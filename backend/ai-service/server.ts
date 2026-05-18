import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai';
import generateDocRoutes from './routes/generateDoc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', aiRoutes);
app.use('/api', generateDocRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-service', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[AI Service] Running on port ${PORT}`);
});

export default app;
