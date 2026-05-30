-- Kích hoạt extension vector (Yêu cầu phải cài đặt pgvector trên máy local trước khi chạy)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- ==========================================
-- 1. TẠO CÁC BẢNG DỮ LIỆU
-- ==========================================

-- Bảng Universities (Trường Đại học)
CREATE TABLE public.universities (
    id integer NOT NULL,
    university_name character varying(255) NOT NULL,
    university_code character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.universities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Universities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Bảng Subjects (Môn học)
CREATE TABLE public.subjects (
    id integer NOT NULL,
    university_id integer,
    subject_name character varying(255) NOT NULL,
    subject_code character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.subjects ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Subjects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Bảng Users (Người dùng)
CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(255),
    is_verified boolean NOT NULL,
    provider character varying(255),
    created_at timestamp without time zone,
    email_verification_code character varying(8),
    email_code_expires_at timestamp without time zone,
    email_verification_attempts integer DEFAULT 0,
    is_email_verified boolean DEFAULT false,
    deleted_at timestamp without time zone
);

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Bảng Groups (Nhóm học tập)
CREATE TABLE public.groups (
    id integer NOT NULL,
    group_name character varying(255) NOT NULL,
    description text,
    invite_code character varying(10) NOT NULL,
    created_by integer
);

ALTER TABLE public.groups ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Bảng Documents (Tài liệu)
CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id integer NOT NULL,
    group_id integer,
    subject_id integer,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    hash_value character varying(100),
    ocr_content text,
    doc_type character varying(50) DEFAULT 'other'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'duplicated_warning'::character varying, 'deleted'::character varying])::text[]))),
    CONSTRAINT documents_doc_type_check CHECK (((doc_type)::text = ANY ((ARRAY['lecture'::character varying, 'exercise'::character varying, 'exam'::character varying, 'other'::character varying])::text[])))
);

-- Bảng Document Chunks (Đoạn văn bản để search vector)
CREATE TABLE public.document_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    embedding public.vector(384)
);

-- Bảng Document Metadata (Dữ liệu siêu văn bản của tài liệu)
CREATE TABLE public.document_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    meta_key character varying(100) NOT NULL,
    meta_value text
);

-- Bảng Group Members (Thành viên nhóm)
CREATE TABLE public.group_members (
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);

-- Bảng Messages (Tin nhắn)
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    user_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Sessions (Phiên họp/Call)
CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    session_type character varying(20) NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    CONSTRAINT sessions_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['call'::character varying, 'whiteboard'::character varying])::text[])))
);

-- Bảng Whiteboard Data (Dữ liệu bảng trắng)
CREATE TABLE public.whiteboard_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    data_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. THÊM KHÓA CHÍNH (PRIMARY KEYS) & KHÓA ĐỘC NHẤT (UNIQUE CONSTRAINTS)
-- ==========================================

ALTER TABLE ONLY public.universities ADD CONSTRAINT "Universities_code_key" UNIQUE (university_code);
ALTER TABLE ONLY public.universities ADD CONSTRAINT universities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subjects ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT "Users_email_key" UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public.groups ADD CONSTRAINT "Groups_invite_code_key" UNIQUE (invite_code);
ALTER TABLE ONLY public.groups ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.document_chunks ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.document_metadata ADD CONSTRAINT document_metadata_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.group_members ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.whiteboard_data ADD CONSTRAINT whiteboard_data_pkey PRIMARY KEY (id);

-- ==========================================
-- 3. TẠO CHỈ MỤC (INDEX) CHO VECTOR SEARCH
-- ==========================================

CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING hnsw (embedding public.vector_cosine_ops);

-- ==========================================
-- 4. THÊM KHÓA NGOẠI (FOREIGN KEYS)
-- ==========================================

