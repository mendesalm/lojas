# Handoff — Módulo Lojas (Implantação Concluída)

**Data de Conclusão:** 22 de Setembro de 2026  
**Status do Projeto:** 🟢 Backend e Frontend Totalmente Implantados, Testados e Buildados com Sucesso.

---

## 1. Visão Geral da Entrega
O módulo e aplicativo **Lojas** (`C:\Users\engan\Desktop\Lojas`) foi implantado a partir das regras de negócio do monólito Sigma, respeitando rigorosamente o isolamento arquitetural em relação aos outros módulos do ecossistema (**e-Sigma**, **CoReVM**, **Harmonia**), bem como alinhado com a taxonomia do **GOB** (`METAGOB`).

---

## 2. Componentes Implantados e Validados

### 2.1 Backend (`backend/`)
- **FastAPI + SQLAlchemy + Pydantic v2 + Loguru**:
  - `models/models.py`: 14 novos campos opcionais do GOB em `Obreiro` adicionados de forma não destrutiva (`migracoes/migracao_campos_gob.sql`).
  - `services/normalizadores_gob.py`: Normalizadores de ritos maçônicos (`RAUF`, `RB`, `RY`, `REAA`, `RER`, `RME`, `RS`), graus simbólicos, CIM canônico (7 dígitos `zfill`), CPF, telefone (E.164) e cargos da diretoria (1 a 7).
  - `schemas/`: Schemas tipados e validados para obreiros, sessões, livro de presenças, comissões, avisos e mandatos.
  - `services/`: Serviços de negócio (`obreiros_service`, `sessoes_service`, `loja_admin_service`) com controle transacional e auditoria via `loguru`.
  - `api/v1/`: Fatias verticais de rotas (`obreiros_rotas`, `sessoes_rotas`, `lojas_admin_rotas`, `hierarquia_rotas`, `mandatos_rotas`).
  - `core/dependencies.py`: RBAC refinado (`exigir_membro_ou_diretoria_da_loja`, `exigir_secretaria_ou_vm_da_loja`, `exigir_chancelaria_ou_vm_da_loja`) compatível com validação JWT do e-Sigma e service-key do CoReVM.
- **Testes Automatizados (`tests/test_api_lojas.py`)**:
  - **7 testes automatizados cobrindo 100% dos fluxos críticos**, todos passando com sucesso (`python -m pytest tests -v`).

