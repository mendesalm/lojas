# backend/api/v1/dashboard_rotas.py
# Rotas e regras de negócio para o Dashboard Maçônico do Lojas
# Compatibilidade estrita com Sigma 2.0 e integração ao e-Sigma

import calendar
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, joinedload

from core.auth_esigma import UsuarioEsigma, obter_usuario_esigma
from core.dependencies import get_usuario_e_obreiro
from core.resolver_loja import resolver_loja_id_ou_404
from core.service_auth import validar_chave_de_servico
from database import get_db
from models import models

router = APIRouter(tags=["Dashboard"])


# --- Schemas ---

class NoticePayload(BaseModel):
    title: str
    content: str
    lodge_id: Optional[str] = None
    expiration_date: Optional[date] = None
    origem: Optional[str] = "LOJA"
    nivel_prioridade: Optional[str] = "NORMAL"
    autor_nome: Optional[str] = None
    link_externo: Optional[str] = None


class NoticeUpdatePayload(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    expiration_date: Optional[date] = None
    lodge_id: Optional[str] = None
    nivel_prioridade: Optional[str] = None
    link_externo: Optional[str] = None


class AvisoRegionalCreatePayload(BaseModel):
    titulo: str
    conteudo: str
    data_expiracao: Optional[date] = None
    nivel_prioridade: Optional[str] = "NORMAL"
    autor_nome: Optional[str] = "Conselho Regional"
    link_externo: Optional[str] = None
    loja_id: Optional[int] = None  # None indica broadcast para todas as lojas da região


def _resolver_contexto_loja(
    db: Session,
    usuario: UsuarioEsigma,
    loja_id_param: Optional[str] = None
) -> int:
    """Resolve o ID inteiro da loja a partir do parâmetro fornecido ou do token do e-Sigma."""
    alvo = loja_id_param or usuario.loja_id
    if not alvo:
        raise HTTPException(
            status_code=400,
            detail="Nenhuma loja identificada no contexto do usuário ou requisição."
        )
    return resolver_loja_id_ou_404(db, alvo)


def _get_next_occurrence(date_obj: Optional[date], reference_date: date) -> Optional[date]:
    """Calcula a próxima ocorrência anual de uma data comemorativa."""
    if not date_obj:
        return None
    try:
        this_year = date_obj.replace(year=reference_date.year)
    except ValueError:
        this_year = date_obj.replace(year=reference_date.year, day=28)

    if this_year < reference_date:
        try:
            this_year = date_obj.replace(year=reference_date.year + 1)
        except ValueError:
            this_year = date_obj.replace(year=reference_date.year + 1, day=28)
    return this_year


def _calcular_stats_loja(db: Session, loja_id_int: int) -> dict:
    today = date.today()

    # 1. Total Active Members
    total_members = (
        db.query(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
        )
        .count()
    )

    # 2. Next Events (limit 5)
    eventos_db = (
        db.query(models.Evento)
        .filter(models.Evento.loja_id == loja_id_int, models.Evento.hora_inicio >= func.now())
        .order_by(models.Evento.hora_inicio)
        .limit(5)
        .all()
    )
    next_events = []
    for ev in eventos_db:
        next_events.append({
            "id": ev.id,
            "title": ev.titulo,
            "start_time": ev.hora_inicio.isoformat() if ev.hora_inicio else "",
            "end_time": ev.hora_fim.isoformat() if ev.hora_fim else "",
            "location": ""
        })

    # 3. Upcoming Birthdays & Anniversaries (Next 30 days)
    active_members = (
        db.query(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
        )
        .all()
    )

    active_family_dates = (
        db.query(
            models.Familiar.nome_completo,
            models.Familiar.data_nascimento,
            models.Familiar.tipo_relacionamento,
            models.Obreiro.nome_completo.label("member_name"),
        )
        .join(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
            models.Familiar.falecido.is_(False),
            models.Familiar.data_nascimento.isnot(None),
        )
        .all()
    )

    upcoming_birthdays = []
    limit_date = today + timedelta(days=30)

    for m in active_members:
        # Aniversário natalício
        bday = _get_next_occurrence(m.data_nascimento, today)
        if bday and today <= bday <= limit_date:
            upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": bday.isoformat(), "type": "aniversario"})

        # Casamento
        wedding_day = _get_next_occurrence(m.data_casamento, today)
        if wedding_day and today <= wedding_day <= limit_date:
            upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": wedding_day.isoformat(), "type": "casamento"})

        # Iniciação
        if m.data_iniciacao:
            inic = _get_next_occurrence(m.data_iniciacao, today)
            if inic and today <= inic <= limit_date:
                upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": inic.isoformat(), "type": "iniciacao"})

        # Elevação
        if m.data_elevacao:
            elev = _get_next_occurrence(m.data_elevacao, today)
            if elev and today <= elev <= limit_date:
                upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": elev.isoformat(), "type": "elevacao"})

        # Exaltação
        if m.data_exaltacao:
            exalt = _get_next_occurrence(m.data_exaltacao, today)
            if exalt and today <= exalt <= limit_date:
                upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": exalt.isoformat(), "type": "exaltacao"})

        # Instalação
        if m.data_instalacao:
            inst = _get_next_occurrence(m.data_instalacao, today)
            if inst and today <= inst <= limit_date:
                upcoming_birthdays.append({"name": f"Ir. {m.nome_completo}", "date": inst.isoformat(), "type": "instalacao"})

    for fm in active_family_dates:
        fm_bday = _get_next_occurrence(fm.data_nascimento, today)
        if fm_bday and today <= fm_bday <= limit_date:
            rel_type = fm.tipo_relacionamento.value if hasattr(fm.tipo_relacionamento, "value") else str(fm.tipo_relacionamento)
            upcoming_birthdays.append({
                "name": f"{fm.nome_completo} ({rel_type} do Ir. {fm.member_name})",
                "date": fm_bday.isoformat(),
                "type": "aniversario_familiar",
            })

    upcoming_birthdays.sort(key=lambda x: x["date"])

    # 4. Notices (Active - Loja local + Avisos do Conselho Regional)
    active_notices_query = (
        db.query(models.Aviso)
        .filter(
            or_(
                models.Aviso.loja_id == loja_id_int,
                and_(models.Aviso.origem == "CONSELHO_REGIONAL", models.Aviso.loja_id.is_(None)),
                and_(models.Aviso.origem == "CONSELHO_REGIONAL", models.Aviso.loja_id == loja_id_int),
            ),
            models.Aviso.ativo.is_(True),
            or_(models.Aviso.data_expiracao.is_(None), models.Aviso.data_expiracao >= today),
        )
        .order_by(models.Aviso.criado_em.desc())
    )

    active_notices_count = active_notices_query.count()
    active_notices_list = active_notices_query.limit(5).all()

    active_notices_data = []
    for n in active_notices_list:
        titulo_formatado = n.titulo
        if n.origem == "CONSELHO_REGIONAL" and not titulo_formatado.startswith("[Conselho Regional]"):
            titulo_formatado = f"[Conselho Regional] {titulo_formatado}"
        active_notices_data.append({
            "id": n.id,
            "title": titulo_formatado,
            "content": n.conteudo,
            "date_posted": n.criado_em.isoformat() if n.criado_em else today.isoformat(),
            "expiration_date": n.data_expiracao.isoformat() if n.data_expiracao else None,
            "lodge_id": n.loja_id,
            "origem": n.origem or "LOJA",
            "nivel_prioridade": n.nivel_prioridade or "NORMAL",
            "autor_nome": n.autor_nome,
            "link_externo": n.link_externo,
        })

    # 5. Next Session
    next_session_record = (
        db.query(models.SessaoMaconica)
        .filter(
            models.SessaoMaconica.loja_id == loja_id_int,
            models.SessaoMaconica.data_sessao >= today,
            models.SessaoMaconica.status != "CANCELADA",
        )
        .order_by(models.SessaoMaconica.data_sessao)
        .first()
    )
    next_session = None
    if next_session_record:
        next_session = {
            "id": next_session_record.id,
            "title": next_session_record.titulo,
            "session_date": next_session_record.data_sessao.isoformat(),
            "start_time": next_session_record.hora_inicio.strftime("%H:%M") if next_session_record.hora_inicio else "20:00",
        }

    # 6. Classifieds Count
    classifieds_count = (
        db.query(models.Classificado)
        .filter(models.Classificado.loja_id == loja_id_int, models.Classificado.status == "ATIVO")
        .count()
    )

    # 7. Dining Scale
    dining_scale_records = (
        db.query(models.EscalaAgape)
        .join(models.Obreiro)
        .filter(models.EscalaAgape.loja_id == loja_id_int, models.EscalaAgape.data >= today)
        .order_by(models.EscalaAgape.data)
        .limit(5)
        .all()
    )
    dining_scale = []
    for ds in dining_scale_records:
        dining_scale.append({
            "id": ds.id,
            "position": ds.posicao,
            "name": ds.obreiro.nome_completo if ds.obreiro else "",
            "date": ds.data.isoformat(),
            "member_id": ds.obreiro_id,
        })

    # 8. Lodge Members Stats
    ms_apprentices = 0
    ms_fellows = 0
    ms_masters = 0
    total_active_members = len(active_members)

    for m in active_members:
        grau_str = m.grau.value if hasattr(m.grau, "value") else str(m.grau or "")
        if "Aprendiz" in grau_str:
            ms_apprentices += 1
        elif "Companheiro" in grau_str:
            ms_fellows += 1
        elif "Mestre" in grau_str or m.data_exaltacao is not None:
            ms_masters += 1

    lodge_members_stats = {
        "total": total_active_members,
        "masters": ms_masters,
        "fellows": ms_fellows,
        "apprentices": ms_apprentices,
    }

    # 9. Lodge Info
    lodge = db.query(models.Loja).filter(models.Loja.id == loja_id_int).first()
    lodge_info = {}
    if lodge:
        potencia = lodge.potencia.nome if lodge.potencia else ""
        subpotencia = lodge.obediencia.nome if lodge.obediencia else ""
        session_day_str = lodge.dia_sessao.value if hasattr(lodge.dia_sessao, "value") else str(lodge.dia_sessao or "")
        session_time_str = lodge.horario_sessao.strftime("%H:%M") if lodge.horario_sessao else ""
        rite_str = lodge.rito.value if hasattr(lodge.rito, "value") else str(lodge.rito or "")

        address_parts = [
            lodge.logradouro,
            lodge.numero,
            lodge.bairro,
            lodge.cidade,
            lodge.estado,
            f"CEP {lodge.cep}" if lodge.cep else None
        ]
        full_address = ", ".join(filter(None, address_parts))

        lodge_info = {
            "id": lodge.id,
            "name": f"{lodge.titulo_loja or 'ARLS'} {lodge.nome_loja}",
            "number": lodge.numero_loja or "",
            "rite": rite_str,
            "session_day": session_day_str,
            "session_time": session_time_str,
            "potencia": potencia,
            "subpotencia": subpotencia,
            "foundation_date": lodge.data_fundacao.strftime("%d/%m/%Y") if lodge.data_fundacao else "",
            "address": full_address,
            "email": lodge.email or "",
            "cnpj": lodge.cnpj or "",
            "logo_url": None,
        }

    return {
        "total_members": total_members,
        "next_events": next_events,
        "upcoming_birthdays": upcoming_birthdays[:5],
        "active_notices_count": active_notices_count,
        "active_notices": active_notices_data,
        "next_session": next_session,
        "classifieds_count": classifieds_count,
        "dining_scale": dining_scale,
        "lodge_members_stats": lodge_members_stats,
        "lodge_info": lodge_info,
    }


def _calcular_calendario_loja(db: Session, loja_id_int: int, month: int, year: int) -> list:
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    # 1. Sessões
    sessions = (
        db.query(models.SessaoMaconica)
        .filter(
            models.SessaoMaconica.loja_id == loja_id_int,
            models.SessaoMaconica.data_sessao.between(start_date, end_date),
            models.SessaoMaconica.status != "CANCELADA"
        )
        .all()
    )

    # 2. Eventos
    events = (
        db.query(models.Evento)
        .filter(
            models.Evento.loja_id == loja_id_int,
            func.date(models.Evento.hora_inicio).between(start_date, end_date)
        )
        .all()
    )

    # 3. Obreiros Ativos e Datas Maçônicas
    active_members = (
        db.query(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
        )
        .all()
    )

    active_family_dates = (
        db.query(
            models.Familiar.nome_completo,
            models.Familiar.data_nascimento,
            models.Familiar.tipo_relacionamento,
            models.Obreiro.nome_completo.label("member_name"),
        )
        .join(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
            models.Familiar.falecido.is_(False),
            models.Familiar.data_nascimento.isnot(None),
        )
        .all()
    )

    calendar_events = []

    # Map Sessions
    for s in sessions:
        calendar_events.append({
            "date": s.data_sessao.day,
            "title": s.titulo,
            "type": "sessao",
            "full_date": s.data_sessao.isoformat(),
            "status": s.status,
        })

    # Map Events
    for e in events:
        calendar_events.append({
            "date": e.hora_inicio.day,
            "title": e.titulo,
            "type": "evento",
            "full_date": e.hora_inicio.date().isoformat(),
        })

    # Map Member Dates
    for m in active_members:
        # Birthday
        if m.data_nascimento and m.data_nascimento.month == month:
            day = min(m.data_nascimento.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "aniversario",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

        # Wedding Anniversary
        if m.data_casamento and m.data_casamento.month == month:
            day = min(m.data_casamento.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "casamento",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

        # Masonic Anniversaries
        if m.data_iniciacao and m.data_iniciacao.month == month:
            day = min(m.data_iniciacao.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "iniciacao",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

        if m.data_elevacao and m.data_elevacao.month == month:
            day = min(m.data_elevacao.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "elevacao",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

        if m.data_exaltacao and m.data_exaltacao.month == month:
            day = min(m.data_exaltacao.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "exaltacao",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

        if m.data_instalacao and m.data_instalacao.month == month:
            day = min(m.data_instalacao.day, last_day)
            calendar_events.append({
                "date": day,
                "title": f"Ir. {m.nome_completo}",
                "type": "instalacao",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

    # Family Birthdays
    for fm in active_family_dates:
        if fm.data_nascimento and fm.data_nascimento.month == month:
            day = min(fm.data_nascimento.day, last_day)
            rel_type = fm.tipo_relacionamento.value if hasattr(fm.tipo_relacionamento, "value") else str(fm.tipo_relacionamento)
            calendar_events.append({
                "date": day,
                "title": f"{fm.nome_completo} ({rel_type} do Ir. {fm.member_name})",
                "type": "aniversario_familiar",
                "full_date": f"{year}-{month:02d}-{day:02d}",
            })

    calendar_events.sort(key=lambda x: x["date"])
    return calendar_events


def _obter_membros_lista(db: Session, loja_id_int: int) -> list:
    active_members = (
        db.query(models.Obreiro)
        .join(models.ObreiroLojaAssociacao)
        .filter(
            models.ObreiroLojaAssociacao.loja_id == loja_id_int,
            models.ObreiroLojaAssociacao.status == models.StatusObreiroEnum.ATIVO,
        )
        .all()
    )

    members_list = []
    for m in active_members:
        grau_str = m.grau.value if hasattr(m.grau, "value") else str(m.grau or "Aprendiz")
        if m.data_instalacao is not None or "Instalado" in grau_str:
            deg_display = "Mestre Instalado"
        elif "Mestre" in grau_str:
            deg_display = "Mestre"
        elif "Companheiro" in grau_str:
            deg_display = "Companheiro"
        else:
            deg_display = "Aprendiz"

        members_list.append({
            "id": m.id,
            "full_name": m.nome_completo,
            "cim": m.cim or "",
            "email": m.email or "",
            "phone": m.telefone or "",
            "profile_picture_path": m.caminho_foto_perfil,
            "degree": deg_display,
        })

    members_list.sort(key=lambda x: x["full_name"])
    return members_list


# --- ENDPOINTS /dashboard/* ---

@router.get("/dashboard/stats", summary="Estatísticas do Dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
    lodge_id: Optional[str] = Query(None, description="ID ou Código UUID da loja")
):
    loja_id_int = _resolver_contexto_loja(db, usuario, lodge_id)
    return _calcular_stats_loja(db, loja_id_int)


@router.get("/dashboard/calendar", summary="Calendário Maçônico")
def get_dashboard_calendar(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=1900, le=2100),
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
    lodge_id: Optional[str] = Query(None, description="ID ou Código UUID da loja")
):
    loja_id_int = _resolver_contexto_loja(db, usuario, lodge_id)
    return _calcular_calendario_loja(db, loja_id_int, month, year)


@router.get("/dashboard/members", summary="Lista de Membros da Loja para o Widget")
def get_dashboard_members(
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
    lodge_id: Optional[str] = Query(None, description="ID ou Código UUID da loja")
):
    loja_id_int = _resolver_contexto_loja(db, usuario, lodge_id)
    return _obter_membros_lista(db, loja_id_int)


# --- ENDPOINTS /lojas/{loja_id}/dashboard/* (Para rotas explicitamente escopadas) ---

@router.get("/lojas/{loja_id}/dashboard/stats", summary="Estatísticas do Dashboard da Loja")
def get_loja_dashboard_stats(
    loja_id: str,
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return _calcular_stats_loja(db, loja_id_int)


@router.get("/lojas/{loja_id}/dashboard/calendar", summary="Calendário Maçônico da Loja")
def get_loja_dashboard_calendar(
    loja_id: str,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=1900, le=2100),
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return _calcular_calendario_loja(db, loja_id_int, month, year)


@router.get("/lojas/{loja_id}/dashboard/members", summary="Lista de Membros da Loja")
def get_loja_dashboard_members(
    loja_id: str,
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return _obter_membros_lista(db, loja_id_int)


# --- ENDPOINTS /notices/ (Compatibilidade direta com Sigma 2.0 Notices API) ---

@router.get("/lojas/{loja_id}/dashboard/notices", summary="Listar Avisos da Loja (Rota Direta)")
@router.get("/notices/", summary="Listar Avisos")
def get_notices(
    loja_id: Optional[str] = None,
    lodge_id: Optional[str] = Query(None, description="ID ou UUID da loja"),
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    alvo = loja_id or lodge_id
    loja_id_int = _resolver_contexto_loja(db, usuario, alvo)
    avisos = (
        db.query(models.Aviso)
        .filter(
            or_(
                models.Aviso.loja_id == loja_id_int,
                and_(models.Aviso.origem == "CONSELHO_REGIONAL", models.Aviso.loja_id.is_(None)),
                and_(models.Aviso.origem == "CONSELHO_REGIONAL", models.Aviso.loja_id == loja_id_int),
            ),
            models.Aviso.ativo.is_(True),
        )
        .order_by(models.Aviso.criado_em.desc())
        .all()
    )
    res = []
    for a in avisos:
        titulo_formatado = a.titulo
        if a.origem == "CONSELHO_REGIONAL" and not titulo_formatado.startswith("[Conselho Regional]"):
            titulo_formatado = f"[Conselho Regional] {titulo_formatado}"
        res.append({
            "id": a.id,
            "title": titulo_formatado,
            "content": a.conteudo,
            "date_posted": a.criado_em.isoformat() if a.criado_em else date.today().isoformat(),
            "expiration_date": a.data_expiracao.isoformat() if a.data_expiracao else None,
            "lodge_id": a.loja_id,
            "origem": a.origem or "LOJA",
            "nivel_prioridade": a.nivel_prioridade or "NORMAL",
            "autor_nome": a.autor_nome,
            "link_externo": a.link_externo,
        })
    return res


@router.post("/notices/", status_code=201, summary="Criar Aviso")
def create_notice(
    payload: NoticePayload,
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    loja_id_int = _resolver_contexto_loja(db, usuario, payload.lodge_id)
    novo_aviso = models.Aviso(
        titulo=payload.title,
        conteudo=payload.content,
        data_expiracao=payload.expiration_date,
        loja_id=loja_id_int,
        ativo=True,
        origem=payload.origem or "LOJA",
        nivel_prioridade=payload.nivel_prioridade or "NORMAL",
        autor_nome=payload.autor_nome or (usuario.nome if usuario else None),
        link_externo=payload.link_externo,
    )
    db.add(novo_aviso)
    db.commit()
    db.refresh(novo_aviso)
    return {
        "id": novo_aviso.id,
        "title": novo_aviso.titulo,
        "content": novo_aviso.conteudo,
        "date_posted": novo_aviso.criado_em.isoformat() if novo_aviso.criado_em else date.today().isoformat(),
        "expiration_date": novo_aviso.data_expiracao.isoformat() if novo_aviso.data_expiracao else None,
        "lodge_id": novo_aviso.loja_id,
        "origem": novo_aviso.origem,
        "nivel_prioridade": novo_aviso.nivel_prioridade,
        "autor_nome": novo_aviso.autor_nome,
        "link_externo": novo_aviso.link_externo,
    }


@router.put("/notices/{notice_id}", summary="Atualizar Aviso")
def update_notice(
    notice_id: int,
    payload: NoticeUpdatePayload,
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    aviso = db.query(models.Aviso).filter(models.Aviso.id == notice_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso não encontrado")

    if payload.title is not None:
        aviso.titulo = payload.title
    if payload.content is not None:
        aviso.conteudo = payload.content
    if payload.expiration_date is not None:
        aviso.data_expiracao = payload.expiration_date
    if payload.nivel_prioridade is not None:
        aviso.nivel_prioridade = payload.nivel_prioridade
    if payload.link_externo is not None:
        aviso.link_externo = payload.link_externo

    db.commit()
    db.refresh(aviso)
    return {
        "id": aviso.id,
        "title": aviso.titulo,
        "content": aviso.conteudo,
        "date_posted": aviso.criado_em.isoformat() if aviso.criado_em else date.today().isoformat(),
        "expiration_date": aviso.data_expiracao.isoformat() if aviso.data_expiracao else None,
        "lodge_id": aviso.loja_id,
        "origem": aviso.origem,
        "nivel_prioridade": aviso.nivel_prioridade,
        "autor_nome": aviso.autor_nome,
        "link_externo": aviso.link_externo,
    }


@router.delete("/notices/{notice_id}", summary="Excluir Aviso")
def delete_notice(
    notice_id: int,
    lodge_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
):
    aviso = db.query(models.Aviso).filter(models.Aviso.id == notice_id).first()
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso não encontrado")

    db.delete(aviso)
    db.commit()
    return {"message": "Aviso excluído com sucesso"}


# --- COMUNICAÇÃO BIDIRECIONAL: CONSELHO REGIONAL -> LOJAS ---

@router.post("/avisos/regional", status_code=201, summary="Publicar Aviso do Conselho Regional no Mural das Lojas")
def publicar_aviso_regional(
    payload: AvisoRegionalCreatePayload,
    db: Session = Depends(get_db),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
):
    """
    Publica aviso oficial do Conselho Regional direcionado a uma loja específica ou
    em modo broadcast para todas as oficinas da jurisdição regional.
    Autorizado para chamadas inter-serviços com service key do CoReVM.
    """
    if not validar_chave_de_servico(x_service_key):
        raise HTTPException(status_code=401, detail="Chave de serviço inválida ou ausente.")

    novo_aviso = models.Aviso(
        titulo=payload.titulo,
        conteudo=payload.conteudo,
        data_expiracao=payload.data_expiracao,
        loja_id=payload.loja_id,
        ativo=True,
        origem="CONSELHO_REGIONAL",
        nivel_prioridade=payload.nivel_prioridade or "NORMAL",
        autor_nome=payload.autor_nome or "Conselho Regional",
        link_externo=payload.link_externo,
    )
    db.add(novo_aviso)
    db.commit()
    db.refresh(novo_aviso)
    return {
        "status": "success",
        "id": novo_aviso.id,
        "titulo": novo_aviso.titulo,
        "origem": novo_aviso.origem,
        "loja_id": novo_aviso.loja_id,
        "criado_em": novo_aviso.criado_em.isoformat() if novo_aviso.criado_em else None,
    }


@router.get("/avisos/regionais", summary="Listar Avisos Ativos do Conselho Regional")
def listar_avisos_regionais(
    loja_id: Optional[int] = None,
    db: Session = Depends(get_db),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
):
    """Consulta avisos regionais publicados pelo conselho."""
    query = db.query(models.Aviso).filter(
        models.Aviso.origem == "CONSELHO_REGIONAL",
        models.Aviso.ativo.is_(True)
    )
    if loja_id is not None:
        query = query.filter(or_(models.Aviso.loja_id == loja_id, models.Aviso.loja_id.is_(None)))
    avisos = query.order_by(models.Aviso.criado_em.desc()).all()
    return [
        {
            "id": a.id,
            "titulo": a.titulo,
            "conteudo": a.conteudo,
            "data_expiracao": a.data_expiracao.isoformat() if a.data_expiracao else None,
            "nivel_prioridade": a.nivel_prioridade,
            "autor_nome": a.autor_nome,
            "link_externo": a.link_externo,
            "loja_id": a.loja_id,
            "criado_em": a.criado_em.isoformat() if a.criado_em else None,
        }
        for a in avisos
    ]
