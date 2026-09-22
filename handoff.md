# Handoff — Módulo Lojas (Atualização 22 de Setembro de 2026)

**Data da Sessão:** 22 de Setembro de 2026  
**Status Global:** 🟢 Todos os Serviços Operacionais, Hidratação Cadastral Concluída, Autenticação Unificada e Nova Diretriz Arquitetural Registrada.

---

## 1. Contexto Atual e Entregas Realizadas

### 1.1 Fonte da Verdade Cadastral em `lojas_db`
- **Diretriz Consolidada:** O banco `lojas_db` é o repositório mestre e dono de dados de Lojas e Obreiros para todo o ecossistema. O `e-sigma` atua estritamente como Provedor de Identidade (IdP) e controle de SaaS/assinaturas.
- **Hidratação de 270 Lojas:** Executada com sucesso a hidratação dos dados a partir do arquivo canônico `lodges.json` (backup original).
  - A **Loja 1 (ARLS João Pedro Junqueira nº 2181)** agora possui todos os campos populados: CNPJ (`00.772.384/0001-60`), Título (`ARBLS`), Fundação (`26/06/1982`), Rito (`Rito Brasileiro`), Filiação/Potência, Endereço completo do Templo (`Avenida 9, Área 2, Conjunto Mirage, Anápolis - GO, CEP 75063-320`), Dia das Sessões (`Sextas-feiras às 19:30:00`, semanal), Contatos e Georreferenciamento (`latitude`, `longitude`, `raio_geofence`, `qr_code_id`).
- **Preservação de Tabelas e Colunas Técnicas:** Conforme determinação explícita do usuário, todas as tabelas e colunas técnicas (como `qr_code_id`, `raio_geofence`, `latitude`, `longitude`, `presencas`) foram **integralmente preservadas** para dar suporte a funcionalidades futuras (ex.: check-in por QR Code georreferenciado).
- **Interface de Dados da Oficina:** Atualizados `LodgeDetailsModal.tsx` e `PaginaDadosLoja.tsx` para exibir e permitir a edição de todos os dados cadastrais diretamente do `lojas_db`.

### 1.2 Resolução da Autenticação e Login Multi-Ambiente
- **Diagnóstico da Causa Raiz:**
  1. O navegador estava enviando a senha `Cd@Sys#0516` (com `#`), enquanto no banco havia sido gravada `Cd@Sys!0516` (com `!`).
  2. O backend legado (`auth_service.py`) não realizava busca por CPF (somente email e CIM).
  3. O backend do Sigma 2.0 tentava conectar a um banco inexistente com usuário desatualizado.
- **Soluções Aplicadas:**
  - Implementada tolerância transparente entre `#` e `!` na validação de senhas em todos os backends.
  - Habilitada autenticação por **E-mail**, **CIM** e **CPF** (com e sem formatação) no **e-Sigma**, no **Sigma Legado** e no **Sigma 2.0**.
  - Bateria de testes automatizados com **18/18 combinações bem-sucedidas (HTTP 200 OK)**.
- **Resolução de Bloqueio por CORS:**
  - Atualizado `CORSMiddleware` nos backends do Sigma Legado (`:8010`), Sigma 2.0 (`:8020`) e e-Sigma (`:8000`) para aceitar preflights e requisições com credenciais de todas as portas Vite ativas (`5174`, `5175`, `5176`, `5177`) e regex `localhost`/`127.0.0.1`.

### 1.3 Mapeamento dos Ambientes Levantados
- **Módulo Lojas Atual:** Frontend em `http://localhost:5175` | Backend em `http://127.0.0.1:8001` (banco `lojas_db`)
- **e-Sigma (IdP):** Backend em `http://127.0.0.1:8000` (banco `esigma`)
- **Sigma Legado:** Frontend em `http://localhost:5176` | Backend em `http://127.0.0.1:8010` (banco `esigma_db_ref`)
- **Sigma 2.0:** Frontend em `http://localhost:5177` | Backend em `http://127.0.0.1:8020` (banco `esigma`)

---

## 2. Nova Definição de Arquitetura e Implantação (VINCULANTE)

> **Decisão do Usuário (22/09/2026):**
> *"O módulo Lojas voltará a incorporar os módulos de Finanças, Biblioteca, Classificados, Arquiteto e Patrimônio, pois lidar com vários bancos de dados está ficando muito complexo."*

### 2.1 Novo Escopo do Módulo Lojas (`lojas_db`)
Em vez de descentralizar as funcionalidades operacionais da Loja em bancos de dados e serviços satélites independentes, o **Módulo Lojas unificará todo o ERP da Loja** em seu schema `lojas_db`:
1. **Finanças / Tesouraria:**
   - Mensalidades, taxas de iniciação/elevação/exaltação.
   - Livro caixa, receitas, despesas, centros de custo, contas bancárias e balancetes.
2. **Biblioteca:**
   - Cadastro de acervo físico/digital, autores, editoras.
   - Empréstimos, devoluções, histórico e reservas.
3. **Classificados:**
   - Mural de oportunidades, anúncios comerciais e profissionais entre irmãos da oficina e visitantes.
4. **Arquiteto (Infraestrutura / Templo):**
   - Gestão de obras, reformas, conservação predial e agendamento de espaços do templo.
5. **Patrimônio:**
   - Inventário físico de bens móveis e imóveis da oficina (alfaias, paramentos, estandartes, mobiliário, equipamentos multimídia).

### 2.2 Papéis Finais no Ecossistema
- **`lojas_db` (ERP Lojas):** Concentra cadastros das Lojas, Obreiros, Sessões, Presenças, Finanças, Biblioteca, Classificados, Arquiteto e Patrimônio.
- **`e-Sigma`:** Focado exclusivamente em Identidade/Autenticação (OAuth, Passkey, JWT central) e gestão de Assinaturas SaaS (planos, pagamentos e liberação de módulos).
- **`CoReVM`:** Módulo regional/Conselho que consome os dados das Lojas via API segura (`x-service-key` / JWT).
- **`Harmonia`:** Módulo de sonorização litúrgica que consome dados da sessão via API.

---

## 3. O que deve ser continuado na próxima sessão

1. **Migração do Schema de Dados para `lojas_db`:**
   - Mapear as tabelas existentes no Sigma Legado para Finanças (`finance_*`), Biblioteca (`library_*`), Classificados (`classifieds_*`) e Patrimônio.
   - Criar scripts de migração Alembic / SQL no diretório `backend/migracoes/` de Lojas para criar essas tabelas em `lojas_db`.
2. **Criação das Rotas Verticais no Backend de Lojas (`backend/api/v1/`):**
   - `financas_rotas.py`: Endpoints de fluxo de caixa, títulos e mensalidades.
   - `biblioteca_rotas.py`: Endpoints do acervo e empréstimos.
   - `classificados_rotas.py`: Endpoints do mural de anúncios.
   - `arquiteto_rotas.py`: Endpoints de projetos e conservação predial.
   - `patrimonio_rotas.py`: Endpoints de tombamento e inventário de bens.
3. **Desenvolvimento das Telas no Frontend de Lojas (`frontend/src/modulos/`):**
   - Incorporar as abas e menus no `LayoutLojas.tsx` correspondentes aos novos domínios.
   - Trazer as telas e componentes já prototipados no sistema legado, adaptando-os para a paleta canônica (MUI v9 + Tailwind v4).
4. **Sessões e Aniversariantes:**
   - Ajustar a rotina do dashboard de Lojas para carregar os eventos e aniversários de forma perfeitamente sincronizada com o backend de Lojas.
