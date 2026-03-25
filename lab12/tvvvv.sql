--
-- PostgreSQL database dump
--

\restrict v04A9dICe0wwusBKXovd6x1a6jTp7Sg6bFDtQZWGPdwOf2EeaIqnvx9asERXtns

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    audit_id integer NOT NULL,
    entity_name character varying(60) NOT NULL,
    entity_id integer NOT NULL,
    action character varying(20) NOT NULL,
    performed_by_id integer,
    performed_at timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb,
    CONSTRAINT ck_audit_log_action CHECK (((action)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[]))),
    CONSTRAINT ck_audit_log_entity CHECK ((length(TRIM(BOTH FROM entity_name)) > 0)),
    CONSTRAINT ck_audit_log_id CHECK ((entity_id > 0))
);


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_audit_id_seq OWNED BY public.audit_log.audit_id;


--
-- Name: chat_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message (
    message_id integer NOT NULL,
    request_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_chat_message_content CHECK ((length(TRIM(BOTH FROM content)) > 0))
);


--
-- Name: chat_message_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_message_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_message_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_message_message_id_seq OWNED BY public.chat_message.message_id;


--
-- Name: contract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract (
    request_id integer NOT NULL,
    contract_number character varying(40) NOT NULL,
    contract_date date NOT NULL,
    amount numeric(14,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agent_commission numeric(12,2),
    CONSTRAINT ck_contract_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT ck_contract_commission CHECK (((agent_commission IS NULL) OR (agent_commission >= (0)::numeric))),
    CONSTRAINT ck_contract_number CHECK ((length(TRIM(BOTH FROM contract_number)) > 0))
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    notification_type_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_notification_message CHECK ((length(TRIM(BOTH FROM message)) > 0))
);


--
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_notification_id_seq OWNED BY public.notification.notification_id;


--
-- Name: notification_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_type (
    notification_type_id integer NOT NULL,
    name character varying(120) NOT NULL,
    CONSTRAINT ck_notification_type_name CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


--
-- Name: notification_type_notification_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_type_notification_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_type_notification_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_type_notification_type_id_seq OWNED BY public.notification_type.notification_type_id;


--
-- Name: payment_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_type (
    payment_type_id integer NOT NULL,
    name character varying(100) NOT NULL,
    CONSTRAINT ck_payment_type_name CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


--
-- Name: payment_type_payment_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_type_payment_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_type_payment_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_type_payment_type_id_seq OWNED BY public.payment_type.payment_type_id;


--
-- Name: request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request (
    request_id integer NOT NULL,
    customer_id integer NOT NULL,
    agent_id integer,
    schedule_id integer NOT NULL,
    planned_datetime timestamp with time zone,
    duration_seconds integer DEFAULT 0 NOT NULL,
    status_id integer NOT NULL,
    total_cost numeric(14,2) NOT NULL,
    description text,
    contact_phone character varying(30) NOT NULL,
    payment_type_id integer,
    payment_date date,
    payment_due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_request_contact_phone CHECK ((length(TRIM(BOTH FROM contact_phone)) > 0)),
    CONSTRAINT ck_request_duration CHECK ((duration_seconds >= 0)),
    CONSTRAINT ck_request_payment_dates CHECK (((payment_date IS NULL) OR (payment_due_date IS NULL) OR (payment_date <= payment_due_date))),
    CONSTRAINT ck_request_total_cost CHECK ((total_cost >= (0)::numeric))
);


--
-- Name: request_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.request_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: request_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.request_request_id_seq OWNED BY public.request.request_id;


--
-- Name: request_status_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_status_type (
    status_id integer NOT NULL,
    name character varying(80) NOT NULL,
    CONSTRAINT ck_request_status_type_name CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


--
-- Name: request_status_type_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.request_status_type_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: request_status_type_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.request_status_type_status_id_seq OWNED BY public.request_status_type.status_id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    role_id integer NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_role_id_seq OWNED BY public.role.role_id;


--
-- Name: show_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.show_schedule (
    schedule_id integer NOT NULL,
    tv_show_id integer NOT NULL,
    start_datetime timestamp with time zone NOT NULL,
    air_date date NOT NULL,
    air_time time without time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: show_schedule_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.show_schedule_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: show_schedule_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.show_schedule_schedule_id_seq OWNED BY public.show_schedule.schedule_id;


--
-- Name: show_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.show_type (
    show_type_id integer NOT NULL,
    name character varying(150) NOT NULL,
    CONSTRAINT ck_show_type_name CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


--
-- Name: show_type_show_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.show_type_show_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: show_type_show_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.show_type_show_type_id_seq OWNED BY public.show_type.show_type_id;


--
-- Name: tv_show; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tv_show (
    tv_show_id integer NOT NULL,
    title character varying(200) NOT NULL,
    advertising_minutes numeric(4,1) DEFAULT 0 NOT NULL,
    price_per_minute numeric(12,2) NOT NULL,
    show_type_id integer NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_tv_show_ad_minutes CHECK ((advertising_minutes >= (0)::numeric)),
    CONSTRAINT ck_tv_show_price CHECK ((price_per_minute > (0)::numeric)),
    CONSTRAINT ck_tv_show_title CHECK ((length(TRIM(BOTH FROM title)) > 0))
);


--
-- Name: tv_show_tv_show_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tv_show_tv_show_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tv_show_tv_show_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tv_show_tv_show_id_seq OWNED BY public.tv_show.tv_show_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    middle_name character varying(100),
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role_id integer NOT NULL,
    CONSTRAINT ck_users_email_fmt CHECK (((email)::text ~~ '%@%'::text)),
    CONSTRAINT ck_users_first_name CHECK ((length(TRIM(BOTH FROM first_name)) > 0)),
    CONSTRAINT ck_users_last_name CHECK ((length(TRIM(BOTH FROM last_name)) > 0))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: audit_log audit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN audit_id SET DEFAULT nextval('public.audit_log_audit_id_seq'::regclass);


--
-- Name: chat_message message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message ALTER COLUMN message_id SET DEFAULT nextval('public.chat_message_message_id_seq'::regclass);


--
-- Name: notification notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification ALTER COLUMN notification_id SET DEFAULT nextval('public.notification_notification_id_seq'::regclass);


--
-- Name: notification_type notification_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_type ALTER COLUMN notification_type_id SET DEFAULT nextval('public.notification_type_notification_type_id_seq'::regclass);


--
-- Name: payment_type payment_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_type ALTER COLUMN payment_type_id SET DEFAULT nextval('public.payment_type_payment_type_id_seq'::regclass);


--
-- Name: request request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request ALTER COLUMN request_id SET DEFAULT nextval('public.request_request_id_seq'::regclass);


--
-- Name: request_status_type status_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_type ALTER COLUMN status_id SET DEFAULT nextval('public.request_status_type_status_id_seq'::regclass);


--
-- Name: role role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role ALTER COLUMN role_id SET DEFAULT nextval('public.role_role_id_seq'::regclass);


--
-- Name: show_schedule schedule_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_schedule ALTER COLUMN schedule_id SET DEFAULT nextval('public.show_schedule_schedule_id_seq'::regclass);


--
-- Name: show_type show_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_type ALTER COLUMN show_type_id SET DEFAULT nextval('public.show_type_show_type_id_seq'::regclass);


--
-- Name: tv_show tv_show_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tv_show ALTER COLUMN tv_show_id SET DEFAULT nextval('public.tv_show_tv_show_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (audit_id, entity_name, entity_id, action, performed_by_id, performed_at, data) FROM stdin;
1	request	1	INSERT	4	2026-03-15 17:50:34.39562+03	{"show": "Утреннее шоу", "status": "Новая", "customer": "Иванов И.И."}
2	request	1	UPDATE	6	2026-03-15 17:50:34.39562+03	{"new_status": "Одобрена", "old_status": "В обсуждении"}
3	users	8	UPDATE	8	2026-03-15 17:50:34.39562+03	{"action": "activated_user", "target_user_id": 5}
\.


--
-- Data for Name: chat_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_message (message_id, request_id, sender_id, content, created_at) FROM stdin;
3	2	4	Орлов, прошу согласовать заявку на вечерние новости (ID 2).	2026-03-15 17:50:34.39562+03
1	1	1	Здравствуйте! Хочу разместить рекламу в утреннем шоу.	2026-03-15 17:50:34.39562+03
2	2	2	Тестовое сообщение для проверки чата	2026-03-15 17:50:34.39562+03
\.


--
-- Data for Name: contract; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract (request_id, contract_number, contract_date, amount, description, created_at, agent_commission) FROM stdin;
1	DOG-2026-000001	2026-02-20	5000.00	Реклама сети ресторанов «Вкусно»	2026-03-15 17:50:34.39562+03	250.00
2	DOG-2026-000002	2026-02-21	25000.00	Реклама автосалона «АвтоМир»	2026-03-15 17:50:34.39562+03	1250.00
3	DOG-2026-000003	2026-02-24	3750.00	Реклама интернет-магазина «ТехноДом»	2026-03-15 17:50:34.39562+03	187.50
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification (notification_id, notification_type_id, user_id, message, is_read, created_at) FROM stdin;
1	1	1	Ваша заявка на размещение в «Утреннем шоу» одобрена.	t	2026-03-15 17:50:34.39562+03
2	2	2	Спасибо за оплату! Рекламный ролик запланирован на 01.03.2026.	t	2026-03-15 17:50:34.39562+03
3	3	4	Вам назначена новая заявка от клиента Сидоров К.П.	f	2026-03-15 17:50:34.39562+03
\.


--
-- Data for Name: notification_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_type (notification_type_id, name) FROM stdin;
1	Статус заявки
2	Оплата
3	Назначение агента
\.


--
-- Data for Name: payment_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_type (payment_type_id, name) FROM stdin;
1	Банковский перевод
2	Карта
3	Наличные
4	Счёт-фактура
\.


--
-- Data for Name: request; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.request (request_id, customer_id, agent_id, schedule_id, planned_datetime, duration_seconds, status_id, total_cost, description, contact_phone, payment_type_id, payment_date, payment_due_date, created_at) FROM stdin;
1	1	4	1	\N	30	3	5000.00	Реклама сети ресторанов «Вкусно»	+7-900-111-11-11	2	\N	2026-03-15	2026-03-15 17:50:34.39562+03
2	2	4	2	\N	60	4	25000.00	Реклама автосалона «АвтоМир»	+7-900-222-22-22	1	\N	2026-03-10	2026-03-15 17:50:34.39562+03
3	3	5	3	\N	15	1	3750.00	Реклама интернет-магазина «ТехноДом»	+7-900-333-33-33	\N	\N	\N	2026-03-15 17:50:34.39562+03
4	10	4	4	\N	60	1	3000.00	\N	79013202919	3	2002-02-02	2030-02-02	2026-03-15 19:21:13.797225+03
5	1	4	1	\N	30	2	15000.00	Рекламный ролик для тестирования	+7-900-111-22-33 	\N	\N	\N	2026-03-24 20:36:51.872741+03
\.


--
-- Data for Name: request_status_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.request_status_type (status_id, name) FROM stdin;
1	Новая
2	В обсуждении
3	Одобрена
4	Оплачена
5	Отменена
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role (role_id, name) FROM stdin;
1	admin
2	director
3	manager
4	agent
5	commercial
6	accountant
7	customer
\.


--
-- Data for Name: show_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.show_schedule (schedule_id, tv_show_id, start_datetime, air_date, air_time, updated_at) FROM stdin;
1	1	2026-03-01 08:00:00+03	2026-03-01	08:00:00	2026-03-15 17:50:34.39562+03
2	2	2026-03-01 19:00:00+03	2026-03-01	19:00:00	2026-03-15 17:50:34.39562+03
3	3	2026-03-01 12:00:00+03	2026-03-01	12:00:00	2026-03-15 17:50:34.39562+03
4	1	2026-03-02 08:00:00+03	2026-03-02	08:00:00	2026-03-15 17:50:34.39562+03
5	2	2026-03-02 19:00:00+03	2026-03-02	19:00:00	2026-03-15 17:50:34.39562+03
6	3	2026-03-02 12:00:00+03	2026-03-02	12:00:00	2026-03-15 17:50:34.39562+03
\.


--
-- Data for Name: show_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.show_type (show_type_id, name) FROM stdin;
1	Новости
2	Развлекательное
3	Спорт
4	Документальное
5	Утреннее
\.


--
-- Data for Name: tv_show; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tv_show (tv_show_id, title, advertising_minutes, price_per_minute, show_type_id, description, is_active, updated_at) FROM stdin;
1	Утреннее шоу «Доброе утро»	15.0	10000.00	5	Ежедневное утреннее шоу с новостями и гостями	t	2026-03-15 17:50:34.39562+03
2	Вечерние новости	12.0	25000.00	1	Главные новости дня	t	2026-03-15 17:50:34.39562+03
3	Дневной сериал «Судьба»	10.0	15000.00	2	Популярный дневной сериал	t	2026-03-15 17:50:34.39562+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, first_name, last_name, middle_name, email, password_hash, phone, is_active, updated_at, role_id) FROM stdin;
8	Сергей	Волков	Игоревич	volkov@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-888-88-88	t	2026-03-15 17:50:34.39562+03	1
9	Алексей	Новиков	Михайлович	novikov@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-999-99-99	t	2026-03-15 17:50:34.39562+03	2
5	Елена	Белова	Викторовна	belova@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-555-55-55	t	2026-03-15 17:50:34.39562+03	4
4	Дмитрий	Козлов	Олегович	kozlov@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-444-44-44	t	2026-03-15 17:50:34.39562+03	4
6	Максим	Орлов	Андреевич	orlov@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-666-66-66	t	2026-03-15 17:50:34.39562+03	5
7	Ольга	Морозова	Николаевна	morozova@tvcompany.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-777-77-77	t	2026-03-15 17:50:34.39562+03	6
11	Vladislav	Kalashnikov	Valerievich	kalashnikov78@gmail.com	470633ec6d4f3b3356553b52cf6b0b6e535c39f67316c7f97f96906880307214	79993432121	t	2026-03-15 19:37:31.424928+03	7
10	vlad	vlad	vlad	vlad@ya.ru	ea53e237265eb2d9a921739acad6d4fb0081601a12e131ea6806962f9ef7514a	79013202919	t	2026-03-15 19:18:34.602185+03	7
3	Кирилл	Сидоров	Петрович	sidorov@mail.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-333-33-33	t	2026-03-15 17:50:34.39562+03	7
2	Анна	Петрова	Сергеевна	petrova@mail.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-222-22-22	t	2026-03-15 17:50:34.39562+03	7
1	Иван	Иванов	Иванович	ivanov@mail.ru	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	+7-900-111-11-11	t	2026-03-15 17:50:34.39562+03	7
12	Пётр 	Петров 	Петрович 	newuser@test.ru	d9b5f58f0b38198293971865a14074f59eba3e82595becbe86ae51f1d9f1f65e	+79001234567	t	2026-03-24 20:32:39.3382+03	7
\.


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_audit_id_seq', 3, true);


--
-- Name: chat_message_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_message_message_id_seq', 3, true);


--
-- Name: notification_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_notification_id_seq', 3, true);


--
-- Name: notification_type_notification_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_type_notification_type_id_seq', 3, true);


--
-- Name: payment_type_payment_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_type_payment_type_id_seq', 4, true);


--
-- Name: request_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.request_request_id_seq', 5, true);


--
-- Name: request_status_type_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.request_status_type_status_id_seq', 5, true);


--
-- Name: role_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_role_id_seq', 7, true);


--
-- Name: show_schedule_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.show_schedule_schedule_id_seq', 6, true);


--
-- Name: show_type_show_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.show_type_show_type_id_seq', 5, true);


--
-- Name: tv_show_tv_show_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tv_show_tv_show_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 12, true);


--
-- Name: audit_log pk_audit_log; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT pk_audit_log PRIMARY KEY (audit_id);


--
-- Name: chat_message pk_chat_message; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT pk_chat_message PRIMARY KEY (message_id);


--
-- Name: contract pk_contract; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT pk_contract PRIMARY KEY (request_id);


--
-- Name: notification pk_notification; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT pk_notification PRIMARY KEY (notification_id);


--
-- Name: notification_type pk_notification_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_type
    ADD CONSTRAINT pk_notification_type PRIMARY KEY (notification_type_id);


--
-- Name: payment_type pk_payment_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_type
    ADD CONSTRAINT pk_payment_type PRIMARY KEY (payment_type_id);


--
-- Name: request pk_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT pk_request PRIMARY KEY (request_id);


--
-- Name: request_status_type pk_request_status_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_type
    ADD CONSTRAINT pk_request_status_type PRIMARY KEY (status_id);


--
-- Name: show_schedule pk_show_schedule; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_schedule
    ADD CONSTRAINT pk_show_schedule PRIMARY KEY (schedule_id);


--
-- Name: show_type pk_show_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_type
    ADD CONSTRAINT pk_show_type PRIMARY KEY (show_type_id);


--
-- Name: tv_show pk_tv_show; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tv_show
    ADD CONSTRAINT pk_tv_show PRIMARY KEY (tv_show_id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (user_id);


--
-- Name: role role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_name_key UNIQUE (name);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- Name: contract uq_contract_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT uq_contract_number UNIQUE (contract_number);


--
-- Name: notification_type uq_notification_type_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_type
    ADD CONSTRAINT uq_notification_type_name UNIQUE (name);


--
-- Name: payment_type uq_payment_type_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_type
    ADD CONSTRAINT uq_payment_type_name UNIQUE (name);


--
-- Name: request_status_type uq_request_status_type_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_type
    ADD CONSTRAINT uq_request_status_type_name UNIQUE (name);


--
-- Name: show_schedule uq_show_schedule_show_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_schedule
    ADD CONSTRAINT uq_show_schedule_show_date UNIQUE (tv_show_id, air_date);


--
-- Name: show_type uq_show_type_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_type
    ADD CONSTRAINT uq_show_type_name UNIQUE (name);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_entity ON public.audit_log USING btree (entity_name, entity_id);


--
-- Name: idx_audit_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_time ON public.audit_log USING btree (performed_at);


--
-- Name: idx_chat_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_request ON public.chat_message USING btree (request_id);


--
-- Name: idx_chat_request_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_request_ts ON public.chat_message USING btree (request_id, created_at);


--
-- Name: idx_notification_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_user ON public.notification USING btree (user_id);


--
-- Name: idx_notification_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_user_unread ON public.notification USING btree (user_id, is_read);


--
-- Name: idx_request_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_request_agent ON public.request USING btree (agent_id);


--
-- Name: idx_request_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_request_created ON public.request USING btree (created_at);


--
-- Name: idx_request_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_request_customer ON public.request USING btree (customer_id);


--
-- Name: idx_request_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_request_schedule ON public.request USING btree (schedule_id);


--
-- Name: idx_request_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_request_status ON public.request USING btree (status_id);


--
-- Name: idx_schedule_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_date ON public.show_schedule USING btree (air_date);


--
-- Name: idx_schedule_show; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_show ON public.show_schedule USING btree (tv_show_id);


--
-- Name: idx_tv_show_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tv_show_active ON public.tv_show USING btree (is_active);


--
-- Name: idx_tv_show_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tv_show_type ON public.tv_show USING btree (show_type_id);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- Name: idx_users_fullname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_fullname ON public.users USING btree (last_name, first_name);


--
-- Name: audit_log fk_audit_log_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT fk_audit_log_user FOREIGN KEY (performed_by_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_message fk_chat_message_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT fk_chat_message_request FOREIGN KEY (request_id) REFERENCES public.request(request_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_message fk_chat_message_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract fk_contract_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT fk_contract_request FOREIGN KEY (request_id) REFERENCES public.request(request_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification fk_notification_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT fk_notification_type FOREIGN KEY (notification_type_id) REFERENCES public.notification_type(notification_type_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notification fk_notification_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: request fk_request_agent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT fk_request_agent FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: request fk_request_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT fk_request_customer FOREIGN KEY (customer_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request fk_request_payment_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT fk_request_payment_type FOREIGN KEY (payment_type_id) REFERENCES public.payment_type(payment_type_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: request fk_request_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT fk_request_schedule FOREIGN KEY (schedule_id) REFERENCES public.show_schedule(schedule_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request fk_request_status; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT fk_request_status FOREIGN KEY (status_id) REFERENCES public.request_status_type(status_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: show_schedule fk_show_schedule_tv_show; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.show_schedule
    ADD CONSTRAINT fk_show_schedule_tv_show FOREIGN KEY (tv_show_id) REFERENCES public.tv_show(tv_show_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tv_show fk_tv_show_show_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tv_show
    ADD CONSTRAINT fk_tv_show_show_type FOREIGN KEY (show_type_id) REFERENCES public.show_type(show_type_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.role(role_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict v04A9dICe0wwusBKXovd6x1a6jTp7Sg6bFDtQZWGPdwOf2EeaIqnvx9asERXtns

