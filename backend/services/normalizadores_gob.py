# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Serviço de normalização e compatibilização com a estrutura de dados oficial do GOB (METAGOB, board, me).
Garante que identificadores, graus, ritos e cargos fornecidos pela integração ou aplicativo do GOB
sejam convertidos com precisão e segurança para o dicionário canônico do ecossistema Lojas.
"""
import re
from typing import Optional

# Mapeamento oficial dos Ritos do GOB (METAGOB) para o RitoEnum canônico de lojas_db
MAPA_RITOS_GOB = {
    "RAUF": "Rito Adonhiramita",
    "RB": "Rito Brasileiro",
    "RY": "Rito York",
    "REAA": "REAA",
    "RER": "Rito Escocês Retificado",
    "RME": "Rito Moderno",
    "RS": "Rito Schroder",
    "SEM_RITO": None,
    # Suporte a nomes por extenso também
    "RITO ADONHIRAMITA": "Rito Adonhiramita",
    "RITO BRASILEIRO": "Rito Brasileiro",
    "RITO DE YORK": "Rito York",
    "RITO YORK": "Rito York",
    "RITO ESCOCÊS ANTIGO E ACEITO": "REAA",
    "RITO ESCOCES ANTIGO E ACEITO": "REAA",
    "RITO ESCOCÊS RETIFICADO": "Rito Escocês Retificado",
    "RITO ESCOCES RETIFICADO": "Rito Escocês Retificado",
    "RITO MODERNO": "Rito Moderno",
    "RITO SCHRÖDER": "Rito Schroder",
    "RITO SCHRODER": "Rito Schroder",
}

# Mapeamento de Graus em inglês do GOB para o GrauEnum canônico
MAPA_GRAUS_GOB = {
    "APPRENTICE": "Aprendiz",
    "FELLOWCRAFT": "Companheiro",
    "MASTER": "Mestre",
    "APRENDIZ": "Aprendiz",
    "COMPANHEIRO": "Companheiro",
    "MESTRE": "Mestre",
    "MESTRE INSTALADO": "Mestre Instalado",
}

# Mapeamento oficial dos 7 Cargos da Administração Eletiva do GOB (board) para cargo_id de lojas_db
MAPA_CARGOS_GOB = {
    "VM": 1,    # Venerável Mestre
    "1V": 2,    # Primeiro Vigilante
    "2V": 3,    # Segundo Vigilante
    "OR": 4,    # Orador
    "SEC": 5,   # Secretário
    "TES": 6,   # Tesoureiro
    "CHAN": 7,  # Chanceler
}


def normalizar_rito_gob(rito_raw: Optional[str]) -> Optional[str]:
    """Converte o código ou nome de rito do GOB para o valor canônico aceito em lojas_db."""
    if not rito_raw:
        return None
    chave = rito_raw.strip().upper()
    return MAPA_RITOS_GOB.get(chave, rito_raw)


def normalizar_grau_gob(grau_raw: Optional[str]) -> Optional[str]:
    """Converte o grau retornado pelo GOB (ex: 'MASTER') para o GrauEnum ('Mestre')."""
    if not grau_raw:
        return None
    chave = grau_raw.strip().upper()
    return MAPA_GRAUS_GOB.get(chave, "Aprendiz")


def normalizar_cim(cim_raw: Optional[str]) -> Optional[str]:
    """
    Normaliza o CIM maçônico. No padrão GOB, o CIM possui 7 dígitos com zeros à esquerda
    (ex: '0292936' ou '0001234'). Remove espaços e aplica zfill(7) se for exclusivamente numérico.
    """
    if not cim_raw:
        return None
    cim_limpo = cim_raw.strip()
    if cim_limpo.isdigit():
        return cim_limpo.zfill(7)
    return cim_limpo


def normalizar_cpf(cpf_raw: Optional[str]) -> Optional[str]:
    """
    Aplica a Regra de Ouro do ecossistema: no banco de dados, o CPF deve ser armazenado
    estritamente como números (apenas dígitos).
    """
    if not cpf_raw:
        return None
    digitos = re.sub(r"\D", "", cpf_raw)
    return digitos if digitos else None


def normalizar_telefone(telefone_raw: Optional[str]) -> Optional[str]:
    """
    Normaliza o telefone para o padrão internacional E.164 (ex: +5562991809133).
    Se vier sem o DDI (+55), adiciona se tiver 10 ou 11 dígitos.
    """
    if not telefone_raw:
        return None
    digitos = re.sub(r"\D", "", telefone_raw)
    if not digitos:
        return None
    if len(digitos) in (10, 11):
        return f"+55{digitos}"
    if len(digitos) in (12, 13) and digitos.startswith("55"):
        return f"+{digitos}"
    return f"+{digitos}"


def mapear_codigo_cargo_gob(position_code: str) -> Optional[int]:
    """Retorna o cargo_id canônico de lojas_db correspondente à sigla de cargo do GOB."""
    if not position_code:
        return None
    return MAPA_CARGOS_GOB.get(position_code.strip().upper())
