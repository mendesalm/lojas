# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Testes automatizados da API do módulo Lojas:
Validação de normalização GOB, rotas de Obreiros, Sessões, Presenças e Hierarquia.
"""
import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
from database import Base, get_db
from main import app
from core.dependencies import get_usuario_e_obreiro, UsuarioEsigma
from core.service_auth import exigir_chave_de_servico
from services.normalizadores_gob import (
    normalizar_rito_gob,
    normalizar_grau_gob,
    normalizar_cim,
    normalizar_cpf,
    normalizar_telefone,
    mapear_codigo_cargo_gob
)
from models.models import Loja, Obediencia, Obreiro, TipoObedienciaEnum

# Setup do banco de testes em SQLite em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_usuario_vm():
    usuario = UsuarioEsigma(
        email="vm@teste.lojas",
        user_id="user-123",
        role="super_admin",
        organizacao_id="org-123",
        cim="0292936",
        cpf="11122233344",
        modulos_ativos=["lojas", "corevm"]
    )
    obreiro = Obreiro(
        id=1,
        nome_completo="José Antonio Lisboa",
        cim="0292936",
        cpf="11122233344",
        email="vm@teste.lojas",
        hash_senha="hash",
        status="Ativo"
    )
    return usuario, obreiro


from core.auth_esigma import obter_usuario_esigma

def override_chave_servico():
    return True


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_usuario_e_obreiro] = override_usuario_vm
app.dependency_overrides[obter_usuario_esigma] = lambda: override_usuario_vm()[0]
app.dependency_overrides[exigir_chave_de_servico] = override_chave_servico

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Cria estrutura de Potência e Loja de teste
    potencia = Obediencia(
        id=1,
        nome="Grande Oriente do Brasil",
        sigla="GOB",
        tipo=TipoObedienciaEnum.FEDERAL,
        nome_contato_tecnico="Admin",
        email_contato_tecnico="admin@gob.org.br"
    )
    db.add(potencia)
    db.flush()

    loja = Loja(
        id=2181,
        nome_loja="João Pedro Junqueira",
        numero_loja="2181",
        codigo_loja="JPJ-2181",
        potencia_id=1,
        nome_contato_tecnico="Secretaria",
        email_contato_tecnico="secretaria@loja2181.org.br"
    )
    db.add(loja)
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)


def test_normalizadores_gob():
    """Valida as regras de conversão da estrutura do GOB."""
    assert normalizar_rito_gob("RB") == "Rito Brasileiro"
    assert normalizar_rito_gob("RY") == "Rito York"
    assert normalizar_rito_gob("REAA") == "REAA"
    assert normalizar_rito_gob("SEM_RITO") is None

    assert normalizar_grau_gob("MASTER") == "Mestre"
    assert normalizar_grau_gob("APPRENTICE") == "Aprendiz"
    assert normalizar_grau_gob("FELLOWCRAFT") == "Companheiro"

    assert normalizar_cim("292936") == "0292936"
    assert normalizar_cpf("831.059.806-87") == "83105980687"
    assert normalizar_telefone("62991809133") == "+5562991809133"

    assert mapear_codigo_cargo_gob("VM") == 1
    assert mapear_codigo_cargo_gob("1V") == 2
    assert mapear_codigo_cargo_gob("CHAN") == 7


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cadastrar_e_listar_obreiro():
    """Testa a criação de um obreiro com campos do GOB e sua listagem no quadro."""
    payload = {
        "loja_id": 2181,
        "nome_completo": "André Luiz Mendes",
        "cim": "0272875",
        "cpf": "831.059.806-87",
        "email": "mendesalm@gmail.com",
        "telefone": "+5562991809133",
        "grau": "MASTER",
        "tipo_sanguineo": "O+",
        "estado_civil": "Casado",
        "profissao": "Militar da Reserva",
        "data_nascimento": "1974-07-23"
    }
    res_create = client.post("/api/v1/lojas/2181/obreiros", json=payload)
    assert res_create.status_code == 201
    dados = res_create.json()
    assert dados["nome_completo"] == "André Luiz Mendes"
    assert dados["cim"] == "0272875"
    assert dados["cpf"] == "83105980687" # Apenas dígitos
    assert dados["grau"] == "Mestre"
    assert dados["tipo_sanguineo"] == "O+"

    # Listagem no quadro
    res_list = client.get("/api/v1/lojas/2181/obreiros")
    assert res_list.status_code == 200
    quadro = res_list.json()
    assert len(quadro) >= 1
    assert quadro[0]["cim"] == "0272875"


def test_aniversariantes_mes():
    """Cadastra obreiros e testa o filtro do mês de aniversário."""
    payload = {
        "loja_id": 2181,
        "nome_completo": "Mário Serra Ferreira",
        "cim": "0255263",
        "cpf": "12345678901",
        "email": "mario@teste.com",
        "data_nascimento": "1981-09-05",
        "grau": "MASTER"
    }
    client.post("/api/v1/lojas/2181/obreiros", json=payload)

    res_aniv = client.get("/api/v1/lojas/2181/aniversariantes?mes=9")
    assert res_aniv.status_code == 200
    dados = res_aniv.json()
    assert dados["mes"] == 9
    assert dados["total"] == 1
    assert dados["membros"][0]["nome_completo"] == "Mário Serra Ferreira"
    assert dados["membros"][0]["dia"] == 5


def test_agendamento_e_checkin_sessao():
    """Testa criação de sessão maçônica e registro de presença."""
    sessao_payload = {
        "loja_id": 2181,
        "titulo": "Sessão Ordinária de Finanças",
        "numero_sessao": 1,
        "data_sessao": str(date.today()),
        "status": "EM_ANDAMENTO",
        "pauta": "Apresentação do balancete mensal"
    }
    res_sessao = client.post("/api/v1/lojas/2181/sessoes", json=sessao_payload)
    assert res_sessao.status_code == 201
    sessao_id = res_sessao.json()["id"]

    # Verifica sessão ativa
    res_ativa = client.get("/api/v1/lojas/2181/sessoes/ativa")
    assert res_ativa.status_code == 200
    assert res_ativa.json()["id"] == sessao_id

    # Check-in do obreiro
    checkin_payload = {"metodo": "QR_CODE", "obreiro_id": 1}
    res_checkin = client.post(f"/api/v1/lojas/2181/sessoes/{sessao_id}/check-in", json=checkin_payload)
    assert res_checkin.status_code == 200
    assert res_checkin.json()["status_presenca"] == "PRESENTE"


def test_comissoes_e_avisos():
    """Testa criação e listagem de Comissões e Mural de Avisos da Loja."""
    comissao_payload = {
        "loja_id": 2181,
        "nome": "Comissão de Finanças",
        "tipo_comissao": "Permanente",
        "data_inicio": "2026-01-01",
        "data_fim": "2026-12-31",
        "presidente_id": 1
    }
    res_com = client.post("/api/v1/lojas/2181/comissoes", json=comissao_payload)
    assert res_com.status_code == 201
    assert res_com.json()["nome"] == "Comissão de Finanças"

    res_com_list = client.get("/api/v1/lojas/2181/comissoes")
    assert res_com_list.status_code == 200
    assert len(res_com_list.json()) == 1

    aviso_payload = {
        "loja_id": 2181,
        "titulo": "Banquete Ritualístico de Solstício",
        "conteudo": "Convidamos todos os irmãos para o ágape ritualístico.",
        "tipo": "Aviso",
        "ativo": True
    }
    res_aviso = client.post("/api/v1/lojas/2181/avisos", json=aviso_payload)
    assert res_aviso.status_code == 201
    assert res_aviso.json()["titulo"] == "Banquete Ritualístico de Solstício"

    res_avisos_list = client.get("/api/v1/lojas/2181/avisos")
    assert res_avisos_list.status_code == 200
    assert len(res_avisos_list.json()) == 1


def test_hierarquia_busca_loja():
    """Testa a rota de Hierarquia (backend-a-backend com service key)."""
    res = client.get("/api/v1/hierarquia/lojas/buscar?numero_loja=2181")
    assert res.status_code == 200
    dados = res.json()
    assert dados["loja"]["numero_loja"] == "2181"
    assert dados["loja"]["nome_loja"] == "João Pedro Junqueira"
    assert dados["potencia"]["sigla"] == "GOB"


def test_obter_dados_cadastrais_loja():
    """Testa a rota de obtenção dos dados cadastrais da loja no lojas_db."""
    res = client.get("/api/v1/lojas/2181")
    assert res.status_code == 200
    dados = res.json()
    assert dados["nome_loja"] == "João Pedro Junqueira"
    assert dados["numero_loja"] == "2181"
    assert dados["potencia_nome"] == "Grande Oriente do Brasil"
    assert "Grande Oriente do Brasil" in dados.get("filiacao_formatada", "")


def test_busca_lojas_global_e_multiplas():
    """Testa busca global por termo e em lote por IDs."""
    res_busca = client.get("/api/v1/lojas/busca?q=Junqueira")
    assert res_busca.status_code == 200
    lojas = res_busca.json()
    assert len(lojas) >= 1
    assert lojas[0]["numero"] == "2181"

    res_lote = client.post("/api/v1/lojas/busca/multiplas", json={"ids": [2181]})
    assert res_lote.status_code == 200
    lojas_lote = res_lote.json()
    assert len(lojas_lote) == 1
    assert lojas_lote[0]["id"] == 2181


def test_atualizar_dados_cadastrais_loja_api():
    """Testa a atualização via PUT/PATCH da loja."""
    payload = {
        "logradouro": "Rua das Acacias",
        "numero": "42",
        "bairro": "Centro",
        "cidade": "Goiania",
        "estado": "GO",
        "cep": "74000-000",
        "dia_sessao": "Segunda-feira",
        "periodicidade": "Semanal"
    }
    res = client.put("/api/v1/lojas/2181", json=payload)
    assert res.status_code == 200
    dados = res.json()
    assert dados["logradouro"] == "Rua das Acacias"
    assert dados["cidade"] == "Goiania"


def test_documentos_loja_e_regionais_api():
    """Testa cadastro, listagem e busca regional de documentos."""
    doc_payload = {
        "titulo": "Balaústre da Sessão de Finanças",
        "tipo_documento": "BALAUSTRE",
        "caminho_arquivo": "/uploads/loja_2181/doc1.pdf",
        "nome_arquivo": "doc1.pdf",
        "tipo_arquivo": "pdf",
        "visibilidade": "REGIONAL",
        "descricao": "Ata aprovada sem emendas",
        "loja_id": 2181
    }
    res_cria = client.post("/api/v1/lojas/2181/documentos", json=doc_payload)
    assert res_cria.status_code == 201
    doc = res_cria.json()
    assert doc["titulo"] == "Balaústre da Sessão de Finanças"
    assert doc["visibilidade"] == "REGIONAL"

    res_list = client.get("/api/v1/lojas/2181/documentos")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    res_reg = client.get("/api/v1/documentos/regionais?lojas_ids=2181")
    assert res_reg.status_code == 200
    assert len(res_reg.json()) >= 1


def test_admissoes_loja_e_regionais_api():
    """Testa cadastro e listagem de prévias/editais de admissão."""
    admissao_payload = {
        "tipo": "INICIACAO",
        "candidato_nome": "Candidato Teste da Silva",
        "pdf_url": "http://arquivos.sigma/previa123.pdf",
        "visibilidade": "REGIONAL",
        "loja_id": 2181
    }
    res_cria = client.post("/api/v1/lojas/2181/admissoes", json=admissao_payload)
    assert res_cria.status_code == 201
    adm = res_cria.json()
    assert adm["candidato_nome"] == "Candidato Teste da Silva"
    assert adm["status"] == "EM_ANDAMENTO"

    res_reg = client.get("/api/v1/admissoes/regionais?lojas_ids=2181")
    assert res_reg.status_code == 200
    assert len(res_reg.json()) >= 1


def test_sessao_visibilidade_regional_api():
    """Testa criação de sessão com visibilidade regional e consulta regional."""
    sessao_payload = {
        "titulo": "Sessão Magna Regional Conjunta",
        "data_sessao": date.today().isoformat(),
        "tipo": "Magna",
        "subtipo": "Festiva",
        "visibilidade": "REGIONAL",
        "loja_id": 2181
    }
    res_cria = client.post("/api/v1/lojas/2181/sessoes", json=sessao_payload)
    assert res_cria.status_code == 201
    sessao = res_cria.json()
    assert sessao["visibilidade"] == "REGIONAL"

    res_reg = client.get("/api/v1/sessoes/regionais?lojas_ids=2181")
    assert res_reg.status_code == 200
    assert any(s["titulo"] == "Sessão Magna Regional Conjunta" for s in res_reg.json())


def test_avisos_conselho_regional_via_dupla_api():
    """Testa a publicação de aviso pelo Conselho Regional e a exibição automática no painel do Lojas."""
    headers_servico = {"X-Service-Key": "lBo_w3qPZ9GDL0O5jq8PgOpjKc8M2J1YdV7QfOj_Zfw"}
    
    # 1. Publica aviso broadcast regional
    aviso_payload = {
        "titulo": "Convocação Ordinária da 1ª Região Maçônica",
        "conteudo": "Convocamos todos os Veneráveis Mestres para a Assembleia Geral Regional.",
        "nivel_prioridade": "URGENTE",
        "autor_nome": "Mesa Diretora do Conselho Regional",
        "loja_id": None  # Broadcast para todas as lojas
    }
    res_pub = client.post("/api/v1/avisos/regional", json=aviso_payload, headers=headers_servico)
    assert res_pub.status_code == 201
    dados_pub = res_pub.json()
    assert dados_pub["status"] == "success"
    assert dados_pub["origem"] == "CONSELHO_REGIONAL"

    # 2. Verifica se o aviso aparece na listagem de avisos da Loja 2181 com prefixo [Conselho Regional]
    res_notices = client.get("/api/v1/lojas/2181/dashboard/notices")
    assert res_notices.status_code == 200
    notices = res_notices.json()
    aviso_encontrado = next((n for n in notices if "Convocação Ordinária da 1ª Região" in n["title"]), None)
    assert aviso_encontrado is not None
    assert aviso_encontrado["title"].startswith("[Conselho Regional]")
    assert aviso_encontrado["origem"] == "CONSELHO_REGIONAL"
    assert aviso_encontrado["nivel_prioridade"] == "URGENTE"

    # 3. Verifica se a rota do conselho lista os avisos
    res_regionais = client.get("/api/v1/avisos/regionais", headers=headers_servico)
    assert res_regionais.status_code == 200
    assert any("Convocação Ordinária" in a["titulo"] for a in res_regionais.json())




