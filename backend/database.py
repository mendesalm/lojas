import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

# Build the path to the .env file in the project root
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
ORIENTE_DB_URL = os.getenv("ORIENTE_DB_URL")

if not DATABASE_URL:
    # Fallback for testing or if .env is missing
    DATABASE_URL = "sqlite:///./sigma.db"

# Engine principal (Sigma)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 60}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Engine secundária (Oriente Data - Read Only)
# Se não houver URL definida, usa a mesma do Sigma (assumindo mesmo banco em dev) ou None
oriente_engine = None
OrienteSessionLocal = None

if ORIENTE_DB_URL:
    oriente_engine = create_engine(ORIENTE_DB_URL)
    OrienteSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=oriente_engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_oriente_db():
    """Dependency for accessing the Oriente Data database."""
    if OrienteSessionLocal is None:
        # Fallback: se não configurado, tenta usar o banco principal (útil se as tabelas estiverem no mesmo DB em dev)
        # Mas idealmente deve ser configurado explicitamente.
        db = SessionLocal()
    else:
        db = OrienteSessionLocal()
        
    try:
        yield db
    finally:
        db.close()

