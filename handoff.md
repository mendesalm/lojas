# Handoff — Módulo Lojas (Atualização 25 de Setembro de 2026)

**Data da Sessão:** 25 de Setembro de 2026  
**Status Global:** 🟢 Serviços Operacionais, Frontend SPA Integrado ao FastAPI, URLs Dinâmicas em Produção, Logo Dourado Animado e Deploy Automático Ativo.


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

### 2.3 Diretriz de Design da Interface (UI/UX - Clone em Termos de Design de Frontend):
- **O Dashboard do Módulo Lojas deve ser estritamente um CLONE DE DESIGN DE FRONTEND do sistema legado Sigma** (`sigma/frontend`):
  - **Foco Estrito no Frontend:** A definição de "clone" restringe-se estritamente à **apresentação visual e design de UI/UX** — layout de tela, cartões de resumo, grids, gráficos, tabelas de dados, widgets de aniversariantes, painel de sessões e navegação do dashboard legado.
  - **Backend e Arquitetura Intactos:** A engenharia de backend segue a arquitetura moderna do ecossistema (`FastAPI`, banco centralizado `lojas_db`, autenticação segura via `e-Sigma` IdP, `Pydantic v2`). O objetivo é unir o melhor dos dois mundos: a solidez da arquitetura moderna com a interface visual consagrada e familiar aos usuários.

### 1.4 Entregas da Sessão de 24 de Setembro de 2026
- **SSO Multi-Domínio**:
  - `AuthContext.tsx` atualizado para recuperação automática de sessão via `GET /api/v1/auth/sso/session` (`withCredentials: true`), com suporte a cookie HttpOnly `sigma_sso_token`.
  - Função de logout integrada com revogação central no IdP via `POST /api/v1/auth/logout`.
- **Endpoints de Integração API-First para o CoReVM**:
  - `POST /api/v1/mandatos/veneraveis-elegiveis`: retorna VMs em exercício de um lote de lojas jurisdicionadas.
  - `GET /api/v1/lojas/{loja_id}/oficiais-elegiveis`: lista ocupantes ativos dos cargos 2 a 7 e Mestres Instalados para suprir o seletor de Suplente e Operador Administrativo.
  - `GET /api/v1/lojas/{loja_id}/oficiais-elegiveis/validar/{identificador}`: validação em tempo real de elegibilidade para indicação de oficiais.
  - `POST /api/v1/obreiros/busca/multiplos`: enriquecimento de obreiros em lote por IDs.
  - `GET /api/v1/obreiros/busca-identificador/{identificador}`: consulta unificada por CIM, CPF ou ID com lista de mandatos ativos.
- **Via Dupla de Avisos Regionais**:
  - Endpoints em `admissoes_rotas.py` e `documentos_rotas.py` permitindo que avisos oficiais emitidos pelo Conselho Regional no CoReVM sejam replicados diretamente para o mural do ERP Lojas.

---

## 2. Entregas da Sessão (25 de Setembro de 2026)

### 2.1 Resolução da Rota Raiz em Produção (`https://lojas.e-sigma.app`)
- **Causa Raiz Identificada:** Em produção, as requisições para `https://lojas.e-sigma.app` eram direcionadas via proxy reverso Nginx para o backend FastAPI (porta 8001), que apenas respondia com o endpoint de teste `@app.get("/") -> {"message": "Lojas API is running"}`. O backend não estava configurado para servir a Single Page Application (SPA) React compilada.
- **Solução Implementada em `backend/main.py`:**
  - Montagem de `StaticFiles` da pasta `frontend/dist/assets` para `/assets`.
  - Implementação do manipulador `servir_frontend_spa(full_path: str)`:
    - Preserva intactos todos os endpoints de `/api/v1/*`, `/docs`, `/openapi.json`, `/redoc` e `/health`.
    - Serve diretamente qualquer arquivo estático presente em `dist/` (ex.: `Lojas_Icon.svg`, `favicon.svg`).
    - Redireciona todas as rotas de navegação da SPA (`/`, `/login`, `/inicio`, `/obreiros`, etc.) para `frontend/dist/index.html`.
  - Validação via testes automatizados locais com `fastapi.testclient.TestClient` confirmando retorno `HTTP 200` com `Content-Type: text/html; charset=utf-8` para `/`, `/login` e `/inicio`.

