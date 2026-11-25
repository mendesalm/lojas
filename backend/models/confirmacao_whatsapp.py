# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Modelos SQLAlchemy para o módulo de Lista Semanal de Confirmação via WhatsApp.
Usa exclusivamente tipos padrão SQL/SQLite (sem ENUM nativo do Postgres)
para compatibilidade total com PostgreSQL em produção e SQLite em testes.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from database import Base


def _agora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ConfiguracaoConfirmacaoWhatsapp(Base):
    __tablename__ = "configuracoes_confirmacao_whatsapp"

    id = Column(Integer, primary_key=True, index=True)
    loja_id = Column(Integer, ForeignKey("lojas.id"), unique=True, nullable=False, index=True)
    slug_publico = Column(String(100), unique=True, nullable=False, index=True)
    url_publica_base = Column(String(500), nullable=True)
    grupo_whatsapp_jid = Column(String(120), nullable=True)
    grupo_whatsapp_nome = Column(String(255), nullable=True)
    horarios_dias_normais = Column(String(100), nullable=False, default="08:00,14:00,18:00")
    horarios_dia_evento = Column(String(100), nullable=False, default="08:00,14:00")
    dia_semana_reset = Column(Integer, nullable=False, default=5)  # 5 = Sábado (Python weekday)
    horario_reset = Column(String(10), nullable=False, default="00:00")
    fuso_horario = Column(String(64), nullable=False, default="America/Sao_Paulo")
    republicar_ao_confirmar = Column(Boolean, nullable=False, default=True)
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime, nullable=False, default=_agora_utc)
    atualizado_em = Column(DateTime, nullable=False, default=_agora_utc, onupdate=_agora_utc)


class PublicadorAutorizadoWhatsapp(Base):
    __tablename__ = "publicadores_autorizados_whatsapp"
    __table_args__ = (
        UniqueConstraint("loja_id", "email", name="uq_pub_autorizado_loja_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    loja_id = Column(Integer, ForeignKey("lojas.id"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    nome = Column(String(255), nullable=True)
    observacao = Column(String(255), nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)
    autorizado_por_email = Column(String(255), nullable=True)
    criado_em = Column(DateTime, nullable=False, default=_agora_utc)


class ListaConfirmacaoWhatsapp(Base):
    __tablename__ = "listas_confirmacao_whatsapp"

    id = Column(Integer, primary_key=True, index=True)
    loja_id = Column(Integer, ForeignKey("lojas.id"), nullable=False, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes_maconicas.id"), nullable=True)
    titulo = Column(String(255), nullable=False)
    texto_anuncio = Column(Text, nullable=False)
    data_evento = Column(Date, nullable=False, index=True)
    status = Column(String(30), nullable=False, default="ABERTA", index=True)  # ABERTA, ENCERRADA, ARQUIVADA
    publicado_por_email = Column(String(255), nullable=True)
    publicado_por_nome = Column(String(255), nullable=True)
    publicado_em = Column(DateTime, nullable=False, default=_agora_utc)
    encerrado_em = Column(DateTime, nullable=True)
    ultimo_disparo_em = Column(DateTime, nullable=True)


class RegistroConfirmacaoWhatsapp(Base):
    __tablename__ = "registros_confirmacao_whatsapp"

    id = Column(Integer, primary_key=True, index=True)
    lista_id = Column(Integer, ForeignKey("listas_confirmacao_whatsapp.id"), nullable=False, index=True)
    loja_id = Column(Integer, ForeignKey("lojas.id"), nullable=False, index=True)
    primeiro_nome = Column(String(100), nullable=False)
    ultimo_nome = Column(String(100), nullable=False)
    acompanhantes = Column(Integer, nullable=False, default=0)
    status = Column(String(30), nullable=False, default="CONFIRMADO")  # CONFIRMADO, CANCELADO
    origem = Column(String(30), nullable=False, default="LINK")  # ANUNCIANTE, LINK, MANUAL
    presente = Column(Boolean, nullable=False, default=False)
    token_aparelho = Column(String(120), nullable=True, index=True)
    observacao = Column(String(255), nullable=True)
    criado_em = Column(DateTime, nullable=False, default=_agora_utc)
    atualizado_em = Column(DateTime, nullable=False, default=_agora_utc, onupdate=_agora_utc)


class LogDisparoConfirmacaoWhatsapp(Base):
    __tablename__ = "logs_disparo_confirmacao_whatsapp"

    id = Column(Integer, primary_key=True, index=True)
    loja_id = Column(Integer, ForeignKey("lojas.id"), nullable=False, index=True)
    lista_id = Column(Integer, ForeignKey("listas_confirmacao_whatsapp.id"), nullable=True, index=True)
    tipo_disparo = Column(String(50), nullable=False)  # PUBLICACAO, CONFIRMACAO, AGENDADO, MANUAL, RESET
    slot_agendado = Column(String(40), nullable=True)
    grupo_whatsapp_jid = Column(String(120), nullable=True)
    modo_simulador = Column(Boolean, nullable=False, default=False)
    sucesso = Column(Boolean, nullable=False, default=True)
    mensagem_enviada = Column(Text, nullable=True)
    erro = Column(Text, nullable=True)
    criado_em = Column(DateTime, nullable=False, default=_agora_utc)
