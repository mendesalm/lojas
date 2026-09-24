# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para Mandatos, Posse de Cargos e Gestão de Oficiais de Lojas.
Suporta consultas detalhadas, transições de cargos, saneamento de diretoria e auditoria.
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ObreiroPosseCargoPayload(BaseModel):
    """Dados para empossar um Obreiro em um cargo de uma Loja (posse on-the-fly)."""
    cim: str = Field(..., description="CIM do Obreiro a ser empossado.")
    nome_completo: str
    email: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo_id: int = Field(
        1, description="ID do cargo em `cargos` (1 = Venerável Mestre, 5 = Secretário, etc.)."
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

    model_config = ConfigDict(from_attributes=True)


class MandatoDetalheResponse(BaseModel):
    mandato_id: int
    obreiro_id: int
    cargo_id: int
    cargo_nome: Optional[str] = None
    loja_id: int
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    ativo: bool = True
    obreiro_nome: Optional[str] = None
    obreiro_cim: Optional[str] = None
    cpf: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VmAtualResponse(BaseModel):
    loja_id: int
    tem_vm_ativo: bool
    mandato_id: Optional[int] = None
    obreiro_id: Optional[int] = None
    nome_completo: Optional[str] = None
    cim: Optional[str] = None
    cpf: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    data_inicio_mandato: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class VmMandatoUpdatePayload(BaseModel):
    data_inicio: Optional[date] = None
    nome_completo: Optional[str] = None
    email: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None


class VmStatusLotePayload(BaseModel):
    ids: List[int]
