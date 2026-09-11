import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from models import models

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

@app.get("/")
def read_root():
    return {"message": "Lojas API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
