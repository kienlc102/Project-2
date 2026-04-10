import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Hash mật khẩu của người dùng
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * So sánh mật khẩu với hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Tạo JWT token
 */
export const generateToken = (userId: number, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'pj2',
    { expiresIn: '7d' }
  );
};

/**
 * Decode JWT token
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET || 'pj2');
};
