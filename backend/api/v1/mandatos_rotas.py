# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rotas para Gestão de Mandatos, Posse de Cargos e Governança de Diretoria da Loja.
Permite transição de cargos (posse normal e transmissão emergencial), encerramento
de mandatos, histórico de Veneráveis Mestres e verificação de status em lote.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.dependencies import (
    get_db,
    exigir_membro_ou_diretoria_da_loja,
    exigir_permissao_gestao_loja,
)
from core.resolver_loja import resolver_loja_id_ou_404
from pydantic import BaseModel
from schemas.mandato_schema import (
    MandatoResponse,
    MandatoDetalheResponse,
    ObreiroPosseCargoPayload,
    VmAtualResponse,
    VmMandatoUpdatePayload,
    VmStatusLotePayload,
)
from services.mandatos_service import (
    empossar_obreiro_e_cargo,
    obter_vm_atual,
    atualizar_vm_ativo,
    encerrar_mandato_vm,
    encerrar_mandato_por_id,
    listar_mandatos_loja,
    verificar_status_vm_lote,
    obter_veneraveis_elegiveis_lote,
    listar_oficiais_elegiveis_loja,
    validar_oficial_elegivel_loja,
)

# Router para operações globais de status/lote
router_mandatos_global = APIRouter(tags=["Mandatos (Global)"])

# Router específico da Loja
router = APIRouter(prefix="/lojas/{loja_id}", tags=["Mandatos (posse e diretoria)"])


class VeneraveisElegiveisPayload(BaseModel):
    lojas_ids: List[int]


# --- ROTAS GLOBAIS DE MANDATOS / VM ---
@router_mandatos_global.post(
    "/mandatos/status_vm",
    summary="Verifica Status de Venerável Mestre em Lote",
    description="Retorna os nomes dos VMs cadastrados nas lojas solicitadas por lista de IDs.",
)
def checar_status_vm_lote(
    payload: VmStatusLotePayload,
    db: Session = Depends(get_db),
):
    return verificar_status_vm_lote(db, ids=payload.ids)


@router_mandatos_global.post(
    "/mandatos/veneraveis-elegiveis",
    summary="Lista Veneráveis Mestres elegíveis de um conjunto de lojas",
    description="Retorna os Veneráveis Mestres em exercício das lojas informadas.",
)
def consultar_veneraveis_elegiveis_lote(
    payload: VeneraveisElegiveisPayload,
    db: Session = Depends(get_db),
):
    return obter_veneraveis_elegiveis_lote(db, ids=payload.lojas_ids)



