# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de posse de cargo (mandato) e gestão de diretoria da Loja.
Responsável pelas regras de ouro de transição de cargos (Venerável Mestre,
Secretário, Tesoureiro, Chanceler, etc.), encerramento de mandatos, histórico,
marcação tradicional de 'Mestre Instalado' para ex-VMs e consultas em lote.
"""
from datetime import date
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from core.constants import CARGO_ID_VENERAVEL_MESTRE
from models.models import (
    Cargo,
    GrauEnum,
    Loja,
    Mandato,
    Obreiro,
    ObreiroLojaAssociacao,
    StatusObreiroEnum
)
from schemas.mandato_schema import (
    MandatoDetalheResponse,
    VmMandatoUpdatePayload
)


def _email_placeholder(cim: str) -> str:
    return f"{cim}@pendente.cadastro.lojas"


def empossar_obreiro_e_cargo(
    db: Session,
    loja_id: int,
    cim: str,
    nome_completo: str,
    email: Optional[str],
    cpf: Optional[str],
    telefone: Optional[str],
    cargo_id: int,
    data_inicio_mandato: Optional[date],
) -> dict:
    """Localiza (ou cria) o Obreiro pelo CIM, garante o vínculo ativo dele
    com a Loja e, quando `cargo_id == CARGO_ID_VENERAVEL_MESTRE`, encerra o
    mandato de VM ativo da Loja (se houver) — marcando o titular anterior
    com o grau tradicional 'Mestre Instalado' — e abre o novo mandato."""
    loja = db.query(Loja).filter(Loja.id == loja_id).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")

    data_efetiva = data_inicio_mandato or date.today()

    obreiro = db.query(Obreiro).filter(Obreiro.cim == cim).first()
    titular_anterior_marcado = False

    if not obreiro:
        obreiro = Obreiro(
            cim=cim,
            nome_completo=nome_completo,
            email=email or _email_placeholder(cim),
            cpf=cpf,
            telefone=telefone,
            status="Ativo",
        )
        db.add(obreiro)
        db.flush()
    else:
        if nome_completo:
            obreiro.nome_completo = nome_completo
        if email:
            obreiro.email = email
        if cpf:
            obreiro.cpf = cpf
        if telefone:
            obreiro.telefone = telefone

    associacao = (
        db.query(ObreiroLojaAssociacao)
        .filter(ObreiroLojaAssociacao.obreiro_id == obreiro.id, ObreiroLojaAssociacao.loja_id == loja_id)
        .first()
    )
    if not associacao:
        db.add(
            ObreiroLojaAssociacao(
                obreiro_id=obreiro.id,
                loja_id=loja_id,
                status=StatusObreiroEnum.ATIVO,
                data_inicio=data_efetiva,
            )
        )

    resultado = {
        "obreiro_id": obreiro.id,
        "obreiro_cim": obreiro.cim,
        "obreiro_nome": obreiro.nome_completo,
        "cargo_id": cargo_id,
        "loja_id": loja_id,
        "data_inicio": data_efetiva,
        "data_fim": None,
        "titular_anterior_marcado_mestre_instalado": False,
    }

    if cargo_id == CARGO_ID_VENERAVEL_MESTRE:
        mandato_anterior = (
            db.query(Mandato)
            .filter(
                Mandato.loja_id == loja_id,
                Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
                Mandato.data_fim.is_(None)
            )
            .first()
        )
        if mandato_anterior:
            mandato_anterior.data_fim = data_efetiva
            db.flush()
            if mandato_anterior.obreiro_id != obreiro.id:
                obreiro_anterior = db.query(Obreiro).filter(Obreiro.id == mandato_anterior.obreiro_id).first()
                if obreiro_anterior:
                    obreiro_anterior.grau = GrauEnum.MESTRE_INSTALADO
                    obreiro_anterior.data_instalacao = data_efetiva
                    titular_anterior_marcado = True

    novo_mandato = Mandato(
        obreiro_id=obreiro.id,
        cargo_id=cargo_id,
        loja_id=loja_id,
        data_inicio=data_efetiva,
        data_fim=None,
    )
    db.add(novo_mandato)
    db.commit()
    db.refresh(novo_mandato)

    resultado["mandato_id"] = novo_mandato.id
    resultado["titular_anterior_marcado_mestre_instalado"] = titular_anterior_marcado
    return resultado


def obter_vm_atual(db: Session, loja_id: int) -> Optional[dict]:
    """Mandato de Venerável Mestre atualmente ativo na Loja, se houver."""
    resultado = (
        db.query(Mandato, Obreiro)
        .join(Obreiro, Mandato.obreiro_id == Obreiro.id)
        .filter(
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            or_(Mandato.data_fim.is_(None), Mandato.data_fim >= date.today())
        )
        .first()
    )
    if not resultado:
        return None
    mandato, obreiro = resultado
    return {
        "mandato_id": mandato.id,
        "obreiro_id": obreiro.id,
        "nome_completo": obreiro.nome_completo,
        "cim": obreiro.cim,
        "cpf": obreiro.cpf,
        "email": obreiro.email,
        "telefone": obreiro.telefone,
        "data_inicio_mandato": mandato.data_inicio,
    }


def atualizar_vm_ativo(db: Session, loja_id: int, payload: VmMandatoUpdatePayload) -> dict:
    """Atualiza a data de início do mandato do VM ativo e/ou seus dados cadastrais."""
    mandato = (
        db.query(Mandato)
        .filter(
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            Mandato.data_fim.is_(None)
        )
        .first()
    )
    if not mandato:
        raise HTTPException(status_code=404, detail="Nenhum Venerável Mestre ativo encontrado nesta loja.")

    if payload.data_inicio is not None:
        mandato.data_inicio = payload.data_inicio

    obreiro = db.query(Obreiro).filter(Obreiro.id == mandato.obreiro_id).first()
    if obreiro:
        if payload.nome_completo is not None:
            obreiro.nome_completo = payload.nome_completo
        if payload.email is not None:
            obreiro.email = payload.email
        if payload.cpf is not None:
            obreiro.cpf = payload.cpf
        if payload.telefone is not None:
            obreiro.telefone = payload.telefone

    db.commit()
    return {
        "status": "success",
        "message": "Dados do Venerável Mestre atualizados com sucesso.",
        "loja_id": loja_id,
    }


def encerrar_mandato_vm(db: Session, loja_id: int) -> dict:
    """Encerra o mandato do Venerável Mestre ativo na loja (define data_fim como hoje)."""
    mandatos = (
        db.query(Mandato)
        .filter(
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            Mandato.data_fim.is_(None),
        )
        .all()
    )
    if not mandatos:
        raise HTTPException(status_code=404, detail="Nenhum mandato de Venerável Mestre ativo encontrado nesta loja.")

    hoje = date.today()
    for m in mandatos:
        m.data_fim = hoje

    db.commit()
    return {"status": "success", "message": "Mandato de Venerável Mestre encerrado com sucesso."}


def encerrar_mandato_por_id(db: Session, loja_id: int, mandato_id: int) -> dict:
    """Encerra um mandato específico pelo seu ID na loja informada."""
    mandato = (
        db.query(Mandato)
        .filter(Mandato.id == mandato_id, Mandato.loja_id == loja_id)
        .first()
    )
    if not mandato:
        raise HTTPException(status_code=404, detail="Mandato não encontrado.")

    mandato.data_fim = date.today()
    db.commit()
    return {"status": "success", "message": "Mandato encerrado com sucesso."}


def listar_mandatos_loja(
    db: Session,
    loja_id: int,
    apenas_ativos: bool = True,
    cargo_id: Optional[int] = None,
) -> List[MandatoDetalheResponse]:
    """Lista mandatos da loja com filtros e informações agregadas do Obreiro e Cargo."""
    query = (
        db.query(Mandato)
        .options(joinedload(Mandato.obreiro), joinedload(Mandato.cargo))
        .filter(Mandato.loja_id == loja_id)
    )

    hoje = date.today()
    if apenas_ativos:
        query = query.filter(or_(Mandato.data_fim.is_(None), Mandato.data_fim >= hoje))

    if cargo_id is not None:
        query = query.filter(Mandato.cargo_id == cargo_id)

    mandatos = query.order_by(Mandato.data_inicio.desc().nullslast(), Mandato.id.desc()).all()

    lista = []
    for m in mandatos:
        ativo = m.data_fim is None or m.data_fim >= hoje
        cargo_nome = m.cargo.nome if m.cargo else f"Cargo {m.cargo_id}"
        obr_nome = m.obreiro.nome_completo if m.obreiro else None
        obr_cim = m.obreiro.cim if m.obreiro else None
        obr_cpf = m.obreiro.cpf if m.obreiro else None
        obr_email = m.obreiro.email if m.obreiro else None
        obr_tel = m.obreiro.telefone if m.obreiro else None

        lista.append(
            MandatoDetalheResponse(
                mandato_id=m.id,
                obreiro_id=m.obreiro_id,
                cargo_id=m.cargo_id,
                cargo_nome=cargo_nome,
                loja_id=m.loja_id,
                data_inicio=m.data_inicio,
                data_fim=m.data_fim,
                ativo=ativo,
                obreiro_nome=obr_nome,
                obreiro_cim=obr_cim,
                cpf=obr_cpf,
                email=obr_email,
                telefone=obr_tel,
            )
        )
    return lista


def verificar_status_vm_lote(db: Session, ids: List[int]) -> dict[int, Optional[str]]:
    """Verifica e retorna o nome do Venerável Mestre ativo para um lote de IDs de Lojas."""
    if not ids:
        return {}

    hoje = date.today()
    resultados = (
        db.query(Mandato.loja_id, Obreiro.nome_completo)
        .join(Obreiro, Mandato.obreiro_id == Obreiro.id)
        .filter(
            Mandato.loja_id.in_(ids),
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            or_(Mandato.data_fim.is_(None), Mandato.data_fim >= hoje),
        )
        .all()
    )

    lojas_com_vm = {row.loja_id: row.nome_completo for row in resultados}
    return {loja_id: lojas_com_vm.get(loja_id) for loja_id in ids}


def obter_veneraveis_elegiveis_lote(db: Session, ids: List[int]) -> List[dict]:
    """Retorna os Veneráveis Mestres em exercício das lojas informadas."""
    if not ids:
        return []

    hoje = date.today()
    from models.models import Loja
    mandatos = (
        db.query(Mandato, Obreiro, Loja)
        .join(Obreiro, Mandato.obreiro_id == Obreiro.id)
        .join(Loja, Mandato.loja_id == Loja.id)
        .filter(
            Mandato.loja_id.in_(ids),
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            or_(Mandato.data_fim.is_(None), Mandato.data_fim >= hoje),
        )
        .all()
    )

    return [
        {
            "usuario_id": obreiro.cim,
            "nome_completo": obreiro.nome_completo,
            "loja_id": str(loja.id),
            "loja_nome": loja.nome_loja,
            "loja_numero": str(loja.numero_loja) if loja.numero_loja is not None else None,
        }
        for mandato, obreiro, loja in mandatos
    ]


MAPA_CARGOS_ELEGIVEIS_SUPLENCIA = {
    2: "1º Vigilante",
    3: "2º Vigilante",
    4: "Orador",
    5: "Secretário",
    6: "Tesoureiro",
    7: "Chanceler",
}


def listar_oficiais_elegiveis_loja(db: Session, loja_id: int) -> List[dict]:
    """
    Retorna os ocupantes ativos dos 6 cargos eletivos da Loja elegíveis à cadeira
    de Suplente do Conselho e Operador Administrativo (cargos 2 a 7) e Mestres Instalados ativos.
    """
    hoje = date.today()
    cargos_ids = list(MAPA_CARGOS_ELEGIVEIS_SUPLENCIA.keys())

    mandatos = (
        db.query(Mandato, Obreiro)
        .join(Obreiro, Mandato.obreiro_id == Obreiro.id)
        .filter(
            Mandato.loja_id == loja_id,
            Mandato.cargo_id.in_(cargos_ids),
            or_(Mandato.data_fim.is_(None), Mandato.data_fim >= hoje),
        )
        .all()
    )

    resultado = [
        {
            "usuario_id": obreiro.cim,
            "nome_completo": obreiro.nome_completo,
            "email": obreiro.email,
            "cargo_id": mandato.cargo_id,
            "cargo": MAPA_CARGOS_ELEGIVEIS_SUPLENCIA.get(mandato.cargo_id, f"Cargo {mandato.cargo_id}"),
        }
        for mandato, obreiro in mandatos
    ]

    # Mestres Instalados ativos na Loja
    from models.models import ObreiroLojaAssociacao, GrauEnum
    mestres_instalados = (
        db.query(Obreiro)
        .join(ObreiroLojaAssociacao, ObreiroLojaAssociacao.obreiro_id == Obreiro.id)
        .filter(
            ObreiroLojaAssociacao.loja_id == loja_id,
            ObreiroLojaAssociacao.status == "Ativo",
            Obreiro.grau == GrauEnum.MESTRE_INSTALADO,
        )
        .all()
    )

    cims_existentes = {r["usuario_id"] for r in resultado}
    for mi in mestres_instalados:
        if mi.cim not in cims_existentes:
            resultado.append({
                "usuario_id": mi.cim,
                "nome_completo": mi.nome_completo,
                "email": mi.email,
                "cargo_id": 0,
                "cargo": "Mestre Instalado",
            })
            cims_existentes.add(mi.cim)

    resultado.sort(key=lambda o: o["cargo_id"])
    return resultado


def validar_oficial_elegivel_loja(db: Session, loja_id: int, identificador: str) -> dict:
    """Verifica se um identificador (CIM ou CPF) corresponde a oficial elegível ou Mestre Instalado da loja."""
    hoje = date.today()
    cargos_ids = list(MAPA_CARGOS_ELEGIVEIS_SUPLENCIA.keys())

    obreiro = db.query(Obreiro).filter(
        or_(Obreiro.cim == identificador, Obreiro.cpf == identificador)
    ).first()

    if not obreiro:
        return {"valido": False, "motivo": "Oficial não encontrado no cadastro.", "obreiro": None}

    # Verifica se tem mandato ativo em cargo 2..7
    mandato = (
        db.query(Mandato)
        .filter(
            Mandato.obreiro_id == obreiro.id,
            Mandato.loja_id == loja_id,
            Mandato.cargo_id.in_(cargos_ids),
            or_(Mandato.data_fim.is_(None), Mandato.data_fim >= hoje),
        )
        .first()
    )

    if mandato:
        return {
            "valido": True,
            "motivo": "Mandato ativo elegível",
            "obreiro": {
                "id": obreiro.id,
                "cim": obreiro.cim,
                "cpf": obreiro.cpf,
                "nome_completo": obreiro.nome_completo,
                "email": obreiro.email,
                "cargo_id": mandato.cargo_id,
            }
        }

    # Verifica se é Mestre Instalado com associação ativa na loja
    from models.models import ObreiroLojaAssociacao, GrauEnum
    assoc = (
        db.query(ObreiroLojaAssociacao)
        .filter(
            ObreiroLojaAssociacao.obreiro_id == obreiro.id,
            ObreiroLojaAssociacao.loja_id == loja_id,
            ObreiroLojaAssociacao.status == "Ativo",
        )
        .first()
    )

    if assoc and obreiro.grau == GrauEnum.MESTRE_INSTALADO:
        return {
            "valido": True,
            "motivo": "Mestre Instalado com vínculo ativo",
            "obreiro": {
                "id": obreiro.id,
                "cim": obreiro.cim,
                "cpf": obreiro.cpf,
                "nome_completo": obreiro.nome_completo,
                "email": obreiro.email,
                "cargo_id": 0,
            }
        }

    return {
        "valido": False,
        "motivo": "O oficial não ocupa cargo elegível nem é Mestre Instalado ativo nesta Loja.",
        "obreiro": {
            "id": obreiro.id,
            "cim": obreiro.cim,
            "nome_completo": obreiro.nome_completo,
        }
    }

