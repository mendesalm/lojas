import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path)

from database import engine, Base
from models import models

print("Creating tables in lojas_db...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
