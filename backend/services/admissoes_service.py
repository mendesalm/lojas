# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de gerenciamento de Editais e Prévias de Admissão de Obreiros.
Oferece publicação, consulta, atualização de status e visibilidade inter-oficinas.
"""
from typing import List, Optional
from datetime import date, datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models.models import PreviaAdmissao, Loja
from schemas.admissao_schema import (
    PreviaAdmissaoCreate,
    PreviaAdmissaoUpdate,
    PreviaAdmissaoResponse,
)


def _montar_resposta_admissao(p: PreviaAdmissao) -> PreviaAdmissaoResponse:
    loja_nome = p.loja.nome_loja if p.loja else None
    loja_num = str(p.loja.numero_loja) if (p.loja and p.loja.numero_loja) else None

    return PreviaAdmissaoResponse(
        id=p.id,
        loja_id=p.loja_id,
        tipo=p.tipo,
        candidato_nome=p.candidato_nome,
        pdf_url=p.pdf_url,
        pdf_nome_original=p.pdf_nome_original,
        data_postagem=p.data_postagem,
        data_limite=p.data_limite,
        status=p.status,
        visibilidade=p.visibilidade or "REGIONAL",
        verificado_por_nome=p.verificado_por_nome,
        data_verificacao=p.data_verificacao,
        autor_id=p.autor_id,
        criado_em=p.criado_em,
        loja_nome=loja_nome,
        loja_numero=loja_num,
    )


def listar_admissoes_loja(
    db: Session,
    loja_id: int,
    status_filtro: Optional[str] = None,
    tipo: Optional[str] = None,
) -> List[PreviaAdmissaoResponse]:
    """Lista as prévias de admissão cadastradas pela oficina."""
    query = (
        db.query(PreviaAdmissao)
        .options(joinedload(PreviaAdmissao.loja))
        .filter(PreviaAdmissao.loja_id == loja_id)
    )

    if status_filtro:
        query = query.filter(PreviaAdmissao.status == status_filtro)

    if tipo:
        query = query.filter(PreviaAdmissao.tipo == tipo)

    itens = query.order_by(PreviaAdmissao.data_postagem.desc()).all()
    return [_montar_resposta_admissao(i) for i in itens]


def criar_previa_admissao(db: Session, payload: PreviaAdmissaoCreate) -> PreviaAdmissaoResponse:
    """Publica um novo edital/pedido de admissão de candidato."""
    nova = PreviaAdmissao(
        loja_id=payload.loja_id,
        tipo=payload.tipo,
        candidato_nome=payload.candidato_nome,
        pdf_url=payload.pdf_url,
        pdf_nome_original=payload.pdf_nome_original,
        data_postagem=payload.data_postagem or date.today(),
        data_limite=payload.data_limite,
        status=payload.status or "EM_ANDAMENTO",
        visibilidade=payload.visibilidade or "REGIONAL",
        autor_id=payload.autor_id,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _montar_resposta_admissao(nova)


def atualizar_previa_admissao(
    db: Session,
    admissao_id: int,
    payload: PreviaAdmissaoUpdate,
) -> PreviaAdmissaoResponse:
    """Atualiza dados do candidato, data limite ou status da prévia."""
    previa = (
        db.query(PreviaAdmissao)
        .options(joinedload(PreviaAdmissao.loja))
        .filter(PreviaAdmissao.id == admissao_id)
        .first()
    )
    if not previa:
        raise HTTPException(status_code=404, detail="Pedido de admissão não encontrado.")

    dados = payload.model_dump(exclude_unset=True)
    for k, v in dados.items():
        setattr(previa, k, v)

    if "status" in dados and dados["status"] in ["AVERIGUADO", "CONCLUIDO"] and not previa.data_verificacao:
        previa.data_verificacao = datetime.now()

    db.commit()
    db.refresh(previa)
    return _montar_resposta_admissao(previa)


def deletar_previa_admissao(db: Session, admissao_id: int) -> dict:
    """Remove o edital de admissão."""
    previa = db.query(PreviaAdmissao).filter(PreviaAdmissao.id == admissao_id).first()
    if not previa:
        raise HTTPException(status_code=404, detail="Pedido de admissão não encontrado.")

    db.delete(previa)
    db.commit()
    return {"status": "success", "message": "Pedido de admissão removido com sucesso."}


def listar_admissoes_regionais(
    db: Session,
    lojas_ids: Optional[List[int]] = None,
    tipo: Optional[str] = None,
    status_filtro: Optional[str] = None,
) -> List[PreviaAdmissaoResponse]:
    """Retorna prévias com visibilidade REGIONAL para exibição no mural do Conselho Regional."""
    query = (
        db.query(PreviaAdmissao)
        .options(joinedload(PreviaAdmissao.loja))
        .filter(PreviaAdmissao.visibilidade == "REGIONAL")
    )

    if lojas_ids:
        query = query.filter(PreviaAdmissao.loja_id.in_(lojas_ids))

    if tipo:
        query = query.filter(PreviaAdmissao.tipo == tipo)

    if status_filtro:
        query = query.filter(PreviaAdmissao.status == status_filtro)

    itens = query.order_by(PreviaAdmissao.data_postagem.desc()).all()
    return [_montar_resposta_admissao(i) for i in itens]
