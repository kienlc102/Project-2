"""
Migration: Add subject_id and doc_type columns to documents table
"""
from app.db.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Add subject_id column with foreign key to subjects
        print("Adding subject_id column...")
        conn.execute(text("""
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS subject_id INTEGER 
            REFERENCES subjects(id) ON DELETE SET NULL ON UPDATE CASCADE
        """))
        
        # Add doc_type column with check constraint
        print("Adding doc_type column...")
        conn.execute(text("""
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50) DEFAULT 'other'
        """))
        
        # Add check constraint for doc_type (only if not exists)
        try:
            conn.execute(text("""
                ALTER TABLE documents 
                ADD CONSTRAINT documents_doc_type_check 
                CHECK (doc_type IN ('lecture', 'exercise', 'exam', 'other'))
            """))
            print("Added doc_type check constraint")
        except Exception as e:
            if 'already exists' in str(e):
                print("doc_type check constraint already exists, skipping")
            else:
                raise
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
