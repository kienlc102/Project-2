import { Response } from 'express';
import { query } from '../db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';
import { generateVerificationCode, sendVerificationEmail } from '../utils/email';

/**
 * SIGNUP - Đăng ký tài khoản mới
 */
export const signup = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const passwordHash = await hashPassword(password);

    const result = await query('SELECT id, is_verified, is_email_verified FROM public.users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.is_verified || user.is_email_verified) {
        return res.status(409).json({ success: false, message: 'Email đã được đăng ký và xác thực' });
      } else {
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
};

/**
 * LOGIN - Đăng nhập
 */
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

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
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

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
};

/**
 * LOGOUT - Đăng xuất
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
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
};

/**
 * GET_PROFILE - Lấy thông tin user
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
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
};

/**
 * UPDATE_PROFILE - Cập nhật thông tin profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName && !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một trường để cập nhật',
      });
    }

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

    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

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
};

/**
 * UPDATE_PASSWORD - Cập nhật mật khẩu
 */
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

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
    const passwordMatch = await comparePassword(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

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
};

/**
 * DELETE_ACCOUNT - Xóa tài khoản
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để xác nhận xóa',
      });
    }

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
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng',
      });
    }

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
};

/**
 * SEND_EMAIL_VERIFICATION_CODE
 */
export const sendVerificationCode = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email',
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

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
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await query(
      `UPDATE public.users 
       SET email_verification_code = $1, 
           email_code_expires_at = $2,
           email_verification_attempts = 0
       WHERE id = $3`,
      [verificationCode, expiresAt, userId]
    );

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
      expiresIn: 180,
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi gửi mã xác thực',
    });
  }
};

/**
 * VERIFY_EMAIL_CODE - Xác thực email bằng mã
 */
export const verifyEmailCode = async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã xác thực',
      });
    }

    if (code.length !== 8 || !/^\d+$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực phải là 8 chữ số',
      });
    }

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

    if (user.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã bị xóa',
      });
    }

    if (!user.email_verification_code || !user.email_code_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Không có mã xác thực. Vui lòng yêu cầu một mã mới',
      });
    }

    const now = new Date();
    if (now > new Date(user.email_code_expires_at)) {
      await query('DELETE FROM public.users WHERE id = $1', [user.id]);

      return res.status(400).json({
        success: false,
        message: 'Mã xác thực đã hết hạn. Tài khoản đã được xóa. Vui lòng tạo lại tài khoản mới',
      });
    }

    if (user.email_verification_code !== code) {
      const newAttempts = user.email_verification_attempts + 1;

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
};
