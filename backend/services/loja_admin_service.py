# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de administração institucional da Loja:
Dados cadastrais do templo/endereço, Comissões e Mural de Avisos da Secretaria.
"""
from typing import List, Optional
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from sqlalchemy import or_
from models.models import (
    Loja,
    Obediencia,
    Comissao,
    MembroComissao,
    Obreiro,
    Aviso,
    TipoComissaoEnum,
    RitoEnum
)
from schemas.comissao_loja_schema import (
    LojaDadosResponse,
    LojaDadosUpdate,
    ComissaoCreate,
    ComissaoResponse,
    MembroComissaoSchema,
    AvisoCreate,
    AvisoResponse,
    LojaBuscaItem,
    LojaCreateOnTheFlyPayload
)


def obter_loja_por_id(db: Session, loja_id: int) -> LojaDadosResponse:
    """Retorna os dados cadastrais da Loja incluindo filiação institucional."""
    loja = (
        db.query(Loja)
        .options(joinedload(Loja.potencia), joinedload(Loja.obediencia))
        .filter(Loja.id == loja_id)
        .first()
    )
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")

    rito_str = loja.rito.value if hasattr(loja.rito, "value") else str(loja.rito or "")
    dia_sessao_str = loja.dia_sessao.value if hasattr(loja.dia_sessao, "value") else str(loja.dia_sessao or "")
    periodicidade_str = loja.periodicidade.value if hasattr(loja.periodicidade, "value") else str(loja.periodicidade or "")

    return LojaDadosResponse(
        id=loja.id,
        nome_loja=loja.nome_loja,
        titulo_loja=loja.titulo_loja,
        codigo_loja=loja.codigo_loja,
        numero_loja=loja.numero_loja,
        data_fundacao=loja.data_fundacao,
        rito=rito_str,
        potencia_id=loja.potencia_id,
        potencia_nome=loja.potencia.nome if loja.potencia else None,
        obediencia_id=loja.obediencia_id,
        obediencia_nome=loja.obediencia.nome if loja.obediencia else None,
        cnpj=loja.cnpj,
        email=loja.email,
        telefone=loja.telefone,
        site=loja.site,
        logradouro=loja.logradouro,
        numero=loja.numero,
        bairro=loja.bairro,
        cidade=loja.cidade,
        estado=loja.estado,
        cep=loja.cep,
        latitude=loja.latitude,
        longitude=loja.longitude,
        raio_geofence=loja.raio_geofence,
        qr_code_id=loja.qr_code_id,
        dia_sessao=dia_sessao_str,
        periodicidade=periodicidade_str,
        horario_sessao=loja.horario_sessao,
        filiacao_formatada=loja.filiacao_formatada
    )


def atualizar_dados_loja(db: Session, loja_id: int, payload: LojaDadosUpdate) -> LojaDadosResponse:
    """Atualiza informações de endereço, horários de reuniões e contato da Loja."""
    loja = db.query(Loja).filter(Loja.id == loja_id).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")

    dados = payload.model_dump(exclude_unset=True)

    # Tratamento de aliases para compatibilidade com o legado e CoReVM
    if "nome" in dados and dados["nome"] is not None:
        loja.nome_loja = dados.pop("nome")
    if "nome_loja" in dados and dados["nome_loja"] is not None:
        loja.nome_loja = dados.pop("nome_loja")

    if "numero_loja" in dados and dados["numero_loja"] is not None:
        loja.numero_loja = dados.pop("numero_loja")
    if "numero_endereco" in dados and dados["numero_endereco"] is not None:
        loja.numero = dados.pop("numero_endereco")
    if "numero" in dados and dados["numero"] is not None:
        loja.numero = dados.pop("numero")

    if "rito" in dados and dados["rito"] is not None:
        rito_val = dados.pop("rito")
        try:
            loja.rito = RitoEnum(rito_val)
        except Exception:
            loja.rito = rito_val

    if "dia_sessao" in dados and dados["dia_sessao"] is not None:
        dia_val = str(dados.pop("dia_sessao")).strip().lower()
        mapa_dias = {
            "segunda-feira": "Segundas-feiras",
            "segunda": "Segundas-feiras",
            "segundas-feiras": "Segundas-feiras",
            "terca-feira": "Terças-feiras",
            "terça-feira": "Terças-feiras",
            "terca": "Terças-feiras",
            "terça": "Terças-feiras",
            "terças-feiras": "Terças-feiras",
            "quarta-feira": "Quartas-feiras",
            "quarta": "Quartas-feiras",
            "quartas-feiras": "Quartas-feiras",
            "quinta-feira": "Quintas-feiras",
            "quinta": "Quintas-feiras",
            "quintas-feiras": "Quintas-feiras",
            "sexta-feira": "Sextas-feiras",
            "sexta": "Sextas-feiras",
            "sextas-feiras": "Sextas-feiras",
            "sabado": "Sábados",
            "sábado": "Sábados",
            "sábados": "Sábados",
            "domingo": "Domingos",
            "domingos": "Domingos",
        }
        loja.dia_sessao = mapa_dias.get(dia_val, dados.get("dia_sessao"))

    for k, v in dados.items():
        if hasattr(loja, k):
            setattr(loja, k, v)

    db.commit()
    db.refresh(loja)
    return obter_loja_por_id(db, loja_id)


def buscar_lojas_termo(db: Session, termo: str, limite: int = 20) -> List[LojaBuscaItem]:
    """Busca lojas pelo nome, número ou cidade com potência associada."""
    t = f"%{termo}%"
    lojas = (
        db.query(Loja)
        .options(joinedload(Loja.potencia))
        .filter(
            or_(
                Loja.nome_loja.ilike(t),
                Loja.numero_loja.ilike(t),
                Loja.cidade.ilike(t),
            )
        )
        .limit(limite)
        .all()
    )
    resultado = []
    for l in lojas:
        rito_str = l.rito.value if hasattr(l.rito, "value") else str(l.rito or "")
        pot_str = l.potencia.sigla if (l.potencia and l.potencia.sigla) else (l.potencia.nome if l.potencia else "")
        resultado.append(
            LojaBuscaItem(
                id=l.id,
                nome=l.nome_loja,
                numero=str(l.numero_loja) if l.numero_loja else None,
                numero_loja=str(l.numero_loja) if l.numero_loja else None,
                cidade=l.cidade or "",
                potencia=pot_str,
                rito=rito_str,
            )
        )
    return resultado


def buscar_lojas_por_ids(db: Session, ids: List[int]) -> List[LojaBuscaItem]:
    """Busca detalhes de múltiplas lojas por lista de IDs."""
    if not ids:
        return []
    ids_validos = [i for i in ids if isinstance(i, int)]
    if not ids_validos:
        return []
    lojas = (
        db.query(Loja)
        .options(joinedload(Loja.potencia))
        .filter(Loja.id.in_(ids_validos))
        .all()
    )
    resultado = []
    for l in lojas:
        rito_str = l.rito.value if hasattr(l.rito, "value") else str(l.rito or "")
        pot_str = l.potencia.sigla if (l.potencia and l.potencia.sigla) else (l.potencia.nome if l.potencia else "")
        resultado.append(
            LojaBuscaItem(
                id=l.id,
                nome=l.nome_loja,
                numero=str(l.numero_loja) if l.numero_loja else None,
                numero_loja=str(l.numero_loja) if l.numero_loja else None,
                cidade=l.cidade or "",
                potencia=pot_str,
                rito=rito_str,
            )
        )
    return resultado


def cadastrar_loja_on_the_fly(db: Session, payload: LojaCreateOnTheFlyPayload) -> dict:
    """Insere nova Loja de forma resiliente respeitando restrições institucionais."""
    loja_existente = db.query(Loja).filter(Loja.numero_loja == payload.numero_loja).first()
    if loja_existente:
        raise HTTPException(status_code=422, detail="Já existe uma loja cadastrada com este número.")

    obediencia_id = payload.obediencia_id or payload.potencia_id
    codigo_loja = f"{payload.titulo_loja or 'ARLS'}-{payload.numero_loja}"

    nova_loja = Loja(
        nome_loja=payload.nome_loja,
        numero_loja=payload.numero_loja,
        titulo_loja=payload.titulo_loja or "ARLS",
        codigo_loja=codigo_loja,
        rito=payload.rito,
        potencia_id=payload.potencia_id,
        obediencia_id=obediencia_id,
        cidade=payload.cidade,
        estado=payload.estado,
        cep=payload.cep,
        ativo=True,
        nome_contato_tecnico="Administração CoReVM",
        email_contato_tecnico="suporte@sigma.org.br",
    )
    db.add(nova_loja)
    db.commit()
    db.refresh(nova_loja)
    return {"status": "success", "loja_id": nova_loja.id, "nome": nova_loja.nome_loja}



def listar_comissoes_loja(db: Session, loja_id: int) -> List[ComissaoResponse]:
    """Lista as comissões permanentes e temporárias da loja."""
    comissoes = (
        db.query(Comissao)
        .options(
            joinedload(Comissao.presidente),
            joinedload(Comissao.obreiros).joinedload(MembroComissao.obreiro)
        )
        .filter(Comissao.loja_id == loja_id)
        .all()
    )

    lista = []
    for c in comissoes:
        membros_list = [
            MembroComissaoSchema(
                id=m.id,
                obreiro_id=m.obreiro_id,
                obreiro_nome=m.obreiro.nome_completo if m.obreiro else None,
                obreiro_cim=m.obreiro.cim if m.obreiro else None,
                cargo=m.cargo
            )
            for m in c.obreiros
        ]
        tipo_str = c.tipo_comissao.value if hasattr(c.tipo_comissao, "value") else str(c.tipo_comissao)

        lista.append(
            ComissaoResponse(
                id=c.id,
                nome=c.nome,
                descricao=c.descricao,
                tipo_comissao=tipo_str,
                data_inicio=c.data_inicio,
                data_fim=c.data_fim,
                presidente_id=c.presidente_id,
                presidente_nome=c.presidente.nome_completo if c.presidente else None,
                loja_id=c.loja_id,
                obreiros=membros_list
            )
        )
    return lista


def criar_comissao(db: Session, payload: ComissaoCreate) -> ComissaoResponse:
    """Cria uma nova comissão da Loja e vincula seus membros."""
    comissao = Comissao(
        nome=payload.nome,
        descricao=payload.descricao,
        tipo_comissao=payload.tipo_comissao,
        data_inicio=payload.data_inicio,
        data_fim=payload.data_fim,
        presidente_id=payload.presidente_id,
        loja_id=payload.loja_id
    )
    db.add(comissao)
    db.flush()

    if payload.membros_ids:
        for oid in payload.membros_ids:
            mc = MembroComissao(
                comissao_id=comissao.id,
                obreiro_id=oid,
                cargo="Membro"
            )
            db.add(mc)

    db.commit()
    db.refresh(comissao)

    comissoes = listar_comissoes_loja(db, payload.loja_id)
    return next(c for c in comissoes if c.id == comissao.id)


def listar_avisos_loja(
    db: Session,
    loja_id: int,
    apenas_ativos: bool = True,
    incluir_regionais: bool = True,
) -> List[AvisoResponse]:
    """Lista os avisos da Loja, opcionalmente incluindo avisos disparados pelo Conselho Regional."""
    query = db.query(Aviso).filter(
        or_(
            Aviso.loja_id == loja_id,
            (Aviso.origem == "CONSELHO_REGIONAL") if incluir_regionais else False,
        )
    )
    if apenas_ativos:
        hoje = date.today()
        query = query.filter(Aviso.ativo.is_(True)).filter(
            (Aviso.data_expiracao.is_(None)) | (Aviso.data_expiracao >= hoje)
        )

    avisos = query.order_by(Aviso.criado_em.desc()).all()

    # Ordenação por nível de prioridade (URGENTE > ALTO > NORMAL)
    def _peso_prioridade(a: Aviso) -> int:
        p = str(a.nivel_prioridade or "").upper()
        if p == "URGENTE":
            return 0
        if p == "ALTO":
            return 1
        return 2

    avisos.sort(key=_peso_prioridade)

    return [
        AvisoResponse(
            id=a.id,
            loja_id=a.loja_id,
            titulo=a.titulo,
            conteudo=a.conteudo,
            tipo=a.tipo.value if hasattr(a.tipo, "value") else str(a.tipo),
            origem=a.origem or "LOJA",
            nivel_prioridade=a.nivel_prioridade or "NORMAL",
            autor_nome=a.autor_nome,
            link_externo=a.link_externo,
            data_expiracao=a.data_expiracao,
            ativo=a.ativo,
            criado_em=a.criado_em,
        )
        for a in avisos
    ]


def criar_aviso_loja(db: Session, payload: AvisoCreate) -> AvisoResponse:
    """Registra um novo comunicado no mural de avisos da Loja (ou do Conselho Regional)."""
    aviso = Aviso(
        loja_id=payload.loja_id,
        titulo=payload.titulo,
        conteudo=payload.conteudo,
        tipo=payload.tipo,
        origem=payload.origem or "LOJA",
        nivel_prioridade=payload.nivel_prioridade or "NORMAL",
        autor_nome=payload.autor_nome,
        link_externo=payload.link_externo,
        data_expiracao=payload.data_expiracao,
        ativo=payload.ativo,
    )
    db.add(aviso)
    db.commit()
    db.refresh(aviso)
    return AvisoResponse(
        id=aviso.id,
        loja_id=aviso.loja_id,
        titulo=aviso.titulo,
        conteudo=aviso.conteudo,
        tipo=aviso.tipo.value if hasattr(aviso.tipo, "value") else str(aviso.tipo),
        origem=aviso.origem or "LOJA",
        nivel_prioridade=aviso.nivel_prioridade or "NORMAL",
        autor_nome=aviso.autor_nome,
        link_externo=aviso.link_externo,
        data_expiracao=aviso.data_expiracao,
        ativo=aviso.ativo,
        criado_em=aviso.criado_em,
    )

