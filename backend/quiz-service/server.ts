import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import quizRoutes from './routes/quizzes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Quiz Service is running', service: 'quiz-service' });
});

// Quiz routes
app.use('/api/quizzes', quizRoutes);

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
  console.log(`✅ Quiz Service đang chạy tại http://localhost:${PORT}`);
});
