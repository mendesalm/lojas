# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de Lista Semanal de Confirmação via WhatsApp:
- Extração automática de data e título a partir do texto do anúncio
- Formatação da lista para WhatsApp e exportação CSV UTF-8 BOM (;)
- Cliente resiliente httpx para o microsserviço esigma-wa-gateway (com fallback para modo simulador)
- Agendador semanal leve em asyncio (America/Sao_Paulo): 08/14/18h dias anteriores, 08/14h no dia, reset sábado 00:00
"""
import asyncio
import csv
import io
import logging
import os
import re
import unicodedata
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, List, Optional, Tuple
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy.orm import Session

from database import SessionLocal
from models.confirmacao_whatsapp import (
    ConfiguracaoConfirmacaoWhatsapp,
    ListaConfirmacaoWhatsapp,
    LogDisparoConfirmacaoWhatsapp,
    RegistroConfirmacaoWhatsapp,
)
from models.models import Loja
from schemas.confirmacao_whatsapp_schemas import TotaisConfirmacaoResponse

logger = logging.getLogger("lojas.confirmacao_whatsapp")

FUSO_PADRAO = ZoneInfo("America/Sao_Paulo")

MESES_PT = {
    "janeiro": 1,
    "jan": 1,
    "fevereiro": 2,
    "fev": 2,
    "marco": 3,
    "março": 3,
    "mar": 3,
    "abril": 4,
    "abr": 4,
    "maio": 5,
    "mai": 5,
    "junho": 6,
    "jun": 6,
    "julho": 7,
    "jul": 7,
    "agosto": 8,
    "ago": 8,
    "setembro": 9,
    "set": 9,
    "outubro": 10,
    "out": 10,
    "novembro": 11,
    "nov": 11,
    "dezembro": 12,
    "dez": 12,
}


def agora_sp() -> datetime:
    return datetime.now(FUSO_PADRAO)


def agora_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _slugify(texto: str) -> str:
    norm = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", norm.lower()).strip("-")
    return slug or "loja"


def obter_ou_criar_configuracao(db: Session, loja: Loja) -> ConfiguracaoConfirmacaoWhatsapp:
    cfg = (
        db.query(ConfiguracaoConfirmacaoWhatsapp)
        .filter(ConfiguracaoConfirmacaoWhatsapp.loja_id == loja.id)
        .first()
    )
    if cfg:
        return cfg

    slug_base = _slugify(loja.codigo_loja or loja.nome_loja or f"loja-{loja.id}")
    slug_candidato = slug_base
    sufixo = 1
    while (
        db.query(ConfiguracaoConfirmacaoWhatsapp)
        .filter(ConfiguracaoConfirmacaoWhatsapp.slug_publico == slug_candidato)
        .first()
        is not None
    ):
        sufixo += 1
        slug_candidato = f"{slug_base}-{sufixo}"

    cfg = ConfiguracaoConfirmacaoWhatsapp(
        loja_id=loja.id,
        slug_publico=slug_candidato,
        horarios_dias_normais="08:00,14:00,18:00",
        horarios_dia_evento="08:00,14:00",
        dia_semana_reset=5,
        horario_reset="00:00",
        fuso_horario="America/Sao_Paulo",
        republicar_ao_confirmar=True,
        ativo=True,
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg


def obter_url_publica_efetiva(cfg: ConfiguracaoConfirmacaoWhatsapp) -> str:
    if cfg.url_publica_base and cfg.url_publica_base.strip():
        return cfg.url_publica_base.strip().rstrip("/")
    base_frontend = os.getenv("LOJAS_PUBLIC_BASE_URL", "https://lojas.e-sigma.app").rstrip("/")
    return f"{base_frontend}/confirmacao/{cfg.slug_publico}"


def extrair_primeiro_e_ultimo_nome(nome_completo: str) -> Tuple[str, str]:
    partes = [p for p in (nome_completo or "").strip().split() if p]
    if not partes:
        return "Irmão", ""
    if len(partes) == 1:
        return partes[0], ""
    return partes[0], partes[-1]


def extrair_data_e_titulo(texto: str, data_referencia: Optional[date] = None) -> Tuple[date, str, bool]:
    """
    Extrai data e sugere um título limpo a partir de um texto livre de anúncio.
    Retorna (data_evento, titulo_sugerido, data_encontrada_no_texto).
    """
    ref = data_referencia or agora_sp().date()
    texto_limpo = " ".join((texto or "").strip().split())
    data_encontrada: Optional[date] = None

    # 1. dd/mm/yyyy ou dd-mm-yyyy ou dd/mm/yy
    match_full = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", texto_limpo)
    if match_full:
        dia, mes, ano = int(match_full.group(1)), int(match_full.group(2)), int(match_full.group(3))
        if ano < 100:
            ano += 2000
        try:
            data_encontrada = date(ano, mes, dia)
        except ValueError:
            data_encontrada = None

    # 2. yyyy-mm-dd
    if data_encontrada is None:
        match_iso = re.search(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", texto_limpo)
        if match_iso:
            try:
                data_encontrada = date(int(match_iso.group(1)), int(match_iso.group(2)), int(match_iso.group(3)))
            except ValueError:
                data_encontrada = None

    # 3. "27 de novembro de 2026" ou "27 de novembro"
    if data_encontrada is None:
        match_ext = re.search(
            r"\b(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)(?:\s+de\s+(\d{4}))?\b",
            texto_limpo,
            flags=re.IGNORECASE,
        )
        if match_ext:
            dia = int(match_ext.group(1))
            mes_nome = match_ext.group(2).lower()
            mes = MESES_PT.get(mes_nome)
            ano = int(match_ext.group(3)) if match_ext.group(3) else ref.year
            if mes:
                try:
                    cand = date(ano, mes, dia)
                    if not match_ext.group(3) and cand < ref:
                        cand = date(ano + 1, mes, dia)
                    data_encontrada = cand
                except ValueError:
                    data_encontrada = None

    # 4. dd/mm sem ano
    if data_encontrada is None:
        match_short = re.search(r"\b(\d{1,2})/(\d{1,2})\b", texto_limpo)
        if match_short:
            dia, mes = int(match_short.group(1)), int(match_short.group(2))
            try:
                cand = date(ref.year, mes, dia)
                if cand < ref:
                    cand = date(ref.year + 1, mes, dia)
                data_encontrada = cand
            except ValueError:
                data_encontrada = None

    # Limpa título
    titulo = texto_limpo
    # Remove trechos de data no final/meio (", dia 27/11/2026", "no dia 27/11", etc.)
    titulo = re.sub(
        r",?\s*(?:no\s+|na\s+)?(?:dia\s+)?\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b",
        "",
        titulo,
        flags=re.IGNORECASE,
    )
    titulo = re.sub(
        r",?\s*(?:no\s+|na\s+)?(?:dia\s+)?\d{1,2}\s+de\s+[a-zA-ZçÇ]+(?:\s+de\s+\d{4})?\b",
        "",
        titulo,
        flags=re.IGNORECASE,
    )
    # Remove saudações/chamadas comuns no início
    padroes_prefixo = [
        r"^(?:solicito|peço|pedimos|convidamos)\s+(?:aos?\s+)?(?:irm[aã]os|ii\.?\s*rr\.?)\s+(?:que\s+)?(?:preencher(?:em)?|confirmar(?:em)?|assinar(?:em)?)\s+(?:a\s+)?(?:lista\s+de\s+confirma[cç][aã]o|presen[cç]a)\s*(?:no|na|para\s+o|para\s+a|para|do|da|em)?\s*",
        r"^(?:lista\s+de\s+confirma[cç][aã]o)\s*(?:no|na|para\s+o|para\s+a|para|do|da|-|:)?\s*",
    ]
    for padrao in padroes_prefixo:
        novo = re.sub(padrao, "", titulo, flags=re.IGNORECASE).strip()
        if novo:
            titulo = novo

    titulo = titulo.strip(" ,.;:-")
    if titulo:
        titulo = titulo[0].upper() + titulo[1:]
    else:
        titulo = "Lista Semanal de Confirmação"

    return (data_encontrada or ref), titulo[:255], (data_encontrada is not None)


def calcular_totais(registros: List[RegistroConfirmacaoWhatsapp]) -> TotaisConfirmacaoResponse:
    confirmados = [r for r in registros if r.status == "CONFIRMADO"]
    irmaos = len(confirmados)
    acomp = sum(max(0, int(r.acompanhantes or 0)) for r in confirmados)
    presentes = sum(1 for r in confirmados if r.presente)
    return TotaisConfirmacaoResponse(
        irmaos_confirmados=irmaos,
        acompanhantes=acomp,
        total_pessoas=irmaos + acomp,
        presentes_checkin=presentes,
    )


def formatar_mensagem_whatsapp(
    lista: ListaConfirmacaoWhatsapp,
    registros: List[RegistroConfirmacaoWhatsapp],
    url_publica: str,
) -> str:
    confirmados = [r for r in registros if r.status == "CONFIRMADO"]
    totais = calcular_totais(confirmados)
    data_str = lista.data_evento.strftime("%d/%m/%Y")

    linhas = [
        f"*{lista.titulo}*",
        f"Data: *{data_str}*",
        "",
        lista.texto_anuncio.strip(),
        "",
        "*Lista de Confirmados:*",
    ]
    if not confirmados:
        linhas.append("_Nenhuma confirmação registrada até o momento._")
    else:
        for idx, reg in enumerate(confirmados, start=1):
            nome = f"{reg.primeiro_nome} {reg.ultimo_nome}".strip()
            if reg.acompanhantes and reg.acompanhantes > 0:
                linhas.append(f"{idx}. {nome} (+{reg.acompanhantes} acomp.)")
            else:
                linhas.append(f"{idx}. {nome}")

    linhas.extend([
        "",
        f"Irmãos: *{totais.irmaos_confirmados}* | Acompanhantes: *{totais.acompanhantes}* | Total: *{totais.total_pessoas} pessoas*",
        "",
        f"Confirme ou atualize sua presença pelo link:\n{url_publica}",
    ])
    return "\n".join(linhas)


def gerar_csv_lista(lista: ListaConfirmacaoWhatsapp, registros: List[RegistroConfirmacaoWhatsapp]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    writer.writerow([
        "Ordem",
        "Primeiro Nome",
        "Último Nome",
        "Acompanhantes",
        "Total Pessoas",
        "Origem",
        "Status",
        "Check-in Presença",
        "Atualizado em",
    ])
    for idx, r in enumerate(registros, start=1):
        total_reg = 1 + max(0, int(r.acompanhantes or 0)) if r.status == "CONFIRMADO" else 0
        writer.writerow([
            idx,
            r.primeiro_nome,
            r.ultimo_nome,
            r.acompanhantes,
            total_reg,
            r.origem,
            r.status,
            "Sim" if r.presente else "Não",
            r.atualizado_em.strftime("%d/%m/%Y %H:%M") if r.atualizado_em else "",
        ])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def _gateway_config() -> Tuple[str, str]:
    url = os.getenv("WA_GATEWAY_URL", "").strip().rstrip("/")
    key = os.getenv("WA_GATEWAY_KEY", "").strip()
    return url, key


async def gateway_status(loja_id: int) -> dict[str, Any]:
    url, key = _gateway_config()
    if not url:
        return {
            "loja_id": str(loja_id),
            "status": "simulador",
            "connected": False,
            "modo_simulador": True,
            "qr_code": None,
            "phone_number": None,
            "push_name": "Modo Simulador (WA_GATEWAY_URL não configurada)",
        }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{url}/internal/lojas/{loja_id}/status",
                headers={"X-Service-Key": key},
            )
            if resp.status_code == 200:
                data = resp.json()
                data["modo_simulador"] = False
                return data
            return {
                "loja_id": str(loja_id),
                "status": "erro",
                "connected": False,
                "modo_simulador": False,
                "last_error": f"Gateway retornou HTTP {resp.status_code}",
            }
    except Exception as exc:
        logger.warning(f"Falha ao consultar status no wa-gateway (loja {loja_id}): {exc}")
        return {
            "loja_id": str(loja_id),
            "status": "indisponivel",
            "connected": False,
            "modo_simulador": False,
            "last_error": "Gateway WhatsApp indisponível no momento.",
        }


async def gateway_conectar(loja_id: int) -> dict[str, Any]:
    url, key = _gateway_config()
    if not url:
        return await gateway_status(loja_id)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{url}/internal/lojas/{loja_id}/connect",
                headers={"X-Service-Key": key},
            )
            if resp.status_code == 200:
                data = resp.json()
                data["modo_simulador"] = False
                return data
            return {"status": "erro", "connected": False, "last_error": resp.text}
    except Exception as exc:
        logger.warning(f"Falha ao conectar wa-gateway (loja {loja_id}): {exc}")
        return {"status": "indisponivel", "connected": False, "last_error": str(exc)}


async def gateway_desconectar(loja_id: int) -> dict[str, Any]:
    url, key = _gateway_config()
    if not url:
        return await gateway_status(loja_id)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{url}/internal/lojas/{loja_id}/disconnect",
                headers={"X-Service-Key": key},
            )
            if resp.status_code == 200:
                return resp.json()
            return {"status": "erro", "connected": False, "last_error": resp.text}
    except Exception as exc:
        logger.warning(f"Falha ao desconectar wa-gateway (loja {loja_id}): {exc}")
        return {"status": "indisponivel", "connected": False, "last_error": str(exc)}


async def gateway_grupos(loja_id: int) -> dict[str, Any]:
    url, key = _gateway_config()
    if not url:
        return {"groups": [], "modo_simulador": True}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{url}/internal/lojas/{loja_id}/groups",
                headers={"X-Service-Key": key},
            )
            if resp.status_code == 200:
                data = resp.json()
                data["modo_simulador"] = False
                return data
            return {"groups": [], "erro": f"HTTP {resp.status_code}: {resp.text}"}
    except Exception as exc:
        logger.warning(f"Falha ao listar grupos wa-gateway (loja {loja_id}): {exc}")
        return {"groups": [], "erro": str(exc)}


async def enviar_mensagem_grupo_whatsapp(
    db: Session,
    cfg: ConfiguracaoConfirmacaoWhatsapp,
    lista: Optional[ListaConfirmacaoWhatsapp],
    tipo_disparo: str,
    mensagem: str,
    slot_agendado: Optional[str] = None,
) -> LogDisparoConfirmacaoWhatsapp:
    """
    Envia a mensagem para o grupo WhatsApp configurado via wa-gateway.
    Se WA_GATEWAY_URL não estiver configurada ou não houver grupo_whatsapp_jid,
    opera em modo simulador sem lançar exceção 500.
    """
    url, key = _gateway_config()
    grupo_jid = cfg.grupo_whatsapp_jid
    modo_simulador = (not url) or (not grupo_jid)

    sucesso = True
    erro_msg: Optional[str] = None

    if not modo_simulador:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{url}/internal/lojas/{cfg.loja_id}/send-group",
                    headers={"X-Service-Key": key},
                    json={"group_jid": grupo_jid, "message": mensagem},
                )
                if resp.status_code >= 400:
                    sucesso = False
                    erro_msg = f"HTTP {resp.status_code}: {resp.text[:300]}"
        except Exception as exc:
            sucesso = False
            erro_msg = str(exc)[:300]
            logger.warning(f"Erro ao enviar mensagem WhatsApp para loja {cfg.loja_id}: {exc}")

    log = LogDisparoConfirmacaoWhatsapp(
        loja_id=cfg.loja_id,
        lista_id=lista.id if lista else None,
        tipo_disparo=tipo_disparo,
        slot_agendado=slot_agendado,
        grupo_whatsapp_jid=grupo_jid,
        modo_simulador=modo_simulador,
        sucesso=sucesso,
        mensagem_enviada=mensagem,
        erro=erro_msg,
    )
    db.add(log)
    if lista and sucesso:
        lista.ultimo_disparo_em = agora_utc_naive()
    db.commit()
    db.refresh(log)
    return log


def _parse_horarios(texto: str) -> List[str]:
    horarios = []
    for item in (texto or "").split(","):
        item = item.strip()
        if re.match(r"^\d{2}:\d{2}$", item):
            horarios.append(item)
    return sorted(set(horarios))


def calcular_proximo_disparo(
    cfg: Optional[ConfiguracaoConfirmacaoWhatsapp],
    lista: Optional[ListaConfirmacaoWhatsapp],
    agora: Optional[datetime] = None,
) -> Optional[str]:
    if not cfg or not lista or lista.status != "ABERTA":
        return None
    tz = ZoneInfo(cfg.fuso_horario or "America/Sao_Paulo")
    ref = (agora or datetime.now(tz))
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=tz)
    else:
        ref = ref.astimezone(tz)

    hoje = ref.date()
    if hoje > lista.data_evento:
        return None

    hora_atual = ref.strftime("%H:%M")
    if hoje == lista.data_evento:
        slots = _parse_horarios(cfg.horarios_dia_evento)
    else:
        slots = _parse_horarios(cfg.horarios_dias_normais)

    for s in slots:
        if s > hora_atual:
            return f"Hoje às {s}"

    amanha = hoje + timedelta(days=1)
    if amanha <= lista.data_evento:
        slots_amanha = _parse_horarios(
            cfg.horarios_dia_evento if amanha == lista.data_evento else cfg.horarios_dias_normais
        )
        if slots_amanha:
            return f"{amanha.strftime('%d/%m')} às {slots_amanha[0]}"
    return None


async def executar_ciclo_agendador(db: Session, agora: Optional[datetime] = None) -> dict[str, int]:
    """
    Executa 1 ciclo do agendador semanal:
    1. Reset semanal (ex.: Sábado 00:00 America/Sao_Paulo) arquivando listas ABERTAS publicadas antes de hoje.
    2. Disparos agendados:
       - Dias anteriores ao evento: horarios_dias_normais (08:00, 14:00, 18:00)
       - Dia do evento: horarios_dia_evento (08:00, 14:00)
    """
    resets = 0
    disparos = 0

    listas_abertas = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(ListaConfirmacaoWhatsapp.status == "ABERTA")
        .all()
    )

    for lista in listas_abertas:
        cfg = (
            db.query(ConfiguracaoConfirmacaoWhatsapp)
            .filter(ConfiguracaoConfirmacaoWhatsapp.loja_id == lista.loja_id)
            .first()
        )
        if not cfg or not cfg.ativo:
            continue

        tz = ZoneInfo(cfg.fuso_horario or "America/Sao_Paulo")
        ref = agora or datetime.now(tz)
        if ref.tzinfo is None:
            ref = ref.replace(tzinfo=tz)
        else:
            ref = ref.astimezone(tz)

        hoje = ref.date()
        hora_atual = ref.strftime("%H:%M")

        # 1. Reset semanal (ex: Sábado == 5 às 00:00)
        if ref.weekday() == cfg.dia_semana_reset and hora_atual >= (cfg.horario_reset or "00:00"):
            pub_local = lista.publicado_em.replace(tzinfo=timezone.utc).astimezone(tz) if lista.publicado_em else ref
            if pub_local.date() < hoje or lista.data_evento < hoje:
                lista.status = "ARQUIVADA"
                lista.encerrado_em = agora_utc_naive()
                db.add(
                    LogDisparoConfirmacaoWhatsapp(
                        loja_id=cfg.loja_id,
                        lista_id=lista.id,
                        tipo_disparo="RESET",
                        slot_agendado=f"{hoje.isoformat()}_RESET",
                        grupo_whatsapp_jid=cfg.grupo_whatsapp_jid,
                        modo_simulador=True,
                        sucesso=True,
                        mensagem_enviada="Reset semanal automático executado.",
                    )
                )
                db.commit()
                resets += 1
                continue

        # 2. Disparos agendados (somente até a data do evento)
        if hoje > lista.data_evento:
            continue

        slots = _parse_horarios(
            cfg.horarios_dia_evento if hoje == lista.data_evento else cfg.horarios_dias_normais
        )
        for slot in slots:
            h, m = map(int, slot.split(":"))
            slot_dt = datetime.combine(hoje, time(h, m), tzinfo=tz)
            diff_min = (ref - slot_dt).total_seconds() / 60.0
            if 0 <= diff_min <= 15:
                slot_key = f"{hoje.isoformat()}_{slot}"
                ja_enviado = (
                    db.query(LogDisparoConfirmacaoWhatsapp)
                    .filter(
                        LogDisparoConfirmacaoWhatsapp.lista_id == lista.id,
                        LogDisparoConfirmacaoWhatsapp.slot_agendado == slot_key,
                    )
                    .first()
                )
                if not ja_enviado:
                    registros = (
                        db.query(RegistroConfirmacaoWhatsapp)
                        .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
                        .order_by(RegistroConfirmacaoWhatsapp.id.asc())
                        .all()
                    )
                    msg = formatar_mensagem_whatsapp(lista, registros, obter_url_publica_efetiva(cfg))
                    await enviar_mensagem_grupo_whatsapp(
                        db, cfg, lista, "AGENDADO", msg, slot_agendado=slot_key
                    )
                    disparos += 1

    return {"resets": resets, "disparos": disparos}


async def _loop_agendador() -> None:
    while True:
        try:
            db = SessionLocal()
            try:
                await executar_ciclo_agendador(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error(f"Erro no loop do agendador WhatsApp: {exc}")
        await asyncio.sleep(60)


def iniciar_agendador_whatsapp() -> Optional[asyncio.Task]:
    if os.getenv("ENABLE_WHATSAPP_SCHEDULER", "true").lower() == "false":
        return None
    return asyncio.create_task(_loop_agendador())
