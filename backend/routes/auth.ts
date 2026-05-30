import { Router, Response } from 'express';
import { query } from '../db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateVerificationCode, sendVerificationEmail } from '../utils/email';

const router = Router();

/**
 * API: SIGNUP - Đăng ký tài khoản mới
 * POST /api/auth/signup
 */
router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const passwordHash = await hashPassword(password);

    // KIỂM TRA EMAIL
    const result = await query('SELECT id, is_verified, is_email_verified FROM public.users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.is_verified || user.is_email_verified) {
        // Nếu đã xác thực -> Chặn luôn
        return res.status(409).json({ success: false, message: 'Email đã được đăng ký và xác thực' });
      } else {
        // Đã tạo nhưng CHƯA xác thực (Do lần trước bỏ dở) -> Cập nhật lại pass/name và cho đi tiếp
        await query(
          'UPDATE public.users SET password_hash = $1, full_name = $2 WHERE email = $3',
          [passwordHash, fullName, email]
        );
        return res.status(200).json({
          success: true,
          message: 'Tài khoản đang chờ xác thực.',
          data: { user: { id: user.id, email, fullName } },
        });
      }
    }

    // Nếu chưa tồn tại -> Tạo mới
    const insertResult = await query(
      `INSERT INTO public.users (email, password_hash, full_name, is_verified, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, full_name`,
      [email, passwordHash, fullName, false]
    );

    return res.status(201).json({
      success: true,
      message: 'Tài khoản đã được tạo. Vui lòng xác thực.',
      data: { user: insertResult.rows[0] },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký tài khoản' });
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

/**
 * API: UPDATE_PROFILE - Cập nhật thông tin profile (name, email)
 * PUT /api/auth/profile
 * Header: Authorization: Bearer <token>
 * Body: { fullName?, email? }
 */
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email } = req.body;

    // At least one field must be provided
    if (!fullName && !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một trường để cập nhật',
      });
    }

    // Validation
    if (fullName && fullName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên không được để trống',
      });
    }

    if (email && email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email không được để trống',
      });
    }

    // Check if email is valid format
    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

    // If email is being updated, check if it's already used by another user
    if (email) {
      const existingUser = await query(
        'SELECT id FROM public.users WHERE email = $1 AND id != $2',
        [email, req.userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng',
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (fullName) {
      updates.push(`full_name = $${paramCount}`);
      values.push(fullName);
      paramCount++;
    }

    if (email) {
      updates.push(`email =$${paramCount}`);
      values.push(email);
      paramCount++;
    }

    values.push(req.userId);

    // Update user
    const result = await query(
      `UPDATE public.users 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, full_name, is_verified, created_at`,
      values
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
      message: 'Cập nhật thông tin thành công',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật profile',
    });
  }
});

/**
 * API: UPDATE_PASSWORD - Cập nhật mật khẩu
 * PUT /api/auth/password
 * Header: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ các trường',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không trùng khớp',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    // Get current user password hash
    const result = await query(
      'SELECT password_hash FROM public.users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User không tìm thấy',
      });
    }

    const user = result.rows[0];

    // Verify current password
    const passwordMatch = await comparePassword(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE public.users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật mật khẩu thành công',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật mật khẩu',
    });
  }
});

/**
 * API: DELETE_ACCOUNT - Xóa tài khoản
 * DELETE /api/auth/profile
 * Header: Authorization: Bearer <token>
 * Body: { password }
 */
router.delete('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để xác nhận xóa',
      });
    }

    // Get current user password hash
    const result = await query(
      'SELECT password_hash FROM public.users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User không tìm thấy',
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng', // Đã fix để báo lỗi chính xác theo yêu cầu [1.2]
      });
    }

    // Hard delete: Delete user account from database
    await query(
      'DELETE FROM public.users WHERE id = $1',
      [req.userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Tài khoản đã được xóa thành công',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xóa tài khoản',
    });
  }
});

/**
 * API: SEND_EMAIL_VERIFICATION_CODE - Gửi mã xác thực email
 * POST /api/auth/email/send-code
 * Body: { email }
 */
router.post('/email/send-code', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email',
      });
    }

    // Check email format
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

    // Check if email exists and is not deleted
    const existingUser = await query(
      'SELECT id, is_email_verified FROM public.users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại',
      });
    }

    if (existingUser.rows[0].is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email có xác thực từ trước',
      });
    }

    const userId = existingUser.rows[0].id;

    // Generate verification code (8 digits)
    const verificationCode = generateVerificationCode();

    // Set expiration time (3 minutes)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    // Update user with verification code
    await query(
      `UPDATE public.users 
       SET email_verification_code = $1, 
           email_code_expires_at = $2,
           email_verification_attempts = 0
       WHERE id = $3`,
      [verificationCode, expiresAt, userId]
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email',
      expiresIn: 180, // 3 minutes in seconds
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi gửi mã xác thực',
    });
  }
});

/**
 * API: VERIFY_EMAIL_CODE - Xác thực email bằng mã
 * POST /api/auth/email/verify
 * Body: { email, code }
 */
router.post('/email/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;

    // Validation
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã xác thực',
      });
    }

    // Check code format (8 digits)
    if (code.length !== 8 || !/^\d+$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực phải là 8 chữ số',
      });
    }

    // Get user by email
    const userResult = await query(
      `SELECT id, email_verification_code, email_code_expires_at, email_verification_attempts, deleted_at 
       FROM public.users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại',
      });
    }

    const user = userResult.rows[0];

    // Check if user is deleted
    if (user.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã bị xóa',
      });
    }

    // Check if code has expired
    if (!user.email_verification_code || !user.email_code_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Không có mã xác thực. Vui lòng yêu cầu một mã mới',
      });
    }

    const now = new Date();
    if (now > new Date(user.email_code_expires_at)) {
      // Code expired - delete user (as per requirement 3.2)
      await query('DELETE FROM public.users WHERE id = $1', [user.id]);

      return res.status(400).json({
        success: false,
        message: 'Mã xác thực đã hết hạn. Tài khoản đã được xóa. Vui lòng tạo lại tài khoản mới',
      });
    }

    // Check if code matches
    if (user.email_verification_code !== code) {
      // Increment attempts
      const newAttempts = user.email_verification_attempts + 1;

      // If 5 attempts failed, delete user
      if (newAttempts >= 5) {
        await query('DELETE FROM public.users WHERE id = $1', [user.id]);

        return res.status(400).json({
          success: false,
          message: 'Vượt quá số lần thử cho phép. Tài khoản đã được xóa. Vui lòng tạo lại tài khoản mới',
        });
      }

      await query(
        'UPDATE public.users SET email_verification_attempts = $1 WHERE id = $2',
        [newAttempts, user.id]
      );

      return res.status(400).json({
        success: false,
        message: `Mã xác thực không chính xác. Lần thử còn lại: ${5 - newAttempts}`,
      });
    }

    // Code is correct - mark email as verified
    await query(
      `UPDATE public.users 
       SET is_email_verified = true,
           is_verified = true,
           email_verification_code = NULL,
           email_code_expires_at = NULL,
           email_verification_attempts = 0
       WHERE id = $1`,
      [user.id]
    );

    // Generate token for auto-login after verification
    const token = generateToken(user.id, user.email);

    return res.status(200).json({
      success: true,
      message: 'Email đã được xác thực thành công',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực email',
    });
  }
});

export default router;