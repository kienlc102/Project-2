import { Router, Response } from 'express';
import { query } from '../db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * API: SIGNUP - Đăng ký tài khoản mới
 * POST /api/auth/signup
 * Body: { email, password, fullName }
 */
router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email, mật khẩu và tên',
      });
    }

    // Kiểm tra email đã tồn tại
    const result = await query('SELECT id FROM public.users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được đăng ký',
      });
    }

    // Hash mật khẩu
    const passwordHash = await hashPassword(password);

    // Tạo user mới
    const insertResult = await query(
      `INSERT INTO public.users (email, password_hash, full_name, is_verified, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, full_name`,
      [email, passwordHash, fullName, false]
    );

    const user = insertResult.rows[0];

    // Tạo token
    const token = generateToken(user.id, user.email);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký tài khoản',
    });
  }
});

/**
 * API: LOGIN - Đăng nhập
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    // Tìm user theo email
    const result = await query(
      'SELECT id, email, password_hash, full_name FROM public.users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    const user = result.rows[0];

    // So sánh mật khẩu
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // Tạo token
    const token = generateToken(user.id, user.email);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
    });
  }
});

/**
 * API: LOGOUT - Đăng xuất
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Trong thực tế, bạn có thể:
    // - Thêm token vào blacklist (redis, database)
    // - Hoặc để client xóa token (recommended)
    // Tạm thời, chỉ trả về thông báo thành công

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng xuất',
    });
  }
});

/**
 * API: GET_PROFILE - Lấy thông tin user (cần token)
 * GET /api/auth/profile
 * Header: Authorization: Bearer <token>
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, is_verified, created_at FROM public.users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User không tìm thấy',
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin user',
    });
  }
});

export default router;
