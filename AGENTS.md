# AGENTS.md — Regras inegociáveis do Lojas

> Leia antes de tocar em código deste repositório, humano ou agente de IA.
> Este repositório ainda não tem documentação formal própria (sem
> README/handoff/manual técnico) — este arquivo é o mínimo necessário até
> que isso seja criado. Ver também o contexto consolidado do ecossistema
> Sigma (projeto "Core" no Claude) para o histórico completo.

## 1. Escopo do módulo

Lojas é o módulo de gestão interna de membros da organização cliente:
cadastro de Obreiros e familiares, histórico de cargos, condecorações,
diretorias, comissões e sessões. Financeiro, biblioteca e classificados
**não pertencem aqui** — são módulos satélites próprios. CoReVM é outro
consumidor deste módulo, não uma camada acima dele.

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
