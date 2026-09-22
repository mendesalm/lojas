# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Administração Institucional da Loja:
Dados Cadastrais, Gestão de Comissões e Mural de Avisos da Secretaria.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    exigir_membro_ou_diretoria_da_loja,
    exigir_secretaria_ou_vm_da_loja,
    exigir_vm_ou_webmaster_da_loja
)
from schemas.comissao_loja_schema import (
    LojaDadosResponse,
    LojaDadosUpdate,
    ComissaoCreate,
    ComissaoResponse,
    AvisoCreate,
    AvisoResponse
)
from services.loja_admin_service import (
    obter_loja_por_id,
    atualizar_dados_loja,
    listar_comissoes_loja,
    criar_comissao,
    listar_avisos_loja,
    criar_aviso_loja
)

router = APIRouter(prefix="/lojas/{loja_id}", tags=["Administração da Loja"])


from core.resolver_loja import resolver_loja_id_ou_404

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
    description="Permite ao Venerável Mestre ou Webmaster atualizar endereços e horários de reuniões."
)
def atualizar_dados(
    loja_id: str,
    payload: LojaDadosUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_vm_ou_webmaster_da_loja)
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
    status_code=201,
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
    status_code=201,
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
