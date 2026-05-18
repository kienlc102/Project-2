"""
Migration: Add document_id column to flashcard_sets and quizzes tables.
Links AI-generated flashcards/quizzes back to their source document.
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Add document_id to flashcard_sets
    conn.execute(text("""
        ALTER TABLE flashcard_sets
        ADD COLUMN IF NOT EXISTS document_id UUID
        REFERENCES documents(id) ON DELETE SET NULL;
    """))

    # Add document_id to quizzes
    conn.execute(text("""
        ALTER TABLE quizzes
        ADD COLUMN IF NOT EXISTS document_id UUID
        REFERENCES documents(id) ON DELETE SET NULL;
    """))

    conn.commit()
    print("Migration complete: document_id added to flashcard_sets and quizzes.")
