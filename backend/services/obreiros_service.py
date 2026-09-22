# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de gerenciamento do Quadro de Obreiros da Loja Maçônica.
Executa buscas, cadastros com anti-duplicidade cruzada, vinculação à loja,
aniversariantes do mês e montagem da ficha completa do obreiro.
"""
from datetime import date
from typing import List, Optional
import hashlib

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, extract

from models.models import (
    Obreiro,
    ObreiroLojaAssociacao,
    Familiar,
    Condecoracao,
    Mandato,
    Cargo,
    StatusObreiroEnum,
    ClasseObreiroEnum,
    GrauEnum
)
from schemas.obreiro_schema import (
    ObreiroCreate,
    ObreiroUpdate,
    ObreiroResumo,
    ObreiroResponse,
    FamiliarSchema,
    CondecoracaoSchema,
    MandatoResumoSchema,
    AniversarianteItem,
    AniversariantesResponse
)


def _hash_temporario(cim: str) -> str:
    """Gera um hash temporário para satisfazer a constraint NOT NULL de hash_senha."""
    return hashlib.sha256(f"temp_pwd_lojas_{cim}".encode()).hexdigest()


def listar_obreiros_loja(
    db: Session,
    loja_id: int,
    busca: Optional[str] = None,
    grau: Optional[str] = None,
    status_filtro: Optional[str] = None,
    apenas_ativos: bool = True
) -> List[ObreiroResumo]:
    """Lista todos os obreiros vinculados a uma determinada Loja."""
    query = (
        db.query(Obreiro, ObreiroLojaAssociacao)
        .join(ObreiroLojaAssociacao, Obreiro.id == ObreiroLojaAssociacao.obreiro_id)
        .filter(ObreiroLojaAssociacao.loja_id == loja_id)
    )

    if apenas_ativos:
        query = query.filter(ObreiroLojaAssociacao.status == StatusObreiroEnum.ATIVO)

    if grau:
        query = query.filter(Obreiro.grau == grau)

    if status_filtro:
        query = query.filter(Obreiro.status == status_filtro)

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                Obreiro.nome_completo.ilike(termo),
                Obreiro.cim.ilike(termo),
                Obreiro.cpf.ilike(termo),
                Obreiro.email.ilike(termo)
            )
        )

    resultados = query.order_by(Obreiro.nome_completo.asc()).all()

    # Mapeia cargos ativos dos obreiros nesta loja para compor o resumo
    mandatos_ativos = (
        db.query(Mandato)
        .options(joinedload(Mandato.cargo))
        .filter(Mandato.loja_id == loja_id, Mandato.data_fim.is_(None))
        .all()
    )
    mapa_cargos = {m.obreiro_id: m.cargo.nome for m in mandatos_ativos if m.cargo}

    resumos = []
    for obreiro, assoc in resultados:
        grau_valor = obreiro.grau.value if hasattr(obreiro.grau, "value") else obreiro.grau
        status_assoc = assoc.status.value if hasattr(assoc.status, "value") else str(assoc.status)
        classe_assoc = assoc.classe_obreiro.value if hasattr(assoc.classe_obreiro, "value") else str(assoc.classe_obreiro)

        resumos.append(
            ObreiroResumo(
                id=obreiro.id,
                cim=obreiro.cim,
                nome_completo=obreiro.nome_completo,
                grau=grau_valor,
                status=status_assoc,
                classe_obreiro=classe_assoc,
                cargo_atual=mapa_cargos.get(obreiro.id),
                email=obreiro.email,
                telefone=obreiro.telefone,
                caminho_foto_perfil=obreiro.caminho_foto_perfil
            )
        )

    return resumos


def obter_obreiro_por_id(db: Session, obreiro_id: int, loja_id: Optional[int] = None) -> ObreiroResponse:
    """Retorna a ficha completa de um Obreiro com familiares, condecorações e mandatos."""
    obreiro = (
        db.query(Obreiro)
        .options(
            joinedload(Obreiro.familiares),
            joinedload(Obreiro.condecoracoes),
            joinedload(Obreiro.mandatos).joinedload(Mandato.cargo),
            joinedload(Obreiro.associacoes_loja)
        )
        .filter(Obreiro.id == obreiro_id)
        .first()
    )

    if not obreiro:
        raise HTTPException(status_code=404, detail="Obreiro não encontrado.")

    classe_loja = None
    if loja_id:
        assoc = next((a for a in obreiro.associacoes_loja if a.loja_id == loja_id), None)
        if assoc:
            classe_loja = assoc.classe_obreiro.value if hasattr(assoc.classe_obreiro, "value") else str(assoc.classe_obreiro)

    familiares_list = [
        FamiliarSchema(
            id=f.id,
            nome_completo=f.nome_completo,
            tipo_relacionamento=f.tipo_relacionamento.value if hasattr(f.tipo_relacionamento, "value") else str(f.tipo_relacionamento),
            data_nascimento=f.data_nascimento,
            email=f.email,
            telefone=f.telefone,
            falecido=f.falecido or False
        )
        for f in obreiro.familiares
    ]

    condecoracoes_list = [
        CondecoracaoSchema(
            id=c.id,
            titulo=c.titulo,
            data_concessao=c.data_concessao,
            observacoes=c.observacoes
        )
        for c in obreiro.condecoracoes
    ]

    mandatos_list = [
        MandatoResumoSchema(
            id=m.id,
            cargo_id=m.cargo_id,
            cargo_nome=m.cargo.nome if m.cargo else None,
            data_inicio=m.data_inicio,
            data_fim=m.data_fim
        )
        for m in obreiro.mandatos
    ]

    grau_str = obreiro.grau.value if hasattr(obreiro.grau, "value") else obreiro.grau

    return ObreiroResponse(
        id=obreiro.id,
        nome_completo=obreiro.nome_completo,
        cim=obreiro.cim,
        cpf=obreiro.cpf,
        rg=obreiro.rg,
        orgao_emissor_rg=obreiro.orgao_emissor_rg,
        data_emissao_rg=obreiro.data_emissao_rg,
        data_nascimento=obreiro.data_nascimento,
        data_casamento=obreiro.data_casamento,
        estado_civil=obreiro.estado_civil,
        tipo_sanguineo=obreiro.tipo_sanguineo,
        nome_pai=obreiro.nome_pai,
        nome_mae=obreiro.nome_mae,
        titulo_eleitor=obreiro.titulo_eleitor,
        zona_eleitoral=obreiro.zona_eleitoral,
        secao_eleitoral=obreiro.secao_eleitoral,
        email=obreiro.email,
        telefone=obreiro.telefone,
        logradouro=obreiro.logradouro,
        numero=obreiro.numero,
        bairro=obreiro.bairro,
        cidade=obreiro.cidade,
        estado=obreiro.estado,
        cep=obreiro.cep,
        naturalidade=obreiro.naturalidade,
        naturalidade_uf=obreiro.naturalidade_uf,
        nacionalidade=obreiro.nacionalidade,
        religiao=obreiro.religiao,
        escolaridade=obreiro.escolaridade,
        profissao=obreiro.profissao,
        local_trabalho=obreiro.local_trabalho,
        caminho_foto_perfil=obreiro.caminho_foto_perfil,
        status=obreiro.status,
        grau=grau_str,
        data_iniciacao=obreiro.data_iniciacao,
        data_elevacao=obreiro.data_elevacao,
        data_exaltacao=obreiro.data_exaltacao,
        data_instalacao=obreiro.data_instalacao,
        data_filiacao=obreiro.data_filiacao,
        data_regularizacao=obreiro.data_regularizacao,
        grau_filosofico=obreiro.grau_filosofico,
        loja_iniciacao=obreiro.loja_iniciacao,
        loja_elevacao=obreiro.loja_elevacao,
        loja_exaltacao=obreiro.loja_exaltacao,
        regularidade_financeira=obreiro.regularidade_financeira,
        classe_obreiro=classe_loja,
        familiares=familiares_list,
        condecoracoes=condecoracoes_list,
        mandatos=mandatos_list
    )


def criar_obreiro(db: Session, payload: ObreiroCreate) -> ObreiroResponse:
    """Cria um novo obreiro e estabelece seu vínculo com a Loja com validação de duplicidade."""
    # 1. Anti-duplicidade cruzada
    filtros = []
    if payload.cim:
        filtros.append(Obreiro.cim == payload.cim)
    if payload.cpf:
        filtros.append(Obreiro.cpf == payload.cpf)
    if payload.email:
        filtros.append(Obreiro.email == payload.email)

    if filtros:
        existente = db.query(Obreiro).filter(or_(*filtros)).first()
        if existente:
            motivo = "CIM" if existente.cim == payload.cim else ("CPF" if existente.cpf == payload.cpf else "E-mail")
            raise HTTPException(
                status_code=422,
                detail=f"Conflito de duplicidade cadastral no campo {motivo}. O obreiro '{existente.nome_completo}' já possui este registro."
            )

    obreiro = Obreiro(
        nome_completo=payload.nome_completo,
        cim=payload.cim,
        cpf=payload.cpf,
        rg=payload.rg,
        orgao_emissor_rg=payload.orgao_emissor_rg,
        data_emissao_rg=payload.data_emissao_rg,
        data_nascimento=payload.data_nascimento,
        data_casamento=payload.data_casamento,
        estado_civil=payload.estado_civil,
        tipo_sanguineo=payload.tipo_sanguineo,
        nome_pai=payload.nome_pai,
        nome_mae=payload.nome_mae,
        titulo_eleitor=payload.titulo_eleitor,
        zona_eleitoral=payload.zona_eleitoral,
        secao_eleitoral=payload.secao_eleitoral,
        email=payload.email,
        hash_senha=_hash_temporario(payload.cim or payload.email),
        telefone=payload.telefone,
        logradouro=payload.logradouro,
        numero=payload.numero,
        bairro=payload.bairro,
        cidade=payload.cidade,
        estado=payload.estado,
        cep=payload.cep,
        naturalidade=payload.naturalidade,
        naturalidade_uf=payload.naturalidade_uf,
        nacionalidade=payload.nacionalidade or "Brasileira",
        religiao=payload.religiao,
        escolaridade=payload.escolaridade,
        profissao=payload.profissao,
        local_trabalho=payload.local_trabalho,
        caminho_foto_perfil=payload.caminho_foto_perfil,
        status=payload.status or "Ativo",
        grau=payload.grau or "Aprendiz",
        data_iniciacao=payload.data_iniciacao,
        data_elevacao=payload.data_elevacao,
        data_exaltacao=payload.data_exaltacao,
        data_instalacao=payload.data_instalacao,
        data_filiacao=payload.data_filiacao,
        data_regularizacao=payload.data_regularizacao,
        grau_filosofico=payload.grau_filosofico,
        loja_iniciacao=payload.loja_iniciacao,
        loja_elevacao=payload.loja_elevacao,
        loja_exaltacao=payload.loja_exaltacao,
        regularidade_financeira=payload.regularidade_financeira if payload.regularidade_financeira is not None else True
    )
    db.add(obreiro)
    db.flush()

    # 2. Vínculo à Loja
    associacao = ObreiroLojaAssociacao(
        obreiro_id=obreiro.id,
        loja_id=payload.loja_id,
        data_inicio=date.today(),
        status=StatusObreiroEnum.ATIVO,
        classe_obreiro=ClasseObreiroEnum.REGULAR
    )
    db.add(associacao)

    # 3. Cargo inicial, se especificado
    if payload.cargo_inicial_id:
        mandato = Mandato(
            obreiro_id=obreiro.id,
            loja_id=payload.loja_id,
            cargo_id=payload.cargo_inicial_id,
            data_inicio=date.today()
        )
        db.add(mandato)

    db.commit()
    db.refresh(obreiro)

    return obter_obreiro_por_id(db, obreiro.id, loja_id=payload.loja_id)


def atualizar_obreiro(db: Session, obreiro_id: int, payload: ObreiroUpdate) -> ObreiroResponse:
    """Atualiza dados cadastrais de um Obreiro."""
    obreiro = db.query(Obreiro).filter(Obreiro.id == obreiro_id).first()
    if not obreiro:
        raise HTTPException(status_code=404, detail="Obreiro não encontrado.")

    dados = payload.model_dump(exclude_unset=True)

    # Se estiver alterando CPF ou Email, checa conflito com terceiros
    if "cpf" in dados and dados["cpf"] != obreiro.cpf:
        conflito = db.query(Obreiro).filter(Obreiro.cpf == dados["cpf"], Obreiro.id != obreiro_id).first()
        if conflito:
            raise HTTPException(status_code=422, detail=f"O CPF já pertence ao obreiro '{conflito.nome_completo}'.")

    if "email" in dados and dados["email"] != obreiro.email:
        conflito = db.query(Obreiro).filter(Obreiro.email == dados["email"], Obreiro.id != obreiro_id).first()
        if conflito:
            raise HTTPException(status_code=422, detail=f"O E-mail já pertence ao obreiro '{conflito.nome_completo}'.")

    for campo, valor in dados.items():
        setattr(obreiro, campo, valor)

    db.commit()
    db.refresh(obreiro)
    return obter_obreiro_por_id(db, obreiro_id)


def listar_aniversariantes_mes(db: Session, loja_id: int, mes: Optional[int] = None) -> AniversariantesResponse:
    """Retorna os aniversariantes de um determinado mês da Loja, ordenados pelo dia do aniversário."""
    mes_alvo = mes if mes is not None else date.today().month

    resultados = (
        db.query(Obreiro)
        .join(ObreiroLojaAssociacao, Obreiro.id == ObreiroLojaAssociacao.obreiro_id)
        .filter(
            ObreiroLojaAssociacao.loja_id == loja_id,
            ObreiroLojaAssociacao.status == StatusObreiroEnum.ATIVO,
            Obreiro.data_nascimento.isnot(None),
            extract("month", Obreiro.data_nascimento) == mes_alvo
        )
        .order_by(extract("day", Obreiro.data_nascimento).asc())
        .all()
    )

    membros_list = []
    for obreiro in resultados:
        grau_str = obreiro.grau.value if hasattr(obreiro.grau, "value") else obreiro.grau
        membros_list.append(
            AniversarianteItem(
                id=obreiro.id,
                nome_completo=obreiro.nome_completo,
                cim=obreiro.cim,
                data_nascimento=obreiro.data_nascimento,
                telefone=obreiro.telefone,
                caminho_foto_perfil=obreiro.caminho_foto_perfil,
                grau=grau_str,
                dia=obreiro.data_nascimento.day
            )
        )

    return AniversariantesResponse(
        mes=mes_alvo,
        total=len(membros_list),
        membros=membros_list
    )
