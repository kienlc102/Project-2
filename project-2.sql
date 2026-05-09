--
-- PostgreSQL database dump
--

\restrict NlAhVEx8mAqWGXwQPkTKav17oXS7koZ5fmZN1B5puxvtZKdp8aINo3aTxyg0HGb

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-09 20:01:12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5398 (class 1262 OID 40960)
-- Name: project-2; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE "project-2" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


\unrestrict NlAhVEx8mAqWGXwQPkTKav17oXS7koZ5fmZN1B5puxvtZKdp8aINo3aTxyg0HGb
\encoding SQL_ASCII
\connect -reuse-previous=on "dbname='project-2'"
\restrict NlAhVEx8mAqWGXwQPkTKav17oXS7koZ5fmZN1B5puxvtZKdp8aINo3aTxyg0HGb

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 40961)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 5399 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 41492)
-- Name: flashcard_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flashcard_sets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    visibility character varying(10) DEFAULT 'public'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcard_sets_visibility_check CHECK (((visibility)::text = ANY (ARRAY[('public'::character varying)::text, ('private'::character varying)::text])))
);


--
-- TOC entry 236 (class 1259 OID 41504)
-- Name: FlashcardSets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.flashcard_sets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."FlashcardSets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 41505)
-- Name: flashcards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flashcards (
    id integer NOT NULL,
    set_id integer NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    term_image_url text,
    definition_image_url text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 238 (class 1259 OID 41517)
-- Name: Flashcards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.flashcards ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Flashcards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 41318)
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    group_name character varying(255) NOT NULL,
    description text,
    invite_code character varying(10) NOT NULL,
    created_by integer
);


--
-- TOC entry 227 (class 1259 OID 41326)
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.groups ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 41298)
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    university_id integer,
    subject_name character varying(255) NOT NULL,
    subject_code character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 41306)
-- Name: Subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.subjects ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Subjects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 41289)
-- Name: universities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universities (
    id integer NOT NULL,
    university_name character varying(255) NOT NULL,
    university_code character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 221 (class 1259 OID 41297)
-- Name: Universities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.universities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Universities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 41307)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

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


--
-- TOC entry 225 (class 1259 OID 41317)
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 41342)
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    embedding public.vector(384)
);


--
-- TOC entry 230 (class 1259 OID 41352)
-- Name: document_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    meta_key character varying(100) NOT NULL,
    meta_value text
);


--
-- TOC entry 228 (class 1259 OID 41327)
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

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
    CONSTRAINT documents_doc_type_check CHECK (((doc_type)::text = ANY (ARRAY[('lecture'::character varying)::text, ('exercise'::character varying)::text, ('exam'::character varying)::text, ('other'::character varying)::text]))),
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('duplicated_warning'::character varying)::text, ('deleted'::character varying)::text])))
);


--
-- TOC entry 231 (class 1259 OID 41361)
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('member'::character varying)::text])))
);


--
-- TOC entry 232 (class 1259 OID 41369)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    user_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 242 (class 1259 OID 65635)
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    quiz_id integer,
    question_text text NOT NULL,
    options json,
    correct_answer character varying(50),
    explanation text
);


--
-- TOC entry 241 (class 1259 OID 65634)
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 241
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- TOC entry 240 (class 1259 OID 65613)
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    university_id integer,
    subject_id integer,
    title character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 239 (class 1259 OID 65612)
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 239
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- TOC entry 233 (class 1259 OID 41379)
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id integer NOT NULL,
    session_type character varying(20) NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    CONSTRAINT sessions_session_type_check CHECK (((session_type)::text = ANY (ARRAY[('call'::character varying)::text, ('whiteboard'::character varying)::text])))
);


--
-- TOC entry 234 (class 1259 OID 41388)
-- Name: whiteboard_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whiteboard_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    data_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 5182 (class 2604 OID 65638)
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- TOC entry 5180 (class 2604 OID 65616)
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- TOC entry 5199 (class 2606 OID 41409)
-- Name: groups Groups_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "Groups_invite_code_key" UNIQUE (invite_code);


--
-- TOC entry 5201 (class 2606 OID 41411)
-- Name: groups Groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- TOC entry 5189 (class 2606 OID 41399)
-- Name: universities Universities_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT "Universities_code_key" UNIQUE (university_code);


