# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas da Lista Semanal de Confirmação via WhatsApp:
- Painel interno autenticado (gestão da Loja + publicadores autorizados)
- Rotas públicas (/api/v1/confirmacao-publica/{slug_ou_loja}) sem exigir login
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.auth_esigma import UsuarioEsigma
from core.constants import CARGOS_GESTAO_LOJA
from core.dependencies import (
    _e_webmaster_da_loja,
    _possui_cargos_na_loja,
    _verificar_acesso_servico_regional,
    exigir_permissao_gestao_loja,
    get_db,
    get_usuario_e_obreiro_opcional,
)
from core.resolver_loja import resolver_loja_id_ou_404
from models.confirmacao_whatsapp import (
    ConfiguracaoConfirmacaoWhatsapp,
    ListaConfirmacaoWhatsapp,
    LogDisparoConfirmacaoWhatsapp,
    PublicadorAutorizadoWhatsapp,
    RegistroConfirmacaoWhatsapp,
)
from models.models import Loja, Obreiro
from schemas.confirmacao_whatsapp_schemas import (
    CancelarPublicaRequest,
    ConfiguracaoConfirmacaoResponse,
    ConfiguracaoConfirmacaoUpdate,
    ConfirmacaoPublicaRequest,
    ListaConfirmacaoResponse,
    LogDisparoResponse,
    PainelConfirmacaoResponse,
    PainelPublicoResponse,
    PreviewAnuncioRequest,
    PreviewAnuncioResponse,
    PublicadorAutorizadoCreate,
    PublicadorAutorizadoResponse,
    PublicarListaRequest,
    RegistroConfirmacaoManualCreate,
    RegistroConfirmacaoResponse,
    RegistroConfirmacaoUpdate,
    RegistroPublicoItem,
)
from services.confirmacao_whatsapp_service import (
    agora_utc_naive,
    calcular_proximo_disparo,
    calcular_totais,
    enviar_mensagem_grupo_whatsapp,
    extrair_data_e_titulo,
    extrair_primeiro_e_ultimo_nome,
    formatar_mensagem_whatsapp,
    gateway_conectar,
    gateway_desconectar,
    gateway_grupos,
    gateway_status,
    gerar_csv_lista,
    obter_ou_criar_configuracao,
    obter_url_publica_efetiva,
)

router_autenticado = APIRouter(tags=["Confirmação WhatsApp"])
router_publico = APIRouter(tags=["Confirmação Pública WhatsApp"])


def _resolver_nome_usuario(usuario: Optional[UsuarioEsigma], obreiro: Optional[Obreiro]) -> str:
    if obreiro and obreiro.nome_completo:
        return obreiro.nome_completo
    if usuario:
        return getattr(usuario, "nome", None) or usuario.email or "Irmão"
    return "Sistema"


def exigir_publicador_ou_gestao_loja(
    loja_id: str,
    contexto: tuple[Optional[UsuarioEsigma], Optional[Obreiro]] = Depends(get_usuario_e_obreiro_opcional),
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    x_operador_papel: Optional[str] = Header(None, alias="X-Operador-Papel"),
    x_operador_loja_id: Optional[str] = Header(None, alias="X-Operador-Loja-Id"),
    db: Session = Depends(get_db),
) -> tuple[int, Optional[UsuarioEsigma], Optional[Obreiro], bool]:
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto

    if _verificar_acesso_servico_regional(x_service_key, x_operador_papel, x_operador_loja_id, loja_id_int):
        return loja_id_int, usuario, obreiro, True

    if not usuario:
        raise HTTPException(status_code=401, detail="Autenticação obrigatória.")

    if usuario.is_super_admin or _e_webmaster_da_loja(db, usuario, loja_id_int):
        return loja_id_int, usuario, obreiro, True

    if obreiro is not None and _possui_cargos_na_loja(db, obreiro.id, loja_id_int, CARGOS_GESTAO_LOJA):
        return loja_id_int, usuario, obreiro, True

    if usuario.email:
        pub = (
            db.query(PublicadorAutorizadoWhatsapp)
            .filter(
                PublicadorAutorizadoWhatsapp.loja_id == loja_id_int,
                func.lower(PublicadorAutorizadoWhatsapp.email) == usuario.email.strip().lower(),
                PublicadorAutorizadoWhatsapp.ativo.is_(True),
            )
            .first()
        )
        if pub:
            return loja_id_int, usuario, obreiro, False

    raise HTTPException(
        status_code=403,
        detail="Você não possui permissão para gerenciar ou publicar listas de confirmação desta Loja.",
    )


