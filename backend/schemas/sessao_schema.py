# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para Gestão de Sessões Maçônicas, Chamada, Check-in e Visitantes.
"""
from datetime import date, time, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class PresencaItem(BaseModel):
    id: int
    obreiro_id: Optional[int] = None
    obreiro_nome: Optional[str] = None
    obreiro_cim: Optional[str] = None
    obreiro_grau: Optional[str] = None
    visitante_id: Optional[int] = None
    visitante_nome: Optional[str] = None
    status_presenca: str
    metodo_checkin: Optional[str] = None
    data_hora_checkin: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PresencaCheckInPayload(BaseModel):
    metodo: Optional[str] = "QR_CODE"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    obreiro_id: Optional[int] = None # Opcional caso registrado pelo próprio usuário logado


class PresencaManualPayload(BaseModel):
    obreiro_id: Optional[int] = None
    visitante_id: Optional[int] = None
    status_presenca: str = "PRESENTE"  # PRESENTE, FALTA_JUSTIFICADA


class SessaoBase(BaseModel):
    titulo: str
    numero_sessao: Optional[int] = None
    data_sessao: date
    hora_inicio: Optional[time] = None
    hora_fim: Optional[time] = None
    tipo: Optional[str] = "Ordinária"
    subtipo: Optional[str] = "Regular"
    status: Optional[str] = "AGENDADA"
    visibilidade: Optional[str] = "LOCAL"  # LOCAL, REGIONAL
    pauta: Optional[str] = None
    cargos_temporarios: Optional[Dict[str, Any]] = None


class SessaoCreate(SessaoBase):
    loja_id: int
    gestao_id: Optional[int] = None


class SessaoUpdate(BaseModel):
    titulo: Optional[str] = None
    numero_sessao: Optional[int] = None
    data_sessao: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fim: Optional[time] = None
    tipo: Optional[str] = None
    subtipo: Optional[str] = None
    status: Optional[str] = None
    visibilidade: Optional[str] = None
    pauta: Optional[str] = None
    cargos_temporarios: Optional[Dict[str, Any]] = None


class SessaoResumo(BaseModel):
    id: int
    titulo: str
    numero_sessao: Optional[int] = None
    data_sessao: date
    hora_inicio: Optional[time] = None
    hora_fim: Optional[time] = None
    tipo: Optional[str] = None
    subtipo: Optional[str] = None
    status: str
    visibilidade: Optional[str] = "LOCAL"
    loja_id: Optional[int] = None
    total_presentes: int = 0
    total_visitantes: int = 0

    model_config = ConfigDict(from_attributes=True)


class SessaoResponse(SessaoBase):
    id: int
    loja_id: int
    gestao_id: Optional[int] = None
    total_presentes: int = 0
    total_visitantes: int = 0
    presencas: List[PresencaItem] = []

    model_config = ConfigDict(from_attributes=True)


class VisitanteBase(BaseModel):
    nome_completo: str
    cim: str
    grau: str = "Mestre"
    email: Optional[str] = None
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    nome_loja_manual: Optional[str] = None
    numero_loja_manual: Optional[str] = None
    obediencia_loja_manual: Optional[str] = None
    observacoes: Optional[str] = None


class VisitanteCreate(VisitanteBase):
    pass


class VisitanteResponse(VisitanteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
