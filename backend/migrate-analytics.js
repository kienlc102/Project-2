const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Quiz attempts - each time a user takes a quiz
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quiz_attempts (
          id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          quiz_id integer NOT NULL,
          user_id integer NOT NULL,
          score integer DEFAULT 0,
          total_points integer DEFAULT 0,
          started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ quiz_attempts table created');

    // Quiz answers - individual answers per attempt
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quiz_answers (
          id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          attempt_id integer NOT NULL,
          question_id integer NOT NULL,
          selected_option_ids integer[] DEFAULT '{}',
          text_answer text,
          is_correct boolean DEFAULT false,
          points_earned integer DEFAULT 0
      );
    `);
    console.log('✅ quiz_answers table created');

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON public.quiz_answers(question_id);`);
    console.log('✅ Indexes created');

    // Foreign keys
    try {
      await client.query(`ALTER TABLE public.quiz_attempts ADD CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* may exist */ }

    try {
      await client.query(`ALTER TABLE public.quiz_attempts ADD CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* may exist */ }

    try {
      await client.query(`ALTER TABLE public.quiz_answers ADD CONSTRAINT fk_answer_attempt FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* may exist */ }

    try {
      await client.query(`ALTER TABLE public.quiz_answers ADD CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* may exist */ }

    console.log('✅ Foreign keys created');
    console.log('🎉 Analytics migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