def _serializar_registro(r: RegistroConfirmacaoWhatsapp) -> RegistroConfirmacaoResponse:
    total = 1 + max(0, int(r.acompanhantes or 0)) if r.status == "CONFIRMADO" else 0
    return RegistroConfirmacaoResponse(
        id=r.id,
        lista_id=r.lista_id,
        loja_id=r.loja_id,
        primeiro_nome=r.primeiro_nome,
        ultimo_nome=r.ultimo_nome,
        acompanhantes=r.acompanhantes,
        total_pessoas=total,
        status=r.status,
        origem=r.origem,
        presente=r.presente,
        observacao=r.observacao,
        criado_em=r.criado_em,
        atualizado_em=r.atualizado_em,
    )


def _serializar_lista(
    lista: ListaConfirmacaoWhatsapp,
    registros: List[RegistroConfirmacaoWhatsapp],
    incluir_registros: bool = False,
) -> ListaConfirmacaoResponse:
    totais = calcular_totais(registros)
    return ListaConfirmacaoResponse(
        id=lista.id,
        loja_id=lista.loja_id,
        sessao_id=lista.sessao_id,
        titulo=lista.titulo,
        texto_anuncio=lista.texto_anuncio,
        data_evento=lista.data_evento,
        status=lista.status,
        publicado_por_email=lista.publicado_por_email,
        publicado_por_nome=lista.publicado_por_nome,
        publicado_em=lista.publicado_em,
        encerrado_em=lista.encerrado_em,
        ultimo_disparo_em=lista.ultimo_disparo_em,
        totais=totais,
        registros=[_serializar_registro(r) for r in registros] if incluir_registros else None,
    )


def _obter_lista_aberta(db: Session, loja_id_int: int) -> Optional[ListaConfirmacaoWhatsapp]:
    return (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(
            ListaConfirmacaoWhatsapp.loja_id == loja_id_int,
            ListaConfirmacaoWhatsapp.status == "ABERTA",
        )
        .order_by(ListaConfirmacaoWhatsapp.id.desc())
        .first()
    )


def _resolver_loja_e_config_publica(
    db: Session, slug_ou_loja: str
) -> tuple[Loja, ConfiguracaoConfirmacaoWhatsapp]:
    chave = (slug_ou_loja or "").strip()
    cfg = (
        db.query(ConfiguracaoConfirmacaoWhatsapp)
        .filter(func.lower(ConfiguracaoConfirmacaoWhatsapp.slug_publico) == chave.lower())
        .first()
    )
    if cfg:
        loja = db.query(Loja).filter(Loja.id == cfg.loja_id).first()
        if loja:
            return loja, cfg

    # Fallback: tenta resolver por ID numérico ou codigo_loja
    try:
        loja_id_int = resolver_loja_id_ou_404(db, chave)
    except HTTPException:
        raise HTTPException(status_code=404, detail="Lista de confirmação não encontrada.")

    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")
    cfg = obter_ou_criar_configuracao(db, loja)
    return loja, cfg


