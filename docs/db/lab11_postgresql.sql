-- ============================================================
--  ЛАБОРАТОРНАЯ РАБОТА №11 — PostgreSQL
--  Цель: Освоение технологии разработки БД
--  Диалект: PostgreSQL 14+
--  БД: TVCompanyX — Система управления рекламными заявками
--  Структура скрипта:
--    1. Создание БД
--    2. Расширения и ENUM-типы
--    3. Создание таблиц (PK, UNIQUE, CHECK, DEFAULT)
--    4. Внешние ключи с ON DELETE / ON UPDATE
--    5. Индексы
--    6. Тестовые данные (≥3 строки на каждую таблицу)
--    7. Проверка
-- ============================================================


-- ─────────────────────────────────────────────
--  1. СОЗДАНИЕ БАЗЫ ДАННЫХ
--     Выполните эту часть от имени суперпользователя (postgres)
--     в базе postgres, затем подключитесь к TVCompanyX
-- ─────────────────────────────────────────────

-- Удалить БД, если существует (для повторного запуска):
DROP DATABASE IF EXISTS "TVCompanyX";

CREATE DATABASE "TVCompanyX"
    ENCODING    'UTF8'
    LC_COLLATE  'en_US.UTF-8'
    LC_CTYPE    'en_US.UTF-8'
    TEMPLATE    template0;

-- После создания БД подключитесь к ней:
-- \c "TVCompanyX"
-- (или выберите её в pgAdmin и выполните остальной скрипт)


-- ─────────────────────────────────────────────
--  2. РАСШИРЕНИЯ
-- ─────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- ─────────────────────────────────────────────
--  2. ТИПЫ (ENUM)
-- ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
    'customer',
    'agent',
    'commercial',
    'accountant',
    'admin',
    'director'
);

CREATE TYPE application_status AS ENUM (
    'pending',
    'in_progress',
    'sent_to_commercial',
    'approved',
    'rejected',
    'paid',
    'overdue'
);

CREATE TYPE payment_method AS ENUM (
    'card',
    'transfer',
    'cash'
);

CREATE TYPE show_type AS ENUM (
    'news',
    'entertainment',
    'sport',
    'documentary',
    'morning'
);

CREATE TYPE contract_status AS ENUM (
    'sent',
    'viewed',
    'downloaded',
    'signed'
);

-- ─────────────────────────────────────────────
--  3. ТАБЛИЦЫ
-- ─────────────────────────────────────────────

-- Таблица: users (Пользователи)
CREATE TABLE users (
    id            UUID          NOT NULL DEFAULT uuid_generate_v4(),
    first_name    VARCHAR(100)  NOT NULL,
    middle_name   VARCHAR(100)  NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         CITEXT        NOT NULL,
    password_hash TEXT          NULL,
    role          user_role     NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    phone         VARCHAR(30)   NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_users        PRIMARY KEY (id),
    CONSTRAINT UQ_users_email  UNIQUE      (email)
);

-- Таблица: shows (Телешоу)
CREATE TABLE shows (
    id                  UUID            NOT NULL DEFAULT uuid_generate_v4(),
    name                VARCHAR(255)    NOT NULL,
    time_slot           VARCHAR(50)     NOT NULL,
    base_price_per_min  NUMERIC(12,2)   NOT NULL,
    show_type           show_type       NULL,
    description         TEXT            NULL,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_shows PRIMARY KEY (id)
);

-- Таблица: show_schedule (Расписание шоу)
CREATE TABLE show_schedule (
    id               UUID        NOT NULL DEFAULT uuid_generate_v4(),
    show_id          UUID        NOT NULL,
    scheduled_date   DATE        NOT NULL,
    duration_minutes INT         NOT NULL,
    ad_minutes       INT         NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_show_schedule              PRIMARY KEY (id),
    CONSTRAINT UQ_show_schedule_show_date    UNIQUE      (show_id, scheduled_date),
    CONSTRAINT CK_show_schedule_duration     CHECK       (duration_minutes > 0),
    CONSTRAINT CK_show_schedule_ad           CHECK       (ad_minutes >= 0)
);

