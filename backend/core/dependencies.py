# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Dependências de autorização da API do módulo Lojas (RBAC Unificado e Inter-Serviços).
Resolve a identidade validada pelo e-Sigma (`UsuarioEsigma`, ver `auth_esigma.py`)
para um `Obreiro` de `lojas_db`, e oferece dependências de escopo com suporte a:
1. Chamadas de usuário final (Frontend Lojas ou CoReVM);
2. Chamadas inter-serviços (CoReVM -> Lojas) com `X-Service-Key` e contexto de operador;
3. Papéis de governança maçônica (SuperAdmin, Mesa Diretora Regional, Venerável Mestre,
   Secretário, Tesoureiro, Chanceler, Suplente e Webmaster).
"""
from datetime import date
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core.auth_esigma import UsuarioEsigma, obter_usuario_esigma
from core.constants import (
    CARGO_ID_VENERAVEL_MESTRE,
    CARGO_ID_SECRETARIO,
    CARGO_ID_TESOUREIRO,
    CARGO_ID_CHANCELER,
    CARGOS_GESTAO_LOJA,
    CARGOS_SECRETARIA,
    CARGOS_CHANCELARIA,
    PAPEIS_DIRETORIA_REGIONAL,
)
from core.resolver_loja import resolver_loja_id_ou_404
from core.service_auth import validar_chave_de_servico
from database import get_db
from models.models import Mandato, Obreiro, Webmaster, StatusObreiroEnum, ObreiroLojaAssociacao


def _resolver_obreiro_por_identificador(db: Session, usuario: UsuarioEsigma) -> Optional[Obreiro]:
    """Casa a identidade validada pelo e-Sigma com um Obreiro cadastrado em
    `lojas_db`, tentando CIM, depois CPF, depois e-mail — mesma ordem de
    prioridade usada pelo login do e-Sigma para outros identificadores."""
    if usuario.cim:
        obreiro = db.query(Obreiro).filter(Obreiro.cim == usuario.cim).first()
        if obreiro:
            return obreiro
    if usuario.cpf:
        obreiro = db.query(Obreiro).filter(Obreiro.cpf == usuario.cpf).first()
        if obreiro:
            return obreiro
    if usuario.email:
        obreiro = db.query(Obreiro).filter(Obreiro.email == usuario.email).first()
        if obreiro:
            return obreiro
    return None


def get_usuario_e_obreiro(
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Dependência de base: devolve a identidade e-Sigma já validada junto
    com o Obreiro correspondente em `lojas_db`, quando existir."""
    obreiro = _resolver_obreiro_por_identificador(db, usuario)
    return usuario, obreiro


def _e_vm_em_exercicio_da_loja(db: Session, obreiro_id: int, loja_id: int) -> bool:
    """Verifica se o obreiro é o Venerável Mestre ativo da Loja."""
    hoje = date.today()
    mandato_ativo = (
        db.query(Mandato)
        .filter(
            Mandato.obreiro_id == obreiro_id,
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            Mandato.data_inicio <= hoje,
        )
        .filter((Mandato.data_fim.is_(None)) | (Mandato.data_fim >= hoje))
        .first()
    )
    return mandato_ativo is not None


def _possui_cargos_na_loja(db: Session, obreiro_id: int, loja_id: int, cargo_ids: list[int]) -> bool:
    """Verifica se o obreiro possui algum dos cargos ativos especificados na loja."""
    hoje = date.today()
    mandato = (
        db.query(Mandato)
        .filter(
            Mandato.obreiro_id == obreiro_id,
            Mandato.loja_id == loja_id,
            Mandato.cargo_id.in_(cargo_ids),
            Mandato.data_inicio <= hoje,
        )
        .filter((Mandato.data_fim.is_(None)) | (Mandato.data_fim >= hoje))
        .first()
    )
    return mandato is not None


def _e_webmaster_da_loja(db: Session, usuario: UsuarioEsigma, loja_id: int) -> bool:
    """Verifica se o usuário é Webmaster cadastrado e ativo da Loja."""
    if not usuario.email:
        return False
    webmaster = (
        db.query(Webmaster)
        .filter(Webmaster.email == usuario.email, Webmaster.loja_id == loja_id, Webmaster.ativo.is_(True))
        .first()
    )
    return webmaster is not None


