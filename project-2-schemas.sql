-- Kích hoạt extension vector (Yêu cầu phải cài đặt pgvector trên máy local trước khi chạy)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- TẠO CÁC BẢNG DỮ LIỆU
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

CREATE TABLE public.document_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    embedding public.vector(384)
);

CREATE TABLE public.document_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    meta_key character varying(100) NOT NULL,
    meta_value text
);

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id integer NOT NULL,
    group_id integer,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    hash_value character varying(100),
    ocr_content text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'duplicated_warning'::character varying, 'deleted'::character varying])::text[])))
);

CREATE TABLE public.group_members (
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    user_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    session_type character varying(20) NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    CONSTRAINT sessions_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['call'::character varying, 'whiteboard'::character varying])::text[])))
);

CREATE TABLE public.whiteboard_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    data_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- THÊM KHÓA CHÍNH (PRIMARY KEYS) VÀ KHÓA ĐỘC NHẤT (UNIQUE CONSTRAINTS)
ALTER TABLE ONLY public.groups ADD CONSTRAINT "Groups_invite_code_key" UNIQUE (invite_code);
ALTER TABLE ONLY public.groups ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT "Users_email_key" UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public.document_chunks ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.document_metadata ADD CONSTRAINT document_metadata_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.group_members ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.whiteboard_data ADD CONSTRAINT whiteboard_data_pkey PRIMARY KEY (id);

-- TẠO CHỈ MỤC (INDEX) CHO VECTOR SEARCH
CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING hnsw (embedding public.vector_cosine_ops);

-- THÊM KHÓA NGOẠI (FOREIGN KEYS)
ALTER TABLE ONLY public.groups ADD CONSTRAINT created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.document_chunks ADD CONSTRAINT fk_chunk_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.documents ADD CONSTRAINT fk_doc_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.documents ADD CONSTRAINT fk_doc_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.group_members ADD CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.group_members ADD CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.messages ADD CONSTRAINT fk_message_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.messages ADD CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.document_metadata ADD CONSTRAINT fk_meta_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;
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