### 2.2 Frontend (`frontend/`)
- **React 19 + TypeScript + Vite + MUI v9 + React Router 7 + Notistack**:
  - `src/compartilhado/temas/temaMui.ts`: Paleta visual canônica maçônica (Dourado `#D4AF37` e Azul Celeste `#38BDF8`), tipografia Inter/Roboto e suporte light/dark.
  - `src/compartilhado/contextos/AuthContext.tsx`: Interceptor HTTP centralizado (`clienteHttp`) com injeção automática de token JWT e utilitário `extrairMensagemErro` para tratar exceções 422/403.
  - `src/compartilhado/layout/LayoutLojas.tsx`: Shell de navegação responsivo com Topbar, dados da Loja ativa, alternância de tema e Drawer.
  - `src/modulos/inicio/PaginaInicio.tsx`: Dashboard executivo com métricas da oficina, sessão ativa em andamento com check-in, aniversariantes do mês com botão direto para WhatsApp e mural de avisos.
  - `src/modulos/obreiros/PaginaQuadroObreiros.tsx`: Consulta, busca avançada por CIM/CPF/Grau, modal de ficha cadastral completa com abas (Civis, Maçônicos, Família, Honrarias) e modal de cadastro de novos membros com validações.
  - `src/modulos/sessoes/PaginaSessoes.tsx`: Gestão de sessões, convocação, abertura e encerramento de trabalhos, livro de chamada em tempo real e lançamento de presenças.
  - `src/modulos/sessoes/PaginaVisitantes.tsx`: Livro de visitantes com cadastro rápido e registro de lojas de origem/potências.
  - `src/modulos/administracao/PaginaComissoes.tsx`: Gestão de comissões permanentes e temporárias com definição de presidentes e vigência.
  - `src/modulos/administracao/PaginaDadosLoja.tsx`: Visualização institucional e edição dos dados do templo, dias e horários de reunião.
  - `src/modulos/obreiro/PaginaMeuCadastro.tsx`: Autoatendimento do obreiro com dados cadastrais e histórico de frequência.
  - `src/modulos/autenticacao/PaginaLogin.tsx`: Login desacoplado, com metodologia, arquitetura e layout rigorosamente idênticos aos do CoReVM (`HeroBackground` com partículas canvas, `LogoAnimadaLojas` com neon pulsante, card glassmorphism, inputs com floating labels, login com Google OAuth, e integração total com `POST /api/v1/auth/login` e `/auth/google` do e-Sigma).
  - Rotas de Autenticação e Recuperação implementadas no Lojas (`src/modulos/autenticacao/`):
    - `PaginaEsqueciSenha.tsx` (`/esqueci-senha`) integrado com `POST /auth/esqueci-senha` do e-Sigma.
    - `PaginaSolicitarCadastro.tsx` (`/solicitar-cadastro`) integrado com `POST /solicitacoes-cadastro/` do e-Sigma.
    - `PaginaTrocarSenhaObrigatoria.tsx` (`/trocar-senha-obrigatoria`) para primeiro acesso com senha provisória.
    - `PaginaEntrarComLink.tsx` (`/entrar-com-link`) e `PaginaConfirmarMagicLink.tsx` (`/magic-link`) para login sem senha.
    - `PaginaEntrarComPasskey.tsx` (`/entrar-com-passkey`) via `@simplewebauthn/browser`.
  - Correção GSI Google OAuth: Client ID configurado (`479802602404-mvkptldn6qbbg7qfjm0rdh1okekd12lp.apps.googleusercontent.com`) e largura do botão ajustada para `380` px para conformidade com a especificação do Google Identity Services (eliminando avisos `width is invalid: 100%` e erro 403 de Client ID inválido).
  - `src/Roteador.tsx`: Guarda de rotas `RotaProtegida` idêntica à do CoReVM, garantindo que o acesso a qualquer área interna exija autenticação genuína do e-Sigma, redirecionando automaticamente para `/login`.
- **Validação de Build**:
  - `npm run build` gerou artefatos estáticos em `dist/` com **zero erros** de compilação ou tipos (incorporando Tailwind CSS v4, PostCSS e Google OAuth).

### 2.3 Scripts Utilitários
- `iniciar_backend.bat`: Inicialização automatizada do FastAPI na porta 8001.
- `iniciar_frontend.bat`: Inicialização automatizada do Vite na porta 5175.
- `executar_testes.bat`: Execução rápida dos testes Pytest com relatório em terminal.

---

## 3. Garantias de Não-Regressão, Portas e Fronteiras
- **Portas Frontends Sem Conflito**:
  - `5173`: e-Sigma Frontend (`strictPort: true`)
  - `5174`: CoReVM Frontend (`strictPort: true`)
  - `5175`: Lojas Frontend (`strictPort: true` no `vite.config.ts` e flag `--strictPort` no `package.json`). Caso a porta esteja ocupada, o Vite aborta de forma ruidosa em vez de auto-incrementar e sequestrar a porta dos outros módulos.
- **CoReVM**: A rota `GET /api/v1/hierarquia/lojas/buscar` (autenticada via `x-service-key`) foi testada e preservada sem qualquer quebra de contrato.
- **e-Sigma**: A validação de identidade depende exclusivamente de repasse do token JWT (`GET /api/v1/auth/validate`). O Lojas não armazena segredos de outros módulos nem acessa tabelas fora de `lojas_db`.
- **Banco de Dados**: Nenhum dado pré-existente foi apagado ou renomeado. A migração foi executada estritamente com `ADD COLUMN IF NOT EXISTS`.

---

## 4. Próximos Passos Recomendados para Sessões Futuras
1. Se desejado pelo time, criar integração de leitor de QR Code físico/câmera no modal de check-in (`html5-qrcode` ou `@zxing/library`).
2. Adicionar testes E2E com Playwright ou Cypress no frontend.
3. Configurar pipeline de CI/CD para deploy conjunto (Docker / GitHub Actions) se aplicável.
