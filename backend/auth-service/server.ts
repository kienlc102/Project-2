import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { query } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Auth Service is running', service: 'auth-service' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tìm thấy',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Auth Service đang chạy tại http://localhost:${PORT}`);

  // Cron job: Xóa tài khoản chưa xác thực email sau 24 giờ (chạy mỗi 1 giờ)
  setInterval(async () => {
    try {
      const result = await query(
        `DELETE FROM public.users 
         WHERE is_email_verified = false 
           AND created_at < NOW() - INTERVAL '24 hours'`
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(`🧹 Đã xóa ${result.rowCount} tài khoản chưa xác thực (>24h)`);
      }
    } catch (error) {
      console.error('Cleanup cron error:', error);
    }
  }, 60 * 60 * 1000);
});
