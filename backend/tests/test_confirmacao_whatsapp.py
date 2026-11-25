# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import asyncio
import os
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["ENABLE_WHATSAPP_SCHEDULER"] = "false"

from core.auth_esigma import UsuarioEsigma, obter_usuario_esigma
from core.dependencies import (
    get_db,
    get_usuario_e_obreiro,
    get_usuario_e_obreiro_opcional,
)
from database import Base
from main import app
from models.models import Loja, Obediencia, Obreiro, TipoObedienciaEnum
from services.confirmacao_whatsapp_service import (
    executar_ciclo_agendador,
    extrair_data_e_titulo,
)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

_usuario_atual = {
    "email": "vm@loja2181.org.br",
    "role": "super_admin",
    "nome": "José Antonio Lisboa",
}


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _criar_contexto_usuario():
    usuario = UsuarioEsigma(
        email=_usuario_atual["email"],
        user_id="user-2181",
        role=_usuario_atual["role"],
        organizacao_id="2181",
        cim="0292936",
        cpf="11122233344",
        modulos_ativos=["lojas"],
    )
    obreiro = Obreiro(
        id=1,
        nome_completo=_usuario_atual["nome"],
        cim="0292936",
        cpf="11122233344",
        email=_usuario_atual["email"],
        hash_senha="hash",
        status="Ativo",
    )
    return usuario, obreiro


@pytest.fixture(autouse=True)
def setup_database():
    _usuario_atual["email"] = "vm@loja2181.org.br"
    _usuario_atual["role"] = "super_admin"
    _usuario_atual["nome"] = "José Antonio Lisboa"

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_usuario_e_obreiro] = _criar_contexto_usuario
    app.dependency_overrides[get_usuario_e_obreiro_opcional] = _criar_contexto_usuario
    app.dependency_overrides[obter_usuario_esigma] = lambda: _criar_contexto_usuario()[0]

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    potencia = Obediencia(
        id=1,
        nome="Grande Oriente do Brasil",
        sigla="GOB",
        tipo=TipoObedienciaEnum.FEDERAL,
        nome_contato_tecnico="Admin",
        email_contato_tecnico="admin@gob.org.br",
    )
    db.add(potencia)
    db.flush()

    loja = Loja(
        id=2181,
        nome_loja="João Pedro Junqueira",
        numero_loja="2181",
        codigo_loja="jpj",
        potencia_id=1,
        nome_contato_tecnico="Secretaria",
        email_contato_tecnico="secretaria@loja2181.org.br",
    )
    db.add(loja)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_extracao_data_e_titulo():
    texto = (
        "Solicito aos Irmãos preencher a Lista de Confirmação no jantar do "
        "irmão fulano e cunhada cicrana, dia 27/11/2026"
    )
    data_ev, titulo, encontrada = extrair_data_e_titulo(texto, data_referencia=date(2026, 11, 20))
    assert encontrada is True
    assert data_ev == date(2026, 11, 27)
    assert "jantar do irmão fulano e cunhada cicrana" in titulo.lower()
    assert "27/11/2026" not in titulo


