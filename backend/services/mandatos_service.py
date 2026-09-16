# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de posse de cargo (mandato) — terceira peça da API própria do
módulo Lojas (2026-09-14). Porta para dentro do próprio Lojas a lógica que
hoje vive em `CoReVM/backend/api/v1/integracao/rotas_lojas.py::
_empossar_obreiro_e_cargo`, escrevendo diretamente em `lojas_db` a partir de
fora do módulo — a dívida técnica registrada em
`claude/decisao-transmissao-cargo-vm.md`.

Diferença em relação à versão do CoReVM: aqui rodamos dentro do próprio
módulo Lojas, sobre os modelos reais (`Obreiro`, `Mandato`,
`ObreiroLojaAssociacao`), então a marcação do titular anterior como "Mestre
Instalado" é feita através do ORM (`GrauEnum.MESTRE_INSTALADO`), não por SQL
bruto — o CoReVM precisava do SQL bruto só porque seu modelo espelho
(`ObreiroIntegracao`) não mapeia o tipo ENUM do Postgres; aqui o tipo já é
nativo.

Nota registrada (não resolvida nesta primeira fatia): `Obreiro.email` é
`NOT NULL` + `UNIQUE` no schema real, mas a posse "on-the-fly" (vindo do
CoReVM, como na transmissão emergencial) nem sempre tem um e-mail
verdadeiro em mãos no momento do cadastro. Enquanto não houver um fluxo de
regularização de e-mail, um e-mail placeholder determinístico
(`<cim>@pendente.cadastro.lojas`) é usado para não travar a posse — mesmo
princípio pragmático já usado noutros pontos do sistema (ex.: a transmissão
emergencial de VM), documentado para não ser confundido com um bug.
"""
from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.models import GrauEnum, Loja, Mandato, Obreiro, ObreiroLojaAssociacao, StatusObreiroEnum

CARGO_ID_VENERAVEL_MESTRE = 1


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
    com o grau tradicional "Mestre Instalado" — e abre o novo mandato."""
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
            .filter(Mandato.loja_id == loja_id, Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE, Mandato.data_fim.is_(None))
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
    """Mandato de Venerável Mestre atualmente ativo na Loja, se houver —
    equivalente de leitura, útil para o cliente confirmar o estado antes de
    chamar a posse."""
    resultado = (
        db.query(Mandato, Obreiro)
        .join(Obreiro, Mandato.obreiro_id == Obreiro.id)
        .filter(
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            Mandato.data_fim.is_(None),
        )
        .first()
    )
    if not resultado:
        return None
    mandato, obreiro = resultado
    return {
        "obreiro_id": obreiro.id,
        "nome_completo": obreiro.nome_completo,
        "cim": obreiro.cim,
        "data_inicio_mandato": mandato.data_inicio,
    }
