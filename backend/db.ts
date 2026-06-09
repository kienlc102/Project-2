import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // This is the critical part:
  ssl: false
});

// Đã fix lỗi TS7006: Khai báo rõ kiểu dữ liệu cho 'err' là 'Error'
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export default pool;