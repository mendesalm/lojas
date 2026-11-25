# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PreviewAnuncioRequest(BaseModel):
    texto_anuncio: str = Field(..., min_length=3, max_length=2000)


class PreviewAnuncioResponse(BaseModel):
    data_evento: date
    titulo_sugerido: str
    data_encontrada_no_texto: bool


class PublicarListaRequest(BaseModel):
    texto_anuncio: str = Field(..., min_length=3, max_length=2000)
    titulo: Optional[str] = Field(None, max_length=255)
    data_evento: Optional[date] = None
    sessao_id: Optional[int] = None
    incluir_anunciante: bool = True
    primeiro_nome_anunciante: Optional[str] = Field(None, max_length=100)
    ultimo_nome_anunciante: Optional[str] = Field(None, max_length=100)
    acompanhantes_anunciante: int = Field(0, ge=0, le=50)


class RegistroConfirmacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lista_id: int
    loja_id: int
    primeiro_nome: str
    ultimo_nome: str
    acompanhantes: int
    total_pessoas: int = 1
    status: str
    origem: str
    presente: bool
    observacao: Optional[str] = None
    criado_em: datetime
    atualizado_em: datetime


class RegistroConfirmacaoManualCreate(BaseModel):
    primeiro_nome: str = Field(..., min_length=1, max_length=100)
    ultimo_nome: str = Field("", max_length=100)
    acompanhantes: int = Field(0, ge=0, le=50)
    observacao: Optional[str] = Field(None, max_length=255)


class RegistroConfirmacaoUpdate(BaseModel):
    primeiro_nome: Optional[str] = Field(None, min_length=1, max_length=100)
    ultimo_nome: Optional[str] = Field(None, max_length=100)
    acompanhantes: Optional[int] = Field(None, ge=0, le=50)
    status: Optional[str] = Field(None, pattern="^(CONFIRMADO|CANCELADO)$")
    presente: Optional[bool] = None
    observacao: Optional[str] = Field(None, max_length=255)


class TotaisConfirmacaoResponse(BaseModel):
    irmaos_confirmados: int
    acompanhantes: int
    total_pessoas: int
    presentes_checkin: int


class ListaConfirmacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loja_id: int
    sessao_id: Optional[int] = None
    titulo: str
    texto_anuncio: str
    data_evento: date
    status: str
    publicado_por_email: Optional[str] = None
    publicado_por_nome: Optional[str] = None
    publicado_em: datetime
    encerrado_em: Optional[datetime] = None
    ultimo_disparo_em: Optional[datetime] = None
    totais: Optional[TotaisConfirmacaoResponse] = None
    registros: Optional[List[RegistroConfirmacaoResponse]] = None


class ConfiguracaoConfirmacaoUpdate(BaseModel):
    slug_publico: Optional[str] = Field(None, min_length=2, max_length=100)
    url_publica_base: Optional[str] = Field(None, max_length=500)
    grupo_whatsapp_jid: Optional[str] = Field(None, max_length=120)
    grupo_whatsapp_nome: Optional[str] = Field(None, max_length=255)
    horarios_dias_normais: Optional[str] = Field(None, max_length=100)
    horarios_dia_evento: Optional[str] = Field(None, max_length=100)
    dia_semana_reset: Optional[int] = Field(None, ge=0, le=6)
    horario_reset: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    fuso_horario: Optional[str] = Field(None, max_length=64)
    republicar_ao_confirmar: Optional[bool] = None
    ativo: Optional[bool] = None


class ConfiguracaoConfirmacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loja_id: int
    slug_publico: str
    url_publica_base: Optional[str] = None
    grupo_whatsapp_jid: Optional[str] = None
    grupo_whatsapp_nome: Optional[str] = None
    horarios_dias_normais: str
    horarios_dia_evento: str
    dia_semana_reset: int
    horario_reset: str
    fuso_horario: str
    republicar_ao_confirmar: bool
    ativo: bool


class PublicadorAutorizadoCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    nome: Optional[str] = Field(None, max_length=255)
    observacao: Optional[str] = Field(None, max_length=255)


class PublicadorAutorizadoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loja_id: int
    email: str
    nome: Optional[str] = None
    observacao: Optional[str] = None
    ativo: bool
    autorizado_por_email: Optional[str] = None
    criado_em: datetime


class LogDisparoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loja_id: int
    lista_id: Optional[int] = None
    tipo_disparo: str
    slot_agendado: Optional[str] = None
    grupo_whatsapp_jid: Optional[str] = None
    modo_simulador: bool
    sucesso: bool
    mensagem_enviada: Optional[str] = None
    erro: Optional[str] = None
    criado_em: datetime


class PainelConfirmacaoResponse(BaseModel):
    loja_id: int
    nome_loja: str
    usuario_logado_nome: str
    usuario_logado_primeiro_nome: str
    usuario_logado_ultimo_nome: str
    eh_gestao_loja: bool
    configuracao: ConfiguracaoConfirmacaoResponse
    url_publica_efetiva: str
    lista_aberta: Optional[ListaConfirmacaoResponse] = None
    totais: TotaisConfirmacaoResponse
    proximo_disparo: Optional[str] = None
    registros: List[RegistroConfirmacaoResponse]
    logs_recentes: List[LogDisparoResponse]


class ConfirmacaoPublicaRequest(BaseModel):
    primeiro_nome: str = Field(..., min_length=1, max_length=100)
    ultimo_nome: str = Field("", max_length=100)
    acompanhantes: int = Field(0, ge=0, le=50)
    token_aparelho: Optional[str] = Field(None, max_length=120)


class CancelarPublicaRequest(BaseModel):
    token_aparelho: str = Field(..., min_length=4, max_length=120)


class RegistroPublicoItem(BaseModel):
    id: int
    primeiro_nome: str
    ultimo_nome: str
    acompanhantes: int
    total_pessoas: int
    origem: str


class PainelPublicoResponse(BaseModel):
    loja_id: int
    nome_loja: str
    numero_loja: Optional[str] = None
    slug_publico: str
    em_espera: bool
    titulo: Optional[str] = None
    texto_anuncio: Optional[str] = None
    data_evento: Optional[date] = None
    totais: TotaisConfirmacaoResponse
    confirmados: List[RegistroPublicoItem]
    meu_registro: Optional[RegistroPublicoItem] = None
