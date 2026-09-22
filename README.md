# Lojas — Sistema de Gestão Interna de Oficinas Maçônicas

O módulo **Lojas** é a aplicação dedicada à gestão interna de Lojas Maçônicas no ecossistema Sigma, compreendendo os setores de **Secretaria**, **Chancelaria**, **Administração da Oficina** e o **Portal do Obreiro** (autoatendimento).

Atua de forma desacoplada e harmonizada com o **e-Sigma** (Provedor Central de Identidade e Autenticação JWT) e o **CoReVM** (Conselho Regional de Veneráveis Mestres), mantendo estrita compatibilidade com o esquema de dados do Grande Oriente do Brasil (**GOB** - Metadados GOB / METAGOB).

---

## 1. Escopo e Fatias Verticais

| Módulo / Setor | Funcionalidades Principais |
| :--- | :--- |
| **Secretaria** | Quadro de Obreiros (CIM, CPF, Graus, Datas de Iniciação/Elevação/Exaltação/Instalação), Ficha Cadastral Completa, Familiares, Mural de Avisos, Importador de Quadro. |
| **Chancelaria** | Livro de Presenças, Sessões Maçônicas (Ordinárias, Magnas, Extraordinárias), Sessão Ativa em Tempo Real, Check-in via QR Code / Manual, Controle de Visitantes e Irmãos do Quadro. |
| **Administração** | Dados Institucionais do Templo, Potência e Jurisdição, Reuniões e Horários, Comissões Permanentes e Temporárias, Histórico de Diretorias/Mandatos. |
| **Portal do Obreiro** | Autoatendimento para conferência de dados civis e maçônicos, aniversariantes com atalho direto para felicitações via WhatsApp e extrato de presenças. |

> **Nota de Fronteira:** Módulos como *Financeiro/Cashless*, *Biblioteca*, *Classificados* e *Harmonia* são módulos satélites individualizados e não pertencem ao repositório Lojas.

---

## 2. Arquitetura e Portas Padrão

- **Backend:** FastAPI (Python 3.12+ / 3.14), SQLAlchemy, Pydantic v2, Loguru, Pytest.
- **Frontend:** React 19, TypeScript, Vite, Material UI v9 (MUI), React Router 7, Notistack.
- **Banco de Dados:** PostgreSQL compartilhado com CoReVM (`lojas_db`), sem migrações destrutivas.

### Portas de Execução:
- **Lojas Backend:** Porta `8001` (Dev) / `8003` (Prod)
- **Lojas Frontend:** Porta `5175`
- **e-Sigma (IdP Satélite):** Porta `8000` (Dev) / `8001` (Prod)
- **CoReVM:** Porta `8003` (Dev) / `8002` (Prod)

---

## 3. Compatibilidade GOB (Metadados GOB / METAGOB)

O módulo incorpora normalizadores canônicos em `backend/services/normalizadores_gob.py` para mapeamento bidirecional de:
- **Ritos:** `RAUF` (Adonhiramita), `RB` (Brasileiro), `RY` (York), `REAA` (Escocês Antigo e Aceito), `RER` (Retificado), `RME` (Moderno), `RS` (Schröder).
- **Graus:** `APPRENTICE` (Aprendiz), `FELLOWCRAFT` (Companheiro), `MASTER` (Mestre), `INSTALLED_MASTER` (Mestre Instalado).
- **Identificadores:** Normalização de CIM para 7 dígitos canônicos (`zfill(7)`), CPF (11 dígitos limpos) e Telefone (padrão internacional E.164).
- **Cargos do Board / Diretoria:** 1: VM, 2: 1º Vigilante, 3: 2º Vigilante, 4: Orador, 5: Secretário, 6: Tesoureiro, 7: Chanceler.

---

## 4. Como Executar

### Pré-requisitos
- Python instalado
- Node.js instalado
- Banco de dados PostgreSQL configurado no `.env`

### Inicialização Rápida (Windows)
1. **Iniciar Backend:** Dê dois cliques em `iniciar_backend.bat`
2. **Iniciar Frontend:** Dê dois cliques em `iniciar_frontend.bat`
3. **Executar Testes:** Dê dois cliques em `executar_testes.bat`

### Inicialização Manual
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Testes do Backend
cd backend
.\venv\Scripts\python -m pytest tests -v

# Frontend
cd frontend
npm install
npm run dev
# ou para build de produção:
npm run build
```

---

## 5. Endpoints Principais da API (`/api/v1`)

- `GET /api/v1/health` — Verificação de status do serviço
- `GET /api/v1/obreiros` — Listagem do quadro de membros da Loja
- `POST /api/v1/obreiros` — Cadastro de novo obreiro (com validação GOB)
- `GET /api/v1/obreiros/aniversariantes` — Aniversariantes do mês corrente
- `GET /api/v1/obreiros/meu-perfil` — Perfil do usuário autenticado
- `GET /api/v1/sessoes` — Sessões maçônicas agendadas e passadas
- `POST /api/v1/sessoes` — Convocação / agendamento de sessão
- `GET /api/v1/sessoes/ativa` — Sessão maçônica em andamento no templo
- `POST /api/v1/sessoes/{id}/checkin` — Check-in de presença (QR Code ou geofence)
- `GET /api/v1/sessoes/{id}/presencas` — Livro de chamada da sessão
- `GET /api/v1/sessoes/visitantes` — Registro de visitantes e lojas de origem
- `GET /api/v1/lojas/dados` — Dados cadastrais e litúrgicos da Loja
- `GET /api/v1/lojas/comissoes` — Comissões permanentes e temporárias
- `GET /api/v1/hierarquia/lojas/buscar` — Contrato consumido pelo CoReVM via `x-service-key`
- `GET /api/v1/mandatos` — Consulta de diretorias e cargos eletivos
