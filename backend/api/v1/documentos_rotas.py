# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Gestão de Documentos, Atas, Pranchas e Compartilhamento com o CoReVM.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    get_usuario_e_obreiro,
    exigir_membro_ou_diretoria_da_loja,
    exigir_secretaria_ou_vm_da_loja,
    UsuarioEsigma,
)
from core.resolver_loja import resolver_loja_id_ou_404
from models.models import Obreiro
from schemas.documento_schema import (
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoResponse,
)
from services.documentos_service import (
    listar_documentos_loja,
    criar_documento,
    atualizar_documento,
    arquivar_ou_deletar_documento,
    reativar_documento,
    listar_documentos_regionais,
)

router_docs_global = APIRouter(tags=["Documentos (Global/Regional)"])
router = APIRouter(prefix="/lojas/{loja_id}/documentos", tags=["Documentos da Loja"])


# --- ROTA GLOBAL DE DOCUMENTOS REGIONAIS ---
@router_docs_global.get(
    "/documentos/regionais",
    response_model=List[DocumentoResponse],
    summary="Listar Documentos com Visibilidade Regional",
    description="Retorna documentos compartilhados pelas lojas para consumo pelo Conselho Regional (CoReVM).",
)
def obter_documentos_regionais(
    lojas_ids: Optional[str] = Query(None, description="Lista de IDs de lojas separados por vírgula"),
    tipo: Optional[str] = Query(None, description="Filtro por tipo de documento"),
    db: Session = Depends(get_db),
):
    ids_list = None
    if lojas_ids:
        ids_list = [int(i.strip()) for i in lojas_ids.split(",") if i.strip().isdigit()]
    return listar_documentos_regionais(db, lojas_ids=ids_list, tipo_documento=tipo)


# --- ROTAS ESPECÍFICAS DA LOJA ---
@router.get(
    "",
    response_model=List[DocumentoResponse],
    summary="Listar Documentos da Loja",
    description="Retorna os documentos, atas, pranchas e arquivos da oficina.",
)
def listar_documentos(
    loja_id: str,
    tipo: Optional[str] = Query(None, description="Filtro por tipo de documento"),
    apenas_ativos: bool = Query(True, description="Filtrar apenas documentos ativos"),
    visibilidade: Optional[str] = Query(None, description="Filtrar por visibilidade (LOCAL ou REGIONAL)"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_documentos_loja(
        db,
        loja_id=loja_id_int,
        tipo_documento=tipo,
        apenas_ativos=apenas_ativos,
        visibilidade=visibilidade,
    )


@router.post(
    "",
    response_model=DocumentoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar Novo Documento",
    description="Permite à Secretaria, Venerável Mestre ou Mesa Diretora Regional publicar um documento.",
)
def registrar_documento(
    loja_id: str,
    payload: DocumentoCreate,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    _, obreiro = contexto
    if obreiro and not payload.enviado_por_obreiro_id:
        payload.enviado_por_obreiro_id = obreiro.id

    return criar_documento(db, payload)


@router.put(
    "/{doc_id}",
    response_model=DocumentoResponse,
    summary="Atualizar Metadados do Documento",
    description="Altera informações de título, descrição ou escopo de visibilidade.",
)
def editar_documento(
    loja_id: str,
    doc_id: int,
    payload: DocumentoUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja),
):
    resolver_loja_id_ou_404(db, loja_id)
    return atualizar_documento(db, doc_id=doc_id, payload=payload)


@router.delete(
    "/{doc_id}",
    summary="Arquivar ou Excluir Documento",
    description="Inativa (soft-delete) ou remove definitivamente o documento da oficina.",
)
def deletar_documento(
    loja_id: str,
    doc_id: int,
    permanente: bool = Query(False, description="Exclusão física definitiva"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja),
):
    resolver_loja_id_ou_404(db, loja_id)
    return arquivar_ou_deletar_documento(db, doc_id=doc_id, permanente=permanente)


@router.put(
    "/{doc_id}/reativar",
    response_model=DocumentoResponse,
    summary="Reativar Documento Arquivado",
    description="Restaura o documento para o estado ativo.",
)
def reativar(
    loja_id: str,
    doc_id: int,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja),
):
    resolver_loja_id_ou_404(db, loja_id)
    return reativar_documento(db, doc_id=doc_id)
