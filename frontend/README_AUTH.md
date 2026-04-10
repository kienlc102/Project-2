# Project-2 Frontend - Authentication System

## Tổng quan

Frontend được xây dựng với **Next.js 16** và **React 19**, cung cấp giao diện người dùng cho 3 chức năng xác thực:
- 📝 Đăng ký (Signup)
- 🔓 Đăng nhập (Login)  
- 🚪 Đăng xuất (Logout)

## Cấu trúc thư mục

```
frontend/
├── app/
│   ├── page.tsx              # Trang chủ (Home) - Dashboard
│   ├── login/
│   │   └── page.tsx          # Trang đăng nhập
│   ├── signup/
│   │   └── page.tsx          # Trang đăng ký
│   ├── account/
│   │   └── page.tsx          # Trang hồ sơ người dùng
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── auth.ts               # API client & utilities
├── components/
│   └── LandingPage.tsx
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.example
```

## Cài đặt

### 1. Cài đặt Dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` trong folder `frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Chạy Frontend

**Development mode:**
```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

**Build for production:**
```bash
npm run build
npm start
```

## Các trang và chức năng

### 1. **Home Page** (`/`)
- Dashboard chính của ứng dụng
- Hiển thị thông tin features
- Navigation links tới Login/Signup
- Nếu đã đăng nhập: hiển thị nút Profile và Logout

### 2. **Signup Page** (`/signup`)
- Form đăng ký với các fields:
  - Tên đầy đủ (Full Name)
  - Email
  - Mật khẩu
  - Xác nhận mật khẩu
- Validation client-side
- Sau khi đăng ký thành công → redirect tới Home
- Token được lưu vào localStorage

### 3. **Login Page** (`/login`)
- Form đăng nhập với các fields:
  - Email
  - Mật khẩu
- Validation client-side
- Sau khi đăng nhập thành công → redirect tới Home
- Token được lưu vào localStorage

### 4. **Account Page** (`/account`)
- Hiển thị thông tin profile của user (cần token)
- Fields:
  - Họ tên (Full Name)
  - Email
  - Trạng thái xác minh (Verified)
  - Ngày tạo tài khoản
  - ID tài khoản
- Nút Đăng xuất (Logout)
- Nếu không có token → redirect tới Login

## API Integration

### Auth Service (`lib/auth.ts`)

```typescript
// Đăng ký
signup({
  email: "user@example.com",
  password: "password123",
  fullName: "John Doe"
})

// Đăng nhập
login({
  email: "user@example.com",
  password: "password123"
})

// Đăng xuất
logout(token: string)

// Lấy thông tin profile
getProfile(token: string)

// Token management
saveToken(token: string)      // Lưu vào localStorage
getToken(): string | null     // Lấy từ localStorage
removeToken()                 // Xóa khỏi localStorage
isAuthenticated(): boolean    // Kiểm tra đã login?
```

### API Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| POST | `/auth/signup` | Đăng ký tài khoản | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/logout` | Đăng xuất | ✅ |
| GET | `/auth/profile` | Lấy profile | ✅ |

## Component Usage

### Login Component
```typescript
'use client';
import { login, saveToken } from '@/lib/auth';

const handleLogin = async (email, password) => {
  const response = await login({ email, password });
  if (response.success) {
    saveToken(response.data.token);
    router.push('/');
  }
};
```

### Protected Pages
```typescript
'use client';
import { getToken, removeToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, []);
  
  // ...
}
```

## Local Storage

Token được lưu với key: `auth_token`

```javascript
// Lấy token
const token = localStorage.getItem('auth_token');

// Xóa token khi logout
localStorage.removeItem('auth_token');
```

## Styling

- **Framework:** Tailwind CSS
- **Icons:** Lucide React
- **Responsive:** Mobile-first design
- **Color Scheme:** Blue & Indigo gradient

## Security Practices

✅ Mật khẩu không bao giờ được lưu ở client  
✅ Token được lưu trong localStorage (có thể nâng cấp sang cookies)  
✅ Validation form trước khi submit  
✅ Protected routes kiểm tra token  
✅ Token được gửi trong Authorization header  

## Environment Setup

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend `.env`
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### CORS Error
- Đảm bảo Backend CORS cho phép origin của Frontend
- Check `FRONTEND_URL` trong backend .env
- Check `NEXT_PUBLIC_API_URL` trong frontend .env.local

### Token Invalid
- Kiểm tra token format: `Bearer <token>`
- Token có thể hết hạn
- Kiểm tra JWT_SECRET match giữa frontend/backend

### Redirect Loop
- Nếu khi vào `/account` mà redirect về `/login`
- Token có thể hết hạn, chạy `removeToken()`
- Check localStorage xem có `auth_token` không

### Cannot read properties of null
- Nếu error liên quan đến localStorage
- Component phải là "client component" (thêm `'use client'`)
- Middleware/hooks cần check `typeof window !== 'undefined'`

## Debug Mode

Thêm console.logs trong `lib/auth.ts`:

```typescript
export const login = async (data) => {
  console.log('Login request:', data);
  const response = await fetch(...);
  console.log('Login response:', response);
  return response.json();
};
```

## Next Steps

- 🔐 Two-Factor Authentication
- 📧 Email verification
- 🔑 Password reset
- 👥 Social login (Google, GitHub)
- 🎨 User avatar/profile customization
- 📱 Mobile responsiveness improvements

## Performance Tips

- Images được optimize tự động bởi Next.js
- Components được render server-side khi có thể
- Client components chỉ hydrate khi cần
- CSS được minify tự động

## Production Checklist

- [ ] Thay đổi JWT_SECRET thành strong key
- [ ] Sử dụng HTTPS URLs
- [ ] Thiết lập proper CORS origins
- [ ] Enable secure cookie flags
- [ ] Setup error logging/monitoring
- [ ] Cache strategy tối ưu
