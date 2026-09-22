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


def override_chave_servico():
    return True


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_usuario_e_obreiro] = override_usuario_vm
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

