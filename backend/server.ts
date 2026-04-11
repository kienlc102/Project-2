import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import flashcardRoutes from './routes/flashcards';
import { query } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Flashcard routes
app.use('/api/flashcards', flashcardRoutes);

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
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);

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
  }, 60 * 60 * 1000); // 1 giờ
});