--
-- TOC entry 5195 (class 2606 OID 41405)
-- Name: users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 5197 (class 2606 OID 41407)
-- Name: users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 5206 (class 2606 OID 41415)
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- TOC entry 5208 (class 2606 OID 41417)
-- Name: document_metadata document_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_pkey PRIMARY KEY (id);


--
-- TOC entry 5203 (class 2606 OID 41413)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5218 (class 2606 OID 41519)
-- Name: flashcard_sets flashcard_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcard_sets
    ADD CONSTRAINT flashcard_sets_pkey PRIMARY KEY (id);


--
-- TOC entry 5222 (class 2606 OID 41521)
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- TOC entry 5210 (class 2606 OID 41419)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- TOC entry 5212 (class 2606 OID 41421)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5227 (class 2606 OID 65644)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 65623)
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- TOC entry 5214 (class 2606 OID 41423)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5193 (class 2606 OID 41403)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 5191 (class 2606 OID 41401)
-- Name: universities universities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_pkey PRIMARY KEY (id);


--
-- TOC entry 5216 (class 2606 OID 41425)
-- Name: whiteboard_data whiteboard_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whiteboard_data
    ADD CONSTRAINT whiteboard_data_pkey PRIMARY KEY (id);


--
-- TOC entry 5204 (class 1259 OID 41426)
-- Name: document_chunks_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING hnsw (embedding public.vector_cosine_ops);


--
-- TOC entry 5219 (class 1259 OID 41522)
-- Name: idx_flashcard_sets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets USING btree (user_id);


--
-- TOC entry 5220 (class 1259 OID 41523)
-- Name: idx_flashcard_sets_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flashcard_sets_visibility ON public.flashcard_sets USING btree (visibility);


--
-- TOC entry 5223 (class 1259 OID 41524)
-- Name: idx_flashcards_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flashcards_set_id ON public.flashcards USING btree (set_id);


--
-- TOC entry 5229 (class 2606 OID 41457)
-- Name: groups created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5233 (class 2606 OID 41447)
-- Name: document_chunks fk_chunk_doc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT fk_chunk_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5230 (class 2606 OID 41437)
-- Name: documents fk_doc_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_doc_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5231 (class 2606 OID 41442)
-- Name: documents fk_doc_owner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_doc_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5232 (class 2606 OID 41432)
-- Name: documents fk_doc_subject; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_doc_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5242 (class 2606 OID 41530)
-- Name: flashcards fk_flashcard_set; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT fk_flashcard_set FOREIGN KEY (set_id) REFERENCES public.flashcard_sets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5241 (class 2606 OID 41525)
-- Name: flashcard_sets fk_flashcard_set_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcard_sets
    ADD CONSTRAINT fk_flashcard_set_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5235 (class 2606 OID 41462)
-- Name: group_members fk_member_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5236 (class 2606 OID 41467)
-- Name: group_members fk_member_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5237 (class 2606 OID 41472)
-- Name: messages fk_message_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_message_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5238 (class 2606 OID 41477)
-- Name: messages fk_message_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5234 (class 2606 OID 41452)
-- Name: document_metadata fk_meta_doc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT fk_meta_doc FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5239 (class 2606 OID 41482)
-- Name: sessions fk_session_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_session_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5228 (class 2606 OID 41427)
-- Name: subjects fk_subject_university; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT fk_subject_university FOREIGN KEY (university_id) REFERENCES public.universities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5240 (class 2606 OID 41487)
-- Name: whiteboard_data fk_whiteboard_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whiteboard_data
    ADD CONSTRAINT fk_whiteboard_session FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5245 (class 2606 OID 65645)
-- Name: questions questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- TOC entry 5243 (class 2606 OID 65629)
-- Name: quizzes quizzes_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 5244 (class 2606 OID 65624)
-- Name: quizzes quizzes_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE CASCADE;


-- Completed on 2026-05-09 20:01:12

--
-- PostgreSQL database dump complete
--

\unrestrict NlAhVEx8mAqWGXwQPkTKav17oXS7koZ5fmZN1B5puxvtZKdp8aINo3aTxyg0HGb