@router_autenticado.get(
    "/lojas/{loja_id}/confirmacao-whatsapp/painel",
    response_model=PainelConfirmacaoResponse,
)
def obter_painel_confirmacao(
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, usuario, obreiro, eh_gestao = autorizacao
    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")

    cfg = obter_ou_criar_configuracao(db, loja)
    lista_aberta = _obter_lista_aberta(db, loja_id_int)
    registros: List[RegistroConfirmacaoWhatsapp] = []
    if lista_aberta:
        registros = (
            db.query(RegistroConfirmacaoWhatsapp)
            .filter(RegistroConfirmacaoWhatsapp.lista_id == lista_aberta.id)
            .order_by(RegistroConfirmacaoWhatsapp.id.asc())
            .all()
        )

    logs = (
        db.query(LogDisparoConfirmacaoWhatsapp)
        .filter(LogDisparoConfirmacaoWhatsapp.loja_id == loja_id_int)
        .order_by(LogDisparoConfirmacaoWhatsapp.id.desc())
        .limit(20)
        .all()
    )

    nome_completo = _resolver_nome_usuario(usuario, obreiro)
    primeiro_nome, ultimo_nome = extrair_primeiro_e_ultimo_nome(nome_completo)

    return PainelConfirmacaoResponse(
        loja_id=loja.id,
        nome_loja=loja.nome_loja,
        usuario_logado_nome=nome_completo,
        usuario_logado_primeiro_nome=primeiro_nome,
        usuario_logado_ultimo_nome=ultimo_nome,
        eh_gestao_loja=eh_gestao,
        configuracao=ConfiguracaoConfirmacaoResponse.model_validate(cfg),
        url_publica_efetiva=obter_url_publica_efetiva(cfg),
        lista_aberta=_serializar_lista(lista_aberta, registros) if lista_aberta else None,
        totais=calcular_totais(registros),
        proximo_disparo=calcular_proximo_disparo(cfg, lista_aberta),
        registros=[_serializar_registro(r) for r in registros],
        logs_recentes=[LogDisparoResponse.model_validate(l) for l in logs],
    )


@router_autenticado.post(
    "/lojas/{loja_id}/confirmacao-whatsapp/preview-anuncio",
    response_model=PreviewAnuncioResponse,
)
def preview_anuncio(
    payload: PreviewAnuncioRequest,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
):
    data_ev, titulo, encontrada = extrair_data_e_titulo(payload.texto_anuncio)
    return PreviewAnuncioResponse(
        data_evento=data_ev,
        titulo_sugerido=titulo,
        data_encontrada_no_texto=encontrada,
    )


@router_autenticado.post(
    "/lojas/{loja_id}/confirmacao-whatsapp/publicar",
    response_model=ListaConfirmacaoResponse,
    status_code=201,
)
async def publicar_lista_semanal(
    payload: PublicarListaRequest,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, usuario, obreiro, _ = autorizacao
    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")
    cfg = obter_ou_criar_configuracao(db, loja)

    # Arquiva qualquer lista aberta anterior
    abertas = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(
            ListaConfirmacaoWhatsapp.loja_id == loja_id_int,
            ListaConfirmacaoWhatsapp.status == "ABERTA",
        )
        .all()
    )
    agora = agora_utc_naive()
    for ant in abertas:
        ant.status = "ARQUIVADA"
        ant.encerrado_em = agora

    data_auto, titulo_auto, _ = extrair_data_e_titulo(payload.texto_anuncio)
    data_evento = payload.data_evento or data_auto
    titulo = (payload.titulo or titulo_auto).strip()

    nome_usuario = _resolver_nome_usuario(usuario, obreiro)
    lista = ListaConfirmacaoWhatsapp(
        loja_id=loja_id_int,
        sessao_id=payload.sessao_id,
        titulo=titulo,
        texto_anuncio=payload.texto_anuncio.strip(),
        data_evento=data_evento,
        status="ABERTA",
        publicado_por_email=usuario.email if usuario else None,
        publicado_por_nome=nome_usuario,
    )
    db.add(lista)
    db.flush()

    registros: List[RegistroConfirmacaoWhatsapp] = []
    if payload.incluir_anunciante:
        p_def, u_def = extrair_primeiro_e_ultimo_nome(nome_usuario)
        primeiro = (payload.primeiro_nome_anunciante or p_def).strip()
        ultimo = (payload.ultimo_nome_anunciante if payload.ultimo_nome_anunciante is not None else u_def).strip()
        reg = RegistroConfirmacaoWhatsapp(
            lista_id=lista.id,
            loja_id=loja_id_int,
            primeiro_nome=primeiro,
            ultimo_nome=ultimo,
            acompanhantes=max(0, int(payload.acompanhantes_anunciante or 0)),
            status="CONFIRMADO",
            origem="ANUNCIANTE",
            presente=False,
        )
        db.add(reg)
        db.flush()
        registros.append(reg)

    db.commit()
    db.refresh(lista)

    msg = formatar_mensagem_whatsapp(lista, registros, obter_url_publica_efetiva(cfg))
    await enviar_mensagem_grupo_whatsapp(db, cfg, lista, "PUBLICACAO", msg)

    return _serializar_lista(lista, registros, incluir_registros=True)


@router_autenticado.get(
    "/lojas/{loja_id}/confirmacao-whatsapp/listas",
    response_model=List[ListaConfirmacaoResponse],
)
def listar_historico_listas(
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    listas = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(ListaConfirmacaoWhatsapp.loja_id == loja_id_int)
        .order_by(ListaConfirmacaoWhatsapp.id.desc())
        .limit(50)
        .all()
    )
    resultado = []
    for l in listas:
        regs = (
            db.query(RegistroConfirmacaoWhatsapp)
            .filter(RegistroConfirmacaoWhatsapp.lista_id == l.id)
            .order_by(RegistroConfirmacaoWhatsapp.id.asc())
            .all()
        )
        resultado.append(_serializar_lista(l, regs))
    return resultado


@router_autenticado.get(
    "/lojas/{loja_id}/confirmacao-whatsapp/listas/{lista_id}",
    response_model=ListaConfirmacaoResponse,
)
def obter_detalhe_lista(
    lista_id: int,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    lista = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(
            ListaConfirmacaoWhatsapp.id == lista_id,
            ListaConfirmacaoWhatsapp.loja_id == loja_id_int,
        )
        .first()
    )
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada.")
    regs = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
        .order_by(RegistroConfirmacaoWhatsapp.id.asc())
        .all()
    )
    return _serializar_lista(lista, regs, incluir_registros=True)