def _verificar_acesso_servico_regional(
    x_service_key: Optional[str],
    x_operador_papel: Optional[str],
    x_operador_loja_id: Optional[str],
    loja_id_int: int,
) -> bool:
    """Verifica se a chamada é autorizada via chave de serviço inter-módulos (ex: CoReVM)."""
    if not validar_chave_de_servico(x_service_key):
        return False

    # Chamada de serviço administrativa pura sem especificação de operador
    if not x_operador_papel:
        return True

    papel_normalizado = str(x_operador_papel).strip().upper()
    if papel_normalizado in PAPEIS_DIRETORIA_REGIONAL:
        return True

    # Suplente atuando em nome da própria Loja
    if papel_normalizado == "SUPLENTE":
        if x_operador_loja_id and str(x_operador_loja_id).strip() == str(loja_id_int):
            return True

    # Demais cargos repassados pelo CoReVM (ex: VM, SECRETARIO, TESOUREIRO, CHANCELER da própria loja)
    if x_operador_loja_id and str(x_operador_loja_id).strip() == str(loja_id_int):
        return True

    return False


def exigir_permissao_gestao_loja(
    loja_id: str,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """
    Autoriza gestão institucional e cadastral da Loja (dados cadastrais, cargos, membros).
    Elegíveis:
    - SuperAdmin do e-Sigma;
    - Chamadas autorizadas via Service Key da Mesa Diretora do CoReVM (saneamento de Lojas omissas);
    - Webmaster da Loja;
    - Venerável Mestre ativo da Loja;
    - Secretário, Tesoureiro ou Chanceler da Loja;
    - Suplente do Conselho Regional da respectiva Loja (via CoReVM).
    """
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id_int):
        return contexto

    if obreiro is not None and _possui_cargos_na_loja(db, obreiro.id, loja_id_int, CARGOS_GESTAO_LOJA):
        return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas a Mesa Diretora Regional, Venerável Mestre, Secretário, Tesoureiro, Chanceler ou Webmaster podem gerenciar esta Loja.",
    )


def exigir_vm_ou_webmaster_da_loja(
    loja_id: str,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Permite posse de cargos / transição de VM. Autoriza VM ativo, Webmaster, SuperAdmin ou Mesa Diretora Regional."""
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id_int):
        return contexto

    if obreiro is not None and _e_vm_em_exercicio_da_loja(db, obreiro.id, loja_id_int):
        return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Venerável Mestre em exercício, Webmaster, SuperAdmin ou Mesa Diretora Regional podem realizar esta ação.",
    )


def exigir_membro_ou_diretoria_da_loja(
    loja_id: str,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Garante que o usuário pertence à Loja (membro ativo), é Webmaster, SuperAdmin ou membro autorizado do Conselho Regional."""
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return contexto

    if usuario.is_super_admin:
        return contexto

    if usuario.loja_id and str(usuario.loja_id) == str(loja_id):
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id_int):
        return contexto

    if obreiro is not None:
        assoc = (
            db.query(ObreiroLojaAssociacao)
            .filter(
                ObreiroLojaAssociacao.obreiro_id == obreiro.id,
                ObreiroLojaAssociacao.loja_id == loja_id_int,
                ObreiroLojaAssociacao.status == StatusObreiroEnum.ATIVO
            )
            .first()
        )
        if assoc:
            return contexto

    raise HTTPException(
        status_code=403,
        detail="Acesso restrito aos membros ativos e administração desta Loja.",
    )


def exigir_secretaria_ou_vm_da_loja(
    loja_id: str,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Permite acesso a ações da Secretaria (VM, Secretário, Webmaster, SuperAdmin ou Mesa Diretora Regional)."""
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id_int):
        return contexto

    if obreiro is not None and _possui_cargos_na_loja(db, obreiro.id, loja_id_int, CARGOS_SECRETARIA):
        return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Venerável Mestre, o Secretário, o Webmaster, SuperAdmin ou Mesa Diretora Regional podem realizar esta ação.",
    )


def exigir_chancelaria_ou_vm_da_loja(
    loja_id: str,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Permite acesso a ações da Chancelaria (VM, Chanceler, Secretário, Webmaster, SuperAdmin ou Mesa Diretora Regional)."""
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id_int):
        return contexto

    if obreiro is not None and _possui_cargos_na_loja(db, obreiro.id, loja_id_int, CARGOS_CHANCELARIA):
        return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Chanceler, Secretário, Venerável Mestre, Webmaster ou Mesa Diretora Regional podem gerenciar presenças.",
    )
