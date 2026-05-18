import { Router, Request, Response } from 'express';
import { generateFlashcardsAndQuiz } from '../services/aiGenerator';
import { getClient } from '../db';

interface AIFlashcard {
  term: string;
  definition: string;
}

interface AIQuizQuestion {
  question: string;
  options: string[];       // AI returns options as plain strings: ["A. ...", "B. ..."]
  correct_index: number;   // AI returns the index of the correct answer
}

interface AIResult {
  flashcard_title: string;
  flashcard_description?: string;
  flashcards: AIFlashcard[];
  quiz_title: string;
  quiz_description?: string;
  questions: AIQuizQuestion[];
}

const router = Router();

/**
 * POST /api/generate/:docId
 * Queries document from DB, generates AI flashcards+quiz, saves to DB.
 * Returns: { message, flashcard_set_id, quiz_id }
 */
router.post('/generate/:docId', async (req: Request, res: Response) => {
  const { docId } = req.params;

  const client = await getClient();
  try {
    // 1. Fetch document
    const docResult = await client.query(
      'SELECT id, ocr_content, owner_id, file_name FROM documents WHERE id = $1',
      [docId]
    );

    if (docResult.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];

    if (!doc.ocr_content || !doc.ocr_content.trim()) {
      return res.status(422).json({ error: 'Document has no text content for AI generation' });
    }

    // 2. Run AI generation
    const rawResult = await generateFlashcardsAndQuiz(doc.ocr_content, doc.file_name ?? 'document');

    if (!rawResult) {
      return res.status(503).json({
        error: 'AI đang bận (rate limit). Vui lòng thử lại sau 30 giây.',
      });
    }

    const aiResult = rawResult as unknown as AIResult;

    await client.query('BEGIN');

    // 3. Save flashcard set
    const fsResult = await client.query(
      `INSERT INTO flashcard_sets (user_id, title, description, visibility)
       VALUES ($1, $2, $3, 'public') RETURNING id`,
      [doc.owner_id, aiResult.flashcard_title, aiResult.flashcard_description ?? '']
    );
    const flashcardSetId: number = fsResult.rows[0].id;

    // 4. Save individual flashcards
    for (let i = 0; i < aiResult.flashcards.length; i++) {
      const card = aiResult.flashcards[i];
      await client.query(
        `INSERT INTO flashcards (set_id, term, definition, position)
         VALUES ($1, $2, $3, $4)`,
        [flashcardSetId, card.term, card.definition, i]
      );
    }

    // 5. Link flashcard_set to document (if column exists)
    try {
      await client.query(
        'UPDATE flashcard_sets SET document_id = $1 WHERE id = $2',
        [docId, flashcardSetId]
      );
    } catch {
      // Column may not exist if migration hasn't run — skip silently
    }

    // 6. Save quiz
    const quizResult = await client.query(
      `INSERT INTO quizzes (user_id, title, description, visibility)
       VALUES ($1, $2, $3, 'public') RETURNING id`,
      [doc.owner_id, aiResult.quiz_title, aiResult.quiz_description ?? '']
    );
    const quizId: number = quizResult.rows[0].id;

    // 7. Save quiz questions + options
    for (let qi = 0; qi < aiResult.questions.length; qi++) {
      const q = aiResult.questions[qi];
      const qResult = await client.query(
        `INSERT INTO quiz_questions (quiz_id, question_text, question_type, position)
         VALUES ($1, $2, 'multiple_choice', $3) RETURNING id`,
        [quizId, q.question, qi]
      );
      const questionId: number = qResult.rows[0].id;

      for (let oi = 0; oi < (q.options ?? []).length; oi++) {
        await client.query(
          `INSERT INTO quiz_options (question_id, option_text, is_correct, position)
           VALUES ($1, $2, $3, $4)`,
          [questionId, q.options[oi], oi === q.correct_index, oi]
        );
      }
    }

    // 8. Link quiz to document (if column exists)
    try {
      await client.query(
        'UPDATE quizzes SET document_id = $1 WHERE id = $2',
        [docId, quizId]
      );
    } catch {
      // Column may not exist — skip silently
    }

    await client.query('COMMIT');

    return res.json({
      message: 'AI generation complete',
      flashcard_set_id: flashcardSetId,
      quiz_id: quizId,
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[generate-doc] Error:', err);
    return res.status(500).json({ error: 'Internal server error during AI generation' });
  } finally {
    client.release();
  }
});

export default router;