@router_autenticado.get("/lojas/{loja_id}/confirmacao-whatsapp/listas/{lista_id}/csv")
def exportar_csv_lista(
    lista_id: int,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    lista = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(
            ListaConfirmacaoWhatsapp.id == lista_id,
            ListaConfirmacaoWhatsapp.loja_id == loja_id_int,
        )
        .first()
    )
    if not lista:
        raise HTTPException(status_code=404, detail="Lista não encontrada.")
    regs = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
        .order_by(RegistroConfirmacaoWhatsapp.id.asc())
        .all()
    )
    conteudo = gerar_csv_lista(lista, regs)
    nome_arquivo = f"lista_confirmacao_{lista.data_evento.isoformat()}_{lista.id}.csv"
    return Response(
        content=conteudo,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )


@router_autenticado.post("/lojas/{loja_id}/confirmacao-whatsapp/reset")
def reset_manual_lista(
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    abertas = (
        db.query(ListaConfirmacaoWhatsapp)
        .filter(
            ListaConfirmacaoWhatsapp.loja_id == loja_id_int,
            ListaConfirmacaoWhatsapp.status == "ABERTA",
        )
        .all()
    )
    agora = agora_utc_naive()
    for l in abertas:
        l.status = "ARQUIVADA"
        l.encerrado_em = agora
    db.commit()
    return {"ok": True, "arquivadas": len(abertas)}


@router_autenticado.post(
    "/lojas/{loja_id}/confirmacao-whatsapp/disparar-agora",
    response_model=LogDisparoResponse,
)
async def disparar_agora_whatsapp(
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    cfg = obter_ou_criar_configuracao(db, loja)
    lista = _obter_lista_aberta(db, loja_id_int)
    if not lista:
        raise HTTPException(status_code=404, detail="Nenhuma lista aberta para disparar.")
    regs = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
        .order_by(RegistroConfirmacaoWhatsapp.id.asc())
        .all()
    )
    msg = formatar_mensagem_whatsapp(lista, regs, obter_url_publica_efetiva(cfg))
    log = await enviar_mensagem_grupo_whatsapp(db, cfg, lista, "MANUAL", msg)
    return LogDisparoResponse.model_validate(log)


@router_autenticado.post(
    "/lojas/{loja_id}/confirmacao-whatsapp/registros",
    response_model=RegistroConfirmacaoResponse,
    status_code=201,
)
def criar_registro_manual(
    payload: RegistroConfirmacaoManualCreate,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    lista = _obter_lista_aberta(db, loja_id_int)
    if not lista:
        raise HTTPException(status_code=404, detail="Nenhuma lista aberta no momento.")

    reg = RegistroConfirmacaoWhatsapp(
        lista_id=lista.id,
        loja_id=loja_id_int,
        primeiro_nome=payload.primeiro_nome.strip(),
        ultimo_nome=payload.ultimo_nome.strip(),
        acompanhantes=max(0, int(payload.acompanhantes or 0)),
        status="CONFIRMADO",
        origem="MANUAL",
        presente=False,
        observacao=payload.observacao,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return _serializar_registro(reg)


@router_autenticado.patch(
    "/lojas/{loja_id}/confirmacao-whatsapp/registros/{registro_id}",
    response_model=RegistroConfirmacaoResponse,
)
def atualizar_registro(
    registro_id: int,
    payload: RegistroConfirmacaoUpdate,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    reg = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(
            RegistroConfirmacaoWhatsapp.id == registro_id,
            RegistroConfirmacaoWhatsapp.loja_id == loja_id_int,
        )
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")

    if payload.primeiro_nome is not None:
        reg.primeiro_nome = payload.primeiro_nome.strip()
    if payload.ultimo_nome is not None:
        reg.ultimo_nome = payload.ultimo_nome.strip()
    if payload.acompanhantes is not None:
        reg.acompanhantes = max(0, int(payload.acompanhantes))
    if payload.status is not None:
        reg.status = payload.status
    if payload.presente is not None:
        reg.presente = payload.presente
    if payload.observacao is not None:
        reg.observacao = payload.observacao

    reg.atualizado_em = agora_utc_naive()
    db.commit()
    db.refresh(reg)
    return _serializar_registro(reg)


@router_autenticado.delete("/lojas/{loja_id}/confirmacao-whatsapp/registros/{registro_id}")
def remover_registro(
    registro_id: int,
    autorizacao=Depends(exigir_publicador_ou_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int, _, _, _ = autorizacao
    reg = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(
            RegistroConfirmacaoWhatsapp.id == registro_id,
            RegistroConfirmacaoWhatsapp.loja_id == loja_id_int,
        )
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")
    db.delete(reg)
    db.commit()
    return {"ok": True}


@router_autenticado.get(
    "/lojas/{loja_id}/confirmacao-whatsapp/publicadores",
    response_model=List[PublicadorAutorizadoResponse],
)
def listar_publicadores_autorizados(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    pubs = (
        db.query(PublicadorAutorizadoWhatsapp)
        .filter(PublicadorAutorizadoWhatsapp.loja_id == loja_id_int)
        .order_by(PublicadorAutorizadoWhatsapp.id.desc())
        .all()
    )
    return [PublicadorAutorizadoResponse.model_validate(p) for p in pubs]


@router_autenticado.post(
    "/lojas/{loja_id}/confirmacao-whatsapp/publicadores",
    response_model=PublicadorAutorizadoResponse,
    status_code=201,
)
def adicionar_publicador_autorizado(
    loja_id: str,
    payload: PublicadorAutorizadoCreate,
    contexto=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, _ = contexto
    email_norm = payload.email.strip().lower()

    existente = (
        db.query(PublicadorAutorizadoWhatsapp)
        .filter(
            PublicadorAutorizadoWhatsapp.loja_id == loja_id_int,
            func.lower(PublicadorAutorizadoWhatsapp.email) == email_norm,
        )
        .first()
    )
    if existente:
        existente.ativo = True
        existente.nome = payload.nome or existente.nome
        existente.observacao = payload.observacao or existente.observacao
        db.commit()
        db.refresh(existente)
        return PublicadorAutorizadoResponse.model_validate(existente)

    pub = PublicadorAutorizadoWhatsapp(
        loja_id=loja_id_int,
        email=email_norm,
        nome=payload.nome,
        observacao=payload.observacao,
        ativo=True,
        autorizado_por_email=usuario.email if usuario else None,
    )
    db.add(pub)
    db.commit()
    db.refresh(pub)
    return PublicadorAutorizadoResponse.model_validate(pub)


@router_autenticado.delete("/lojas/{loja_id}/confirmacao-whatsapp/publicadores/{pub_id}")
def remover_publicador_autorizado(
    loja_id: str,
    pub_id: int,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    pub = (
        db.query(PublicadorAutorizadoWhatsapp)
        .filter(
            PublicadorAutorizadoWhatsapp.id == pub_id,
            PublicadorAutorizadoWhatsapp.loja_id == loja_id_int,
        )
        .first()
    )
    if not pub:
        raise HTTPException(status_code=404, detail="Publicador não encontrado.")
    db.delete(pub)
    db.commit()
    return {"ok": True}


@router_autenticado.get(
    "/lojas/{loja_id}/confirmacao-whatsapp/configuracao",
    response_model=ConfiguracaoConfirmacaoResponse,
)
def obter_configuracao(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    cfg = obter_ou_criar_configuracao(db, loja)
    return ConfiguracaoConfirmacaoResponse.model_validate(cfg)


@router_autenticado.put(
    "/lojas/{loja_id}/confirmacao-whatsapp/configuracao",
    response_model=ConfiguracaoConfirmacaoResponse,
)
def atualizar_configuracao(
    loja_id: str,
    payload: ConfiguracaoConfirmacaoUpdate,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    loja = db.query(Loja).filter(Loja.id == loja_id_int).first()
    cfg = obter_ou_criar_configuracao(db, loja)

    if payload.slug_publico is not None:
        slug_novo = payload.slug_publico.strip().lower()
        conflito = (
            db.query(ConfiguracaoConfirmacaoWhatsapp)
            .filter(
                ConfiguracaoConfirmacaoWhatsapp.slug_publico == slug_novo,
                ConfiguracaoConfirmacaoWhatsapp.id != cfg.id,
            )
            .first()
        )
        if conflito:
            raise HTTPException(status_code=409, detail="Este slug público já está em uso por outra Loja.")
        cfg.slug_publico = slug_novo

    for campo in (
        "url_publica_base",
        "grupo_whatsapp_jid",
        "grupo_whatsapp_nome",
        "horarios_dias_normais",
        "horarios_dia_evento",
        "dia_semana_reset",
        "horario_reset",
        "fuso_horario",
        "republicar_ao_confirmar",
        "ativo",
    ):
        valor = getattr(payload, campo)
        if valor is not None:
            setattr(cfg, campo, valor)

    cfg.atualizado_em = agora_utc_naive()
    db.commit()
    db.refresh(cfg)
    return ConfiguracaoConfirmacaoResponse.model_validate(cfg)


@router_autenticado.get("/lojas/{loja_id}/confirmacao-whatsapp/whatsapp/status")
async def whatsapp_status(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return await gateway_status(loja_id_int)


@router_autenticado.post("/lojas/{loja_id}/confirmacao-whatsapp/whatsapp/conectar")
async def whatsapp_conectar(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return await gateway_conectar(loja_id_int)


@router_autenticado.post("/lojas/{loja_id}/confirmacao-whatsapp/whatsapp/desconectar")
async def whatsapp_desconectar(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return await gateway_desconectar(loja_id_int)


@router_autenticado.get("/lojas/{loja_id}/confirmacao-whatsapp/whatsapp/grupos")
async def whatsapp_grupos(
    loja_id: str,
    _autorizacao=Depends(exigir_permissao_gestao_loja),
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return await gateway_grupos(loja_id_int)


# ==============================================================================
# ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) — /api/v1/confirmacao-publica/{slug_ou_loja}
# ==============================================================================


def _montar_painel_publico(
    db: Session,
    loja: Loja,
    cfg: ConfiguracaoConfirmacaoWhatsapp,
    token_aparelho: Optional[str] = None,
) -> PainelPublicoResponse:
    lista = _obter_lista_aberta(db, loja.id)
    if not lista:
        return PainelPublicoResponse(
            loja_id=loja.id,
            nome_loja=loja.nome_loja,
            numero_loja=loja.numero_loja,
            slug_publico=cfg.slug_publico,
            em_espera=True,
            totais=calcular_totais([]),
            confirmados=[],
            meu_registro=None,
        )

    regs = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(
            RegistroConfirmacaoWhatsapp.lista_id == lista.id,
            RegistroConfirmacaoWhatsapp.status == "CONFIRMADO",
        )
        .order_by(RegistroConfirmacaoWhatsapp.id.asc())
        .all()
    )

    itens = [
        RegistroPublicoItem(
            id=r.id,
            primeiro_nome=r.primeiro_nome,
            ultimo_nome=r.ultimo_nome,
            acompanhantes=r.acompanhantes,
            total_pessoas=1 + max(0, int(r.acompanhantes or 0)),
            origem=r.origem,
        )
        for r in regs
    ]

    meu_reg = None
    if token_aparelho:
        for r in regs:
            if r.token_aparelho == token_aparelho:
                meu_reg = RegistroPublicoItem(
                    id=r.id,
                    primeiro_nome=r.primeiro_nome,
                    ultimo_nome=r.ultimo_nome,
                    acompanhantes=r.acompanhantes,
                    total_pessoas=1 + max(0, int(r.acompanhantes or 0)),
                    origem=r.origem,
                )
                break

    return PainelPublicoResponse(
        loja_id=loja.id,
        nome_loja=loja.nome_loja,
        numero_loja=loja.numero_loja,
        slug_publico=cfg.slug_publico,
        em_espera=False,
        titulo=lista.titulo,
        texto_anuncio=lista.texto_anuncio,
        data_evento=lista.data_evento,
        totais=calcular_totais(regs),
        confirmados=itens,
        meu_registro=meu_reg,
    )


@router_publico.get(
    "/confirmacao-publica/{slug_ou_loja}",
    response_model=PainelPublicoResponse,
)
def obter_painel_publico(
    slug_ou_loja: str,
    token_aparelho: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    loja, cfg = _resolver_loja_e_config_publica(db, slug_ou_loja)
    return _montar_painel_publico(db, loja, cfg, token_aparelho=token_aparelho)


@router_publico.post(
    "/confirmacao-publica/{slug_ou_loja}/confirmar",
    response_model=PainelPublicoResponse,
)
async def confirmar_presenca_publica(
    slug_ou_loja: str,
    payload: ConfirmacaoPublicaRequest,
    db: Session = Depends(get_db),
):
    loja, cfg = _resolver_loja_e_config_publica(db, slug_ou_loja)
    lista = _obter_lista_aberta(db, loja.id)
    if not lista:
        raise HTTPException(
            status_code=409,
            detail="Não há lista de confirmação aberta no momento para esta Loja.",
        )

    token = (payload.token_aparelho or "").strip() or None
    reg = None
    if token:
        reg = (
            db.query(RegistroConfirmacaoWhatsapp)
            .filter(
                RegistroConfirmacaoWhatsapp.lista_id == lista.id,
                RegistroConfirmacaoWhatsapp.token_aparelho == token,
            )
            .first()
        )

    if reg:
        reg.primeiro_nome = payload.primeiro_nome.strip()
        reg.ultimo_nome = payload.ultimo_nome.strip()
        reg.acompanhantes = max(0, int(payload.acompanhantes or 0))
        reg.status = "CONFIRMADO"
        reg.atualizado_em = agora_utc_naive()
    else:
        reg = RegistroConfirmacaoWhatsapp(
            lista_id=lista.id,
            loja_id=loja.id,
            primeiro_nome=payload.primeiro_nome.strip(),
            ultimo_nome=payload.ultimo_nome.strip(),
            acompanhantes=max(0, int(payload.acompanhantes or 0)),
            status="CONFIRMADO",
            origem="LINK",
            presente=False,
            token_aparelho=token,
        )
        db.add(reg)

    db.commit()

    if cfg.republicar_ao_confirmar:
        regs = (
            db.query(RegistroConfirmacaoWhatsapp)
            .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
            .order_by(RegistroConfirmacaoWhatsapp.id.asc())
            .all()
        )
        msg = formatar_mensagem_whatsapp(lista, regs, obter_url_publica_efetiva(cfg))
        await enviar_mensagem_grupo_whatsapp(db, cfg, lista, "CONFIRMACAO", msg)

    return _montar_painel_publico(db, loja, cfg, token_aparelho=token)


@router_publico.post(
    "/confirmacao-publica/{slug_ou_loja}/cancelar",
    response_model=PainelPublicoResponse,
)
async def cancelar_presenca_publica(
    slug_ou_loja: str,
    payload: CancelarPublicaRequest,
    db: Session = Depends(get_db),
):
    loja, cfg = _resolver_loja_e_config_publica(db, slug_ou_loja)
    lista = _obter_lista_aberta(db, loja.id)
    if not lista:
        raise HTTPException(
            status_code=409,
            detail="Não há lista de confirmação aberta no momento.",
        )

    reg = (
        db.query(RegistroConfirmacaoWhatsapp)
        .filter(
            RegistroConfirmacaoWhatsapp.lista_id == lista.id,
            RegistroConfirmacaoWhatsapp.token_aparelho == payload.token_aparelho.strip(),
        )
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Confirmação não encontrada para este aparelho.")

    reg.status = "CANCELADO"
    reg.atualizado_em = agora_utc_naive()
    db.commit()

    if cfg.republicar_ao_confirmar:
        regs = (
            db.query(RegistroConfirmacaoWhatsapp)
            .filter(RegistroConfirmacaoWhatsapp.lista_id == lista.id)
            .order_by(RegistroConfirmacaoWhatsapp.id.asc())
            .all()
        )
        msg = formatar_mensagem_whatsapp(lista, regs, obter_url_publica_efetiva(cfg))
        await enviar_mensagem_grupo_whatsapp(db, cfg, lista, "CONFIRMACAO", msg)

    return _montar_painel_publico(db, loja, cfg, token_aparelho=payload.token_aparelho.strip())
