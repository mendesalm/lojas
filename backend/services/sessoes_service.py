# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de gerenciamento de Sessões Maçônicas, Frequência, Check-in Inteligente e Visitantes.
"""
from datetime import date, datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from models.models import (
    SessaoMaconica,
    Presenca,
    Visitante,
    Obreiro,
    MetodoCheckInEnum,
    TipoSessaoEnum,
    SubtipoSessaoEnum
)
from schemas.sessao_schema import (
    SessaoCreate,
    SessaoUpdate,
    SessaoResumo,
    SessaoResponse,
    PresencaItem,
    PresencaCheckInPayload,
    PresencaManualPayload,
    VisitanteCreate,
    VisitanteResponse
)


def listar_sessoes_loja(
    db: Session,
    loja_id: int,
    status_filtro: Optional[str] = None,
    ano: Optional[int] = None
) -> List[SessaoResumo]:
    """Lista as sessões maçônicas da loja ordenadas pela data mais recente."""
    query = db.query(SessaoMaconica).filter(SessaoMaconica.loja_id == loja_id)

    if status_filtro:
        query = query.filter(SessaoMaconica.status == status_filtro)

    if ano:
        query = query.filter(db.func.extract("year", SessaoMaconica.data_sessao) == ano)

    sessoes = query.order_by(desc(SessaoMaconica.data_sessao)).all()

    resumos = []
    for s in sessoes:
        total_p = db.query(Presenca).filter(Presenca.sessao_id == s.id, Presenca.obreiro_id.isnot(None)).count()
        total_v = db.query(Presenca).filter(Presenca.sessao_id == s.id, Presenca.visitante_id.isnot(None)).count()

        tipo_str = s.tipo.value if hasattr(s.tipo, "value") else str(s.tipo or "")
        subtipo_str = s.subtipo.value if hasattr(s.subtipo, "value") else str(s.subtipo or "")

        resumos.append(
            SessaoResumo(
                id=s.id,
                titulo=s.titulo,
                numero_sessao=s.numero_sessao,
                data_sessao=s.data_sessao,
                hora_inicio=s.hora_inicio,
                hora_fim=s.hora_fim,
                tipo=tipo_str,
                subtipo=subtipo_str,
                status=s.status,
                total_presentes=total_p,
                total_visitantes=total_v
            )
        )
    return resumos


def obter_sessao_ativa(db: Session, loja_id: int) -> Optional[SessaoResumo]:
    """Retorna a sessão em andamento ou a sessão agendada para o dia atual."""
    hoje = date.today()
    sessao = (
        db.query(SessaoMaconica)
        .filter(
            SessaoMaconica.loja_id == loja_id,
            SessaoMaconica.data_sessao == hoje,
            SessaoMaconica.status.in_(["EM_ANDAMENTO", "AGENDADA"])
        )
        .order_by(desc(SessaoMaconica.status == "EM_ANDAMENTO"))
        .first()
    )

    if not sessao:
        return None

    tipo_str = sessao.tipo.value if hasattr(sessao.tipo, "value") else str(sessao.tipo or "")
    subtipo_str = sessao.subtipo.value if hasattr(sessao.subtipo, "value") else str(sessao.subtipo or "")

    return SessaoResumo(
        id=sessao.id,
        titulo=sessao.titulo,
        numero_sessao=sessao.numero_sessao,
        data_sessao=sessao.data_sessao,
        hora_inicio=sessao.hora_inicio,
        hora_fim=sessao.hora_fim,
        tipo=tipo_str,
        subtipo=subtipo_str,
        status=sessao.status
    )


def obter_sessao_detalhe(db: Session, sessao_id: int) -> SessaoResponse:
    """Retorna os detalhes completos da sessão e o livro de chamada com presenças registradas."""
    sessao = (
        db.query(SessaoMaconica)
        .options(
            joinedload(SessaoMaconica.presencas).joinedload(Presenca.obreiro),
            joinedload(SessaoMaconica.presencas).joinedload(Presenca.visitante)
        )
        .filter(SessaoMaconica.id == sessao_id)
        .first()
    )

    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    presencas_list = []
    total_presentes = 0
    total_visitantes = 0

    for p in sessao.presencas:
        if p.obreiro:
            total_presentes += 1
            grau_str = p.obreiro.grau.value if hasattr(p.obreiro.grau, "value") else str(p.obreiro.grau or "")
            presencas_list.append(
                PresencaItem(
                    id=p.id,
                    obreiro_id=p.obreiro.id,
                    obreiro_nome=p.obreiro.nome_completo,
                    obreiro_cim=p.obreiro.cim,
                    obreiro_grau=grau_str,
                    status_presenca=p.status_presenca,
                    metodo_checkin=p.metodo_checkin.value if hasattr(p.metodo_checkin, "value") else str(p.metodo_checkin or ""),
                    data_hora_checkin=p.data_hora_checkin
                )
            )
        elif p.visitante:
            total_visitantes += 1
            presencas_list.append(
                PresencaItem(
                    id=p.id,
                    visitante_id=p.visitante.id,
                    visitante_nome=p.visitante.nome_completo,
                    obreiro_cim=p.visitante.cim,
                    status_presenca=p.status_presenca,
                    metodo_checkin=p.metodo_checkin.value if hasattr(p.metodo_checkin, "value") else str(p.metodo_checkin or ""),
                    data_hora_checkin=p.data_hora_checkin
                )
            )

    tipo_str = sessao.tipo.value if hasattr(sessao.tipo, "value") else str(sessao.tipo or "")
    subtipo_str = sessao.subtipo.value if hasattr(sessao.subtipo, "value") else str(sessao.subtipo or "")

    return SessaoResponse(
        id=sessao.id,
        loja_id=sessao.loja_id,
        gestao_id=sessao.gestao_id,
        titulo=sessao.titulo,
        numero_sessao=sessao.numero_sessao,
        data_sessao=sessao.data_sessao,
        hora_inicio=sessao.hora_inicio,
        hora_fim=sessao.hora_fim,
        tipo=tipo_str,
        subtipo=subtipo_str,
        status=sessao.status,
        pauta=sessao.pauta,
        cargos_temporarios=sessao.cargos_temporarios,
        total_presentes=total_presentes,
        total_visitantes=total_visitantes,
        presencas=presencas_list
    )


def criar_sessao(db: Session, payload: SessaoCreate) -> SessaoResponse:
    """Cria e agenda uma nova sessão maçônica."""
    sessao = SessaoMaconica(
        loja_id=payload.loja_id,
        gestao_id=payload.gestao_id,
        titulo=payload.titulo,
        numero_sessao=payload.numero_sessao,
        data_sessao=payload.data_sessao,
        hora_inicio=payload.hora_inicio,
        hora_fim=payload.hora_fim,
        tipo=payload.tipo,
        subtipo=payload.subtipo,
        status=payload.status or "AGENDADA",
        pauta=payload.pauta,
        cargos_temporarios=payload.cargos_temporarios
    )
    db.add(sessao)
    db.commit()
    db.refresh(sessao)
    return obter_sessao_detalhe(db, sessao.id)


def atualizar_sessao(db: Session, sessao_id: int, payload: SessaoUpdate) -> SessaoResponse:
    """Atualiza dados e status da sessão (ex: abrir, encerrar, alterar pauta)."""
    sessao = db.query(SessaoMaconica).filter(SessaoMaconica.id == sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    dados = payload.model_dump(exclude_unset=True)
    for k, v in dados.items():
        setattr(sessao, k, v)

    db.commit()
    db.refresh(sessao)
    return obter_sessao_detalhe(db, sessao_id)


def registrar_presenca_sessao(
    db: Session,
    sessao_id: int,
    obreiro_id: Optional[int] = None,
    visitante_id: Optional[int] = None,
    status_presenca: str = "PRESENTE",
    metodo: str = "MANUAL",
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> PresencaItem:
    """Registra a presença de um obreiro ou visitante na sessão, impedindo duplicidade."""
    if not obreiro_id and not visitante_id:
        raise HTTPException(status_code=400, detail="Identificador de Obreiro ou Visitante deve ser informado.")

    # Checa se já existe presença registrada
    query = db.query(Presenca).filter(Presenca.sessao_id == sessao_id)
    if obreiro_id:
        query = query.filter(Presenca.obreiro_id == obreiro_id)
    else:
        query = query.filter(Presenca.visitante_id == visitante_id)

    presenca_existente = query.first()
    if presenca_existente:
        presenca_existente.status_presenca = status_presenca
        presenca_existente.data_hora_checkin = datetime.now()
        db.commit()
        db.refresh(presenca_existente)
        return PresencaItem(
            id=presenca_existente.id,
            obreiro_id=presenca_existente.obreiro_id,
            visitante_id=presenca_existente.visitante_id,
            status_presenca=presenca_existente.status_presenca,
            metodo_checkin=metodo,
            data_hora_checkin=presenca_existente.data_hora_checkin
        )

    nova_presenca = Presenca(
        sessao_id=sessao_id,
        obreiro_id=obreiro_id,
        visitante_id=visitante_id,
        status_presenca=status_presenca,
        metodo_checkin=metodo,
        data_hora_checkin=datetime.now(),
        latitude_checkin=lat,
        longitude_checkin=lon
    )
    db.add(nova_presenca)
    db.commit()
    db.refresh(nova_presenca)

    obreiro_nome = None
    if obreiro_id:
        o = db.query(Obreiro).filter(Obreiro.id == obreiro_id).first()
        obreiro_nome = o.nome_completo if o else None

    return PresencaItem(
        id=nova_presenca.id,
        obreiro_id=nova_presenca.obreiro_id,
        obreiro_nome=obreiro_nome,
        visitante_id=nova_presenca.visitante_id,
        status_presenca=nova_presenca.status_presenca,
        metodo_checkin=metodo,
        data_hora_checkin=nova_presenca.data_hora_checkin
    )


def listar_visitantes(db: Session, busca: Optional[str] = None) -> List[VisitanteResponse]:
    """Lista visitantes cadastrados no livro de presenças."""
    query = db.query(Visitante)
    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            (Visitante.nome_completo.ilike(termo)) | (Visitante.cim.ilike(termo))
        )
    return query.order_by(Visitante.nome_completo.asc()).all()


def cadastrar_visitante(db: Session, payload: VisitanteCreate) -> VisitanteResponse:
    """Cadastra um visitante externo no livro de visitas."""
    existente = db.query(Visitante).filter(Visitante.cim == payload.cim).first()
    if existente:
        return existente

    visitante = Visitante(
        nome_completo=payload.nome_completo,
        cim=payload.cim,
        grau=payload.grau,
        email=payload.email,
        telefone=payload.telefone,
        cpf=payload.cpf,
        nome_loja_manual=payload.nome_loja_manual,
        numero_loja_manual=payload.numero_loja_manual,
        obediencia_loja_manual=payload.obediencia_loja_manual,
        observacoes=payload.observacoes
    )
    db.add(visitante)
    db.commit()
    db.refresh(visitante)
    return visitante


def obter_minhas_presencas(db: Session, obreiro_id: int) -> List[dict]:
    """Retorna o histórico pessoal de presenças e faltas justificadas do obreiro."""
    presencas = (
        db.query(Presenca)
        .options(joinedload(Presenca.sessao))
        .filter(Presenca.obreiro_id == obreiro_id)
        .order_by(desc(Presenca.data_hora_checkin))
        .all()
    )
    lista = []
    for p in presencas:
        if p.sessao:
            tipo_str = p.sessao.tipo.value if hasattr(p.sessao.tipo, "value") else str(p.sessao.tipo or "")
            lista.append({
                "presenca_id": p.id,
                "sessao_id": p.sessao.id,
                "sessao_titulo": p.sessao.titulo,
                "data_sessao": p.sessao.data_sessao,
                "tipo_sessao": tipo_str,
                "status_presenca": p.status_presenca,
                "metodo_checkin": p.metodo_checkin.value if hasattr(p.metodo_checkin, "value") else str(p.metodo_checkin or ""),
                "data_hora_checkin": p.data_hora_checkin
            })
    return lista
