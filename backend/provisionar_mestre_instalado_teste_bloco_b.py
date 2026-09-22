# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Provisiona (cria, se ainda não existir) um Obreiro de teste com
grau="Mestre Instalado" e vínculo ATIVO numa Loja de teste, para permitir
rodar o Bloco B do roteiro de testes manuais (claude/roteiro-testes-
manuais.md no Project "Core") -- elegibilidade de Mestre Instalado como
Suplente do Conselho, nunca testada antes por faltar esse dado.

IMPORTANTE -- por que este script é seguro e não precisa de restauração
depois (diferente do Bloco C, que MUTA o VM/Suplente de uma Loja real de
teste): ele cria um Obreiro NOVO, dedicado, e só grava o `grau` dele e uma
associação de Loja ATIVA -- nunca toca na tabela `mandatos` nem em nenhum
Obreiro/associação já existente. Não interfere com nenhum outro script
automatizado (testar_modulo1_login_rbac.py, testar_modulo2_*, etc.) nem com
os VMs atuais das Lojas 901-905.

Este Obreiro é criado SOMENTE em lojas_db (grau, vínculo). O login de fato
(passo 4 do item B.1) depende de uma `Pessoa` correspondente no e-Sigma,
criada pelo script irmão `e-sigma/backend/provisionar_mestre_instalado_
teste_bloco_b.py` (mesmo CIM) -- rode os dois.

Idempotente: se o CIM já existir como Obreiro, o script só garante que o
grau e a associação estão corretos, sem duplicar nada.

Roda a partir de Lojas/backend (reaproveita o database.py já configurado
lá):
    cd C:\\Users\\engan\\Desktop\\Lojas\\backend
    python provisionar_mestre_instalado_teste_bloco_b.py
"""
from datetime import date

from database import SessionLocal
from models.models import GrauEnum, Loja, Obreiro, ObreiroLojaAssociacao, StatusObreiroEnum

CIM_TESTE = "9911003"
NOME_TESTE = "Heráclito Fontenele (Mestre Instalado — teste Bloco B)"
EMAIL_TESTE = "teste.cim9911003@e-sigma.app"  # mesmo padrão de e-mail usado em provisionar_membros_teste_ceres.py
NUMERO_LOJA_TESTE = "904"  # mesma sugestão do roteiro de testes -- Loja "limpa", já jurisdicionada a uma Região de teste


def main():
    db = SessionLocal()
    try:
        loja = db.query(Loja).filter(Loja.numero_loja == NUMERO_LOJA_TESTE).first()
        if not loja:
            print(f"ERRO: Loja de número {NUMERO_LOJA_TESTE} não encontrada em lojas_db. Ajuste NUMERO_LOJA_TESTE no script.")
            return

        obreiro = db.query(Obreiro).filter(Obreiro.cim == CIM_TESTE).first()
        if obreiro:
            print(f"[JÁ EXISTIA] Obreiro CIM {CIM_TESTE} (id={obreiro.id}) -- garantindo grau e vínculo.")
        else:
            obreiro = Obreiro(
                cim=CIM_TESTE,
                nome_completo=NOME_TESTE,
                email=EMAIL_TESTE,
                status="Ativo",
                hash_senha="nao-usado-e-sigma-e-o-idp",  # login real é sempre via e-Sigma -- este campo é legado, nunca lido
            )
            db.add(obreiro)
            db.flush()
            print(f"[CRIADO] Obreiro CIM {CIM_TESTE} (id={obreiro.id}).")

        obreiro.grau = GrauEnum.MESTRE_INSTALADO
        obreiro.data_instalacao = date.today()

        associacao = (
            db.query(ObreiroLojaAssociacao)
            .filter(ObreiroLojaAssociacao.obreiro_id == obreiro.id, ObreiroLojaAssociacao.loja_id == loja.id)
            .first()
        )
        if not associacao:
            db.add(
                ObreiroLojaAssociacao(
                    obreiro_id=obreiro.id,
                    loja_id=loja.id,
                    status=StatusObreiroEnum.ATIVO,
                    data_inicio=date.today(),
                )
            )
            print(f"[CRIADO] Vínculo ATIVO com a Loja {NUMERO_LOJA_TESTE} (id={loja.id}).")
        else:
            associacao.status = StatusObreiroEnum.ATIVO
            print(f"[JÁ EXISTIA] Vínculo com a Loja {NUMERO_LOJA_TESTE} -- garantido como ATIVO.")

        db.commit()
        print()
        print(f"OK -- Obreiro CIM {CIM_TESTE} agora tem grau='Mestre Instalado' e vínculo ATIVO na Loja {NUMERO_LOJA_TESTE}.")
        print("Próximo passo: rodar o script irmão em e-sigma/backend para criar a Pessoa correspondente (login real).")
    except Exception as e:
        db.rollback()
        print(f"ERRO: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
