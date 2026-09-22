-- EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
-- Migração incremental e não-destrutiva: campos adicionais compatíveis com a estrutura do GOB (METAGOB / me)
-- Todos os campos são nullable=True para não quebrar cadastros existentes nem queries do CoReVM.

ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS tipo_sanguineo VARCHAR(5);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS orgao_emissor_rg VARCHAR(50);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS data_emissao_rg DATE;
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS nome_pai VARCHAR(255);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS titulo_eleitor VARCHAR(50);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS zona_eleitoral VARCHAR(20);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS secao_eleitoral VARCHAR(20);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS naturalidade_uf VARCHAR(2);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS loja_iniciacao VARCHAR(255);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS loja_elevacao VARCHAR(255);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS loja_exaltacao VARCHAR(255);
ALTER TABLE obreiros ADD COLUMN IF NOT EXISTS regularidade_financeira BOOLEAN DEFAULT TRUE;