-- Cấp độ môn học & trường đại học
ALTER TABLE ONLY public.subjects ADD CONSTRAINT fk_subject_university FOREIGN KEY (university_id) REFERENCES public.universities(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Cấp độ tài liệu
ALTER TABLE ONLY public.documents ADD CONSTRAINT fk_doc_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.documents ADD CONSTRAINT fk_doc_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.documents ADD CONSTRAINT fk_doc_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Các bảng phụ thuộc tài liệu
ALTER TABLE ONLY public.document_chunks ADD CONSTRAINT fk_chunk_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.document_metadata ADD CONSTRAINT fk_meta_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Các bảng liên quan đến Group & User
ALTER TABLE ONLY public.groups ADD CONSTRAINT created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.group_members ADD CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.group_members ADD CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.messages ADD CONSTRAINT fk_message_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.messages ADD CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Các bảng liên quan đến Sessions & Whiteboard
ALTER TABLE ONLY public.sessions ADD CONSTRAINT fk_session_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.whiteboard_data ADD CONSTRAINT fk_whiteboard_session FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- =============================================
-- FLASHCARD TABLES
-- =============================================

CREATE TABLE public.flashcard_sets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    visibility character varying(10) DEFAULT 'public'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcard_sets_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[])))
);

ALTER TABLE public.flashcard_sets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."FlashcardSets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.flashcards (
    id integer NOT NULL,
    set_id integer NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    term_image_url text,
    definition_image_url text,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.flashcards ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Flashcards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.flashcard_sets ADD CONSTRAINT flashcard_sets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.flashcards ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);

CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX idx_flashcard_sets_visibility ON public.flashcard_sets(visibility);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);

ALTER TABLE ONLY public.flashcard_sets ADD CONSTRAINT fk_flashcard_set_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.flashcards ADD CONSTRAINT fk_flashcard_set FOREIGN KEY (set_id) REFERENCES public.flashcard_sets(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- =============================================
-- QUIZ TABLES
-- =============================================

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL DEFAULT 'Quiz không có tiêu đề',
    description text,
    visibility character varying(10) DEFAULT 'public'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quizzes_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[])))
);

ALTER TABLE public.quizzes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Quizzes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    question_text text NOT NULL,
    question_type character varying(20) NOT NULL DEFAULT 'multiple_choice'::character varying,
    image_url text,
    is_required boolean DEFAULT false,
    points integer DEFAULT 1,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quiz_questions_type_check CHECK (((question_type)::text = ANY ((ARRAY['multiple_choice'::character varying, 'checkboxes'::character varying, 'short_answer'::character varying, 'paragraph'::character varying, 'dropdown'::character varying])::text[])))
);

ALTER TABLE public.quiz_questions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."QuizQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.quiz_options (
    id integer NOT NULL,
    question_id integer NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false,
    position integer NOT NULL DEFAULT 0
);

ALTER TABLE public.quiz_options ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."QuizOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.quizzes ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_questions ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_options ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (id);

CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_visibility ON public.quizzes(visibility);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);

ALTER TABLE ONLY public.quizzes ADD CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_questions ADD CONSTRAINT fk_quiz_question_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_options ADD CONSTRAINT fk_quiz_option_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON UPDATE CASCADE ON DELETE CASCADE;

