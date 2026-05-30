"""
Migration: quiz_questions + quiz_options -> questions table

Copies all existing quiz data from the old schema into the new `questions` table
that the FastAPI backend reads from.
"""

import json
import sys
from app.db.database import SessionLocal
from sqlalchemy import text

KEYS = ["A", "B", "C", "D", "E"]

def migrate():
    db = SessionLocal()
    try:
        # Check existing rows to avoid duplicates
        existing_quiz_ids = {
            row[0] for row in db.execute(text("SELECT DISTINCT quiz_id FROM questions")).fetchall()
        }

        # Get all quiz_questions
        quiz_questions = db.execute(text(
            "SELECT id, quiz_id, question_text FROM quiz_questions ORDER BY quiz_id, position, id"
        )).fetchall()

        inserted = 0
        skipped = 0

        for qq in quiz_questions:
            qq_id, quiz_id, question_text = qq[0], qq[1], qq[2]

            if quiz_id in existing_quiz_ids:
                skipped += 1
                continue

            # Get options for this question, ordered by position
            opts = db.execute(text(
                "SELECT option_text, is_correct, position FROM quiz_options "
                "WHERE question_id = :qid ORDER BY position, id"
            ), {"qid": qq_id}).fetchall()

            if not opts:
                print(f"  SKIP question {qq_id} (no options)", file=sys.stderr)
                continue

            options_list = []
            correct_answer = None

            for i, opt in enumerate(opts):
                option_text, is_correct, position = opt[0], opt[1], opt[2]
                key = KEYS[i] if i < len(KEYS) else str(i + 1)

                # Strip "A. ", "B. " prefix if already present in the text
                stripped = option_text.strip()
                if len(stripped) >= 3 and stripped[1] == '.' and stripped[0] in 'ABCDE':
                    stripped = stripped[3:].strip()

                options_list.append({"key": key, "text": stripped})

                if is_correct:
                    correct_answer = key

            if correct_answer is None and opts:
                # Fallback: mark first option as correct
                correct_answer = KEYS[0]
                print(f"  WARN question {qq_id}: no is_correct flag, defaulting to A")

            db.execute(text(
                "INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) "
                "VALUES (:quiz_id, :question_text, :options, :correct_answer, :explanation)"
            ), {
                "quiz_id": quiz_id,
                "question_text": question_text,
                "options": json.dumps(options_list, ensure_ascii=False),
                "correct_answer": correct_answer,
                "explanation": None
            })
            inserted += 1

        db.commit()
        print(f"Migration done: {inserted} questions inserted, {skipped} skipped (already had data).")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
