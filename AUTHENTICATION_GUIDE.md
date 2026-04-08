# Project-2: Complete Authentication System Guide

## 📋 Overview

Hệ thống xác thực đầy đủ với 3 chức năng chính:
1. **✍️ Đăng ký (Signup)** - Tạo tài khoản mới
2. **🔓 Đăng nhập (Login)** - Xác thực người dùng
3. **🚪 Đăng xuất (Logout)** - Kết thúc phiên

### Tech Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Database:** NeonDB (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Login   │  │  Signup  │  │ Account  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       ↓              ↓              ↓                   │
│  ┌─────────────────────────────────────┐               │
│  │   lib/auth.ts (API Client)          │               │
│  │   - login(), signup(), logout()     │               │
│  │   - Token management                │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
                        ↓↑ HTTP
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                   │
│  ┌──────────────────────────────────────┐              │
│  │  POST /api/auth/signup               │              │
│  │  POST /api/auth/login                │              │
│  │  POST /api/auth/logout               │              │
│  │  GET  /api/auth/profile              │              │
│  └──────────────────────────────────────┘              │
│       ↓ Routes (routes/auth.ts)           │              │
│  Middleware (middleware/auth.ts)          │              │
│  Utilities (utils/auth.ts)                │              │
└─────────────────────────────────────────────────────────┘
                        ↓↑ SQL
┌─────────────────────────────────────────────────────────┐
│               NeonDB (PostgreSQL)                        │
│  ┌──────────────────────────────────────┐              │
│  │  public.users table                  │              │
│  │  - id, email, password_hash          │              │
│  │  - full_name, is_verified, created_at              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (với npm)
- NeonDB account
- Git

### Step 1: Clone & Setup Project Structure

```bash
cd d:/Project/Project-2

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Step 2: Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-polished-math-a1x5da0m-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_super_secret_key_here_change_this_in_production
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Run Backend

```bash
cd backend
npm run dev
```

Output:
```
✅ Server đang chạy tại http://localhost:5000
```

### Step 4: Run Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Output:
```
▲ Next.js 16.2.1
- Ready in 1.2s
- Local:        http://localhost:3000
```

### Step 5: Test Application

Mở browser: `http://localhost:3000`

---

## 📝 API 详细文档

### 1. SIGNUP - Đăng ký tài khoản

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123",
    "fullName": "John Doe"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlhdCI6MTcxMjQ2MzAwMCwiZXhwIjoxNzEzMDY4MDAwfQ.signature"
  }
}
```

**Validation Rules:**
- Email: phải hợp lệ, duy nhất
- Password: tối thiểu 6 ký tự
- Full Name: không để trống

---

### 2. LOGIN - Đăng nhập

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Cases:**
- ❌ Email không tồn tại: 401
- ❌ Mật khẩu sai: 401
- ❌ Email/mật khẩu trống: 400

---

### 3. LOGOUT - Đăng xuất

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Note:** Token vẫn còn hợp lệ trên server cho đến khi hết hạn (7 days). Để thực hiện logout hoàn toàn, xóa token từ client-side.

---

### 4. GET PROFILE - Lấy thông tin user

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "isVerified": false,
    "createdAt": "2026-04-07T10:30:00.000Z"
  }
}
```

---

## 🗄️ Database Schema

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

**Table Info:**
- **id:** Auto increment primary key
- **email:** Unique email address
- **password_hash:** Bcrypt hashed password (10 rounds)
- **full_name:** User's full name
- **is_verified:** Account verification status
- **provider:** OAuth provider (Google, GitHub, etc.) - cho tương lai
- **created_at:** Account creation timestamp

---

## 🔐 Security Features

### 1. Password Hashing
- **Library:** bcryptjs
- **Salt Rounds:** 10
- **Algorithm:** bcrypt

```typescript
// Hashing
const hash = await hashPassword('password123');

// Verification
const isValid = await comparePassword('password123', hash);
```

### 2. JWT Tokens
- **Algorithm:** HS256
- **Expiration:** 7 days
- **Secret:** Configured in .env

```typescript
// Token payload
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1712463000,      // issued at
  "exp": 1713068000       // expires at
}
```

### 3. CORS Protection
Frontend URL được whitelist trong backend

### 4. SSL/TLS
NeonDB connection bắt buộc SSL

---