-- Таблица: applications (Заявки)
CREATE TABLE applications (
    id               UUID               NOT NULL DEFAULT uuid_generate_v4(),
    customer_id      UUID               NOT NULL,
    agent_id         UUID               NULL,
    show_id          UUID               NOT NULL,
    scheduled_at     TIMESTAMPTZ        NOT NULL,
    duration_seconds INT                NOT NULL,
    status           application_status NOT NULL DEFAULT 'pending',
    cost             NUMERIC(14,2)      NOT NULL DEFAULT 0,
    description      TEXT               NULL,
    contact_phone    VARCHAR(30)        NULL,
    payment_method   payment_method     NULL,
    payment_date     TIMESTAMPTZ        NULL,
    due_date         TIMESTAMPTZ        NULL,
    created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_applications           PRIMARY KEY (id),
    CONSTRAINT CK_applications_duration  CHECK (duration_seconds BETWEEN 5 AND 300)
);

-- Таблица: commissions (Комиссии агентов)
CREATE TABLE commissions (
    id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
    agent_id       UUID          NOT NULL,
    application_id UUID          NOT NULL,
    percent        NUMERIC(5,2)  NOT NULL,
    amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_commissions              PRIMARY KEY (id),
    CONSTRAINT UQ_commissions_agent_app    UNIQUE      (agent_id, application_id),
    CONSTRAINT CK_commissions_percent      CHECK       (percent >= 0)
);

-- Таблица: contracts (Договоры)
CREATE TABLE contracts (
    id              UUID            NOT NULL DEFAULT uuid_generate_v4(),
    application_id  UUID            NOT NULL,
    contract_number VARCHAR(50)     NULL,
    contract_date   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    cost            NUMERIC(14,2)   NOT NULL DEFAULT 0,
    description     TEXT            NULL,
    status          contract_status NOT NULL DEFAULT 'sent',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_contracts             PRIMARY KEY (id),
    CONSTRAINT UQ_contracts_app         UNIQUE      (application_id),
    CONSTRAINT UQ_contracts_number      UNIQUE      (contract_number)
);

-- Таблица: chat_messages (Сообщения чата)
CREATE TABLE chat_messages (
    id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    room_id     VARCHAR(255) NOT NULL,
    sender_id   UUID        NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_chat_messages PRIMARY KEY (id)
);

-- Таблица: notifications (Уведомления)
CREATE TABLE notifications (
    id         UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id    UUID         NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_notifications PRIMARY KEY (id)
);

-- Таблица: audit_log (Журнал аудита)
CREATE TABLE audit_log (
    id         BIGSERIAL      NOT NULL,
    entity     VARCHAR(100)   NOT NULL,
    entity_id  UUID           NOT NULL,
    action     VARCHAR(50)    NOT NULL,
    changed_by UUID           NULL,
    changed_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    payload    JSONB          NULL,

    CONSTRAINT PK_audit_log    PRIMARY KEY (id),
    CONSTRAINT CK_audit_action CHECK (action IN ('create', 'update', 'delete'))
);

-- ─────────────────────────────────────────────
--  4. ВНЕШНИЕ КЛЮЧИ
-- ─────────────────────────────────────────────

ALTER TABLE show_schedule
    ADD CONSTRAINT FK_show_schedule_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE applications
    ADD CONSTRAINT FK_applications_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE applications
    ADD CONSTRAINT FK_applications_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE applications
    ADD CONSTRAINT FK_applications_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE contracts
    ADD CONSTRAINT FK_contracts_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE chat_messages
    ADD CONSTRAINT FK_chat_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE notifications
    ADD CONSTRAINT FK_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_log_user
    FOREIGN KEY (changed_by) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
--  5. ИНДЕКСЫ
-- ─────────────────────────────────────────────

CREATE INDEX idx_users_role          ON users(role);
CREATE INDEX idx_users_fullname      ON users(last_name, first_name);
CREATE INDEX idx_shows_active        ON shows(is_active);
CREATE INDEX idx_shows_type          ON shows(show_type);
CREATE INDEX idx_schedule_date       ON show_schedule(scheduled_date);
CREATE INDEX idx_app_customer        ON applications(customer_id);
CREATE INDEX idx_app_agent           ON applications(agent_id);
CREATE INDEX idx_app_show            ON applications(show_id);
CREATE INDEX idx_app_status          ON applications(status);
CREATE INDEX idx_app_customer_status ON applications(customer_id, status);
CREATE INDEX idx_chat_room           ON chat_messages(room_id);
CREATE INDEX idx_chat_room_time      ON chat_messages(room_id, created_at);
CREATE INDEX idx_notif_user          ON notifications(user_id);
CREATE INDEX idx_notif_user_unread   ON notifications(user_id, is_read);
CREATE INDEX idx_audit_entity        ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_time          ON audit_log(changed_at);