### 2.2 Resolução Dinâmica de URLs da API em Runtime (`configuracaoApi.ts`)
- **Problema:** O frontend utilizava fallback estático para `http://localhost:8001/api/v1` e `http://localhost:8000/api/v1`, o que causava falha de rede ao tentar contactar `localhost` a partir do navegador de clientes em produção.
- **Solução:** Criado o utilitário `frontend/src/compartilhado/servicos/configuracaoApi.ts`:
  - `obterUrlLojasApi()`: Detecta o domínio em produção e utiliza a rota relativa `/api/v1` (mesma origem `lojas.e-sigma.app`), com fallback para `localhost:8001` apenas em desenvolvimento.
  - `obterUrlLojasBase()`: Fornece a URL base sem o sufixo `/api/v1` para imagens e uploads de logotipos de Lojas.
  - `obterUrlEsigmaApi()`: Aponta dinamicamente para `https://e-sigma.app/api/v1` em produção para o IdP central e SSO.
  - Atualizados `AuthContext.tsx`, `PaginaLogin.tsx`, `PaginaInicio.tsx`, `PaginaQuadroObreiros.tsx`, `LayoutLojas.tsx` e modais.

### 2.3 Transformação Estética e Vetorial do Logo `Lojas_Icon.svg`
- Substituição da paleta ciano por gradientes de ouro maçônico (`lodgeGoldGradient`, `lodgeGoldLightGradient`, `lodgeGoldDarkGradient`) compatíveis com `LodgeIcon.tsx`.
- Animações CSS nativas de flutuação (`lodgeFloat`) e pulso radiante (`lodgeGlowPulse`), além de variações interativas em hover.
- Sincronização nos assets de `frontend/public/` e `frontend/src/assets/icons/`.

### 2.4 Automação de CI/CD para a VPS (`.github/workflows/deploy.yml`)
- Criado o workflow GitHub Actions no padrão do ecossistema Sigma, disparado no `push` da branch `main`:
  - Conexão segura via SSH (`appleboy/ssh-action@v1.0.3`).
  - Execução de `git pull origin main` em `/var/www/lojas`.
  - Atualização de dependências Python e reinício do serviço systemd (`lojas`).
  - Instalação de pacotes e compilação do frontend (`npm run build`) gerando o `dist/` atualizado.

### 2.5 Design System Soberano e Tela de Login Clone do e-Sigma (25 de Setembro de 2026)
- **Design System Soberano**:
  - Implementado em `index.css`: Fundo Abissal (`#050508`), cards `.card-deep-blue-glass`, botões `.btn-masonic-pill .btn-pill-blue` com aro chanfrado dourado metálico.
  - Favicon em ouro maçônico e `favicon.ico` gerado com cache busting `?v=3`.
- **Tela de Login Padronizada (`PaginaLogin.tsx`)**:
  - Clone visual fiel da tela de login do `e-sigma.app`:
    - Canvas de partículas animadas `HeroBackground`.
    - Card central com `.card-deep-blue-glass` e `LogoAnimadaLojas` dourada animada (100x100).
    - Título "Acesso Restrito" em gradiente dourado e subtítulo neutro.
    - Campos MUI de usuário e senha com alternância de visibilidade.
    - Botão `.btn-masonic-pill .btn-pill-blue` "Entrar".
    - Divisor "ou", botão de login Google e links auxiliares.
    - Preservação total de regras de negócio: seleção de múltiplas lojas quando pluri-filiado e redirecionamento para `/trocar-senha-obrigatoria`.
- **Deploy em Produção**:
  - Verificado em `https://lojas.e-sigma.app` respondendo HTTP 200 com bundle compilado ativo.

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
