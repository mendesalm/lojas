# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para Gestão de Documentos, Atas, Pranchas, Decretos e Balaústres.
"""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentoBase(BaseModel):
    titulo: str
    tipo_documento: Optional[str] = "GERAL"  # BALAUSTRE, EDITAL, PRANCHA, DECRETO, REGULAMENTO, GERAL
    caminho_arquivo: str
    nome_arquivo: str
    tipo_arquivo: Optional[str] = "pdf"
    tamanho_bytes: Optional[int] = None
    descricao: Optional[str] = None
    visibilidade: Optional[str] = "LOCAL"  # LOCAL, REGIONAL
    ativo: bool = True
    data_expiracao: Optional[date] = None
    sessao_id: Optional[int] = None


class DocumentoCreate(DocumentoBase):
    loja_id: int
    enviado_por_obreiro_id: Optional[int] = None


class DocumentoUpdate(BaseModel):
    titulo: Optional[str] = None
    tipo_documento: Optional[str] = None
    descricao: Optional[str] = None
    visibilidade: Optional[str] = None
    ativo: Optional[bool] = None
    data_expiracao: Optional[date] = None


class DocumentoResponse(DocumentoBase):
    id: int
    loja_id: int
    data_upload: Optional[datetime] = None
    enviado_por_obreiro_id: Optional[int] = None
    enviado_por_nome: Optional[str] = None
    loja_nome: Optional[str] = None
    loja_numero: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
