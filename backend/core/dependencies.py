# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Dependências de autorização da API do módulo Lojas — segunda peça da API
própria (2026-09-14). Resolve a identidade validada pelo e-Sigma
(`UsuarioEsigma`, ver `auth_esigma.py`) para um `Obreiro` de `lojas_db`, e
oferece a dependência de escopo usada pelas rotas de escrita: só o
Venerável Mestre em exercício da própria Loja, um Webmaster daquela Loja, ou
um SuperAdmin (`role == "super_admin"` no e-Sigma) pode alterar o cadastro
de cargos da Loja.

Convenção herdada do `lojas_db` já em uso hoje pelo CoReVM (ver
`CoReVM/backend/api/v1/regional/rotas.py::_resolver_veneravel_atual_da_loja`
e `_resolver_ultimo_vm_da_loja`): `cargo_id == 1` é sempre "Venerável
Mestre" nesta base. Não há hoje outra forma de identificar esse cargo por
nome sem uma consulta extra a `cargos.nome`, e essa convenção já é a fonte
de verdade usada em produção — reaproveitada aqui para as duas pontas
(CoReVM e Lojas) ficarem de acordo sobre o mesmo dado.
"""
from datetime import date
from typing import Optional

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from core.auth_esigma import UsuarioEsigma, obter_usuario_esigma
from database import get_db
from models.models import Mandato, Obreiro, Webmaster

CARGO_ID_VENERAVEL_MESTRE = 1


def _resolver_obreiro_por_identificador(db: Session, usuario: UsuarioEsigma) -> Optional[Obreiro]:
    """Casa a identidade validada pelo e-Sigma com um Obreiro cadastrado em
    `lojas_db`, tentando CIM, depois CPF, depois e-mail — mesma ordem de
    prioridade usada pelo login do e-Sigma para outros identificadores
    (`_resolver_pessoa_por_identificador`)."""
    if usuario.cim:
        obreiro = db.query(Obreiro).filter(Obreiro.cim == usuario.cim).first()
        if obreiro:
            return obreiro
    if usuario.cpf:
        obreiro = db.query(Obreiro).filter(Obreiro.cpf == usuario.cpf).first()
        if obreiro:
            return obreiro
    if usuario.email:
        obreiro = db.query(Obreiro).filter(Obreiro.email == usuario.email).first()
        if obreiro:
            return obreiro
    return None


def get_usuario_e_obreiro(
    usuario: UsuarioEsigma = Depends(obter_usuario_esigma),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Dependência de base: devolve a identidade e-Sigma já validada junto
    com o Obreiro correspondente em `lojas_db`, quando existir. `Obreiro`
    pode vir `None` — por exemplo, um SuperAdmin autenticando sem ter
    cadastro de Obreiro em Loja nenhuma; quem depende disso decide se isso é
    aceitável para a rota em questão."""
    obreiro = _resolver_obreiro_por_identificador(db, usuario)
    return usuario, obreiro


def _e_vm_em_exercicio_da_loja(db: Session, obreiro_id: int, loja_id: int) -> bool:
    hoje = date.today()
    mandato_ativo = (
        db.query(Mandato)
        .filter(
            Mandato.obreiro_id == obreiro_id,
            Mandato.loja_id == loja_id,
            Mandato.cargo_id == CARGO_ID_VENERAVEL_MESTRE,
            Mandato.data_inicio <= hoje,
        )
        .filter((Mandato.data_fim.is_(None)) | (Mandato.data_fim >= hoje))
        .first()
    )
    return mandato_ativo is not None


def _e_webmaster_da_loja(db: Session, usuario: UsuarioEsigma, loja_id: int) -> bool:
    if not usuario.email:
        return False
    webmaster = (
        db.query(Webmaster)
        .filter(Webmaster.email == usuario.email, Webmaster.loja_id == loja_id, Webmaster.ativo.is_(True))
        .first()
    )
    return webmaster is not None


