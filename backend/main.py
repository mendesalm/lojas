import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from models import models

# API própria do módulo Lojas (2026-09-14) — primeira fatia: autenticação
# via e-Sigma + posse de cargo (mandato). Ver claude/decisao-transmissao-
# cargo-vm.md no Project "Core" para o contexto completo da decisão.
from api.v1.mandatos_rotas import router as mandatos_router, router_mandatos_global
from api.v1.hierarquia_rotas import router as hierarquia_router
from api.v1.obreiros_rotas import router as obreiros_router
from api.v1.sessoes_rotas import router as sessoes_router
from api.v1.lojas_admin_rotas import router as lojas_admin_router, router_lojas_global
from api.v1.documentos_rotas import router as documentos_router, router_docs_global
from api.v1.admissoes_rotas import router as admissoes_router, router_admissoes_global
from api.v1.dashboard_rotas import router as dashboard_router

# Ensure tables are created (in a real app, use Alembic)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lojas API (ERP Maçônico)",
    description="Backend oficial do Módulo Lojas (Secretaria, Chancelaria, Administração)",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_lojas_global, prefix="/api/v1")
app.include_router(router_mandatos_global, prefix="/api/v1")
app.include_router(router_docs_global, prefix="/api/v1")
app.include_router(router_admissoes_global, prefix="/api/v1")
app.include_router(mandatos_router, prefix="/api/v1")
app.include_router(hierarquia_router, prefix="/api/v1")
app.include_router(obreiros_router, prefix="/api/v1")
app.include_router(sessoes_router, prefix="/api/v1")
app.include_router(documentos_router, prefix="/api/v1")
app.include_router(admissoes_router, prefix="/api/v1")
app.include_router(lojas_admin_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")

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
