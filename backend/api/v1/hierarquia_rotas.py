# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
API de Hierarquia do módulo Lojas (2026-09-16) — primeira rota de leitura
de uso INTERNO (backend-a-backend, nunca exposta ao formulário público)
deste módulo. Criada especificamente para resolver um problema de
sincronismo encontrado ao testar a Solicitação de Cadastro do e-Sigma pela
UI real: a tabela `organizacoes` do e-Sigma estava desconectada da
hierarquia real de Potência/Obediência/Loja, que vive em `lojas_db` (a
base operacional deste módulo) — ver `claude/decisao-controle-acesso-
cadastro.md`, seção 13, no Project "Core", para a análise completa e a
decisão.

Desenho deliberado:
- Busca PONTUAL por número exato de Loja — sem listagem, sem paginação,
  sem busca por nome/texto livre. Isso preserva a mesma lógica anti-
  curioso já usada na Solicitação de Cadastro (seção 2.3 da decisão):
  quem não souber o número exato da própria Loja não consegue usar esta
  rota para "descobrir" Lojas alheias, e o e-Sigma (única chamadora
  prevista) já exige o número como campo obrigatório do formulário.
- Protegida por chave de serviço (`core/service_auth.py`) — nunca por um
  token de usuário, porque não há usuário nesta chamada.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.service_auth import exigir_chave_de_servico
from database import get_db
from models.models import Loja, Obediencia

router = APIRouter(prefix="/hierarquia", tags=["Hierarquia (uso interno entre serviços)"])


def _serializar_obediencia(org: "Obediencia | None") -> "dict | None":
    if org is None:
        return None
    return {"id": org.id, "nome": org.nome, "sigla": org.sigla}


@router.get(
    "/lojas/buscar",
    summary="Busca uma Loja por número exato (uso interno — validação da Solicitação de Cadastro no e-Sigma)",
    dependencies=[Depends(exigir_chave_de_servico)],
)
def buscar_loja_por_numero(numero_loja: str, db: Session = Depends(get_db)):
    numero_alvo = (numero_loja or "").strip()
    loja = db.query(Loja).filter(Loja.numero_loja == numero_alvo).first()

    if loja is None:
        # Fallback tolerante a formatação (ex.: "0042" vs "42") — mesma
        # cautela de normalização já usada do outro lado (e-Sigma,
        # `_apenas_digitos`), mas só como segunda tentativa: a comparação
        # exata acima é a via principal.
        alvo_digitos = "".join(ch for ch in numero_alvo if ch.isdigit())
        if alvo_digitos:
            candidatas = db.query(Loja).filter(Loja.numero_loja.isnot(None)).all()
            for candidata in candidatas:
                digitos_candidata = "".join(ch for ch in (candidata.numero_loja or "") if ch.isdigit())
                if digitos_candidata and digitos_candidata == alvo_digitos:
                    loja = candidata
                    break

    if loja is None:
        raise HTTPException(status_code=404, detail="Loja não encontrada para este número.")

    return {
        "loja": {
            "id": loja.id,
            "nome_loja": loja.nome_loja,
            "numero_loja": loja.numero_loja,
            "codigo_loja": loja.codigo_loja,
        },
        "potencia": _serializar_obediencia(loja.potencia),
        "obediencia": _serializar_obediencia(loja.obediencia),
    }
