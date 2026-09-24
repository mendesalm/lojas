# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Administração Institucional da Loja:
Dados Cadastrais, Buscas Globais, Gestão de Comissões e Mural de Avisos da Secretaria.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    exigir_membro_ou_diretoria_da_loja,
    exigir_secretaria_ou_vm_da_loja,
    exigir_vm_ou_webmaster_da_loja,
    exigir_permissao_gestao_loja,
)
from core.resolver_loja import resolver_loja_id_ou_404
from schemas.comissao_loja_schema import (
    LojaDadosResponse,
    LojaDadosUpdate,
    ComissaoCreate,
    ComissaoResponse,
    AvisoCreate,
    AvisoResponse,
    LojaBuscaItem,
    LojaCreateOnTheFlyPayload,
    LojaMultiplasBuscaPayload,
)
from services.loja_admin_service import (
    obter_loja_por_id,
    atualizar_dados_loja,
    listar_comissoes_loja,
    criar_comissao,
    listar_avisos_loja,
    criar_aviso_loja,
    buscar_lojas_termo,
    buscar_lojas_por_ids,
    cadastrar_loja_on_the_fly,
)

# Router para buscas e operações em coleção/global
router_lojas_global = APIRouter(prefix="/lojas", tags=["Lojas (Global e Busca)"])

# Router para alçada de uma oficina específica
router = APIRouter(prefix="/lojas/{loja_id}", tags=["Administração da Loja"])


# --- ROTAS GLOBAIS DE LOJAS ---
@router_lojas_global.get(
    "/busca",
    response_model=List[LojaBuscaItem],
    summary="Busca Lojas por Termo",
    description="Busca lojas pelo nome, número ou cidade com potência associada.",
)
def buscar_lojas(
    q: str = Query(..., min_length=3, description="Termo de pesquisa (mínimo 3 caracteres)"),
    db: Session = Depends(get_db),
):
    return buscar_lojas_termo(db, termo=q)


@router_lojas_global.post(
    "/busca/multiplas",
    response_model=List[LojaBuscaItem],
    summary="Busca Múltiplas Lojas por IDs",
    description="Retorna detalhes de um lote de Lojas informado.",
)
def buscar_multiplas_lojas(
    payload: LojaMultiplasBuscaPayload,
    db: Session = Depends(get_db),
):
    return buscar_lojas_por_ids(db, ids=payload.ids)


@router_lojas_global.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra Loja On-the-Fly",
    description="Cria uma loja respeitando restrições de Potência e Obediência.",
)
def cadastrar_loja(
    payload: LojaCreateOnTheFlyPayload,
    db: Session = Depends(get_db),
):
    return cadastrar_loja_on_the_fly(db, payload=payload)


# --- ROTAS ESPECÍFICAS DA LOJA ---
@router.get(
    "",
    response_model=LojaDadosResponse,
    summary="Obter Dados Cadastrais da Loja",
    description="Retorna as informações institucionais, endereço, dia e horário das sessões e filiação."
)
def obter_dados(
    loja_id: str,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return obter_loja_por_id(db, loja_id=loja_id_int)


@router.put(
    "",
    response_model=LojaDadosResponse,
    summary="Atualizar Dados da Loja",
    description="Permite à Mesa Diretora Regional, Venerável Mestre, Secretário, Tesoureiro ou Webmaster atualizar dados cadastrais e horários da Loja."
)
def atualizar_dados_put(
    loja_id: str,
    payload: LojaDadosUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return atualizar_dados_loja(db, loja_id=loja_id_int, payload=payload)


@router.patch(
    "",
    response_model=LojaDadosResponse,
    summary="Atualização Parcial de Dados da Loja",
    description="Permite atualização incremental dos campos cadastrais e horários da Loja."
)
def atualizar_dados_patch(
    loja_id: str,
    payload: LojaDadosUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return atualizar_dados_loja(db, loja_id=loja_id_int, payload=payload)


@router.get(
    "/comissoes",
    response_model=List[ComissaoResponse],
    summary="Listar Comissões da Loja",
    description="Retorna as comissões permanentes e temporárias com seus respectivos presidentes e membros."
)
def listar_comissoes(
    loja_id: str,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_comissoes_loja(db, loja_id=loja_id_int)


@router.post(
    "/comissoes",
    response_model=ComissaoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Comissão",
    description="Cria uma comissão na Loja e designa os irmãos que a compõem."
)
def cadastrar_comissao(
    loja_id: str,
    payload: ComissaoCreate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    return criar_comissao(db, payload)


@router.get(
    "/avisos",
    response_model=List[AvisoResponse],
    summary="Mural de Avisos da Loja",
    description="Retorna comunicados e notícias oficiais publicadas pela Secretaria para o quadro."
)
def obter_avisos(
    loja_id: str,
    apenas_ativos: bool = Query(True, description="Filtrar apenas avisos não expirados"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_avisos_loja(db, loja_id=loja_id_int, apenas_ativos=apenas_ativos)


@router.post(
    "/avisos",
    response_model=AvisoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publicar Aviso",
    description="Permite à Secretaria ou Venerável Mestre publicar um novo comunicado no mural."
)
def publicar_aviso(
    loja_id: str,
    payload: AvisoCreate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    return criar_aviso_loja(db, payload)
