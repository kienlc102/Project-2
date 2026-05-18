import { Router, Request, Response } from 'express';
import { generateFlashcardsAndQuiz } from '../services/aiGenerator';

const router = Router();

/**
 * POST /api/generate
 * Body: { text: string, filename: string }
 * Returns: AI-generated flashcards + quiz JSON, or 503 if all providers fail.
 */
router.post('/generate', async (req: Request, res: Response) => {
  const { text, filename } = req.body as { text?: string; filename?: string };

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const result = await generateFlashcardsAndQuiz(text, filename ?? 'document');

  if (!result) {
    return res
      .status(503)
      .json({ error: 'AI đang bận (rate limit). Vui lòng thử lại sau 30 giây.' });
  }

  return res.json(result);
});

export default router;