# --- ROTAS ESPECÍFICAS DA LOJA ---
@router.get(
    "/mandatos",
    response_model=List[MandatoDetalheResponse],
    summary="Listar Mandatos da Loja",
    description="Retorna os mandatos de cargos da loja com detalhes do obreiro e cargo associado.",
)
def listar_mandatos(
    loja_id: str,
    apenas_ativos: bool = Query(True, description="Filtrar apenas mandatos vigentes"),
    cargo_id: Optional[int] = Query(None, description="Filtrar por cargo específico"),
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_mandatos_loja(
        db, loja_id=loja_id_int, apenas_ativos=apenas_ativos, cargo_id=cargo_id
    )


@router.post(
    "/mandatos",
    response_model=MandatoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Empossa um Obreiro em um cargo da Loja (ex.: Venerável Mestre)",
    description=(
        "Localiza o Obreiro pelo CIM (cria se não existir) e, quando "
        "cargo_id corresponde a Venerável Mestre (1), encerra o mandato "
        "de VM ativo anterior — marcando o titular anterior com o grau tradicional "
        "'Mestre Instalado' — e abre o novo mandato. Autorização: Mesa Diretora Regional, "
        "Venerável Mestre em exercício, Secretário, Tesoureiro, Chanceler, Webmaster ou SuperAdmin."
    ),
)
def empossar_cargo(
    loja_id: str,
    payload: ObreiroPosseCargoPayload,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    resultado = empossar_obreiro_e_cargo(
        db,
        loja_id=loja_id_int,
        cim=payload.cim,
        nome_completo=payload.nome_completo,
        email=payload.email,
        cpf=payload.cpf,
        telefone=payload.telefone,
        cargo_id=payload.cargo_id,
        data_inicio_mandato=payload.data_inicio_mandato,
    )
    return MandatoResponse(**resultado)


@router.get(
    "/mandatos/vm-atual",
    response_model=VmAtualResponse,
    summary="Consulta o Venerável Mestre em exercício da Loja",
)
def consultar_vm_atual(loja_id: str, db: Session = Depends(get_db)):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    vm = obter_vm_atual(db, loja_id_int)
    if not vm:
        return VmAtualResponse(loja_id=loja_id_int, tem_vm_ativo=False)
    return VmAtualResponse(loja_id=loja_id_int, tem_vm_ativo=True, **vm)


@router.get(
    "/mandatos/vm",
    response_model=VmAtualResponse,
    summary="Detalhes do Venerável Mestre Ativo (Compatibilidade CoReVM)",
)
def obter_vm_compat(loja_id: str, db: Session = Depends(get_db)):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    vm = obter_vm_atual(db, loja_id_int)
    if not vm:
        return VmAtualResponse(loja_id=loja_id_int, tem_vm_ativo=False)
    return VmAtualResponse(loja_id=loja_id_int, tem_vm_ativo=True, **vm)


@router.put(
    "/mandatos/vm",
    summary="Atualiza Dados do VM ou Mandato Ativo",
    description="Permite atualizar data de início do mandato ou dados cadastrais do Venerável Mestre.",
)
def atualizar_vm(
    loja_id: str,
    payload: VmMandatoUpdatePayload,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return atualizar_vm_ativo(db, loja_id=loja_id_int, payload=payload)


@router.delete(
    "/mandatos/vm",
    summary="Encerra o Mandato do Venerável Mestre Ativo",
    description="Encerra o mandato de VM ativo na loja informada, definindo data_fim como hoje.",
)
def encerrar_vm(
    loja_id: str,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return encerrar_mandato_vm(db, loja_id=loja_id_int)


@router.get(
    "/mandatos/vm/historico",
    summary="Histórico de Mandatos de Veneráveis Mestres",
    description="Retorna o histórico cronológico de todos os mandatos de Venerável Mestre da oficina.",
)
def historico_vms(
    loja_id: str,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_membro_ou_diretoria_da_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return listar_mandatos_loja(
        db, loja_id=loja_id_int, apenas_ativos=False, cargo_id=1
    )


@router.delete(
    "/mandatos/{mandato_id}",
    summary="Encerra Mandato Específico por ID",
    description="Define data_fim como hoje para o mandato informado.",
)
def encerrar_mandato_especifico(
    loja_id: str,
    mandato_id: int,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_permissao_gestao_loja),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return encerrar_mandato_por_id(db, loja_id=loja_id_int, mandato_id=mandato_id)


@router.get(
    "/oficiais-elegiveis",
    summary="Lista Oficiais Elegíveis a Suplente/Operador e Mestres Instalados",
    description="Retorna ocupantes de cargos eletivos (2 a 7) e Mestres Instalados ativos na oficina.",
)
def obter_oficiais_elegiveis(
    loja_id: str,
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return {"oficiais": listar_oficiais_elegiveis_loja(db, loja_id=loja_id_int)}


@router.get(
    "/oficiais-elegiveis/validar/{identificador}",
    summary="Valida se um membro é Oficial Elegível ou Mestre Instalado",
    description="Checa se o CIM ou CPF informado atende aos critérios de elegibilidade para Suplente ou Operador Administrativo.",
)
def validar_oficial_elegibilidade(
    loja_id: str,
    identificador: str,
    db: Session = Depends(get_db),
):
    loja_id_int = resolver_loja_id_ou_404(db, loja_id)
    return validar_oficial_elegivel_loja(db, loja_id=loja_id_int, identificador=identificador)

