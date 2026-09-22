# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Schemas Pydantic para manipulação e retorno de dados de Obreiros e Quadro de Membros.
Compatível com a estrutura de dados canônica de lojas_db e com a API do GOB.
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from services.normalizadores_gob import normalizar_cim, normalizar_cpf, normalizar_telefone, normalizar_grau_gob


class FamiliarSchema(BaseModel):
    id: Optional[int] = None
    nome_completo: str
    tipo_relacionamento: str
    data_nascimento: Optional[date] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    falecido: bool = False

    model_config = ConfigDict(from_attributes=True)


class CondecoracaoSchema(BaseModel):
    id: Optional[int] = None
    titulo: str
    data_concessao: date
    observacoes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MandatoResumoSchema(BaseModel):
    id: int
    cargo_id: int
    cargo_nome: Optional[str] = None
    data_inicio: date
    data_fim: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class ObreiroBase(BaseModel):
    nome_completo: str
    cim: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    orgao_emissor_rg: Optional[str] = None
    data_emissao_rg: Optional[date] = None
    data_nascimento: Optional[date] = None
    data_casamento: Optional[date] = None
    estado_civil: Optional[str] = None
    tipo_sanguineo: Optional[str] = None
    
    # Filiação
    nome_pai: Optional[str] = None
    nome_mae: Optional[str] = None
    
    # Título eleitoral
    titulo_eleitor: Optional[str] = None
    zona_eleitoral: Optional[str] = None
    secao_eleitoral: Optional[str] = None
    
    # Contato e Endereço
    email: str
    telefone: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    
    # Origem e Profissão
    naturalidade: Optional[str] = None
    naturalidade_uf: Optional[str] = None
    nacionalidade: Optional[str] = "Brasileira"
    religiao: Optional[str] = None
    escolaridade: Optional[str] = None
    profissao: Optional[str] = None
    local_trabalho: Optional[str] = None
    caminho_foto_perfil: Optional[str] = None
    
    # Dados Maçônicos
    status: Optional[str] = "Ativo"
    grau: Optional[str] = "Aprendiz"
    data_iniciacao: Optional[date] = None
    data_elevacao: Optional[date] = None
    data_exaltacao: Optional[date] = None
    data_instalacao: Optional[date] = None
    data_filiacao: Optional[date] = None
    data_regularizacao: Optional[date] = None
    grau_filosofico: Optional[str] = None
    loja_iniciacao: Optional[str] = None
    loja_elevacao: Optional[str] = None
    loja_exaltacao: Optional[str] = None
    regularidade_financeira: Optional[bool] = True

    @field_validator("cim", mode="before")
    @classmethod
    def validar_cim(cls, v):
        return normalizar_cim(v)

    @field_validator("cpf", mode="before")
    @classmethod
    def validar_cpf(cls, v):
        return normalizar_cpf(v)

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, v):
        return normalizar_telefone(v)

    @field_validator("grau", mode="before")
    @classmethod
    def validar_grau(cls, v):
        return normalizar_grau_gob(v)


class ObreiroCreate(ObreiroBase):
    loja_id: int
    classe_obreiro: Optional[str] = "Regular"
    cargo_inicial_id: Optional[int] = None
    familiares: Optional[List[FamiliarSchema]] = []
    condecoracoes: Optional[List[CondecoracaoSchema]] = []


class ObreiroUpdate(BaseModel):
    nome_completo: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    orgao_emissor_rg: Optional[str] = None
    data_emissao_rg: Optional[date] = None
    data_nascimento: Optional[date] = None
    data_casamento: Optional[date] = None
    estado_civil: Optional[str] = None
    tipo_sanguineo: Optional[str] = None
    nome_pai: Optional[str] = None
    nome_mae: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    zona_eleitoral: Optional[str] = None
    secao_eleitoral: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    naturalidade: Optional[str] = None
    naturalidade_uf: Optional[str] = None
    nacionalidade: Optional[str] = None
    religiao: Optional[str] = None
    escolaridade: Optional[str] = None
    profissao: Optional[str] = None
    local_trabalho: Optional[str] = None
    caminho_foto_perfil: Optional[str] = None
    status: Optional[str] = None
    grau: Optional[str] = None
    data_iniciacao: Optional[date] = None
    data_elevacao: Optional[date] = None
    data_exaltacao: Optional[date] = None
    data_instalacao: Optional[date] = None
    grau_filosofico: Optional[str] = None
    loja_iniciacao: Optional[str] = None
    loja_elevacao: Optional[str] = None
    loja_exaltacao: Optional[str] = None
    regularidade_financeira: Optional[bool] = None

    @field_validator("cpf", mode="before")
    @classmethod
    def validar_cpf(cls, v):
        return normalizar_cpf(v)

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, v):
        return normalizar_telefone(v)


class ObreiroResumo(BaseModel):
    """Schema otimizado para a exibição em listas e no Quadro de Obreiros da Loja."""
    id: int
    cim: Optional[str] = None
    nome_completo: str
    grau: Optional[str] = None
    status: Optional[str] = None
    classe_obreiro: Optional[str] = None
    cargo_atual: Optional[str] = None
    email: str
    telefone: Optional[str] = None
    caminho_foto_perfil: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ObreiroResponse(ObreiroBase):
    id: int
    classe_obreiro: Optional[str] = None
    familiares: List[FamiliarSchema] = []
    condecoracoes: List[CondecoracaoSchema] = []
    mandatos: List[MandatoResumoSchema] = []

    model_config = ConfigDict(from_attributes=True)


class AniversarianteItem(BaseModel):
    id: int
    nome_completo: str
    cim: Optional[str] = None
    data_nascimento: date
    telefone: Optional[str] = None
    caminho_foto_perfil: Optional[str] = None
    grau: Optional[str] = None
    dia: int

    model_config = ConfigDict(from_attributes=True)


class AniversariantesResponse(BaseModel):
    mes: int
    total: int
    membros: List[AniversarianteItem]
