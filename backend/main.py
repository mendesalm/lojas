import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from models import models

# API própria do módulo Lojas (2026-09-14) — primeira fatia: autenticação
# via e-Sigma + posse de cargo (mandato). Ver claude/decisao-transmissao-
# cargo-vm.md no Project "Core" para o contexto completo da decisão.
from api.v1.mandatos_rotas import router as mandatos_router

# API de Hierarquia (2026-09-16) — segunda fatia: leitura interna
# (backend-a-backend, protegida por chave de serviço) usada pelo e-Sigma
# para validar a Solicitação de Cadastro contra a Loja/Potência reais.
# Ver claude/decisao-controle-acesso-cadastro.md, seção 13, no Project
# "Core".
from api.v1.hierarquia_rotas import router as hierarquia_router

# Ensure tables are created (in a real app, use Alembic)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lojas API (ERP Maçônico)",
    description="Backend oficial do Módulo Lojas (Secretaria, Chancelaria, Patrimônio)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mandatos_router, prefix="/api/v1")
app.include_router(hierarquia_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Lojas API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    porta = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=porta, reload=True)
