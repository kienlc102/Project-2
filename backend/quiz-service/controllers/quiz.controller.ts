import { Response } from 'express';
import { query, getClient } from '../db';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * UPLOAD IMAGE
 */
export const uploadImage = (req: AuthRequest, res: Response) => {
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
};

/**
 * CREATE QUIZ
 */
export const createQuiz = async (req: AuthRequest, res: Response) => {
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

    const quizResult = await client.query(
      `INSERT INTO public.quizzes (user_id, title, description, visibility)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [userId, title.trim(), description?.trim() || null, vis]
    );
    const quizId = quizResult.rows[0].id;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionResult = await client.query(
        `INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, image_url, is_required, points, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [quizId, q.questionText.trim(), q.questionType, q.imageUrl || null, q.isRequired || false, q.points || 1, i]
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
};

/**
 * GET ALL QUIZZES
 */
export const getAllQuizzes = async (req: any, res: Response) => {
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
};

/**
 * GET SINGLE QUIZ WITH QUESTIONS & OPTIONS
 */
export const getQuiz = async (req: any, res: Response) => {
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

    const questionsResult = await query(
      `SELECT id, question_text, question_type, image_url, is_required, points, position
       FROM public.quiz_questions
       WHERE quiz_id = $1
       ORDER BY position ASC`,
      [quizId]
    );

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
};

/**
 * UPDATE QUIZ
 */
export const updateQuiz = async (req: AuthRequest, res: Response) => {
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

    await client.query(
      `UPDATE public.quizzes SET title = $1, description = $2, visibility = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [title.trim(), description?.trim() || null, vis, quizId]
    );

    // Collect IDs of questions being kept (sent from frontend with dbId)
    const keptQuestionDbIds: number[] = questions
      .map((q: any) => q.dbId)
      .filter((id: any) => typeof id === 'number');

    // Delete questions that are no longer in the submission (CASCADE deletes their answers + options)
    if (keptQuestionDbIds.length > 0) {
      await client.query(
        `DELETE FROM public.quiz_questions WHERE quiz_id = $1 AND id != ALL($2)`,
        [quizId, keptQuestionDbIds]
      );
    } else {
      await client.query(`DELETE FROM public.quiz_questions WHERE quiz_id = $1`, [quizId]);
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let questionId: number;

      if (q.dbId) {
        // Update existing question in place (preserves question_id → preserves quiz_answers)
        await client.query(
          `UPDATE public.quiz_questions SET question_text = $1, question_type = $2, image_url = $3, is_required = $4, points = $5, position = $6 WHERE id = $7 AND quiz_id = $8`,
          [q.questionText.trim(), q.questionType, q.imageUrl || null, q.isRequired || false, q.points || 1, i, q.dbId, quizId]
        );
        questionId = q.dbId;
      } else {
        // Insert new question
        const questionResult = await client.query(
          `INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, image_url, is_required, points, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [quizId, q.questionText.trim(), q.questionType, q.imageUrl || null, q.isRequired || false, q.points || 1, i]
        );
        questionId = questionResult.rows[0].id;
      }

      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType) && q.options) {
        // Collect kept option IDs
        const keptOptionDbIds: number[] = q.options
          .map((o: any) => o.dbId)
          .filter((id: any) => typeof id === 'number');

        // Delete removed options
        if (keptOptionDbIds.length > 0) {
          await client.query(
            `DELETE FROM public.quiz_options WHERE question_id = $1 AND id != ALL($2)`,
            [questionId, keptOptionDbIds]
          );
        } else {
          await client.query(`DELETE FROM public.quiz_options WHERE question_id = $1`, [questionId]);
        }

        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (opt.dbId) {
            // Update existing option in place
            await client.query(
              `UPDATE public.quiz_options SET option_text = $1, is_correct = $2, position = $3 WHERE id = $4 AND question_id = $5`,
              [opt.text.trim(), opt.isCorrect || false, j, opt.dbId, questionId]
            );
          } else {
            // Insert new option
            await client.query(
              `INSERT INTO public.quiz_options (question_id, option_text, is_correct, position)
               VALUES ($1, $2, $3, $4)`,
              [questionId, opt.text.trim(), opt.isCorrect || false, j]
            );
          }
        }
      } else {
        // Not an option-based type anymore, remove old options
        await client.query(`DELETE FROM public.quiz_options WHERE question_id = $1`, [questionId]);
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
};

