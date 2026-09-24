# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de gerenciamento de Documentos, Atas, Balaústres e Arquivos da Loja.
Oferece operações de listagem, arquivamento, reativação e compartilhamento regional.
"""
from typing import List, Optional
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models.models import Documento, Loja, Obreiro
from schemas.documento_schema import DocumentoCreate, DocumentoUpdate, DocumentoResponse


def _montar_resposta_documento(doc: Documento) -> DocumentoResponse:
    loja_nome = doc.loja.nome_loja if doc.loja else None
    loja_num = str(doc.loja.numero_loja) if (doc.loja and doc.loja.numero_loja) else None
    obreiro_nome = doc.enviado_por.nome_completo if doc.enviado_por else None

    return DocumentoResponse(
        id=doc.id,
        titulo=doc.titulo,
        tipo_documento=doc.tipo_documento,
        caminho_arquivo=doc.caminho_arquivo,
        nome_arquivo=doc.nome_arquivo,
        tipo_arquivo=doc.tipo_arquivo,
        tamanho_bytes=doc.tamanho_bytes,
        descricao=doc.descricao,
        visibilidade=doc.visibilidade or "LOCAL",
        ativo=doc.ativo,
        data_expiracao=doc.data_expiracao,
        sessao_id=doc.sessao_id,
        loja_id=doc.loja_id,
        data_upload=doc.data_upload,
        enviado_por_obreiro_id=doc.enviado_por_obreiro_id,
        enviado_por_nome=obreiro_nome,
        loja_nome=loja_nome,
        loja_numero=loja_num,
    )


def listar_documentos_loja(
    db: Session,
    loja_id: int,
    tipo_documento: Optional[str] = None,
    apenas_ativos: bool = True,
    visibilidade: Optional[str] = None,
) -> List[DocumentoResponse]:
    """Lista os documentos vinculados à Loja com filtros de tipo, vigência e visibilidade."""
    query = (
        db.query(Documento)
        .options(joinedload(Documento.loja), joinedload(Documento.enviado_por))
        .filter(Documento.loja_id == loja_id)
    )

    if apenas_ativos:
        hoje = date.today()
        query = query.filter(Documento.ativo.is_(True)).filter(
            (Documento.data_expiracao.is_(None)) | (Documento.data_expiracao >= hoje)
        )

    if tipo_documento:
        query = query.filter(Documento.tipo_documento.ilike(f"%{tipo_documento}%"))

    if visibilidade:
        query = query.filter(Documento.visibilidade == visibilidade)

    docs = query.order_by(Documento.data_upload.desc()).all()
    return [_montar_resposta_documento(d) for d in docs]


def criar_documento(db: Session, payload: DocumentoCreate) -> DocumentoResponse:
    """Registra um novo documento no repositório da oficina."""
    doc = Documento(
        titulo=payload.titulo,
        tipo_documento=payload.tipo_documento,
        caminho_arquivo=payload.caminho_arquivo,
        nome_arquivo=payload.nome_arquivo,
        tipo_arquivo=payload.tipo_arquivo,
        tamanho_bytes=payload.tamanho_bytes,
        descricao=payload.descricao,
        visibilidade=payload.visibilidade or "LOCAL",
        ativo=payload.ativo,
        data_expiracao=payload.data_expiracao,
        sessao_id=payload.sessao_id,
        loja_id=payload.loja_id,
        enviado_por_obreiro_id=payload.enviado_por_obreiro_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _montar_resposta_documento(doc)


def atualizar_documento(db: Session, doc_id: int, payload: DocumentoUpdate) -> DocumentoResponse:
    """Atualiza metadados ou altera o status de arquivamento do documento."""
    doc = (
        db.query(Documento)
        .options(joinedload(Documento.loja), joinedload(Documento.enviado_por))
        .filter(Documento.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    dados = payload.model_dump(exclude_unset=True)
    for k, v in dados.items():
        setattr(doc, k, v)

    db.commit()
    db.refresh(doc)
    return _montar_resposta_documento(doc)


def arquivar_ou_deletar_documento(db: Session, doc_id: int, permanente: bool = False) -> dict:
    """Arquiva (soft-delete) ou remove definitivamente o documento."""
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    if permanente:
        db.delete(doc)
        db.commit()
        return {"status": "success", "message": "Documento excluído com sucesso."}

    doc.ativo = False
    db.commit()
    return {"status": "success", "message": "Documento arquivado com sucesso."}


def reativar_documento(db: Session, doc_id: int) -> DocumentoResponse:
    """Desarquiva um documento previamente inativado."""
    doc = (
        db.query(Documento)
        .options(joinedload(Documento.loja), joinedload(Documento.enviado_por))
        .filter(Documento.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    doc.ativo = True
    db.commit()
    db.refresh(doc)
    return _montar_resposta_documento(doc)


def listar_documentos_regionais(
    db: Session,
    lojas_ids: Optional[List[int]] = None,
    tipo_documento: Optional[str] = None,
) -> List[DocumentoResponse]:
    """Retorna documentos marcados com visibilidade REGIONAL para consumo no CoReVM."""
    query = (
        db.query(Documento)
        .options(joinedload(Documento.loja), joinedload(Documento.enviado_por))
        .filter(Documento.visibilidade == "REGIONAL", Documento.ativo.is_(True))
    )

    if lojas_ids:
        query = query.filter(Documento.loja_id.in_(lojas_ids))

    if tipo_documento:
        query = query.filter(Documento.tipo_documento.ilike(f"%{tipo_documento}%"))

    docs = query.order_by(Documento.data_upload.desc()).all()
    return [_montar_resposta_documento(d) for d in docs]