## 📂 Frontend Pages

### `/` - Home Page
```typescript
// Components/Pages
- Header/Navigation
- Feature showcase
- CTA buttons (Login/Signup)
```

### `/signup` - Sign Up Page
```typescript
// Features
- Form validation
- Error handling
- Success redirect to home
- Link to login page
```

### `/login` - Login Page
```typescript
// Features
- Email & password input
- Remember me (optional future)
- Success redirect to home
- Link to signup page
```

### `/account` - Profile Page
```typescript
// Features (AUTH REQUIRED)
- User information display
- Account status
- Logout button
- Account creation date
```

---

## 🛠️ File Structure

### Backend
```
backend/
├── middleware/
│   └── auth.ts                    # JWT verification
├── routes/
│   └── auth.ts                    # REST API endpoints
├── utils/
│   └── auth.ts                    # Helper functions
├── db.ts                          # Database connection
├── server.ts                      # Express app setup
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── .env                          # Secrets (DO NOT COMMIT)
├── .env.example                 # Template
└── README.md                     # Documentation
```

### Frontend
```
frontend/
├── app/
│   ├── page.tsx                 # Home page
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Signup page
│   ├── account/page.tsx         # Profile page
│   ├── layout.tsx               # Main layout
│   └── globals.css              # Global styles
├── lib/
│   └── auth.ts                  # API client
├── components/
│   └── LandingPage.tsx          # Landing component
├── package.json                 # Dependencies
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
├── .env.local                  # Secrets (DO NOT COMMIT)
├── .env.example               # Template
└── README_AUTH.md             # Authentication guide
```

---

## 🧪 Testing

### Manual Testing with cURL

**Test Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123","fullName":"Test User"}'
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'
```

**Test with Browser:**
1. Open `http://localhost:3000`
2. Click "Đăng ký"
3. Fill form and submit
4. Should be redirected to home with logged in state
5. Click profile to see account info
6. Click logout

---

## 🔧 Configuration

### Backend Environment Variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| DATABASE_URL | ✅ | postgresql://... | NeonDB connection |
| JWT_SECRET | ✅ | super_secret_key | Change in production |
| NODE_ENV | ❌ | development | development/production |
| PORT | ❌ | 5000 | Server port |
| FRONTEND_URL | ❌ | http://localhost:3000 | CORS origin |

### Frontend Environment Variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| NEXT_PUBLIC_API_URL | ✅ | http://localhost:5000/api | Backend API URL |

---

## 🐛 Troubleshooting

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. Check backend CORS config
2. Verify FRONTEND_URL in .env
3. Verify NEXT_PUBLIC_API_URL in frontend

### Issue: Token Invalid
```
Token không hợp lệ hoặc đã hết hạn
```
**Solution:**
1. Token hết hạn (7 days) → login lại
2. JWT_SECRET không match → kiểm tra .env
3. Token format sai

### Issue: Database Connection Failed
```
ECONNREFUSED or SSL error
```
**Solution:**
1. Check DATABASE_URL format
2. Ensure ?sslmode=require in URL
3. Check NeonDB credentials
4. Check network connection

### Issue: Login/Signup Not Working
```
400 Bad Request
```
**Solution:**
1. Check API endpoint URL
2. Verify email/password format
3. Check backend is running
4. Check browser console logs

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [JWT Introduction](https://jwt.io/introduction)
- [NeonDB Docs](https://neon.tech/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

## ✅ Production Checklist

- [ ] Change JWT_SECRET to strong random key
- [ ] Use HTTPS for all URLs
- [ ] Configure proper CORS origins
- [ ] Enable database backups
- [ ] Setup error logging (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Setup email verification
- [ ] Use environment-specific configs
- [ ] Add rate limiting middleware
- [ ] Setup monitoring/alerting
- [ ] Security headers (HELMET)
- [ ] API key rotation strategy
- [ ] Audit logging

---

## 🎉 Success!

Nếu bạn có thể:
1. ✅ Signup thành công
2. ✅ Login thành công
3. ✅ View profile
4. ✅ Logout thành công
5. ✅ Redirect tới login khi access protected page

**Thì hệ thống authentication của bạn đã hoạt động đầy đủ! 🎊**

---

**Version:** 1.0.0  
**Last Updated:** April 7, 2026  
**Author:** GitHub Copilot