/**
 * DELETE QUIZ
 */
export const deleteQuiz = async (req: AuthRequest, res: Response) => {
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
};

/**
 * SUBMIT QUIZ (Take quiz)
 */
export const submitQuiz = async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu câu trả lời không hợp lệ' });
    }

    const quizResult = await client.query(
      `SELECT id, visibility, user_id FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }

    const quiz = quizResult.rows[0];
    if (quiz.visibility === 'private' && quiz.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Quiz này là riêng tư' });
    }

    const questionsResult = await client.query(
      `SELECT id, question_type, is_required, points FROM public.quiz_questions WHERE quiz_id = $1 ORDER BY position ASC`,
      [quizId]
    );

    const questionIds = questionsResult.rows.map((q: any) => q.id);
    let correctOptionsMap: Record<number, number[]> = {};

    if (questionIds.length > 0) {
      const correctOptions = await client.query(
        `SELECT id, question_id FROM public.quiz_options WHERE question_id = ANY($1) AND is_correct = true`,
        [questionIds]
      );
      for (const opt of correctOptions.rows) {
        if (!correctOptionsMap[opt.question_id]) {
          correctOptionsMap[opt.question_id] = [];
        }
        correctOptionsMap[opt.question_id].push(opt.id);
      }
    }

    for (const q of questionsResult.rows) {
      if (q.is_required) {
        const answer = answers.find((a: any) => a.questionId === q.id);
        if (!answer) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi bắt buộc chưa được trả lời`,
          });
        }
        if (
          ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type) &&
          (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0)
        ) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi bắt buộc chưa được trả lời`,
          });
        }
        if (
          ['short_answer', 'paragraph'].includes(q.question_type) &&
          (!answer.textAnswer || !answer.textAnswer.trim())
        ) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi bắt buộc chưa được trả lời`,
          });
        }
      }
    }

    await client.query('BEGIN');

    let totalScore = 0;
    let totalPoints = 0;

    const attemptResult = await client.query(
      `INSERT INTO public.quiz_attempts (quiz_id, user_id) VALUES ($1, $2) RETURNING id`,
      [quizId, userId]
    );
    const attemptId = attemptResult.rows[0].id;

    for (const q of questionsResult.rows) {
      totalPoints += q.points;
      const answer = answers.find((a: any) => a.questionId === q.id);

      let isCorrect = false;
      let pointsEarned = 0;
      let selectedOptionIds: number[] = [];
      let textAnswer: string | null = null;

      if (answer) {
        if (['multiple_choice', 'dropdown'].includes(q.question_type)) {
          selectedOptionIds = answer.selectedOptionIds || [];
          const correctIds = correctOptionsMap[q.id] || [];
          if (
            correctIds.length > 0 &&
            selectedOptionIds.length === 1 &&
            correctIds.includes(selectedOptionIds[0])
          ) {
            isCorrect = true;
            pointsEarned = q.points;
          }
        } else if (q.question_type === 'checkboxes') {
          selectedOptionIds = answer.selectedOptionIds || [];
          const correctIds = correctOptionsMap[q.id] || [];
          if (correctIds.length > 0) {
            const allCorrectSelected = correctIds.every((id: number) => selectedOptionIds.includes(id));
            const noIncorrect = selectedOptionIds.every((id: number) => correctIds.includes(id));
            if (allCorrectSelected && noIncorrect) {
              isCorrect = true;
              pointsEarned = q.points;
            }
          }
        } else {
          textAnswer = answer.textAnswer || null;
        }
      }

      totalScore += pointsEarned;

      await client.query(
        `INSERT INTO public.quiz_answers (attempt_id, question_id, selected_option_ids, text_answer, is_correct, points_earned)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [attemptId, q.id, selectedOptionIds, textAnswer, isCorrect, pointsEarned]
      );
    }

    await client.query(
      `UPDATE public.quiz_attempts SET score = $1, total_points = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [totalScore, totalPoints, attemptId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Nộp bài thành công',
      data: {
        attemptId,
        score: totalScore,
        totalPoints,
        percentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Submit quiz error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
};

/**
 * GET QUIZ ANALYTICS (Summary) — Owner only
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const quizResult = await query(
      `SELECT id, user_id, title FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (quizResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem analytics' });
    }

    const attemptsCount = await query(
      `SELECT COUNT(*) as total, 
              COALESCE(AVG(score), 0) as avg_score, 
              COALESCE(AVG(total_points), 0) as avg_total,
              COALESCE(MAX(score), 0) as max_score,
              COALESCE(MIN(score), 0) as min_score
       FROM public.quiz_attempts WHERE quiz_id = $1`,
      [quizId]
    );

    const summary = attemptsCount.rows[0];

    const questionsResult = await query(
      `SELECT qq.id, qq.question_text, qq.question_type, qq.points, qq.position,
              COUNT(qa.id) as total_answers,
              SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_count,
              SUM(CASE WHEN NOT qa.is_correct AND qa.selected_option_ids != '{}' THEN 1 ELSE 0 END) as incorrect_count
       FROM public.quiz_questions qq
       LEFT JOIN public.quiz_answers qa ON qa.question_id = qq.id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id, qq.question_text, qq.question_type, qq.points, qq.position
       ORDER BY qq.position ASC`,
      [quizId]
    );

    const questionIds = questionsResult.rows.map((q: any) => q.id);
    let optionDistribution: Record<number, any[]> = {};

    if (questionIds.length > 0) {
      const optionsResult = await query(
        `SELECT qo.id, qo.question_id, qo.option_text, qo.is_correct, qo.position,
                COUNT(qa.id) FILTER (WHERE qo.id = ANY(qa.selected_option_ids)) as selection_count
         FROM public.quiz_options qo
         LEFT JOIN public.quiz_answers qa ON qa.question_id = qo.question_id
         WHERE qo.question_id = ANY($1)
         GROUP BY qo.id, qo.question_id, qo.option_text, qo.is_correct, qo.position
         ORDER BY qo.position ASC`,
        [questionIds]
      );

      for (const opt of optionsResult.rows) {
        if (!optionDistribution[opt.question_id]) {
          optionDistribution[opt.question_id] = [];
        }
        optionDistribution[opt.question_id].push({
          id: opt.id,
          text: opt.option_text,
          isCorrect: opt.is_correct,
          selectionCount: parseInt(opt.selection_count) || 0,
        });
      }
    }

    const questionAnalytics = questionsResult.rows.map((q: any) => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      points: q.points,
      totalAnswers: parseInt(q.total_answers) || 0,
      correctCount: parseInt(q.correct_count) || 0,
      incorrectCount: parseInt(q.incorrect_count) || 0,
      correctPercentage:
        parseInt(q.total_answers) > 0
          ? Math.round((parseInt(q.correct_count) / parseInt(q.total_answers)) * 100)
          : 0,
      options: optionDistribution[q.id] || [],
    }));

    res.json({
      success: true,
      data: {
        quizTitle: quizResult.rows[0].title,
        summary: {
          totalAttempts: parseInt(summary.total) || 0,
          averageScore: parseFloat(parseFloat(summary.avg_score).toFixed(1)),
          averageTotal: parseFloat(parseFloat(summary.avg_total).toFixed(1)),
          averagePercentage:
            parseFloat(summary.avg_total) > 0
              ? Math.round((parseFloat(summary.avg_score) / parseFloat(summary.avg_total)) * 100)
              : 0,
          highestScore: parseInt(summary.max_score) || 0,
          lowestScore: parseInt(summary.min_score) || 0,
        },
        questions: questionAnalytics,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

/**
 * GET ALL RESPONSES (per user) — Owner only
 */
export const getResponses = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const quizResult = await query(
      `SELECT user_id FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (quizResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem responses' });
    }

    const responsesResult = await query(
      `SELECT qa.id, qa.quiz_id, qa.user_id, qa.score, qa.total_points, qa.started_at, qa.completed_at,
              u.full_name as user_name, u.email as user_email
       FROM public.quiz_attempts qa
       JOIN public.users u ON u.id = qa.user_id
       WHERE qa.quiz_id = $1
       ORDER BY qa.completed_at DESC`,
      [quizId]
    );

    const responses = responsesResult.rows.map((r: any) => ({
      ...r,
      percentage: r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0,
    }));

    res.json({
      success: true,
      data: { responses },
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

/**
 * GET SINGLE RESPONSE DETAIL — Owner only
 */
export const getResponseDetail = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const attemptId = parseInt(req.params.attemptId);
    const userId = req.userId;

    if (isNaN(quizId) || isNaN(attemptId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const quizResult = await query(
      `SELECT user_id FROM public.quizzes WHERE id = $1`,
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
    }
    if (quizResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem response này' });
    }

    const attemptResult = await query(
      `SELECT qa.*, u.full_name as user_name, u.email as user_email
       FROM public.quiz_attempts qa
       JOIN public.users u ON u.id = qa.user_id
       WHERE qa.id = $1 AND qa.quiz_id = $2`,
      [attemptId, quizId]
    );
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy response' });
    }

    const attempt = attemptResult.rows[0];

    const answersResult = await query(
      `SELECT qa.question_id, qa.selected_option_ids, qa.text_answer, qa.is_correct, qa.points_earned,
              qq.question_text, qq.question_type, qq.points as max_points, qq.position
       FROM public.quiz_answers qa
       JOIN public.quiz_questions qq ON qq.id = qa.question_id
       WHERE qa.attempt_id = $1
       ORDER BY qq.position ASC`,
      [attemptId]
    );

    const questionIds = answersResult.rows.map((a: any) => a.question_id);
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

    const answers = answersResult.rows.map((a: any) => ({
      ...a,
      options: optionsMap[a.question_id] || [],
    }));

    res.json({
      success: true,
      data: {
        attempt: {
          ...attempt,
          percentage: attempt.total_points > 0 ? Math.round((attempt.score / attempt.total_points) * 100) : 0,
        },
        answers,
      },
    });
  } catch (error) {
    console.error('Get response detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

/**
 * GET MY ATTEMPTS
 */
export const getMyAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(quizId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const attemptsResult = await query(
      `SELECT id, score, total_points, started_at, completed_at
       FROM public.quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY completed_at DESC`,
      [quizId, userId]
    );

    const attempts = attemptsResult.rows.map((a: any) => ({
      ...a,
      percentage: a.total_points > 0 ? Math.round((a.score / a.total_points) * 100) : 0,
    }));

    res.json({
      success: true,
      data: { attempts },
    });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

/**
 * GET MY ATTEMPT DETAIL
 */
export const getMyAttemptDetail = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const attemptId = parseInt(req.params.attemptId);
    const userId = req.userId;

    if (isNaN(quizId) || isNaN(attemptId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const attemptResult = await query(
      `SELECT * FROM public.quiz_attempts WHERE id = $1 AND quiz_id = $2 AND user_id = $3`,
      [attemptId, quizId, userId]
    );
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài làm' });
    }

    const attempt = attemptResult.rows[0];

    const answersResult = await query(
      `SELECT qa.question_id, qa.selected_option_ids, qa.text_answer, qa.is_correct, qa.points_earned,
              qq.question_text, qq.question_type, qq.points as max_points, qq.image_url, qq.position
       FROM public.quiz_answers qa
       JOIN public.quiz_questions qq ON qq.id = qa.question_id
       WHERE qa.attempt_id = $1
       ORDER BY qq.position ASC`,
      [attemptId]
    );

    const questionIds = answersResult.rows.map((a: any) => a.question_id);
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
        if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
        optionsMap[opt.question_id].push(opt);
      }
    }

    const answers = answersResult.rows.map((a: any) => ({
      ...a,
      options: optionsMap[a.question_id] || [],
    }));

    res.json({
      success: true,
      data: {
        attempt: {
          ...attempt,
          percentage: attempt.total_points > 0 ? Math.round((attempt.score / attempt.total_points) * 100) : 0,
        },
        answers,
      },
    });
  } catch (error) {
    console.error('Get my attempt detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
