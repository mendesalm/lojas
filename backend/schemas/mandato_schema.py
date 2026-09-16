# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""Schemas da API de mandatos/posse de cargo — primeira rota de escrita real
do módulo Lojas (2026-09-14)."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class ObreiroPosseCargoPayload(BaseModel):
    """Dados para empossar um Obreiro em um cargo de uma Loja. Mesmo formato
    já usado pelo CoReVM em `ObreiroCreateOnTheFly` (posse "on-the-fly": cria
    o Obreiro se ele ainda não existir em `lojas_db`, ou reaproveita o
    cadastro existente pelo CIM)."""

    cim: str = Field(..., description="CIM do Obreiro a ser empossado.")
    nome_completo: str
    email: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo_id: int = Field(
        1, description="ID do cargo em `cargos` (1 = Venerável Mestre, convenção já usada em lojas_db)."
    )
    data_inicio_mandato: Optional[date] = None


class MandatoResponse(BaseModel):
    mandato_id: int
    obreiro_id: int
    cargo_id: int
    loja_id: int
    data_inicio: date
    data_fim: Optional[date] = None
    obreiro_cim: Optional[str] = None
    obreiro_nome: str
    titular_anterior_marcado_mestre_instalado: bool = False

    class Config:
        from_attributes = True


class VmAtualResponse(BaseModel):
    loja_id: int
    tem_vm_ativo: bool
    obreiro_id: Optional[int] = None
    nome_completo: Optional[str] = None
    cim: Optional[str] = None
    data_inicio_mandato: Optional[date] = None
