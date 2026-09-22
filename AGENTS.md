# AGENTS.md — Regras inegociáveis do Lojas

> Leia antes de tocar em código deste repositório, humano ou agente de IA.
> Este repositório ainda não tem documentação formal própria (sem
> README/handoff/manual técnico) — este arquivo é o mínimo necessário até
> que isso seja criado. Ver também o contexto consolidado do ecossistema
> Sigma (projeto "Core" no Claude) para o histórico completo.

## 1. Escopo do módulo

Lojas é o ERP central de gestão das oficinas maçônicas cliente:
- Cadastro de Obreiros e familiares, histórico de cargos, condecorações, diretorias, comissões e sessões.
- **DEFINIÇÃO DE ARQUITETURA E IMPLANTAÇÃO (2026-09-22):** O módulo Lojas **volta a incorporar** formalmente os domínios de:
  1. **Finanças** (Tesouraria, fluxo de caixa, mensalidades, balancetes);
  2. **Biblioteca** (Acervo, empréstimos, catalogação);
  3. **Classificados** (Mural de anúncios e oportunidades internas);
  4. **Arquiteto** (Planejamento de obras, reformas e infraestrutura);
  5. **Patrimônio** (Inventário de bens, alfaias, paramentos e patrimônio físico da Loja).

> **Racional Arquitetural:** A separação desses domínios em múltiplos bancos de dados satélites gerava complexidade excessiva de sincronização, transações distribuídas e redundância de conexões. O banco `lojas_db` é o repositório mestre e consolidado do ERP de Lojas.
> **Papéis no Ecossistema:**
> - **`lojas_db`**: Dono do cadastro de Lojas, Obreiros e dos dados operacionais da Loja (Finanças, Biblioteca, Classificados, Arquiteto, Patrimônio, Sessões).
> - **`e-Sigma`**: Provedor central de Identidade (IdP) e gestão de assinaturas SaaS.
> - **`CoReVM`**: Módulo de gestão regional/Conselho, consumidor de Lojas via API.

## 2. Segurança — nunca, em nenhuma circunstância

- **Nunca hardcode senha, token ou string de conexão no código.** Sempre variável de ambiente.
- **Nunca cole credencial em texto puro numa conversa, PR, issue ou commit.**
- Identidade de usuário só é válida depois de validada contra o e-Sigma (IdP central do ecossistema) — nunca aceitar um header ou parâmetro de identidade enviado sem verificação pelo cliente.
- Qualquer upload de arquivo deriva o diretório de destino do contexto autenticado (tenant/organização), nunca de um parâmetro vindo do cliente.

## 3. Fronteira entre módulos

- Lojas deveria expor API para seus dados (membros, cargos, diretorias, sessões) para que CoReVM e outros satélites consumam via HTTP — não é esperado que outro módulo leia o schema deste banco diretamente. Se isso ainda acontece hoje (ver contexto do CoReVM), é dívida técnica em migração, não o padrão a seguir daqui para frente.

## 4. Pendências conhecidas do repositório

- Sem `README.md`/`handoff.md`/diretriz de arquitetura própria — criar ao menos um mínimo espelhando o padrão de CoReVM/e-Sigma.
- Sem testes automatizados confirmados até o momento — endpoints de autenticação/permissão e de dados de cargo/mandato deveriam ganhar cobertura Pytest.
