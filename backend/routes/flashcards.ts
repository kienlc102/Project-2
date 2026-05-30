import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================
// MULTER CONFIG - Image Upload
// ============================================
const uploadsDir = path.join(__dirname, '..', 'uploads', 'flashcards');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `flashcard-${uniqueSuffix}${ext}`);
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
// POST /api/flashcards/upload
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
    const url = `/uploads/flashcards/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  });
});

// ============================================
// CREATE FLASHCARD SET
// POST /api/flashcards/sets
// ============================================
router.post('/sets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, visibility, cards } = req.body;
    const userId = req.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!cards || !Array.isArray(cards) || cards.length < 2) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 2 thẻ' });
    }

    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].term?.trim() || !cards[i].definition?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Thẻ ${i + 1}: Thuật ngữ và định nghĩa không được để trống`,
        });
      }
    }

    const vis = visibility === 'private' ? 'private' : 'public';

    const setResult = await query(
      `INSERT INTO public.flashcard_sets (user_id, title, description, visibility)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [userId, title.trim(), description?.trim() || null, vis]
    );

    const setId = setResult.rows[0].id;

    // Insert cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      await query(
        `INSERT INTO public.flashcards (set_id, term, definition, term_image_url, definition_image_url, position)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [setId, card.term.trim(), card.definition.trim(), card.termImageUrl || null, card.definitionImageUrl || null, i]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tạo bộ flashcard thành công',
      data: { id: setId },
    });
  } catch (error) {
    console.error('Create flashcard set error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// GET ALL SETS (browse, search)
// GET /api/flashcards/sets?search=&page=&limit=&filter=
// ============================================
router.get('/sets', async (req: any, res: Response) => {
  try {
    // Optional auth - try to extract userId
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
    const filter = req.query.filter as string; // 'my' | 'public' | undefined

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (filter === 'my' && currentUserId) {
      whereConditions.push(`fs.user_id = $${paramIndex++}`);
      params.push(currentUserId);
    } else {
      // Show public sets + own private sets
      if (currentUserId) {
        whereConditions.push(`(fs.visibility = 'public' OR fs.user_id = $${paramIndex++})`);
        params.push(currentUserId);
      } else {
        whereConditions.push(`fs.visibility = 'public'`);
      }
    }

    if (search.trim()) {
      whereConditions.push(`(LOWER(fs.title) LIKE $${paramIndex} OR LOWER(fs.description) LIKE $${paramIndex})`);
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM public.flashcard_sets fs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get sets with card count and author info
    const setsResult = await query(
      `SELECT fs.id, fs.title, fs.description, fs.visibility, fs.created_at, fs.updated_at,
              fs.user_id, u.full_name as author_name,
              (SELECT COUNT(*) FROM public.flashcards f WHERE f.set_id = fs.id) as card_count
       FROM public.flashcard_sets fs
       JOIN public.users u ON u.id = fs.user_id
       ${whereClause}
       ORDER BY fs.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        sets: setsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get flashcard sets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// GET SINGLE SET WITH CARDS
// GET /api/flashcards/sets/:id
// ============================================
router.get('/sets/:id', async (req: any, res: Response) => {
  try {
    const setId = parseInt(req.params.id);
    if (isNaN(setId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Optional auth
    let currentUserId: number | null = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pj2') as any;
        currentUserId = decoded.userId;
      } catch {}
    }

    // Get set info
    const setResult = await query(
      `SELECT fs.*, u.full_name as author_name
       FROM public.flashcard_sets fs
       JOIN public.users u ON u.id = fs.user_id
       WHERE fs.id = $1`,
      [setId]
    );

    if (setResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ flashcard' });
    }

    const set = setResult.rows[0];

    // Check visibility
    if (set.visibility === 'private' && set.user_id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Bộ flashcard này là riêng tư' });
    }

    // Get cards
    const cardsResult = await query(
      `SELECT id, term, definition, term_image_url, definition_image_url, position
       FROM public.flashcards
       WHERE set_id = $1
       ORDER BY position ASC`,
      [setId]
    );

    res.json({
      success: true,
      data: {
        ...set,
        cards: cardsResult.rows,
        isOwner: set.user_id === currentUserId,
      },
    });
  } catch (error) {
    console.error('Get flashcard set error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// UPDATE FLASHCARD SET
// PUT /api/flashcards/sets/:id
// ============================================
router.put('/sets/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const setId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(setId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Check ownership
    const ownership = await query(
      `SELECT user_id FROM public.flashcard_sets WHERE id = $1`,
      [setId]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ flashcard' });
    }
    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa' });
    }

    const { title, description, visibility, cards } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!cards || !Array.isArray(cards) || cards.length < 2) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 2 thẻ' });
    }

    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].term?.trim() || !cards[i].definition?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Thẻ ${i + 1}: Thuật ngữ và định nghĩa không được để trống`,
        });
      }
    }

    const vis = visibility === 'private' ? 'private' : 'public';

    // Update set
    await query(
      `UPDATE public.flashcard_sets SET title = $1, description = $2, visibility = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [title.trim(), description?.trim() || null, vis, setId]
    );

    // Delete old cards and re-insert
    await query(`DELETE FROM public.flashcards WHERE set_id = $1`, [setId]);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      await query(
        `INSERT INTO public.flashcards (set_id, term, definition, term_image_url, definition_image_url, position)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [setId, card.term.trim(), card.definition.trim(), card.termImageUrl || null, card.definitionImageUrl || null, i]
      );
    }

    res.json({
      success: true,
      message: 'Cập nhật bộ flashcard thành công',
    });
  } catch (error) {
    console.error('Update flashcard set error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================
// DELETE FLASHCARD SET
// DELETE /api/flashcards/sets/:id
// ============================================
router.delete('/sets/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const setId = parseInt(req.params.id);
    const userId = req.userId;

    if (isNaN(setId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Check ownership
    const ownership = await query(
      `SELECT user_id FROM public.flashcard_sets WHERE id = $1`,
      [setId]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ flashcard' });
    }
    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa' });
    }

    // Delete set (cards cascade)
    await query(`DELETE FROM public.flashcard_sets WHERE id = $1`, [setId]);

    res.json({
      success: true,
      message: 'Xóa bộ flashcard thành công',
    });
  } catch (error) {
    console.error('Delete flashcard set error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
