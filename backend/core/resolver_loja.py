# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Helper para resolver o identificador de Loja (que pode ser integer ID do lojas_db
ou UUID da organização / codigo_loja do e-Sigma) para a instância e ID inteiro do lojas_db.
"""
from typing import Union
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Loja


def resolver_loja_id_ou_404(db: Session, loja_identificador: Union[int, str]) -> int:
    identificador_str = str(loja_identificador).strip()

    # 1. Se for numérico, tenta buscar por ID primário inteiro
    if identificador_str.isdigit():
        loja_int = int(identificador_str)
        loja = db.query(Loja).filter(Loja.id == loja_int).first()
        if loja:
            return loja.id

    # 2. Tenta buscar por codigo_loja (UUID do e-Sigma / lojas_db)
    loja = db.query(Loja).filter(Loja.codigo_loja == identificador_str).first()
    if loja:
        return loja.id

    # 3. Fallback: se o identificador for puramente numérico, assume o ID
    if identificador_str.isdigit():
        return int(identificador_str)

    raise HTTPException(
        status_code=404,
        detail=f"Loja com identificador '{loja_identificador}' não foi localizada."
    )


def obter_loja_instancia_ou_404(db: Session, loja_identificador: Union[int, str]) -> Loja:
    identificador_str = str(loja_identificador).strip()

    if identificador_str.isdigit():
        loja = db.query(Loja).filter(Loja.id == int(identificador_str)).first()
        if loja:
            return loja

    loja = db.query(Loja).filter(Loja.codigo_loja == identificador_str).first()
    if loja:
        return loja

    raise HTTPException(
        status_code=404,
        detail=f"Loja com identificador '{loja_identificador}' não foi localizada."
    )
