# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para Mural de Prévias e Editais de Admissão (Iniciação, Filiação, Regularização).
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PreviaAdmissaoBase(BaseModel):
    tipo: str  # INICIACAO, REGULARIZACAO, FILIACAO
    candidato_nome: str
    pdf_url: Optional[str] = None
    pdf_nome_original: Optional[str] = None
    data_postagem: Optional[date] = None
    data_limite: Optional[date] = None
    status: Optional[str] = "EM_ANDAMENTO"  # EM_ANDAMENTO, AVERIGUADO, CONCLUIDO
    visibilidade: Optional[str] = "REGIONAL"


class PreviaAdmissaoCreate(PreviaAdmissaoBase):
    loja_id: int
    autor_id: Optional[str] = None


class PreviaAdmissaoUpdate(BaseModel):
    candidato_nome: Optional[str] = None
    tipo: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_nome_original: Optional[str] = None
    data_limite: Optional[date] = None
    status: Optional[str] = None
    verificado_por_nome: Optional[str] = None
    visibilidade: Optional[str] = None


class PreviaAdmissaoResponse(PreviaAdmissaoBase):
    id: int
    loja_id: int
    loja_nome: Optional[str] = None
    loja_numero: Optional[str] = None
    verificado_por_nome: Optional[str] = None
    data_verificacao: Optional[datetime] = None
    autor_id: Optional[str] = None
    criado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
