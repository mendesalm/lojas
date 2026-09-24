# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Gestão de Prévias e Editais de Admissão (Iniciação, Filiação e Regularização).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    get_usuario_e_obreiro,
    exigir_membro_ou_diretoria_da_loja,
    exigir_chancelaria_ou_vm_da_loja,
    UsuarioEsigma,
)
from core.resolver_loja import resolver_loja_id_ou_404
from models.models import Obreiro
from schemas.admissao_schema import (
    PreviaAdmissaoCreate,
    PreviaAdmissaoUpdate,
    PreviaAdmissaoResponse,
)
from services.admissoes_service import (
    listar_admissoes_loja,
    criar_previa_admissao,
    atualizar_previa_admissao,
    deletar_previa_admissao,
    listar_admissoes_regionais,
)

router_admissoes_global = APIRouter(tags=["Admissões (Global/Regional)"])
router = APIRouter(prefix="/lojas/{loja_id}/admissoes", tags=["Admissões da Loja"])


# --- ROTA GLOBAL DE ADMISSÕES REGIONAIS ---
@router_admissoes_global.get(
    "/admissoes/regionais",
    response_model=List[PreviaAdmissaoResponse],
    summary="Mural Regional de Prévias de Admissão",
    description="Retorna pedidos de admissão publicados pelas oficinas para o Conselho Regional (CoReVM).",
)
def obter_admissoes_regionais(
    lojas_ids: Optional[str] = Query(None, description="Lista de IDs de lojas separados por vírgula"),
    tipo: Optional[str] = Query(None, description="Filtro por tipo (INICIACAO, FILIACAO, REGULARIZACAO)"),
    status: Optional[str] = Query(None, description="Filtro por status (EM_ANDAMENTO, AVERIGUADO, CONCLUIDO)"),
    db: Session = Depends(get_db),
):
    ids_list = None
    if lojas_ids:
        ids_list = [int(i.strip()) for i in lojas_ids.split(",") if i.strip().isdigit()]
    return listar_admissoes_regionais(db, lojas_ids=ids_list, tipo=tipo, status_filtro=status)


# --- ROTAS ESPECÍFICAS DA LOJA ---
@router.get(
    "",
    response_model=List[PreviaAdmissaoResponse],
    summary="Listar Prévias de Admissão da Loja",
    description="Retorna os editais e pedidos de admissão protocolados na oficina.",
)
def listar_admissoes(
    loja_id: str,
    tipo: Optional[str] = Query(None, description="Filtro por tipo"),
    status: Optional[str] = Query(None, description="Filtro por status"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_admissoes_loja(db, loja_id=loja_id_int, status_filtro=status, tipo=tipo)


@router.post(
    "",
    response_model=PreviaAdmissaoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publicar Prévia de Admissão",
    description="Permite à Chancelaria, Secretaria ou Venerável Mestre protocolar edital de candidato.",
)
def publicar_admissao(
    loja_id: str,
    payload: PreviaAdmissaoCreate,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    usuario, _ = contexto
    if usuario and not payload.autor_id:
        payload.autor_id = usuario.email or usuario.user_id

    return criar_previa_admissao(db, payload)


@router.put(
    "/{admissao_id}",
    response_model=PreviaAdmissaoResponse,
    summary="Atualizar Prévia de Admissão",
    description="Atualiza status de averiguação ou retifica dados do edital.",
)
def editar_admissao(
    loja_id: str,
    admissao_id: int,
    payload: PreviaAdmissaoUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja),
):
    resolver_loja_id_ou_404(db, loja_id)
    return atualizar_previa_admissao(db, admissao_id=admissao_id, payload=payload)


@router.delete(
    "/{admissao_id}",
    summary="Remover Prévia de Admissão",
    description="Exclui o edital da lista da oficina.",
)
def excluir_admissao(
    loja_id: str,
    admissao_id: int,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja),
):
    resolver_loja_id_ou_404(db, loja_id)
    return deletar_previa_admissao(db, admissao_id=admissao_id)
