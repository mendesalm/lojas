-- EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
-- Migração idempotente: Lista Semanal de Confirmação via WhatsApp (lojas_db)
-- Nenhuma tabela existente é alterada.

CREATE TABLE IF NOT EXISTS configuracoes_confirmacao_whatsapp (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL UNIQUE REFERENCES lojas(id),
    slug_publico VARCHAR(100) NOT NULL UNIQUE,
    url_publica_base VARCHAR(500),
    grupo_whatsapp_jid VARCHAR(120),
    grupo_whatsapp_nome VARCHAR(255),
    horarios_dias_normais VARCHAR(100) NOT NULL DEFAULT '08:00,14:00,18:00',
    horarios_dia_evento VARCHAR(100) NOT NULL DEFAULT '08:00,14:00',
    dia_semana_reset INTEGER NOT NULL DEFAULT 5,
    horario_reset VARCHAR(10) NOT NULL DEFAULT '00:00',
    fuso_horario VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    republicar_ao_confirmar BOOLEAN NOT NULL DEFAULT TRUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_cfg_confirmacao_wa_loja_id ON configuracoes_confirmacao_whatsapp (loja_id);
CREATE INDEX IF NOT EXISTS ix_cfg_confirmacao_wa_slug ON configuracoes_confirmacao_whatsapp (slug_publico);

CREATE TABLE IF NOT EXISTS publicadores_autorizados_whatsapp (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id),
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    observacao VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    autorizado_por_email VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pub_autorizado_loja_email UNIQUE (loja_id, email)
);

CREATE INDEX IF NOT EXISTS ix_pub_aut_wa_loja_id ON publicadores_autorizados_whatsapp (loja_id);
CREATE INDEX IF NOT EXISTS ix_pub_aut_wa_email ON publicadores_autorizados_whatsapp (email);

CREATE TABLE IF NOT EXISTS listas_confirmacao_whatsapp (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id),
    sessao_id INTEGER REFERENCES sessoes_maconicas(id),
    titulo VARCHAR(255) NOT NULL,
    texto_anuncio TEXT NOT NULL,
    data_evento DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',
    publicado_por_email VARCHAR(255),
    publicado_por_nome VARCHAR(255),
    publicado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em TIMESTAMP,
    ultimo_disparo_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_listas_wa_loja_id ON listas_confirmacao_whatsapp (loja_id);
CREATE INDEX IF NOT EXISTS ix_listas_wa_data_evento ON listas_confirmacao_whatsapp (data_evento);
CREATE INDEX IF NOT EXISTS ix_listas_wa_status ON listas_confirmacao_whatsapp (status);

CREATE TABLE IF NOT EXISTS registros_confirmacao_whatsapp (
    id SERIAL PRIMARY KEY,
    lista_id INTEGER NOT NULL REFERENCES listas_confirmacao_whatsapp(id),
    loja_id INTEGER NOT NULL REFERENCES lojas(id),
    primeiro_nome VARCHAR(100) NOT NULL,
    ultimo_nome VARCHAR(100) NOT NULL,
    acompanhantes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO',
    origem VARCHAR(30) NOT NULL DEFAULT 'LINK',
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    token_aparelho VARCHAR(120),
    observacao VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_reg_wa_lista_id ON registros_confirmacao_whatsapp (lista_id);
CREATE INDEX IF NOT EXISTS ix_reg_wa_loja_id ON registros_confirmacao_whatsapp (loja_id);
CREATE INDEX IF NOT EXISTS ix_reg_wa_token_aparelho ON registros_confirmacao_whatsapp (token_aparelho);

CREATE TABLE IF NOT EXISTS logs_disparo_confirmacao_whatsapp (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id),
    lista_id INTEGER REFERENCES listas_confirmacao_whatsapp(id),
    tipo_disparo VARCHAR(50) NOT NULL,
    slot_agendado VARCHAR(40),
    grupo_whatsapp_jid VARCHAR(120),
    modo_simulador BOOLEAN NOT NULL DEFAULT FALSE,
    sucesso BOOLEAN NOT NULL DEFAULT TRUE,
    mensagem_enviada TEXT,
    erro TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_logs_wa_loja_id ON logs_disparo_confirmacao_whatsapp (loja_id);
CREATE INDEX IF NOT EXISTS ix_logs_wa_lista_id ON logs_disparo_confirmacao_whatsapp (lista_id);