def exigir_vm_ou_webmaster_da_loja(
    loja_id: int,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Dependência FastAPI "nativa" (não uma factory por closure — `loja_id`
    é declarado aqui como parâmetro próprio, e o FastAPI o resolve sozinho a
    partir do path da rota que a usa, casando pelo nome). Bloqueia a rota
    para qualquer chamador que não seja (a) o Venerável Mestre em exercício
    da própria Loja, (b) um Webmaster daquela Loja, ou (c) um SuperAdmin do
    e-Sigma. Mesmo espírito de defesa em profundidade já usado no CoReVM
    (`_exigir_vm_da_loja_ou_diretoria`): a checagem de escopo acontece no
    backend, nunca só na UI.

    Nota de implementação: uma versão anterior desta dependência era uma
    "dependency factory" (`def exigir_...(loja_id): def dependencia(...):
    ...; return dependencia`) chamada como `Depends(exigir_...(loja_id))`
    diretamente no valor-padrão de um parâmetro de rota — isso não
    funcionaria: o valor de `loja_id` usado nessa chamada seria avaliado na
    definição da função de rota (quando o `def` roda), não a cada
    requisição, e nesse momento não existe nenhum `loja_id` no escopo (ele é
    só um outro parâmetro do mesmo `def`, ainda não vinculado) — resultaria
    em `NameError` já na importação do módulo. Corrigido antes de ir para
    produção, adotando o padrão de dependência com parâmetro próprio que o
    FastAPI já resolve automaticamente pelo path.
    """
    usuario, obreiro = contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id):
        return contexto

    if obreiro is not None and _e_vm_em_exercicio_da_loja(db, obreiro.id, loja_id):
        return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Venerável Mestre em exercício desta Loja, um Webmaster desta Loja ou um SuperAdmin podem realizar esta ação.",
    )


def _possui_cargos_na_loja(db: Session, obreiro_id: int, loja_id: int, cargo_ids: list[int]) -> bool:
    """Verifica se o obreiro possui algum dos cargos ativos especificados na loja."""
    hoje = date.today()
    mandato = (
        db.query(Mandato)
        .filter(
            Mandato.obreiro_id == obreiro_id,
            Mandato.loja_id == loja_id,
            Mandato.cargo_id.in_(cargo_ids),
            Mandato.data_inicio <= hoje,
        )
        .filter((Mandato.data_fim.is_(None)) | (Mandato.data_fim >= hoje))
        .first()
    )
    return mandato is not None


def exigir_membro_ou_diretoria_da_loja(
    loja_id: int,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Garante que o usuário pertence à Loja (como obreiro ativo), é Webmaster, ou SuperAdmin."""
    usuario, obreiro = contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id):
        return contexto

    if obreiro is not None:
        assoc = (
            db.query(Obreiro)
            .join(Obreiro.associacoes_loja)
            .filter(
                Obreiro.id == obreiro.id,
                Obreiro.associacoes_loja.any(loja_id=loja_id, status=StatusObreiroEnum.ATIVO)
            )
            .first()
        )
        if assoc:
            return contexto

    raise HTTPException(
        status_code=403,
        detail="Acesso restrito aos membros ativos e administração desta Loja.",
    )


def exigir_secretaria_ou_vm_da_loja(
    loja_id: int,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Permite acesso a ações da Secretaria (Venerável Mestre, Secretário [cargo_id=5], Webmaster ou SuperAdmin)."""
    usuario, obreiro = contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id):
        return contexto

    if obreiro is not None:
        # VM (1) ou Secretário (5)
        if _possui_cargos_na_loja(db, obreiro.id, loja_id, [CARGO_ID_VENERAVEL_MESTRE, 5]):
            return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Venerável Mestre, o Secretário, o Webmaster ou SuperAdmin podem realizar esta ação.",
    )


def exigir_chancelaria_ou_vm_da_loja(
    loja_id: int,
    contexto: tuple[UsuarioEsigma, Optional[Obreiro]] = Depends(get_usuario_e_obreiro),
    db: Session = Depends(get_db),
) -> tuple[UsuarioEsigma, Optional[Obreiro]]:
    """Permite acesso a ações da Chancelaria (Venerável Mestre, Chanceler [cargo_id=7], Secretário [cargo_id=5], Webmaster ou SuperAdmin)."""
    usuario, obreiro = contexto

    if usuario.is_super_admin:
        return contexto

    if _e_webmaster_da_loja(db, usuario, loja_id):
        return contexto

    if obreiro is not None:
        # VM (1), Chanceler (7) ou Secretário (5)
        if _possui_cargos_na_loja(db, obreiro.id, loja_id, [CARGO_ID_VENERAVEL_MESTRE, 5, 7]):
            return contexto

    raise HTTPException(
        status_code=403,
        detail="Apenas o Chanceler, Secretário, Venerável Mestre ou Webmaster podem gerenciar presenças.",
    )

