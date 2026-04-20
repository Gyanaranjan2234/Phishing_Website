"""
Database Configuration
======================
This file handles the database connection and session management.
We're using SQLite for simplicity (creates a local file: apgs.db).
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL - SQLite will create 'apgs.db' file in the backend folder
# "check_same_thread=False" allows multiple connections in FastAPI
DATABASE_URL = "sqlite:///./apgs.db"

# Create the database engine
# connect_args needed for SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal - Creates database sessions
# Each request will get its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base - Base class for all SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Database dependency function.
    Creates a new session for each request and closes it after.
    This function will be used in route endpoints.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