-- ─────────────────────────────────────────────
--  6. ТЕСТОВЫЕ ДАННЫЕ
-- ─────────────────────────────────────────────

-- users (9 строк, все 6 ролей)
INSERT INTO users (id, first_name, middle_name, last_name, email, password_hash, role, is_active, phone)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Иван',    'Иванович',    'Иванов',   'ivanov@mail.ru',         '$2b$10$hashedpassword1', 'customer',   TRUE, '+7-900-111-11-11'),
    ('a0000001-0000-0000-0000-000000000002', 'Анна',    'Сергеевна',   'Петрова',  'petrova@mail.ru',        '$2b$10$hashedpassword2', 'customer',   TRUE, '+7-900-222-22-22'),
    ('a0000001-0000-0000-0000-000000000003', 'Кирилл',  'Петрович',    'Сидоров',  'sidorov@mail.ru',        '$2b$10$hashedpassword3', 'customer',   TRUE, '+7-900-333-33-33'),
    ('a0000002-0000-0000-0000-000000000001', 'Дмитрий', 'Олегович',    'Козлов',   'kozlov@tvcompany.ru',    '$2b$10$hashedpassword4', 'agent',      TRUE, '+7-900-444-44-44'),
    ('a0000002-0000-0000-0000-000000000002', 'Елена',   'Викторовна',  'Белова',   'belova@tvcompany.ru',    '$2b$10$hashedpassword5', 'agent',      TRUE, '+7-900-555-55-55'),
    ('a0000003-0000-0000-0000-000000000001', 'Максим',  'Андреевич',   'Орлов',    'orlov@tvcompany.ru',     '$2b$10$hashedpassword6', 'commercial', TRUE, '+7-900-666-66-66'),
    ('a0000004-0000-0000-0000-000000000001', 'Ольга',   'Николаевна',  'Морозова', 'morozova@tvcompany.ru',  '$2b$10$hashedpassword7', 'accountant', TRUE, '+7-900-777-77-77'),
    ('a0000005-0000-0000-0000-000000000001', 'Сергей',  'Игоревич',    'Волков',   'volkov@tvcompany.ru',    '$2b$10$hashedpassword8', 'admin',      TRUE, '+7-900-888-88-88'),
    ('a0000006-0000-0000-0000-000000000001', 'Алексей', 'Михайлович',  'Новиков',  'novikov@tvcompany.ru',   '$2b$10$hashedpassword9', 'director',   TRUE, '+7-900-999-99-99');

-- shows (3 строки)
INSERT INTO shows (id, name, time_slot, base_price_per_min, show_type, description, is_active)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'Утреннее шоу «Доброе утро»', '08:00-10:00', 10000.00, 'morning',       'Ежедневное утреннее шоу с новостями и гостями', TRUE),
    ('b0000001-0000-0000-0000-000000000002', 'Дневной сериал «Судьба»',    '12:00-13:00', 15000.00, 'entertainment', 'Популярный дневной сериал',                      TRUE),
    ('b0000001-0000-0000-0000-000000000003', 'Вечерние новости',            '19:00-20:00', 25000.00, 'news',          'Главные новости дня',                            TRUE);

-- show_schedule (6 строк)
INSERT INTO show_schedule (id, show_id, scheduled_date, duration_minutes, ad_minutes)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2026-03-01', 120, 30),
    ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', '2026-03-01',  60, 15),
    ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', '2026-03-01',  60, 20),
    (uuid_generate_v4(),                    'b0000001-0000-0000-0000-000000000001', '2026-03-02', 120, 28),
    (uuid_generate_v4(),                    'b0000001-0000-0000-0000-000000000002', '2026-03-02',  60, 14),
    (uuid_generate_v4(),                    'b0000001-0000-0000-0000-000000000003', '2026-03-02',  60, 19);

