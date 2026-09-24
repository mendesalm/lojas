# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Autenticação simples de serviço-a-serviço para rotas do módulo Lojas que
não são chamadas por um usuário final, mas por outro backend do
ecossistema (hoje: o e-Sigma, validando a Solicitação de Cadastro contra a
API de Hierarquia — ver `api/v1/hierarquia_rotas.py` e
`claude/decisao-controle-acesso-cadastro.md`, seção 13, no Project "Core").

Deliberadamente mais simples que `auth_esigma.py` (que valida um usuário
humano via JWT do e-Sigma): aqui não há usuário, só um backend confiável
chamando outro, então uma chave estática comparada em tempo constante é
suficiente — mesmo padrão de robustez usado em segredos de webhook. Nunca
logar a chave recebida, nem a configurada, em nenhuma circunstância.
"""
import os
import secrets

from fastapi import Header, HTTPException

LOJAS_SERVICE_KEY = os.getenv("LOJAS_SERVICE_KEY", "")


def exigir_chave_de_servico(x_service_key: str = Header(..., alias="X-Service-Key")) -> None:
    if not LOJAS_SERVICE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Configuração ausente: LOJAS_SERVICE_KEY não definida no backend do Lojas.",
        )
    if not secrets.compare_digest(x_service_key, LOJAS_SERVICE_KEY):
        raise HTTPException(status_code=401, detail="Chave de serviço inválida.")


def validar_chave_de_servico(x_service_key: Optional[str]) -> bool:
    """Valida se a chave de serviço informada confere com LOJAS_SERVICE_KEY em tempo constante."""
    if not LOJAS_SERVICE_KEY or not x_service_key:
        return False
    return secrets.compare_digest(x_service_key, LOJAS_SERVICE_KEY)