def test_publicar_confirmacao_publica_csv_e_reset():
    # 1. Configura slug 'jpj'
    res_cfg = client.put(
        "/api/v1/lojas/2181/confirmacao-whatsapp/configuracao",
        json={
            "slug_publico": "jpj",
            "url_publica_base": "https://lojajoaopedrojunqueira.com.br/confirmacao",
        },
    )
    assert res_cfg.status_code == 200
    assert res_cfg.json()["slug_publico"] == "jpj"

    # 2. Publica lista com auto-inclusão do anunciante
    res_pub = client.post(
        "/api/v1/lojas/2181/confirmacao-whatsapp/publicar",
        json={
            "texto_anuncio": "Solicito aos Irmãos preencher a Lista de Confirmação no jantar do irmão fulano, dia 27/11/2026",
            "incluir_anunciante": True,
            "acompanhantes_anunciante": 1,
        },
    )
    assert res_pub.status_code == 201
    lista = res_pub.json()
    lista_id = lista["id"]
    assert lista["data_evento"] == "2026-11-27"
    assert len(lista["registros"]) == 1
    assert lista["registros"][0]["origem"] == "ANUNCIANTE"
    assert lista["registros"][0]["primeiro_nome"] == "José"
    assert lista["registros"][0]["ultimo_nome"] == "Lisboa"
    assert lista["registros"][0]["acompanhantes"] == 1

    # Confirma que 1 + 1 = 2
    assert lista["totais"]["irmaos_confirmados"] == 1
    assert lista["totais"]["acompanhantes"] == 1
    assert lista["totais"]["total_pessoas"] == 2

    # 3. Confirmação pública com token_aparelho (criação e atualização sem duplicar)
    res_conf1 = client.post(
        "/api/v1/confirmacao-publica/jpj/confirmar",
        json={
            "primeiro_nome": "André",
            "ultimo_nome": "Mendes",
            "acompanhantes": 2,
            "token_aparelho": "device-abc-123",
        },
    )
    assert res_conf1.status_code == 200
    dados_pub1 = res_conf1.json()
    assert dados_pub1["em_espera"] is False
    assert dados_pub1["totais"]["irmaos_confirmados"] == 2
    assert dados_pub1["totais"]["acompanhantes"] == 3
    assert dados_pub1["totais"]["total_pessoas"] == 5

    # Atualiza pelo mesmo token_aparelho (não duplica)
    res_conf2 = client.post(
        "/api/v1/confirmacao-publica/jpj/confirmar",
        json={
            "primeiro_nome": "André",
            "ultimo_nome": "Mendes",
            "acompanhantes": 0,
            "token_aparelho": "device-abc-123",
        },
    )
    assert res_conf2.status_code == 200
    dados_pub2 = res_conf2.json()
    assert dados_pub2["totais"]["irmaos_confirmados"] == 2
    assert dados_pub2["totais"]["acompanhantes"] == 1
    assert dados_pub2["totais"]["total_pessoas"] == 3

    # 4. Exportação CSV UTF-8 BOM com ';'
    res_csv = client.get(f"/api/v1/lojas/2181/confirmacao-whatsapp/listas/{lista_id}/csv")
    assert res_csv.status_code == 200
    assert res_csv.content.startswith(b"\xef\xbb\xbf")
    texto_csv = res_csv.content.decode("utf-8-sig")
    assert "Primeiro Nome;Último Nome;Acompanhantes" in texto_csv
    assert "André;Mendes;0" in texto_csv

    # 5. Cancelamento público
    res_canc = client.post(
        "/api/v1/confirmacao-publica/jpj/cancelar",
        json={"token_aparelho": "device-abc-123"},
    )
    assert res_canc.status_code == 200
    assert res_canc.json()["totais"]["irmaos_confirmados"] == 1

    # 6. Reset manual
    res_reset = client.post("/api/v1/lojas/2181/confirmacao-whatsapp/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["arquivadas"] == 1

    res_espera = client.get("/api/v1/confirmacao-publica/jpj")
    assert res_espera.status_code == 200
    assert res_espera.json()["em_espera"] is True


def test_publicador_autorizado_e_agendador():
    # Cadastra publicador autorizado
    res_add = client.post(
        "/api/v1/lojas/2181/confirmacao-whatsapp/publicadores",
        json={"email": "banquetes@loja2181.org.br", "nome": "Mestre de Banquetes"},
    )
    assert res_add.status_code == 201

    # Troca usuário logado para o publicador (role comum 'user', sem cargo de gestão)
    _usuario_atual["email"] = "banquetes@loja2181.org.br"
    _usuario_atual["role"] = "user"
    _usuario_atual["nome"] = "Carlos Banquetes"

    res_painel = client.get("/api/v1/lojas/2181/confirmacao-whatsapp/painel")
    assert res_painel.status_code == 200
    assert res_painel.json()["eh_gestao_loja"] is False

    # Publica evento para quinta-feira 26/11/2026
    res_pub = client.post(
        "/api/v1/lojas/2181/confirmacao-whatsapp/publicar",
        json={
            "texto_anuncio": "Jantar ritualístico dia 26/11/2026",
            "incluir_anunciante": True,
        },
    )
    assert res_pub.status_code == 201

    # Testa agendador: dia anterior (25/11/2026) às 18:00 -> deve disparar
    tz = ZoneInfo("America/Sao_Paulo")
    db = TestingSessionLocal()
    try:
        r1 = asyncio.run(executar_ciclo_agendador(db, agora=datetime(2026, 11, 25, 18, 2, tzinfo=tz)))
        assert r1["disparos"] == 1
        # Mesmo slot não dispara duas vezes
        r1_dup = asyncio.run(executar_ciclo_agendador(db, agora=datetime(2026, 11, 25, 18, 5, tzinfo=tz)))
        assert r1_dup["disparos"] == 0

        # No dia do evento (26/11/2026) às 18:00 NÃO dispara (só 08:00 e 14:00)
        r2 = asyncio.run(executar_ciclo_agendador(db, agora=datetime(2026, 11, 26, 18, 2, tzinfo=tz)))
        assert r2["disparos"] == 0

        # No dia do evento às 14:00 dispara
        r3 = asyncio.run(executar_ciclo_agendador(db, agora=datetime(2026, 11, 26, 14, 1, tzinfo=tz)))
        assert r3["disparos"] == 1

        # Sábado (28/11/2026) às 00:05 -> reset semanal
        r_reset = asyncio.run(executar_ciclo_agendador(db, agora=datetime(2026, 11, 28, 0, 5, tzinfo=tz)))
        assert r_reset["resets"] == 1
    finally:
        db.close()

    # Usuário não autorizado recebe 403
    _usuario_atual["email"] = "intruso@loja2181.org.br"
    res_403 = client.get("/api/v1/lojas/2181/confirmacao-whatsapp/painel")
    assert res_403.status_code == 403