INSERT INTO public.universities (university_name, university_code, description, created_at)
VALUES 
    ('Đại học Bách khoa Hà Nội', 'HUST', 'Trường đại học kỹ thuật đa ngành hàng đầu tại Việt Nam, chuyên đào tạo kỹ sư và nghiên cứu công nghệ.', CURRENT_TIMESTAMP),
    ('Trường Đại học Kinh tế Quốc dân', 'NEU', 'Trường đại học trọng điểm quốc gia đầu ngành đào tạo về kinh tế, quản lý và quản trị kinh doanh.', CURRENT_TIMESTAMP),
    ('Trường Đại học Xây dựng Hà Nội', 'HUCE', 'Một trong những trường đại học kỹ thuật hàng đầu tại Việt Nam về nhóm ngành xây dựng và kiến trúc.', CURRENT_TIMESTAMP),
    ('Đại học Quốc gia Hà Nội', 'VNU', 'Trung tâm đào tạo, nghiên cứu khoa học và chuyển giao công nghệ đa ngành, đa lĩnh vực lớn nhất Việt Nam.', CURRENT_TIMESTAMP),
    ('Trường Đại học Ngoại thương', 'FTU', 'Trường đại học chuyên ngành kinh tế, thương mại quốc tế, nổi tiếng với môi trường năng động.', CURRENT_TIMESTAMP),
    ('Trường Đại học Thương mại', 'TMU', 'Trường đại học công lập đa ngành, hàng đầu về kinh tế, thương mại và quản trị kinh doanh.', CURRENT_TIMESTAMP),
    ('Học viện Công nghệ Bưu chính Viễn thông', 'PTIT', 'Cơ sở đào tạo, nghiên cứu trọng điểm về Viễn thông, Công nghệ thông tin và Truyền thông.', CURRENT_TIMESTAMP),
    ('Đại học Quốc gia Thành phố Hồ Chí Minh', 'VNUHCM', 'Hệ thống đại học quốc gia lớn nhất và uy tín nhất tại khu vực miền Nam Việt Nam.', CURRENT_TIMESTAMP),
    ('Trường Đại học Bách khoa - ĐHQG TP.HCM', 'HCMUT', 'Trường đại học kỹ thuật đầu ngành tại miền Nam, đơn vị thành viên nòng cốt của ĐHQG TP.HCM.', CURRENT_TIMESTAMP),
    ('Đại học Kinh tế Thành phố Hồ Chí Minh', 'UEH', 'Đại học trọng điểm quốc gia, đào tạo đa ngành về kinh tế, kinh doanh, luật và quản lý.', CURRENT_TIMESTAMP),
    ('Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM', 'HCMUS', 'Trung tâm đào tạo và nghiên cứu khoa học cơ bản, công nghệ mũi nhọn hàng đầu khu vực.', CURRENT_TIMESTAMP),
    ('Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM', 'UIT', 'Trường đại học công lập chuyên sâu về đào tạo và nghiên cứu công nghệ thông tin.', CURRENT_TIMESTAMP),
    ('Học viện Tài chính', 'AOF', 'Cơ sở đào tạo đầu ngành về tài chính, kế toán, kiểm toán tại Việt Nam.', CURRENT_TIMESTAMP),
    ('Học viện Ngân hàng', 'HVNH', 'Trường đại học đa ngành, định hướng ứng dụng, trực thuộc Ngân hàng Nhà nước Việt Nam.', CURRENT_TIMESTAMP),
    ('Trường Đại học Y Hà Nội', 'HMU', 'Trường đại học y khoa hàng đầu, lâu đời và danh giá nhất của Việt Nam.', CURRENT_TIMESTAMP),
    ('Trường Đại học Sư phạm Hà Nội', 'HNUE', 'Trường đại học trọng điểm, trung tâm đào tạo giáo viên và nghiên cứu giáo dục lớn nhất Việt Nam.', CURRENT_TIMESTAMP),
    ('Đại học FPT', 'FPT', 'Trường đại học tư thục tiên phong do Tập đoàn FPT thành lập, gắn liền đào tạo với thực tiễn doanh nghiệp.', CURRENT_TIMESTAMP),
    ('Đại học RMIT Việt Nam', 'RMIT', 'Phân hiệu châu Á của Đại học RMIT (Úc) tại Việt Nam, mang đến môi trường giáo dục chuẩn quốc tế.', CURRENT_TIMESTAMP),
    ('Trường Đại học Công nghệ - ĐHQGHN', 'UET', 'Trường đại học thành viên của ĐHQGHN, mũi nhọn về công nghệ thông tin, điện tử viễn thông và cơ kỹ thuật.', CURRENT_TIMESTAMP),
    ('Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN', 'USSH', 'Trung tâm đào tạo và nghiên cứu khoa học xã hội và nhân văn uy tín bậc nhất Việt Nam.', CURRENT_TIMESTAMP);