-- applications (3 строки)
INSERT INTO applications (id, customer_id, agent_id, show_id, scheduled_at, duration_seconds, status, cost, description, contact_phone, payment_method, due_date)
VALUES
    ('d0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001',
     'b0000001-0000-0000-0000-000000000001',
     '2026-03-01 08:30:00+03', 30, 'approved', 5000.00,
     'Реклама сети ресторанов «Вкусно»', '+7-900-111-11-11', 'card', '2026-03-15 23:59:59+03'),

    ('d0000001-0000-0000-0000-000000000002',
     'a0000001-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000001',
     'b0000001-0000-0000-0000-000000000003',
     '2026-03-01 19:15:00+03', 60, 'paid', 25000.00,
     'Реклама автосалона «АвтоМир»', '+7-900-222-22-22', 'transfer', '2026-03-10 23:59:59+03'),

    ('d0000001-0000-0000-0000-000000000003',
     'a0000001-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000002',
     'b0000001-0000-0000-0000-000000000002',
     '2026-03-02 12:10:00+03', 15, 'pending', 3750.00,
     'Реклама интернет-магазина «ТехноДом»', '+7-900-333-33-33', NULL, NULL);

-- commissions (3 строки)
INSERT INTO commissions (agent_id, application_id, percent, amount)
VALUES
    ('a0000002-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 5.00,  250.00),
    ('a0000002-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 5.00, 1250.00),
    ('a0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 5.00,  187.50);

-- contracts (3 строки)
INSERT INTO contracts (application_id, contract_number, contract_date, cost, description, status)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'DOG-2026-000001', '2026-02-20 00:00:00+03', 5000.00,
     'Реклама сети ресторанов «Вкусно»', 'viewed'),

    ('d0000001-0000-0000-0000-000000000002', 'DOG-2026-000002', '2026-02-21 00:00:00+03', 25000.00,
     'Реклама автосалона «АвтоМир»', 'downloaded'),

    ('d0000001-0000-0000-0000-000000000003', 'DOG-2026-000003', '2026-02-24 00:00:00+03', 3750.00,
     'Реклама интернет-магазина «ТехноДом»', 'sent');

-- chat_messages (3 строки)
INSERT INTO chat_messages (room_id, sender_id, content)
VALUES
    ('room-app1-cust-agent', 'a0000001-0000-0000-0000-000000000001',
     'Здравствуйте! Хочу разместить рекламу в утреннем шоу.'),

    ('room-app1-cust-agent', 'a0000002-0000-0000-0000-000000000001',
     'Добрый день! Принято, передаю на согласование.'),

    ('room-app2-cust-agent', 'a0000002-0000-0000-0000-000000000001',
     'Максим, прошу согласовать заявку на вечерние новости.');

-- notifications (3 строки)
INSERT INTO notifications (user_id, type, title, message, is_read)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'application', 'Заявка одобрена',
     'Ваша заявка на размещение в «Утреннем шоу» одобрена.', TRUE),

    ('a0000001-0000-0000-0000-000000000002', 'billing', 'Оплата получена',
     'Спасибо за оплату! Рекламный ролик запланирован на 01.03.2026.', TRUE),

    ('a0000002-0000-0000-0000-000000000001', 'application', 'Новая заявка',
     'Вам назначена новая заявка от клиента Сидоров К.П.', FALSE);

-- audit_log (3 строки)
INSERT INTO audit_log (entity, entity_id, action, changed_by, payload)
VALUES
    ('applications', 'd0000001-0000-0000-0000-000000000001', 'create',
     'a0000002-0000-0000-0000-000000000001',
     '{"status":"pending","customer":"Иванов И.И.","show":"Утреннее шоу"}'),

    ('applications', 'd0000001-0000-0000-0000-000000000001', 'update',
     'a0000003-0000-0000-0000-000000000001',
     '{"old_status":"pending","new_status":"approved"}'),

    ('users', 'a0000005-0000-0000-0000-000000000001', 'update',
     'a0000005-0000-0000-0000-000000000001',
     '{"action":"activated_user","target":"agent2"}');


-- ─────────────────────────────────────────────
--  7. ПРОВЕРКА: количество строк в таблицах
-- ─────────────────────────────────────────────

SELECT 'users'          AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'shows',           COUNT(*) FROM shows
UNION ALL SELECT 'show_schedule',   COUNT(*) FROM show_schedule
UNION ALL SELECT 'applications',    COUNT(*) FROM applications
UNION ALL SELECT 'commissions',     COUNT(*) FROM commissions
UNION ALL SELECT 'contracts',       COUNT(*) FROM contracts
UNION ALL SELECT 'chat_messages',   COUNT(*) FROM chat_messages
UNION ALL SELECT 'notifications',   COUNT(*) FROM notifications
UNION ALL SELECT 'audit_log',       COUNT(*) FROM audit_log
ORDER BY table_name;
