# Project-2 Backend API - Authentication System

## Tổng quan

Backend API được xây dựng với **Express.js** và TypeScript, kết nối với **NeonDB** (PostgreSQL). Cung cấp các chức năng xác thực người dùng: đăng ký, đăng nhập, đăng xuất.

## Cấu trúc thư mục

```
backend/
├── middleware/
│   └── auth.ts          # JWT authentication middleware
├── routes/
│   └── auth.ts          # Authentication routes (signup, login, logout)
├── utils/
│   └── auth.ts          # Authentication utilities (hash, token generation)
├── db.ts                # Database connection
├── server.ts            # Express server setup
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── .env                 # Environment variables
└── .env.example         # Example environment variables
```

## Cài đặt

### 1. Cài đặt Dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` (hoặc copy từ `.env.example`):

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Chú ý:** Nhất định phải có `?sslmode=require&channel_binding=require` trong NeonDB connection string.

### 3. Chạy Server

**Development mode (với hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## API Endpoints

### 1. **SIGNUP - Đăng ký tài khoản**

**URL:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Email đã được đăng ký"
}
```

---

### 2. **LOGIN - Đăng nhập**

**URL:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác"
}
```

---

### 3. **LOGOUT - Đăng xuất**

**URL:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### 4. **GET PROFILE - Lấy thông tin user**

**URL:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "isVerified": false,
    "createdAt": "2026-04-07T10:30:00Z"
  }
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE public.users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    provider VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Xác thực (Authentication)

### Token Format
- **Type:** JWT (JSON Web Token)
- **Algorithm:** HS256
- **Expiration:** 7 days
- **Payload:**
  ```json
  {
    "userId": 1,
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1235000000
  }
  ```

### Middleware Usage
```typescript
import { authMiddleware } from './middleware/auth';

app.get('/protected-route', authMiddleware, (req, res) => {
  const userId = req.userId;
  // ...
});
```

## Utilities

### `hashPassword(password: string): Promise<string>`
Hash mật khẩu của người dùng bằng bcryptjs

### `comparePassword(password: string, hash: string): Promise<boolean>`
So sánh mật khẩu với hash đã lưu

### `generateToken(userId: number, email: string): string`
Tạo JWT token mới

### `verifyToken(token: string): any`
Xác minh và decode JWT token

## CORS Configuration

Backend được cấu hình CORS để chấp nhận request từ:
- `http://localhost:3000` (development)
- Hoặc URL được chỉ định trong `FRONTEND_URL`

## Error Handling

Tất cả endpoint đều trả về response có cấu trúc:
```json
{
  "success": boolean,
  "message": string,
  "data": object (nếu có)
}
```

## Security Best Practices

- ✅ Mật khẩu được hash bằng bcryptjs (10 salt rounds)
- ✅ Sử dụng JWT tokens với expiration
- ✅ CORS được cấu hình strictly
- ✅ Database connection sử dụng SSL
- ✅ Environment variables không được commit

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra `DATABASE_URL` có đúng format
- Đảm bảo NeonDB URL có `?sslmode=require`
- Kiểm tra network connection

### Lỗi token verification
- Đảm bảo `JWT_SECRET` khớp giữa signup/login
- Token có thể hết hạn (expires in 7 days)
- Kiểm tra format Authorization header: `Bearer <token>`

## Development Tips

- Sử dụng Postman hoặc Thunder Client để test API
- Check console logs để debug
- Sử dụng `ts-node` cho development

## Next Steps

- Thêm email verification
- Implement refresh tokens
- Thêm rate limiting
- Thêm password reset functionality
