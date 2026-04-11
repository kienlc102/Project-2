import { Router, Response } from 'express';
import { query, getClient } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================
// MULTER CONFIG - Quiz Image Upload
// ============================================
const uploadsDir = path.join(__dirname, '..', 'uploads', 'quizzes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `quiz-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ============================================
// UPLOAD IMAGE
// POST /api/quizzes/upload
// ============================================
router.post('/upload', authMiddleware, (req: AuthRequest, res: Response) => {
  upload.single('image')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File quá lớn (tối đa 5MB)' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }
    const url = `/uploads/quizzes/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  });
});

// ============================================
// CREATE QUIZ
// POST /api/quizzes
// ============================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { title, description, visibility, questions } = req.body;
    const userId = req.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!questions || !Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 1 câu hỏi' });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Câu hỏi ${i + 1}: Nội dung câu hỏi không được để trống`,
        });
      }
      const validTypes = ['multiple_choice', 'checkboxes', 'short_answer', 'paragraph', 'dropdown'];
      if (!validTypes.includes(q.questionType)) {
        return res.status(400).json({
          success: false,
          message: `Câu hỏi ${i + 1}: Loại câu hỏi không hợp lệ`,
        });
      }
      // Validate options for choice-based types
      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType)) {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi ${i + 1}: Cần ít nhất 2 lựa chọn`,
          });
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text?.trim()) {
            return res.status(400).json({
              success: false,
              message: `Câu hỏi ${i + 1}, Lựa chọn ${j + 1}: Nội dung không được để trống`,
            });
          }
        }
      }
    }

    const vis = visibility === 'private' ? 'private' : 'public';

    // Insert quiz
    const quizResult = await client.query(
      `INSERT INTO public.quizzes (user_id, title, description, visibility)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [userId, title.trim(), description?.trim() || null, vis]
    );
    const quizId = quizResult.rows[0].id;

    // Insert questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionResult = await client.query(
        `INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, image_url, is_required, points, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          quizId,
          q.questionText.trim(),
          q.questionType,
          q.imageUrl || null,
          q.isRequired || false,
          q.points || 1,
          i,
        ]
      );
      const questionId = questionResult.rows[0].id;

      // Insert options for choice-based types
      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType) && q.options) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await client.query(
            `INSERT INTO public.quiz_options (question_id, option_text, is_correct, position)
             VALUES ($1, $2, $3, $4)`,
            [questionId, opt.text.trim(), opt.isCorrect || false, j]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tạo quiz thành công',
      data: { id: quizId },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
});

// ============================================
// GET ALL QUIZZES
// GET /api/quizzes?search=&page=&limit=&filter=
// ============================================
router.get('/', async (req: any, res: Response) => {
  try {
    let currentUserId: number | null = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pj2') as any;
        currentUserId = decoded.userId;
      } catch {}
    }

    const search = (req.query.search as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const offset = (page - 1) * limit;
    const filter = req.query.filter as string;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (filter === 'my' && currentUserId) {
      whereConditions.push(`q.user_id = $${paramIndex++}`);
      params.push(currentUserId);
    } else {
      if (currentUserId) {
        whereConditions.push(`(q.visibility = 'public' OR q.user_id = $${paramIndex++})`);
        params.push(currentUserId);
      } else {
        whereConditions.push(`q.visibility = 'public'`);
      }
    }

    if (search.trim()) {
      whereConditions.push(`(LOWER(q.title) LIKE $${paramIndex} OR LOWER(q.description) LIKE $${paramIndex})`);
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM public.quizzes q ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const quizzesResult = await query(
      `SELECT q.id, q.title, q.description, q.visibility, q.created_at, q.updated_at,
              q.user_id, u.full_name as author_name,
              (SELECT COUNT(*) FROM public.quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
       FROM public.quizzes q
       JOIN public.users u ON u.id = q.user_id
       ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        quizzes: quizzesResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// GET SINGLE QUIZ WITH QUESTIONS & OPTIONS
// GET /api/quizzes/:id
// ============================================
router.get('/:id', async (req: any, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    let currentUserId: number | null = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pj2') as any;
        currentUserId = decoded.userId;
      } catch {}
    }

    const quizResult = await query(
      `SELECT q.*, u.full_name as author_name
       FROM public.quizzes q
       JOIN public.users u ON u.id = q.user_id
       WHERE q.id = $1`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }

    const quiz = quizResult.rows[0];

    if (quiz.visibility === 'private' && quiz.user_id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Quiz này là riêng tư' });
    }

    // Get questions
    const questionsResult = await query(
      `SELECT id, question_text, question_type, image_url, is_required, points, position
       FROM public.quiz_questions
       WHERE quiz_id = $1
       ORDER BY position ASC`,
      [quizId]
    );

    // Get options for all questions
    const questionIds = questionsResult.rows.map((q: any) => q.id);
    let optionsMap: Record<number, any[]> = {};

    if (questionIds.length > 0) {
      const optionsResult = await query(
        `SELECT id, question_id, option_text, is_correct, position
         FROM public.quiz_options
         WHERE question_id = ANY($1)
         ORDER BY position ASC`,
        [questionIds]
      );

      for (const opt of optionsResult.rows) {
        if (!optionsMap[opt.question_id]) {
          optionsMap[opt.question_id] = [];
        }
        optionsMap[opt.question_id].push(opt);
      }
    }

    const questions = questionsResult.rows.map((q: any) => ({
      ...q,
      options: optionsMap[q.id] || [],
    }));

    res.json({
      success: true,
      data: {
        ...quiz,
        questions,
        isOwner: quiz.user_id === currentUserId,
      },
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// UPDATE QUIZ
// PUT /api/quizzes/:id
// ============================================
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const ownership = await client.query(
      `SELECT user_id FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa' });
    }

    const { title, description, visibility, questions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!questions || !Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 1 câu hỏi' });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Câu hỏi ${i + 1}: Nội dung câu hỏi không được để trống`,
        });
      }
      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType)) {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi ${i + 1}: Cần ít nhất 2 lựa chọn`,
          });
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text?.trim()) {
            return res.status(400).json({
              success: false,
              message: `Câu hỏi ${i + 1}, Lựa chọn ${j + 1}: Nội dung không được để trống`,
            });
          }
        }
      }
    }

    await client.query('BEGIN');

    const vis = visibility === 'private' ? 'private' : 'public';

    // Update quiz
    await client.query(
      `UPDATE public.quizzes SET title = $1, description = $2, visibility = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [title.trim(), description?.trim() || null, vis, quizId]
    );

    // Delete old questions & options (cascade will delete options)
    await client.query(`DELETE FROM public.quiz_questions WHERE quiz_id = $1`, [quizId]);

    // Insert new questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionResult = await client.query(
        `INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, image_url, is_required, points, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          quizId,
          q.questionText.trim(),
          q.questionType,
          q.imageUrl || null,
          q.isRequired || false,
          q.points || 1,
          i,
        ]
      );
      const questionId = questionResult.rows[0].id;

      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType) && q.options) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await client.query(
            `INSERT INTO public.quiz_options (question_id, option_text, is_correct, position)
             VALUES ($1, $2, $3, $4)`,
            [questionId, opt.text.trim(), opt.isCorrect || false, j]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Cập nhật quiz thành công',
      data: { id: quizId },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update quiz error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE QUIZ
// DELETE /api/quizzes/:id
// ============================================
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const ownership = await query(
      `SELECT user_id FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa' });
    }

    await query(`DELETE FROM public.quizzes WHERE id = $1`, [quizId]);

    res.json({ success: true, message: 'Xóa quiz thành công' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
