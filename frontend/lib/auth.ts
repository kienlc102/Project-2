const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      fullName: string;
    };
    token: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
}

/**
 * SIGNUP API - Đăng ký tài khoản
 */
export const signup = async (data: SignupPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

/**
 * LOGIN API - Đăng nhập
 */
export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

/**
 * LOGOUT API - Đăng xuất
 */
export const logout = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

/**
 * GET PROFILE - Lấy thông tin user
 */
export const getProfile = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

/**
 * Lưu token vào localStorage
 */
export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Lấy token từ localStorage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

/**
 * Xóa token khỏi localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Kiểm tra xem user đã đăng nhập hay chưa
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

/**
 * UPDATE PROFILE - Cập nhật tên và email
 */
export const updateProfile = async (token: string, data: { fullName?: string; email?: string }) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

/**
 * UPDATE PASSWORD - Cập nhật mật khẩu
 */
export const updatePassword = async (
  token: string,
  data: { currentPassword: string; newPassword: string; confirmPassword: string }
) => {
  const response = await fetch(`${API_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

/**
 * DELETE ACCOUNT - Xóa tài khoản
 */
export const deleteAccount = async (token: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  return response.json();
};

/**
 * SEND EMAIL VERIFICATION CODE - Gửi mã xác thực email
 */
export const sendEmailVerificationCode = async (email: string) => {
  const response = await fetch(`${API_URL}/auth/email/send-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return response.json();
};

/**
 * VERIFY EMAIL CODE - Xác thực email bằng mã
 */
export const verifyEmailCode = async (email: string, code: string) => {
  const response = await fetch(`${API_URL}/auth/email/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  return response.json();
};
