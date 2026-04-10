'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup, sendEmailVerificationCode, verifyEmailCode } from '@/lib/auth';
import { Mail, Check, X } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [codeTimer, setCodeTimer] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) return setError('Vui lòng nhập tên đầy đủ');
    if (!formData.email.trim()) return setError('Vui lòng nhập email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return setError('Email không hợp lệ');
    if (formData.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (formData.password !== formData.confirmPassword) return setError('Mật khẩu xác nhận không khớp');

    setLoading(true);
    try {
      // 1. Lưu user vào DB
      const response = await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // 2. GỌI API GỬI EMAIL TRƯỚC KHI CHUYỂN TRANG
        const codeResponse = await sendEmailVerificationCode(formData.email);
        
        if (codeResponse.success) {
          // 3. Gửi mail thành công mới hiện form nhập mã và đếm ngược
          setVerificationEmail(formData.email);
          setStep('verification');
          setCodeTimer(180); // 3 phút
          
          const interval = setInterval(() => {
            setCodeTimer((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setError(codeResponse.message || 'Lỗi hệ thống gửi mail. Hãy kiểm tra lại cấu hình SMTP.');
        }
      } else {
        setError(response.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Lỗi đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 8) {
      setVerificationError('Vui lòng nhập đủ 8 chữ số');
      return;
    }

    setVerificationLoading(true);
    setVerificationError('');
    try {
      const response = await verifyEmailCode(verificationEmail, verificationCode);
      if (response.success) {
        setStep('form');
        router.push('/login');
      } else {
        setVerificationError(response.message || 'Xác thực email thất bại');
      }
    } catch (err) {
      setVerificationError('Lỗi xác thực email. Vui lòng thử lại.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setVerificationCode('');
    setVerificationError('');
    setCodeTimer(0);
  };

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Xác thực Email</h1>
          <p className="text-center text-gray-600 mb-6">Nhập mã xác thực đã được gửi đến email của bạn</p>

          {verificationError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
              <X className="w-5 h-5" />
              {verificationError}
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Email: <strong>{verificationEmail}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Hết hạn trong: <strong>{Math.floor(codeTimer / 60)}:{(codeTimer % 60).toString().padStart(2, '0')}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã xác thực (8 chữ số)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="00000000"
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg tracking-widest"
                disabled={verificationLoading}
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={verificationLoading || verificationCode.length !== 8}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              {verificationLoading ? 'Đang xác thực...' : 'Xác thực Email'}
            </button>

            <button
              onClick={handleBackToForm}
              disabled={verificationLoading}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition duration-200"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Đăng ký</h1>
        <p className="text-center text-gray-600 mb-6">Tạo tài khoản mới để bắt đầu</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đầy đủ</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên của bạn"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ít nhất 6 ký tự"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập lại mật khẩu"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}