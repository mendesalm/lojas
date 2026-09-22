# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Gestão de Obreiros e Quadro de Membros da Loja Maçônica.
Oferece busca paginada com filtros, visualização detalhada da ficha, aniversariantes do mês,
cadastro com anti-duplicidade e consulta de autoatendimento ("Meu Cadastro").
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    get_usuario_e_obreiro,
    exigir_membro_ou_diretoria_da_loja,
    exigir_secretaria_ou_vm_da_loja,
    UsuarioEsigma
)
from models.models import Obreiro
from schemas.obreiro_schema import (
    ObreiroCreate,
    ObreiroUpdate,
    ObreiroResumo,
    ObreiroResponse,
    AniversariantesResponse
)
from services.obreiros_service import (
    listar_obreiros_loja,
    obter_obreiro_por_id,
    criar_obreiro,
    atualizar_obreiro,
    listar_aniversariantes_mes
)

router = APIRouter(tags=["Quadro de Obreiros"])


from core.resolver_loja import resolver_loja_id_ou_404

@router.get(
    "/lojas/{loja_id}/obreiros",
    response_model=List[ObreiroResumo],
    summary="Listar Quadro de Obreiros da Loja",
    description="Retorna a lista resumida de membros ativos da Loja com filtros de busca textual, grau e status."
)
def listar_quadro(
    loja_id: str,
    busca: Optional[str] = Query(None, description="Busca por Nome, CIM, CPF ou E-mail"),
    grau: Optional[str] = Query(None, description="Filtro por Grau (Aprendiz, Companheiro, Mestre, Mestre Instalado)"),
    status: Optional[str] = Query(None, description="Filtro por status (Ativo, Inativo)"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_obreiros_loja(
        db,
        loja_id=loja_id_int,
        busca=busca,
        grau=grau,
        status_filtro=status
    )


@router.get(
    "/lojas/{loja_id}/aniversariantes",
    response_model=AniversariantesResponse,
    summary="Listar Aniversariantes do Mês",
    description="Retorna os membros que fazem aniversário no mês selecionado (ou mês corrente), compatível com a API do GOB."
)
def obter_aniversariantes(
    loja_id: str,
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mês do aniversário (1 a 12)"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_aniversariantes_mes(db, loja_id=loja_id_int, mes=mes)


@router.get(
    "/lojas/{loja_id}/obreiros/{obreiro_id}",
    response_model=ObreiroResponse,
    summary="Obter Ficha Cadastral do Obreiro",
    description="Retorna a ficha completa do Obreiro com dados civis, maçônicos, familiares, condecorações e mandatos."
)
def obter_ficha_obreiro(
    loja_id: str,
    obreiro_id: int,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return obter_obreiro_por_id(db, obreiro_id=obreiro_id, loja_id=loja_id_int)


@router.post(
    "/lojas/{loja_id}/obreiros",
    response_model=ObreiroResponse,
    status_code=201,
    summary="Cadastrar Novo Obreiro na Loja",
    description="Registra um novo obreiro e estabelece seu vínculo à Loja, aplicando validação contra duplicidade de CPF, CIM e E-mail."
)
def cadastrar_novo_obreiro(
    loja_id: str,
    payload: ObreiroCreate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    return criar_obreiro(db, payload)


@router.put(
    "/lojas/{loja_id}/obreiros/{obreiro_id}",
    response_model=ObreiroResponse,
    summary="Atualizar Dados do Obreiro",
    description="Permite à Secretaria ou Venerável Mestre atualizar os dados cadastrais do membro."
)
def atualizar_dados_obreiro(
    loja_id: str,
    obreiro_id: int,
    payload: ObreiroUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_secretaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return atualizar_obreiro(db, obreiro_id=obreiro_id, payload=payload)


@router.get(
    "/obreiros/meu-perfil",
    response_model=ObreiroResponse,
    summary="Meu Cadastro (Autoatendimento)",
    description="Retorna a ficha cadastral do próprio obreiro autenticado via token JWT do e-Sigma."
)
def meu_perfil(
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db)
):
    usuario, obreiro = contexto
    if not obreiro:
        raise HTTPException(
            status_code=404,
            detail="Não foi localizado nenhum cadastro de Obreiro associado à sua conta do e-Sigma."
        )
    return obter_obreiro_por_id(db, obreiro_id=obreiro.id)


@router.get(
    "/obreiros/minhas-lojas",
    summary="Minhas Lojas Associadas",
    description="Retorna todas as Lojas às quais o obreiro autenticado está associado (detectando pluri-filiação/duplicidade)."
)
@router.get(
    "/minhas-lojas",
    summary="Minhas Lojas Associadas (Alias)",
    description="Retorna todas as Lojas às quais o obreiro autenticado está associado."
)
def minhas_lojas(
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db)
):
    from models import models as db_models
    usuario, obreiro = contexto
    if not obreiro:
        if usuario.is_super_admin:
            todas = db.query(db_models.Loja).filter(db_models.Loja.ativo.is_(True)).all()
            return [
                {
                    "id": l.id,
                    "codigo_loja": l.codigo_loja,
                    "nome_loja": l.nome_loja,
                    "numero_loja": l.numero_loja,
                    "titulo_loja": l.titulo_loja or "ARLS",
                    "rito": l.rito.value if hasattr(l.rito, "value") else str(l.rito or ""),
                    "filiacao": l.filiacao_formatada,
                    "cargo": "SuperAdmin",
                    "status": "Ativo",
                }
                for l in todas
            ]
        raise HTTPException(
            status_code=404,
            detail="Não foi localizado nenhum cadastro de Obreiro associado à sua conta do e-Sigma."
        )

    associacoes = (
        db.query(db_models.ObreiroLojaAssociacao)
        .filter(
            db_models.ObreiroLojaAssociacao.obreiro_id == obreiro.id,
            db_models.ObreiroLojaAssociacao.status == db_models.StatusObreiroEnum.ATIVO
        )
        .all()
    )

    resultado = []
    for assoc in associacoes:
        l = assoc.loja
        if not l:
            continue
        resultado.append({
            "id": l.id,
            "codigo_loja": l.codigo_loja,
            "nome_loja": l.nome_loja,
            "numero_loja": l.numero_loja,
            "titulo_loja": l.titulo_loja or "ARLS",
            "rito": l.rito.value if hasattr(l.rito, "value") else str(l.rito or ""),
            "filiacao": l.filiacao_formatada,
            "cargo": "Obreiro",
            "classe": assoc.classe_obreiro.value if hasattr(assoc.classe_obreiro, "value") else str(assoc.classe_obreiro),
            "status": assoc.status.value if hasattr(assoc.status, "value") else str(assoc.status),
        })

    return resultado
