from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# List all tables
r = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).fetchall()
print("All tables:")
for row in r:
    print(f"  {row[0]}")

print()

# questions table schema
r2 = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='questions' ORDER BY ordinal_position")).fetchall()
print("questions columns:")
for row in r2:
    print(f"  {row[0]}: {row[1]}")

print()

# quiz_options schema
r3 = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='quiz_options' ORDER BY ordinal_position")).fetchall()
print("quiz_options columns:")
for row in r3:
    print(f"  {row[0]}: {row[1]}")

print()

# quiz_answers schema
r4 = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='quiz_answers' ORDER BY ordinal_position")).fetchall()
print("quiz_answers columns:")
for row in r4:
    print(f"  {row[0]}: {row[1]}")

print()

# quiz_options sample
rows = db.execute(text("SELECT * FROM quiz_options LIMIT 5")).fetchall()
print("quiz_options sample:")
for row in rows:
    print(dict(row._mapping))

db.close()
