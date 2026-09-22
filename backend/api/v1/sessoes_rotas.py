# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Gestão de Sessões Maçônicas, Chamada, Check-in Inteligente e Visitantes.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    get_usuario_e_obreiro,
    exigir_membro_ou_diretoria_da_loja,
    exigir_secretaria_ou_vm_da_loja,
    exigir_chancelaria_ou_vm_da_loja,
    UsuarioEsigma
)
from models.models import Obreiro
from schemas.sessao_schema import (
    SessaoCreate,
    SessaoUpdate,
    SessaoResumo,
    SessaoResponse,
    PresencaItem,
    PresencaCheckInPayload,
    PresencaManualPayload,
    VisitanteCreate,
    VisitanteResponse
)
from services.sessoes_service import (
    listar_sessoes_loja,
    obter_sessao_ativa,
    obter_sessao_detalhe,
    criar_sessao,
    atualizar_sessao,
    registrar_presenca_sessao,
    listar_visitantes,
    cadastrar_visitante,
    obter_minhas_presencas
)

router = APIRouter(tags=["Sessões e Frequência"])


from core.resolver_loja import resolver_loja_id_ou_404

@router.get(
    "/lojas/{loja_id}/sessoes",
    response_model=List[SessaoResumo],
    summary="Listar Sessões da Loja",
    description="Retorna a relação de sessões maçônicas agendadas e realizadas pela oficina."
)
def listar_sessoes(
    loja_id: str,
    status: Optional[str] = Query(None, description="Filtro de status (AGENDADA, EM_ANDAMENTO, REALIZADA, ENCERRADA)"),
    ano: Optional[int] = Query(None, description="Filtrar por ano"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_sessoes_loja(db, loja_id=loja_id_int, status_filtro=status, ano=ano)


@router.get(
    "/lojas/{loja_id}/sessoes/ativa",
    response_model=Optional[SessaoResumo],
    summary="Obter Sessão Ativa",
    description="Identifica se há uma sessão em andamento ou agendada para a data de hoje para check-in imediato."
)
def buscar_sessao_ativa(
    loja_id: str,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return obter_sessao_ativa(db, loja_id=loja_id_int)


@router.get(
    "/lojas/{loja_id}/sessoes/{sessao_id}",
    response_model=SessaoResponse,
    summary="Detalhes da Sessão e Livro de Presença",
    description="Retorna pauta, oficiais do dia e a relação completa de obreiros e visitantes com presença registrada."
)
def detalhes_sessao(
    loja_id: str,
    sessao_id: int,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return obter_sessao_detalhe(db, sessao_id=sessao_id)


@router.post(
    "/lojas/{loja_id}/sessoes",
    response_model=SessaoResponse,
    status_code=201,
    summary="Agendar Nova Sessão",
    description="Permite à Secretaria, Chancelaria ou Venerável Mestre agendar uma nova sessão maçônica."
)
def agendar_sessao(
    loja_id: str,
    payload: SessaoCreate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    payload.loja_id = loja_id_int
    return criar_sessao(db, payload)


@router.put(
    "/lojas/{loja_id}/sessoes/{sessao_id}",
    response_model=SessaoResponse,
    summary="Atualizar Sessão",
    description="Atualiza status (iniciar/encerrar), pauta ou horários da sessão."
)
def atualizar_dados_sessao(
    loja_id: str,
    sessao_id: int,
    payload: SessaoUpdate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return atualizar_sessao(db, sessao_id=sessao_id, payload=payload)


@router.post(
    "/lojas/{loja_id}/sessoes/{sessao_id}/check-in",
    response_model=PresencaItem,
    summary="Check-in Presencial do Obreiro",
    description="Registra a presença do obreiro autenticado na sessão por leitura de QR Code ou validação de geofence."
)
def check_in_obreiro(
    loja_id: str,
    sessao_id: int,
    payload: PresencaCheckInPayload,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    usuario, obreiro = contexto
    alvo_id = payload.obreiro_id or (obreiro.id if obreiro else None)
    if not alvo_id:
        raise HTTPException(status_code=400, detail="Identificador do Obreiro não determinado para check-in.")

    return registrar_presenca_sessao(
        db,
        sessao_id=sessao_id,
        obreiro_id=alvo_id,
        metodo=payload.metodo or "QR_CODE",
        lat=payload.latitude,
        lon=payload.longitude
    )


@router.post(
    "/lojas/{loja_id}/sessoes/{sessao_id}/presenca-manual",
    response_model=PresencaItem,
    summary="Lançamento Manual de Presença / Justificativa",
    description="Permite ao Chanceler registrar a presença ou falta justificada de um irmão ou visitante no livro de chamada."
)
def presenca_manual(
    loja_id: str,
    sessao_id: int,
    payload: PresencaManualPayload,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return registrar_presenca_sessao(
        db,
        sessao_id=sessao_id,
        obreiro_id=payload.obreiro_id,
        visitante_id=payload.visitante_id,
        status_presenca=payload.status_presenca,
        metodo="MANUAL"
    )


@router.get(
    "/lojas/{loja_id}/visitantes",
    response_model=List[VisitanteResponse],
    summary="Listar Visitantes",
    description="Retorna os irmãos visitantes de outras oficinas registrados no histórico da loja."
)
def obter_visitantes(
    loja_id: str,
    busca: Optional[str] = Query(None, description="Busca por Nome ou CIM"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_visitantes(db, busca=busca)


@router.post(
    "/lojas/{loja_id}/visitantes",
    response_model=VisitanteResponse,
    status_code=201,
    summary="Cadastrar Visitante",
    description="Registra um novo visitante no cadastro da oficina para futura chamada em livro de presenças."
)
def registrar_novo_visitante(
    loja_id: str,
    payload: VisitanteCreate,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_chancelaria_ou_vm_da_loja)
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return cadastrar_visitante(db, payload)


@router.get(
    "/obreiros/minhas-presencas",
    summary="Minhas Presenças (Autoatendimento)",
    description="Retorna o histórico pessoal de frequência do obreiro logado a todas as sessões."
)
def minhas_presencas(
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db)
):
    usuario, obreiro = contexto
    if not obreiro:
        raise HTTPException(status_code=404, detail="Perfil de Obreiro não localizado.")
    return obter_minhas_presencas(db, obreiro_id=obreiro.id)
