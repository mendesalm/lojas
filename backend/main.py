import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

@app.get("/health", tags=["Diagnóstico"])
def health_check():
    return {"status": "ok"}

# ==============================================================================
# SERVIÇO DO FRONTEND ESTÁTICO (SPA REACT)
# ==============================================================================
caminho_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(caminho_dist):
    caminho_assets = os.path.join(caminho_dist, "assets")
    if os.path.exists(caminho_assets):
        app.mount("/assets", StaticFiles(directory=caminho_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def servir_frontend_spa(full_path: str):
        # Ignora rotas de API, documentação e diagnóstico
        if (
            full_path.startswith("api/")
            or full_path.startswith("api")
            or full_path in ("docs", "openapi.json", "redoc", "health")
        ):
            raise HTTPException(status_code=404, detail="Recurso da API não encontrado")

        # Verifica se é um arquivo físico na raiz de dist (ex.: favicon.svg, Lojas_Icon.svg, robots.txt)
        arquivo_especifico = os.path.join(caminho_dist, full_path)
        if full_path and os.path.isfile(arquivo_especifico):
            return FileResponse(arquivo_especifico)

        # Fallback de SPA para o React Router (/login, /inicio, /obreiros, etc.)
        arquivo_index = os.path.join(caminho_dist, "index.html")
        if os.path.exists(arquivo_index):
            return FileResponse(arquivo_index)

        return {"message": "Lojas API is running"}
else:
    @app.get("/")
    def read_root():
        return {"message": "Lojas API is running"}


if __name__ == "__main__":
    import uvicorn
    porta = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=porta, reload=True)
