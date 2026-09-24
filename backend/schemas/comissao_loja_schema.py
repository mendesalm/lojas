# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para Comissões da Loja, Avisos da Secretaria e Dados Institucionais da Loja.
"""
from datetime import date, time, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MembroComissaoSchema(BaseModel):
    id: Optional[int] = None
    obreiro_id: int
    obreiro_nome: Optional[str] = None
    obreiro_cim: Optional[str] = None
    cargo: str = "Membro"

    model_config = ConfigDict(from_attributes=True)


class ComissaoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    tipo_comissao: str = "Permanente"  # Permanente, Temporária
    data_inicio: date
    data_fim: date
    presidente_id: int


class ComissaoCreate(ComissaoBase):
    loja_id: int
    membros_ids: Optional[List[int]] = []


class ComissaoResponse(ComissaoBase):
    id: int
    loja_id: int
    presidente_nome: Optional[str] = None
    obreiros: List[MembroComissaoSchema] = []

    model_config = ConfigDict(from_attributes=True)


class AvisoBase(BaseModel):
    titulo: str
    conteudo: str
    tipo: str = "Aviso"  # Aviso, Notícia
    origem: Optional[str] = "LOJA"  # LOJA, CONSELHO_REGIONAL
    nivel_prioridade: Optional[str] = "NORMAL"  # NORMAL, ALTO, URGENTE
    autor_nome: Optional[str] = None
    link_externo: Optional[str] = None
    data_expiracao: Optional[date] = None
    ativo: bool = True


class AvisoCreate(AvisoBase):
    loja_id: int


class AvisoResponse(AvisoBase):
    id: int
    loja_id: int
    criado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class LojaDadosResponse(BaseModel):
    id: int
    nome_loja: str
    titulo_loja: Optional[str] = "ARLS"
    codigo_loja: str
    numero_loja: Optional[str] = None
    data_fundacao: Optional[date] = None
    rito: Optional[str] = None
    potencia_id: int
    potencia_nome: Optional[str] = None
    obediencia_id: Optional[int] = None
    obediencia_nome: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    site: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raio_geofence: Optional[int] = 200
    qr_code_id: Optional[str] = None
    dia_sessao: Optional[str] = None
    periodicidade: Optional[str] = None
    horario_sessao: Optional[time] = None
    filiacao_formatada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LojaDadosUpdate(BaseModel):
    nome_loja: Optional[str] = None
    nome: Optional[str] = None
    numero_loja: Optional[str] = None
    numero: Optional[str] = None
    numero_endereco: Optional[str] = None
    titulo_loja: Optional[str] = None
    rito: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    site: Optional[str] = None
    logradouro: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raio_geofence: Optional[int] = None
    dia_sessao: Optional[str] = None
    periodicidade: Optional[str] = None
    horario_sessao: Optional[time] = None


class LojaBuscaItem(BaseModel):
    id: int
    nome: str
    numero: Optional[str] = None
    numero_loja: Optional[str] = None
    cidade: Optional[str] = ""
    potencia: Optional[str] = ""
    rito: Optional[str] = ""

    model_config = ConfigDict(from_attributes=True)


class LojaCreateOnTheFlyPayload(BaseModel):
    nome_loja: str
    numero_loja: str
    titulo_loja: Optional[str] = "ARLS"
    rito: str
    potencia_id: int
    obediencia_id: Optional[int] = None
    cidade: str
    estado: str
    cep: Optional[str] = None


class LojaMultiplasBuscaPayload(BaseModel):
    ids: List[int]

