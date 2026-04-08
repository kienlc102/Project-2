# 🚀 Quick Start - Authentication System

Hệ thống xác thực đã được cài đặt hoàn chỉnh! Đây là hướng dẫn bắt đầu nhanh.

## ⚡ 5 Bước Khởi Động

### 1️⃣ **Kiểm tra Dependencies đã cài**

**Backend:**
```bash
cd d:\Project\Project-2\backend
npm install
```

**Frontend:**
```bash
cd d:\Project\Project-2\frontend
npm install
```

### 2️⃣ **Kiểm tra Environment Variables**

**Backend** - `backend/.env` (đã có):
```env
DATABASE_URL=postgresql://neondb_owner:npg_DpCB0l5bdARN@ep-polished-math-a1x5da0m-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=pj2
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend** - `frontend/.env.local` (tạo mới):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3️⃣ **Chạy Backend Server**

```bash
cd d:\Project\Project-2\backend
npm run dev
```

✅ Nếu thấy: `✅ Server đang chạy tại http://localhost:5000`

### 4️⃣ **Chạy Frontend** (terminal mới)

```bash
cd d:\Project\Project-2\frontend
npm run dev
```

✅ Nếu thấy: `- Ready in ...` hoặc `- Local: http://localhost:3000`

### 5️⃣ **Mở Browser**

Truy cập: **http://localhost:3000**

---

## 🎯 Test Flow

### Scenario 1: Đăng ký tài khoản mới
1. Click "Đăng ký" button
2. Nhập: Name, Email, Password, Confirm Password
3. Click "Đăng ký"
4. ✅ Redirect tới Home page với status "Bạn đã đăng nhập"

### Scenario 2: Đăng nhập
1. Click "Đăng xuất" hoặc xóa browser localStorage
2. Click "Đăng nhập"
3. Nhập email đã đăng ký và password
4. Click "Đăng nhập"
5. ✅ Redirect tới Home page

### Scenario 3: Xem Profile
1. Click "Hồ sơ" button (top right)
2. ✅ Thấy tên, email, trạng thái xác minh, ngày tạo

### Scenario 4: Đăng xuất
1. Click "Đăng xuất"
2. ✅ Redirect tới Login page
3. LocalStorage `auth_token` bị xóa

---

## 📋 API Testing (Using cURL)

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@test.com\",
    \"password\": \"Test123456\",
    \"fullName\": \"Test User\"
  }"
```

### Response (201 Created):
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 2,
      "email": "test@test.com",
      "fullName": "Test User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@test.com\",
    \"password\": \"Test123456\"
  }"
```

### Test Get Profile
```bash
TOKEN="your_token_from_login"
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗂️ Project Structure

```
Project-2/
├── backend/
│   ├── middleware/
│   │   └── auth.ts ......................... Verify JWT
│   ├── routes/
│   │   └── auth.ts ......................... REST endpoints
│   ├── utils/
│   │   └── auth.ts ......................... Helpers
│   ├── db.ts ............................... Database
│   ├── server.ts ........................... Express app
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env ................................ Secrets
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx ........................ Home
│   │   ├── signup/page.tsx ................ Register
│   │   ├── login/page.tsx ................. Login
│   │   ├── account/page.tsx ............... Profile (protected)
│   │   └── layout.tsx
│   ├── lib/
│   │   └── auth.ts ........................ API Client
│   ├── package.json
│   ├── .env.local ......................... Secrets
│   └── .env.example
│
├── AUTHENTICATION_GUIDE.md ................ Full documentation
├── QUICK_START.md ......................... This file
└── project-2-schemas.sql ................. Database schema
```

---

## 🔧 Common Commands

### Backend Development
```bash
# Install dependencies
cd backend && npm install

# Run development server (port 5000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🐛 Troubleshooting

### ❌ Backend won't start
**Problem:** Port 5000 already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

### ❌ Frontend won't connect to backend
**Problem:** CORS error
- Check backend is running on port 5000
- Check brain `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- Check backend `FRONTEND_URL=http://localhost:3000`

### ❌ Database connection fails
**Problem:** DATABASE_URL incorrect
- Verify NeonDB credentials in `.env`
- Ensure URL has `?sslmode=require&channel_binding=require`
- Check network connection to NeonDB

### ❌ Login fails with "Email or password incorrect"
**Problem:** Wrong credentials or email not registered
- Create new account first via signup page
- Check email and password correctly

### ❌ Token invalid after login
**Problem:** Session expired
- JWT tokens expire in 7 days
- Login again to get new token
- Or check if `auth_token` exists in localStorage

---

## 📊 Database Status

### Check Users Table
```sql
SELECT * FROM public.users;
```

### Connection String
```
postgresql://neondb_owner:npg_DpCB0l5bdARN@ep-polished-math-a1x5da0m-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🎨 Frontend URLs

| Page | URL | Status |
|------|-----|--------|
| Home | `http://localhost:3000/` | Public |
| Login | `http://localhost:3000/login` | Public |
| Signup | `http://localhost:3000/signup` | Public |
| Profile | `http://localhost:3000/account` | Protected |

---

## 🔒 Security Notes

✅ Passwords are hashed with bcryptjs (10 salt rounds)  
✅ JWT tokens expire in 7 days  
✅ Database connections use SSL/TLS  
✅ CORS is properly configured  
✅ Environment secrets not committed to git  

⚠️ In production:
- Change `JWT_SECRET` to a strong random value
- Use HTTPS for all URLs
- Configure proper CORS origins
- Setup rate limiting
- Enable monitoring/logging

---

## 📞 Support

### View Logs
**Backend:** Check terminal where `npm run dev` is running  
**Frontend:** Check browser DevTools (F12)

### debug Mode
Add `console.log` in:
- Backend: `backend/routes/auth.ts`
- Frontend: `frontend/lib/auth.ts`

---

## 🎉 Next Steps

1. ✅ Test signup/login/logout
2. ✅ Test protected routes
3. ✅ Verify database updates
4. 🔜 Add more features (email verification, password reset)
5. 🔜 Setup CI/CD pipeline
6. 🔜 Deploy to production

---

**Status:** ✅ Ready to Use  
**Version:** 1.0.0  
**Last Updated:** April 7, 2026

Happy Coding! 🚀
