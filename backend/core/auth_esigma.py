# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Cliente de integração com o e-Sigma para validação de identidade — primeira
peça da API própria do módulo Lojas (2026-09-14). Espelha exatamente o
padrão já validado em `CoReVM/backend/core/auth_esigma.py`: nenhum header
"confiável" enviado pelo cliente é aceito sem verificação — a identidade só
é aceita depois de validada contra o endpoint central
`GET /auth/validate` do e-Sigma, repassando o mesmo token Bearer que o
usuário já enviou. Mesmo cache com lock por token (double-checked locking)
para evitar tanto chamadas repetidas quanto "cache stampede" — motivo
documentado em detalhe no arquivo espelhado do CoReVM.

Diferença deliberada em relação ao arquivo do CoReVM: usa o módulo `logging`
da biblioteca padrão em vez de `loguru`, para não introduzir uma dependência
nova só para isso (o Lojas ainda não tem `loguru` no requirements.txt).
"""
import hashlib
import logging
import os
import threading
import time
from typing import List, Optional

import requests
from fastapi import Header, HTTPException

logger = logging.getLogger("lojas.auth_esigma")

ESIGMA_API_BASE_URL = os.getenv("ESIGMA_API_BASE_URL", "").rstrip("/")
ESIGMA_VALIDATE_TIMEOUT_SEGUNDOS = float(os.getenv("ESIGMA_VALIDATE_TIMEOUT_SEGUNDOS", "5"))
ESIGMA_VALIDATE_CACHE_TTL_SEGUNDOS = float(os.getenv("ESIGMA_VALIDATE_CACHE_TTL_SEGUNDOS", "30"))

_cache_validacao: dict[str, tuple[float, "UsuarioEsigma"]] = {}
_cache_lock = threading.Lock()

_locks_validacao: dict[str, threading.Lock] = {}
_locks_dict_lock = threading.Lock()


def _chave_cache(authorization: str) -> str:
    # Nunca guarda o token em texto puro na memória do processo — só o hash,
    # que já é suficiente como chave de cache.
    return hashlib.sha256(authorization.encode("utf-8")).hexdigest()


def _obter_lock_do_token(chave: str) -> threading.Lock:
    with _locks_dict_lock:
        lock = _locks_validacao.get(chave)
        if lock is None:
            lock = threading.Lock()
            _locks_validacao[chave] = lock
        return lock


class UsuarioEsigma:
    """Identidade do usuário autenticado, já validada pelo e-Sigma."""

    def __init__(
        self,
        email: Optional[str],
        user_id: Optional[str],
        role: Optional[str],
        organizacao_id: Optional[str],
        cim: Optional[str],
        cpf: Optional[str],
        modulos_ativos: List[str],
    ):
        self.email = email
        self.user_id = user_id
        self.role = role
        self.organizacao_id = organizacao_id
        self.cim = cim
        self.cpf = cpf
        self.modulos_ativos = modulos_ativos

    @property
    def is_super_admin(self) -> bool:
        return self.role == "super_admin"

    @property
    def identificador_negocio(self) -> Optional[str]:
        """Identificador usado para casar com os registros de `lojas_db`
        (Obreiro.cim / Obreiro.cpf / Obreiro.email) — esses registros
        guardam CIM/CPF/e-mail, não o UUID interno do e-Sigma."""
        return self.cim or self.cpf or self.email


def obter_usuario_esigma(
    authorization: str = Header(
        ...,
        description="Token Bearer emitido pelo e-Sigma no login do usuário (ex.: 'Bearer eyJ...').",
    ),
) -> UsuarioEsigma:
    """
    Dependência FastAPI que valida a identidade do usuário contra o e-Sigma
    antes de aceitar qualquer requisição de escrita/leitura autenticada na
    API do módulo Lojas. Mesmo contrato que `obter_usuario_esigma` do
    CoReVM, para os dois módulos poderem, no futuro, compartilhar a mesma
    lib de autenticação se isso for extraído para um pacote comum.
    """
    if not ESIGMA_API_BASE_URL:
        logger.error("ESIGMA_API_BASE_URL não configurada — não é possível validar o usuário.")
        raise HTTPException(
            status_code=500,
            detail="Configuração ausente: ESIGMA_API_BASE_URL não definida no backend do Lojas.",
        )

    chave = _chave_cache(authorization)
    agora = time.monotonic()
    with _cache_lock:
        entrada = _cache_validacao.get(chave)
        if entrada and entrada[0] > agora:
            return entrada[1]

    lock_token = _obter_lock_do_token(chave)
    with lock_token:
        agora = time.monotonic()
        with _cache_lock:
            entrada = _cache_validacao.get(chave)
            if entrada and entrada[0] > agora:
                return entrada[1]

        try:
            resposta = requests.get(
                f"{ESIGMA_API_BASE_URL}/auth/validate",
                headers={"Authorization": authorization},
                timeout=ESIGMA_VALIDATE_TIMEOUT_SEGUNDOS,
            )
        except requests.RequestException as erro:
            logger.error(f"Falha ao validar token junto ao e-Sigma: {erro}")
            raise HTTPException(
                status_code=503,
                detail="Não foi possível validar suas credenciais no momento (e-Sigma indisponível). Tente novamente em instantes.",
            )

        if resposta.status_code == 401:
            raise HTTPException(status_code=401, detail="Sessão inválida ou expirada. Faça login novamente.")
        if resposta.status_code != 200:
            logger.error(f"Resposta inesperada do e-Sigma ao validar token: {resposta.status_code} {resposta.text}")
            raise HTTPException(status_code=502, detail="Erro ao validar credenciais junto ao e-Sigma.")

        dados = resposta.json()
        usuario = dados.get("usuario", {})
        usuario_validado = UsuarioEsigma(
            email=usuario.get("email"),
            user_id=usuario.get("user_id"),
            role=usuario.get("role"),
            organizacao_id=usuario.get("organizacao_id"),
            cim=usuario.get("cim"),
            cpf=usuario.get("cpf"),
            modulos_ativos=dados.get("modulos_ativos", []),
        )

        with _cache_lock:
            _cache_validacao[chave] = (agora + ESIGMA_VALIDATE_CACHE_TTL_SEGUNDOS, usuario_validado)
            if len(_cache_validacao) > 500:
                expiradas = [k for k, v in _cache_validacao.items() if v[0] <= agora]
                for k in expiradas:
                    del _cache_validacao[k]

        return usuario_validado
