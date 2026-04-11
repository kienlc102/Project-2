const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quizzes (
          id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id integer NOT NULL,
          title character varying(255) NOT NULL DEFAULT 'Quiz không có tiêu đề',
          description text,
          visibility character varying(10) DEFAULT 'public',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT quizzes_visibility_check CHECK (visibility IN ('public', 'private'))
      );
    `);
    console.log('✅ quizzes table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quiz_questions (
          id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          quiz_id integer NOT NULL,
          question_text text NOT NULL,
          question_type character varying(20) NOT NULL DEFAULT 'multiple_choice',
          image_url text,
          is_required boolean DEFAULT false,
          points integer DEFAULT 1,
          position integer NOT NULL DEFAULT 0,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT quiz_questions_type_check CHECK (question_type IN ('multiple_choice', 'checkboxes', 'short_answer', 'paragraph', 'dropdown'))
      );
    `);
    console.log('✅ quiz_questions table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.quiz_options (
          id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          question_id integer NOT NULL,
          option_text text NOT NULL,
          is_correct boolean DEFAULT false,
          position integer NOT NULL DEFAULT 0
      );
    `);
    console.log('✅ quiz_options table created');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quizzes_visibility ON public.quizzes(visibility);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);`);
    console.log('✅ Indexes created');

    // Add foreign keys if not exist
    try {
      await client.query(`ALTER TABLE public.quizzes ADD CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* constraint may already exist */ }

    try {
      await client.query(`ALTER TABLE public.quiz_questions ADD CONSTRAINT fk_quiz_question_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* constraint may already exist */ }

    try {
      await client.query(`ALTER TABLE public.quiz_options ADD CONSTRAINT fk_quiz_option_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
    } catch (e) { /* constraint may already exist */ }

    console.log('✅ Foreign keys created');
    console.log('🎉 Quiz migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
