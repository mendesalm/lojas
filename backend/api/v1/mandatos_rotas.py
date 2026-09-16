# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Primeira rota de escrita autenticada da API própria do módulo Lojas
(2026-09-14) — resolve a dívida técnica registrada em
`claude/decisao-transmissao-cargo-vm.md`: hoje o CoReVM escreve diretamente
em `lojas_db` para empossar um novo Venerável Mestre (posse normal e
transmissão emergencial); esta rota é o destino futuro dessa escrita, já
publicada e testável de forma independente, sem tocar no que já funciona no
CoReVM.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import exigir_vm_ou_webmaster_da_loja
from database import get_db
from schemas.mandato_schema import MandatoResponse, ObreiroPosseCargoPayload, VmAtualResponse
from services.mandatos_service import empossar_obreiro_e_cargo, obter_vm_atual

router = APIRouter(prefix="/lojas/{loja_id}", tags=["Mandatos (posse de cargo)"])


@router.get(
    "/mandatos/vm-atual",
    response_model=VmAtualResponse,
    summary="Consulta o Venerável Mestre em exercício da Loja",
)
def consultar_vm_atual(loja_id: int, db: Session = Depends(get_db)):
    vm = obter_vm_atual(db, loja_id)
    if not vm:
        return VmAtualResponse(loja_id=loja_id, tem_vm_ativo=False)
    return VmAtualResponse(loja_id=loja_id, tem_vm_ativo=True, **vm)


@router.post(
    "/mandatos",
    response_model=MandatoResponse,
    summary="Empossa um Obreiro em um cargo da Loja (ex.: Venerável Mestre)",
    description=(
        "Localiza o Obreiro pelo CIM (cria se não existir) e, quando "
        "cargo_id corresponde a Venerável Mestre (1, convenção de "
        "lojas_db), encerra o mandato de VM ativo da Loja — marcando o "
        "titular anterior com o grau tradicional 'Mestre Instalado' — e "
        "abre o novo mandato. Autorização: Venerável Mestre em exercício da "
        "própria Loja, Webmaster da Loja, ou SuperAdmin."
    ),
)
def empossar_cargo(
    loja_id: int,
    payload: ObreiroPosseCargoPayload,
    db: Session = Depends(get_db),
    _autorizacao=Depends(exigir_vm_ou_webmaster_da_loja),
):
    resultado = empossar_obreiro_e_cargo(
        db,
        loja_id=loja_id,
        cim=payload.cim,
        nome_completo=payload.nome_completo,
        email=payload.email,
        cpf=payload.cpf,
        telefone=payload.telefone,
        cargo_id=payload.cargo_id,
        data_inicio_mandato=payload.data_inicio_mandato,
    )
    return MandatoResponse(**resultado)
