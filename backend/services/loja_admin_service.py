# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de administração institucional da Loja:
Dados cadastrais do templo/endereço, Comissões e Mural de Avisos da Secretaria.
"""
from typing import List, Optional
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models.models import (
    Loja,
    Obediencia,
    Comissao,
    MembroComissao,
    Obreiro,
    Aviso,
    TipoComissaoEnum
)
from schemas.comissao_loja_schema import (
    LojaDadosResponse,
    LojaDadosUpdate,
    ComissaoCreate,
    ComissaoResponse,
    MembroComissaoSchema,
    AvisoCreate,
    AvisoResponse
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
    for k, v in dados.items():
        setattr(loja, k, v)

    db.commit()
    db.refresh(loja)
    return obter_loja_por_id(db, loja_id)


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


def listar_avisos_loja(db: Session, loja_id: int, apenas_ativos: bool = True) -> List[AvisoResponse]:
    """Lista os avisos e comunicados da secretaria da Loja."""
    query = db.query(Aviso).filter(Aviso.loja_id == loja_id)
    if apenas_ativos:
        hoje = date.today()
        query = query.filter(Aviso.ativo.is_(True)).filter(
            (Aviso.data_expiracao.is_(None)) | (Aviso.data_expiracao >= hoje)
        )
    avisos = query.order_by(Aviso.criado_em.desc()).all()
    return [
        AvisoResponse(
            id=a.id,
            loja_id=a.loja_id,
            titulo=a.titulo,
            conteudo=a.conteudo,
            tipo=a.tipo.value if hasattr(a.tipo, "value") else str(a.tipo),
            data_expiracao=a.data_expiracao,
            ativo=a.ativo,
            criado_em=a.criado_em
        )
        for a in avisos
    ]


def criar_aviso_loja(db: Session, payload: AvisoCreate) -> AvisoResponse:
    """Registra um novo comunicado no mural de avisos da Loja."""
    aviso = Aviso(
        loja_id=payload.loja_id,
        titulo=payload.titulo,
        conteudo=payload.conteudo,
        tipo=payload.tipo,
        data_expiracao=payload.data_expiracao,
        ativo=payload.ativo
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
        data_expiracao=aviso.data_expiracao,
        ativo=aviso.ativo,
        criado_em=aviso.criado_em
    )
