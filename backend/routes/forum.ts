import { Router, Response } from 'express';
import { query, getClient } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================
// MULTER CONFIG - Forum Attachment Upload
// ============================================
const uploadsDir = path.join(__dirname, '..', 'uploads', 'forum');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `forum-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIMETYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Plain text & source code
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'text/x-python',
  'text/x-c',
  'text/x-c++',
  'text/x-java-source',
  'text/x-csrc',
  'text/x-csharp',
  'text/x-go',
  'text/x-rust',
  'text/x-typescript',
  'text/markdown',
  // Archives
  'application/zip',
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.json', '.xml', '.html', '.css',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp',
  '.h', '.hpp', '.cs', '.go', '.rs', '.php', '.rb', '.swift',
  '.kt', '.scala', '.r', '.sql', '.sh', '.bat', '.ps1',
  '.yaml', '.yml', '.toml', '.ini', '.env', '.zip',
];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không được hỗ trợ: ${ext}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

// ============================================
// INIT TABLES
// ============================================
export const initForumTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}',
      attachments JSONB DEFAULT '[]',
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS forum_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS forum_votes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
      target_id INTEGER NOT NULL,
      target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'comment')),
      vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up', 'down')),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (user_id, target_id, target_type)
    )
  `);
};

// ============================================
// UPLOAD ATTACHMENT
// POST /api/forum/upload
// ============================================
router.post('/upload', authMiddleware, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File quá lớn (tối đa 20MB)' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }
    const url = `/uploads/forum/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  });
});

// ============================================
// GET POSTS
// GET /api/forum/posts?page=1&limit=20&search=&tag=
// ============================================
router.get('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();
    const tag = (req.query.tag as string || '').trim();

    let whereClause = '';
    const params: any[] = [];
    let paramIdx = 1;

    const conditions: string[] = [];
    if (search) {
      conditions.push(`(fp.title ILIKE $${paramIdx} OR fp.content ILIKE $${paramIdx + 1} OR array_to_string(fp.tags, ' ') ILIKE $${paramIdx + 2} OR fc_search.content ILIKE $${paramIdx + 3})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      paramIdx += 4;
    }
    if (tag) {
      conditions.push(`$${paramIdx} = ANY(fp.tags)`);
      params.push(tag);
      paramIdx++;
    }
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const countResult = await query(
      `SELECT COUNT(DISTINCT fp.id) FROM forum_posts fp
       LEFT JOIN forum_comments fc_search ON fc_search.post_id = fp.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const postsResult = await query(
      `SELECT DISTINCT ON (fp.id, fp.created_at) fp.*, u.full_name, u.email,
        COALESCE(fp.upvotes, 0) - COALESCE(fp.downvotes, 0) as score
       FROM forum_posts fp
       LEFT JOIN public.users u ON u.id = fp.user_id
       LEFT JOIN forum_comments fc_search ON fc_search.post_id = fp.id
       ${whereClause}
       ORDER BY fp.created_at DESC, fp.id DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        posts: postsResult.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('GET /forum/posts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// GET SINGLE POST
// GET /api/forum/posts/:id
// ============================================
router.get('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let userId: number | null = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pj2') as any;
        userId = decoded.userId;
      } catch {}
    }

    const result = await query(
      `SELECT fp.*, u.full_name, u.email,
        COALESCE(fp.upvotes, 0) - COALESCE(fp.downvotes, 0) as score
       FROM forum_posts fp
       LEFT JOIN public.users u ON u.id = fp.user_id
       WHERE fp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }

    const post = result.rows[0];

    // Get user's vote on this post
    let userVote: string | null = null;
    if (userId) {
      const voteResult = await query(
        `SELECT vote_type FROM forum_votes WHERE user_id = $1 AND target_id = $2 AND target_type = 'post'`,
        [userId, id]
      );
      if (voteResult.rows.length > 0) {
        userVote = voteResult.rows[0].vote_type;
      }
    }

    res.json({ success: true, data: { post: { ...post, userVote } } });
  } catch (error) {
    console.error('GET /forum/posts/:id error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// CREATE POST
// POST /api/forum/posts
// ============================================
router.post('/posts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, tags, attachments } = req.body;
    const userId = req.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    const tagsArray = Array.isArray(tags) ? tags.filter((t: string) => t.trim()) : [];
    const attachmentsJson = JSON.stringify(Array.isArray(attachments) ? attachments : []);

    const result = await query(
      `INSERT INTO forum_posts (user_id, title, content, tags, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title.trim(), content.trim(), tagsArray, attachmentsJson]
    );

    const post = result.rows[0];

    // Fetch author info
    const userResult = await query(`SELECT full_name, email FROM public.users WHERE id = $1`, [userId]);
    const author = userResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Đã tạo bài viết',
      data: { post: { ...post, ...author, score: 0, userVote: null } },
    });
  } catch (error) {
    console.error('POST /forum/posts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// UPDATE POST
// PUT /api/forum/posts/:id
// ============================================
router.put('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { title, content, tags, attachments } = req.body;

    // Check ownership
    const check = await query(`SELECT user_id FROM forum_posts WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài viết này' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    const tagsArray = Array.isArray(tags) ? tags.filter((t: string) => t.trim()) : [];
    const attachmentsJson = JSON.stringify(Array.isArray(attachments) ? attachments : []);

    const result = await query(
      `UPDATE forum_posts
       SET title = $1, content = $2, tags = $3, attachments = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title.trim(), content.trim(), tagsArray, attachmentsJson, id]
    );

    res.json({
      success: true,
      message: 'Đã cập nhật bài viết',
      data: { post: result.rows[0] },
    });
  } catch (error) {
    console.error('PUT /forum/posts/:id error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// DELETE POST
// DELETE /api/forum/posts/:id
// ============================================
router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const check = await query(`SELECT user_id, attachments FROM forum_posts WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài viết này' });
    }

    // Delete attached files
    const attachments = check.rows[0].attachments || [];
    for (const att of attachments) {
      if (att.url) {
        const filePath = path.join(__dirname, '..', att.url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await query(`DELETE FROM forum_posts WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (error) {
    console.error('DELETE /forum/posts/:id error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// VOTE POST
// POST /api/forum/posts/:id/vote
// ============================================
router.post('/posts/:id/vote', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const userId = req.userId;
    const { voteType } = req.body; // 'up' | 'down' | null (to remove)

    // Check post exists
    const postCheck = await client.query(`SELECT id FROM forum_posts WHERE id = $1`, [id]);
    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }

    // Get existing vote
    const existingVote = await client.query(
      `SELECT id, vote_type FROM forum_votes WHERE user_id = $1 AND target_id = $2 AND target_type = 'post'`,
      [userId, id]
    );
    const prevVoteType: string | null = existingVote.rows[0]?.vote_type ?? null;

    let newUserVote: 'up' | 'down' | null = null;
    if (voteType === null || voteType === prevVoteType) {
      // Toggle off — remove vote
      await client.query(
        `DELETE FROM forum_votes WHERE user_id = $1 AND target_id = $2 AND target_type = 'post'`,
        [userId, id]
      );
      newUserVote = null;
    } else {
      // New vote or switch vote — use ON CONFLICT to avoid race conditions
      await client.query(
        `INSERT INTO forum_votes (user_id, target_id, target_type, vote_type)
         VALUES ($1, $2, 'post', $3)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote_type = EXCLUDED.vote_type`,
        [userId, id, voteType]
      );
      newUserVote = voteType;
    }

    // Recalculate counters from votes table to prevent drift
    await client.query(
      `UPDATE forum_posts SET
         upvotes   = (SELECT COUNT(*) FROM forum_votes WHERE target_id = $1 AND target_type = 'post' AND vote_type = 'up'),
         downvotes = (SELECT COUNT(*) FROM forum_votes WHERE target_id = $1 AND target_type = 'post' AND vote_type = 'down')
       WHERE id = $1`,
      [id]
    );

    const updated = await client.query(
      `SELECT upvotes, downvotes, upvotes - downvotes as score FROM forum_posts WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      data: {
        upvotes: updated.rows[0].upvotes,
        downvotes: updated.rows[0].downvotes,
        score: updated.rows[0].score,
        userVote: newUserVote,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('POST /forum/posts/:id/vote error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  } finally {
    client.release();
  }
});

// ============================================
// GET COMMENTS (TREE)
// GET /api/forum/posts/:id/comments
// ============================================
router.get('/posts/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let userId: number | null = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pj2') as any;
        userId = decoded.userId;
      } catch {}
    }

    const result = await query(
      `SELECT fc.*, u.full_name, u.email,
        fc.upvotes - fc.downvotes as score
       FROM forum_comments fc
       LEFT JOIN public.users u ON u.id = fc.user_id
       WHERE fc.post_id = $1
       ORDER BY fc.created_at ASC`,
      [id]
    );

    // Get user's votes on comments
    let userVotes: Record<number, string> = {};
    if (userId && result.rows.length > 0) {
      const commentIds = result.rows.map((r: any) => r.id);
      const votesResult = await query(
        `SELECT target_id, vote_type FROM forum_votes WHERE user_id = $1 AND target_type = 'comment' AND target_id = ANY($2)`,
        [userId, commentIds]
      );
      votesResult.rows.forEach((v: any) => {
        userVotes[v.target_id] = v.vote_type;
      });
    }

    const comments = result.rows.map((c: any) => ({
      ...c,
      userVote: userVotes[c.id] || null,
      children: [],
    }));

    // Build tree
    const commentMap: Record<number, any> = {};
    const roots: any[] = [];
    comments.forEach((c: any) => (commentMap[c.id] = c));
    comments.forEach((c: any) => {
      if (c.parent_id && commentMap[c.parent_id]) {
        commentMap[c.parent_id].children.push(c);
      } else {
        roots.push(c);
      }
    });

    res.json({ success: true, data: { comments: roots } });
  } catch (error) {
    console.error('GET /forum/posts/:id/comments error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// ADD COMMENT
// POST /api/forum/posts/:id/comments
// ============================================
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    // Check post exists
    const postCheck = await query(`SELECT id FROM forum_posts WHERE id = $1`, [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }

    // Check parent comment if provided
    if (parentId) {
      const parentCheck = await query(
        `SELECT id FROM forum_comments WHERE id = $1 AND post_id = $2`,
        [parentId, id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Bình luận cha không tồn tại' });
      }
    }

    const result = await query(
      `INSERT INTO forum_comments (post_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, parentId || null, content.trim()]
    );

    // Increment comment_count
    await query(`UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = $1`, [id]);

    const userResult = await query(`SELECT full_name, email FROM public.users WHERE id = $1`, [userId]);
    const comment = { ...result.rows[0], ...userResult.rows[0], score: 0, userVote: null, children: [] };

    res.status(201).json({ success: true, message: 'Đã thêm bình luận', data: { comment } });
  } catch (error) {
    console.error('POST /forum/posts/:id/comments error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// EDIT COMMENT
// PUT /api/forum/comments/:id
// ============================================
router.put('/comments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    const check = await query(`SELECT user_id FROM forum_comments WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bình luận này' });
    }

    const result = await query(
      `UPDATE forum_comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content.trim(), id]
    );

    res.json({ success: true, message: 'Đã cập nhật bình luận', data: { comment: result.rows[0] } });
  } catch (error) {
    console.error('PUT /forum/comments/:id error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// DELETE COMMENT
// DELETE /api/forum/comments/:id
// ============================================
router.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const check = await query(`SELECT user_id, post_id FROM forum_comments WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    const postId = check.rows[0].post_id;
    await query(`DELETE FROM forum_comments WHERE id = $1`, [id]);
    await query(`UPDATE forum_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1`, [postId]);

    res.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (error) {
    console.error('DELETE /forum/comments/:id error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// VOTE COMMENT
// POST /api/forum/comments/:id/vote
// ============================================
router.post('/comments/:id/vote', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const userId = req.userId;
    const { voteType } = req.body;

    const commentCheck = await client.query(`SELECT id FROM forum_comments WHERE id = $1`, [id]);
    if (commentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
    }

    const existingVote = await client.query(
      `SELECT id, vote_type FROM forum_votes WHERE user_id = $1 AND target_id = $2 AND target_type = 'comment'`,
      [userId, id]
    );
    const prevVoteType: string | null = existingVote.rows[0]?.vote_type ?? null;

    let newUserVote: 'up' | 'down' | null = null;
    if (voteType === null || voteType === prevVoteType) {
      // Toggle off — remove vote
      await client.query(
        `DELETE FROM forum_votes WHERE user_id = $1 AND target_id = $2 AND target_type = 'comment'`,
        [userId, id]
      );
      newUserVote = null;
    } else {
      // New vote or switch vote — use ON CONFLICT to avoid race conditions
      await client.query(
        `INSERT INTO forum_votes (user_id, target_id, target_type, vote_type)
         VALUES ($1, $2, 'comment', $3)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote_type = EXCLUDED.vote_type`,
        [userId, id, voteType]
      );
      newUserVote = voteType;
    }

    // Recalculate counters from votes table to prevent drift
    await client.query(
      `UPDATE forum_comments SET
         upvotes   = (SELECT COUNT(*) FROM forum_votes WHERE target_id = $1 AND target_type = 'comment' AND vote_type = 'up'),
         downvotes = (SELECT COUNT(*) FROM forum_votes WHERE target_id = $1 AND target_type = 'comment' AND vote_type = 'down')
       WHERE id = $1`,
      [id]
    );

    const updated = await client.query(
      `SELECT upvotes, downvotes, upvotes - downvotes as score FROM forum_comments WHERE id = $1`,
      [id]
    );
    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        upvotes: updated.rows[0].upvotes,
        downvotes: updated.rows[0].downvotes,
        score: updated.rows[0].score,
        userVote: newUserVote,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('POST /forum/comments/:id/vote error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  } finally {
    client.release();
  }
});

// ============================================
// GET TOP USERS (Reputation)
// GET /api/forum/top-users
// ============================================
router.get('/top-users', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.email,
        COALESCE(SUM(fp.upvotes - fp.downvotes), 0)::int as reputation_score,
        COUNT(fp.id)::int as post_count
       FROM public.users u
       JOIN forum_posts fp ON fp.user_id = u.id
       GROUP BY u.id, u.full_name, u.email
       ORDER BY reputation_score DESC, post_count DESC
       LIMIT 5`
    );
    res.json({ success: true, data: { users: result.rows } });
  } catch (error) {
    console.error('GET /forum/top-users error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ============================================
// GET USER POSTS
// GET /api/forum/users/:userId/posts
// ============================================
router.get('/users/:userId/posts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }

    const userResult = await query(
      `SELECT id, full_name, email FROM public.users WHERE id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const postsResult = await query(
      `SELECT fp.*, u.full_name, u.email,
        fp.upvotes - fp.downvotes as score
       FROM forum_posts fp
       LEFT JOIN public.users u ON u.id = fp.user_id
       WHERE fp.user_id = $1
       ORDER BY fp.created_at DESC`,
      [userId]
    );

    const statsResult = await query(
      `SELECT COALESCE(SUM(upvotes - downvotes), 0)::int as reputation_score, COUNT(*)::int as post_count
       FROM forum_posts WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        posts: postsResult.rows,
        stats: statsResult.rows[0],
      },
    });
  } catch (error) {
    console.error('GET /forum/users/:userId/posts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

export default router;
