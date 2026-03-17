-- ============================================================
--  ЛАБОРАТОРНАЯ РАБОТА №11 — PostgreSQL
--  Цель: Освоение технологии разработки БД
--  Диалект: PostgreSQL 14+
--  БД: TVCompanyX — Система управления рекламными заявками
--  Физическая модель: DBML (logical → physical)
--  -----------------------------------------------------------
--  Структура скрипта:
--    1. Создание БД
--    2. Создание таблиц (PK, UNIQUE, CHECK, NOT NULL, DEFAULT)
--    3. Внешние ключи с ON DELETE / ON UPDATE
--    4. Индексы
--    5. Тестовые данные (≥3 строки на таблицу)
--    6. Проверка
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1. СОЗДАНИЕ БАЗЫ ДАННЫХ
--     Выполните этот блок от имени postgres в базе postgres,
--     затем переключитесь на TVCompanyX (\c "TVCompanyX")
-- ─────────────────────────────────────────────────────────────

DROP DATABASE IF EXISTS "TVCompanyX";

CREATE DATABASE "TVCompanyX"
    ENCODING   'UTF8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE   'en_US.UTF-8'
    TEMPLATE   template0;

-- После создания подключитесь к базе и выполните остальной скрипт:
-- \c "TVCompanyX"


-- ─────────────────────────────────────────────────────────────
--  2. ТАБЛИЦЫ
--  Порядок: справочники → главные → зависимые
--  ПРИМЕЧАНИЕ: "user" — зарезервированное слово в PostgreSQL,
--  поэтому таблица названа "users"
-- ─────────────────────────────────────────────────────────────


-- ───────────────────────────
--  Справочник: show_type
-- ───────────────────────────
CREATE TABLE show_type (
    show_type_id  SERIAL        NOT NULL,
    name          VARCHAR(150)  NOT NULL,

    CONSTRAINT PK_show_type      PRIMARY KEY (show_type_id),
    CONSTRAINT UQ_show_type_name UNIQUE      (name),
    CONSTRAINT CK_show_type_name CHECK       (LENGTH(TRIM(name)) > 0)
);


-- ───────────────────────────
--  Справочник: notification_type
-- ───────────────────────────
CREATE TABLE notification_type (
    notification_type_id  SERIAL        NOT NULL,
    name                  VARCHAR(120)  NOT NULL,

    CONSTRAINT PK_notification_type      PRIMARY KEY (notification_type_id),
    CONSTRAINT UQ_notification_type_name UNIQUE      (name),
    CONSTRAINT CK_notification_type_name CHECK       (LENGTH(TRIM(name)) > 0)
);


-- ───────────────────────────
--  Справочник: request_status_type
-- ───────────────────────────
CREATE TABLE request_status_type (
    status_id  SERIAL       NOT NULL,
    name       VARCHAR(80)  NOT NULL,

    CONSTRAINT PK_request_status_type      PRIMARY KEY (status_id),
    CONSTRAINT UQ_request_status_type_name UNIQUE      (name),
    CONSTRAINT CK_request_status_type_name CHECK       (LENGTH(TRIM(name)) > 0)
);


-- ───────────────────────────
--  Справочник: payment_type
-- ───────────────────────────
CREATE TABLE payment_type (
    payment_type_id  SERIAL        NOT NULL,
    name             VARCHAR(100)  NOT NULL,

    CONSTRAINT PK_payment_type      PRIMARY KEY (payment_type_id),
    CONSTRAINT UQ_payment_type_name UNIQUE      (name),
    CONSTRAINT CK_payment_type_name CHECK       (LENGTH(TRIM(name)) > 0)
);


-- ───────────────────────────
--  Таблица: users
-- ───────────────────────────
CREATE TABLE users (
    user_id       SERIAL        NOT NULL,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    middle_name   VARCHAR(100)  NULL,
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(50)   NOT NULL,
    phone         VARCHAR(30)   NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_users       PRIMARY KEY (user_id),
    CONSTRAINT UQ_users_email UNIQUE      (email),
    CONSTRAINT CK_users_role  CHECK       (role IN (
        'admin', 'director', 'manager', 'agent', 'commercial', 'accountant', 'customer'
    )),
    CONSTRAINT CK_users_first_name CHECK (LENGTH(TRIM(first_name)) > 0),
    CONSTRAINT CK_users_last_name  CHECK (LENGTH(TRIM(last_name))  > 0),
    CONSTRAINT CK_users_email_fmt  CHECK (email LIKE '%@%')
);


-- ───────────────────────────
--  Таблица: tv_show
-- ───────────────────────────
CREATE TABLE tv_show (
    tv_show_id           SERIAL         NOT NULL,
    title                VARCHAR(200)   NOT NULL,
    advertising_minutes  NUMERIC(4,1)   NOT NULL DEFAULT 0,
    price_per_minute     NUMERIC(12,2)  NOT NULL,
    show_type_id         INT            NOT NULL,
    description          TEXT           NULL,
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_tv_show               PRIMARY KEY (tv_show_id),
    CONSTRAINT CK_tv_show_title         CHECK       (LENGTH(TRIM(title)) > 0),
    CONSTRAINT CK_tv_show_ad_minutes    CHECK       (advertising_minutes >= 0),
    CONSTRAINT CK_tv_show_price         CHECK       (price_per_minute > 0)
);


-- ───────────────────────────
--  Таблица: show_schedule
-- ───────────────────────────
CREATE TABLE show_schedule (
    schedule_id     SERIAL       NOT NULL,
    tv_show_id      INT          NOT NULL,
    start_datetime  TIMESTAMPTZ  NOT NULL,
    air_date        DATE         NOT NULL,
    air_time        TIME         NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_show_schedule             PRIMARY KEY (schedule_id),
    CONSTRAINT UQ_show_schedule_show_date   UNIQUE      (tv_show_id, air_date)
    -- Note: start_datetime is mandatory; air_date + air_time are redundant but kept per diagram
);


-- ───────────────────────────
--  Таблица: request
-- ───────────────────────────
CREATE TABLE request (
    request_id        SERIAL         NOT NULL,
    customer_id       INT            NOT NULL,
    agent_id          INT            NULL,
    schedule_id       INT            NOT NULL,
    planned_datetime  TIMESTAMPTZ    NULL,
    duration_seconds  INTEGER        NOT NULL DEFAULT 0,
    status_id         INT            NOT NULL,
    total_cost        NUMERIC(14,2)  NOT NULL,
    description       TEXT           NULL,
    contact_phone     VARCHAR(30)    NOT NULL,
    payment_type_id   INT            NULL,
    payment_date      DATE           NULL,
    payment_due_date  DATE           NULL,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_request                   PRIMARY KEY (request_id),
    CONSTRAINT CK_request_duration          CHECK       (duration_seconds >= 0),
    CONSTRAINT CK_request_total_cost        CHECK       (total_cost >= 0),
    CONSTRAINT CK_request_contact_phone     CHECK       (LENGTH(TRIM(contact_phone)) > 0),
    CONSTRAINT CK_request_payment_dates     CHECK       (
        payment_date IS NULL
        OR payment_due_date IS NULL
        OR payment_date <= payment_due_date
    )
);


-- ───────────────────────────
--  Таблица: contract (1:1 с request)
-- ───────────────────────────
CREATE TABLE contract (
    request_id        INT            NOT NULL,
    contract_number   VARCHAR(40)    NOT NULL,
    contract_date     DATE           NOT NULL,
    amount            NUMERIC(14,2)  NOT NULL,
    description       TEXT           NULL,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    agent_commission  NUMERIC(12,2)  NULL,

    CONSTRAINT PK_contract             PRIMARY KEY (request_id),
    CONSTRAINT UQ_contract_number      UNIQUE      (contract_number),
    CONSTRAINT CK_contract_number      CHECK       (LENGTH(TRIM(contract_number)) > 0),
    CONSTRAINT CK_contract_amount      CHECK       (amount > 0),
    CONSTRAINT CK_contract_commission  CHECK       (agent_commission IS NULL OR agent_commission >= 0)
);


-- ───────────────────────────
--  Таблица: notification
-- ───────────────────────────
CREATE TABLE notification (
    notification_id       SERIAL       NOT NULL,
    notification_type_id  INT          NOT NULL,
    user_id               INT          NOT NULL,
    message               TEXT         NOT NULL,
    is_read               BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_notification         PRIMARY KEY (notification_id),
    CONSTRAINT CK_notification_message CHECK       (LENGTH(TRIM(message)) > 0)
);


-- ───────────────────────────
--  Таблица: chat_message
-- ───────────────────────────
CREATE TABLE chat_message (
    message_id  SERIAL       NOT NULL,
    request_id  INT          NOT NULL,
    sender_id   INT          NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT PK_chat_message         PRIMARY KEY (message_id),
    CONSTRAINT CK_chat_message_content CHECK       (LENGTH(TRIM(content)) > 0)
);


-- ───────────────────────────
--  Таблица: audit_log
-- ───────────────────────────
CREATE TABLE audit_log (
    audit_id        SERIAL        NOT NULL,
    entity_name     VARCHAR(60)   NOT NULL,
    entity_id       INT           NOT NULL,
    action          VARCHAR(20)   NOT NULL,
    performed_by_id INT           NULL,
    performed_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    data            JSONB         NULL,

    CONSTRAINT PK_audit_log        PRIMARY KEY (audit_id),
    CONSTRAINT CK_audit_log_action CHECK       (action IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT CK_audit_log_entity CHECK       (LENGTH(TRIM(entity_name)) > 0),
    CONSTRAINT CK_audit_log_id     CHECK       (entity_id > 0)
);


-- ─────────────────────────────────────────────────────────────
--  3. ВНЕШНИЕ КЛЮЧИ С ON DELETE / ON UPDATE
-- ─────────────────────────────────────────────────────────────

-- tv_show → show_type
ALTER TABLE tv_show
    ADD CONSTRAINT FK_tv_show_show_type
    FOREIGN KEY (show_type_id) REFERENCES show_type(show_type_id)
    ON DELETE RESTRICT   -- нельзя удалить тип, если есть шоу
    ON UPDATE CASCADE;

-- show_schedule → tv_show
ALTER TABLE show_schedule
    ADD CONSTRAINT FK_show_schedule_tv_show
    FOREIGN KEY (tv_show_id) REFERENCES tv_show(tv_show_id)
    ON DELETE RESTRICT   -- нельзя удалить шоу с расписанием
    ON UPDATE CASCADE;

-- request → users (customer_id)
ALTER TABLE request
    ADD CONSTRAINT FK_request_customer
    FOREIGN KEY (customer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT   -- нельзя удалить заказчика с активными заявками
    ON UPDATE CASCADE;

-- request → users (agent_id)
ALTER TABLE request
    ADD CONSTRAINT FK_request_agent
    FOREIGN KEY (agent_id) REFERENCES users(user_id)
    ON DELETE SET NULL   -- при удалении агента — обнуляем ссылку
    ON UPDATE CASCADE;

-- request → show_schedule
ALTER TABLE request
    ADD CONSTRAINT FK_request_schedule
    FOREIGN KEY (schedule_id) REFERENCES show_schedule(schedule_id)
    ON DELETE RESTRICT   -- нельзя удалить расписание с заявками
    ON UPDATE CASCADE;

-- request → request_status_type
ALTER TABLE request
    ADD CONSTRAINT FK_request_status
    FOREIGN KEY (status_id) REFERENCES request_status_type(status_id)
    ON DELETE RESTRICT   -- нельзя удалить статус, если он используется
    ON UPDATE CASCADE;

-- request → payment_type
ALTER TABLE request
    ADD CONSTRAINT FK_request_payment_type
    FOREIGN KEY (payment_type_id) REFERENCES payment_type(payment_type_id)
    ON DELETE SET NULL   -- при удалении типа оплаты — обнуляем
    ON UPDATE CASCADE;

-- contract → request (1:1)
ALTER TABLE contract
    ADD CONSTRAINT FK_contract_request
    FOREIGN KEY (request_id) REFERENCES request(request_id)
    ON DELETE CASCADE    -- удаление заявки удаляет договор
    ON UPDATE CASCADE;

-- notification → notification_type
ALTER TABLE notification
    ADD CONSTRAINT FK_notification_type
    FOREIGN KEY (notification_type_id) REFERENCES notification_type(notification_type_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- notification → users
ALTER TABLE notification
    ADD CONSTRAINT FK_notification_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE    -- удаление пользователя удаляет его уведомления
    ON UPDATE CASCADE;

-- chat_message → request
ALTER TABLE chat_message
    ADD CONSTRAINT FK_chat_message_request
    FOREIGN KEY (request_id) REFERENCES request(request_id)
    ON DELETE CASCADE    -- удаление заявки удаляет переписку
    ON UPDATE CASCADE;

-- chat_message → users (sender_id)
ALTER TABLE chat_message
    ADD CONSTRAINT FK_chat_message_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
    ON DELETE RESTRICT   -- нельзя удалить пользователя с сообщениями
    ON UPDATE CASCADE;

-- audit_log → users (performed_by_id)
ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_log_user
    FOREIGN KEY (performed_by_id) REFERENCES users(user_id)
    ON DELETE SET NULL   -- при удалении пользователя — сохраняем запись
    ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────
--  4. ИНДЕКСЫ
-- ─────────────────────────────────────────────────────────────

-- users
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);
CREATE INDEX idx_users_fullname ON users(last_name, first_name);

-- tv_show
CREATE INDEX idx_tv_show_type   ON tv_show(show_type_id);
CREATE INDEX idx_tv_show_active ON tv_show(is_active);

-- show_schedule
CREATE INDEX idx_schedule_show ON show_schedule(tv_show_id);
CREATE INDEX idx_schedule_date ON show_schedule(air_date);

-- request
CREATE INDEX idx_request_customer ON request(customer_id);
CREATE INDEX idx_request_agent    ON request(agent_id);
CREATE INDEX idx_request_schedule ON request(schedule_id);
CREATE INDEX idx_request_status   ON request(status_id);
CREATE INDEX idx_request_created  ON request(created_at);

-- notification
CREATE INDEX idx_notification_user        ON notification(user_id);
CREATE INDEX idx_notification_user_unread ON notification(user_id, is_read);

-- chat_message
CREATE INDEX idx_chat_request    ON chat_message(request_id);
CREATE INDEX idx_chat_request_ts ON chat_message(request_id, created_at);

-- audit_log
CREATE INDEX idx_audit_entity ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_time   ON audit_log(performed_at);


-- ─────────────────────────────────────────────────────────────
--  5. ТЕСТОВЫЕ ДАННЫЕ (≥3 строки на каждую таблицу)
--  Порядок вставки: справочники → users → tv_show →
--  show_schedule → request → contract → notification →
--  chat_message → audit_log
-- ─────────────────────────────────────────────────────────────


-- ── show_type (5 строк) ──
INSERT INTO show_type (name) VALUES
    ('Новости'),
    ('Развлекательное'),
    ('Спорт'),
    ('Документальное'),
    ('Утреннее');
-- IDs: 1=Новости, 2=Развлекательное, 3=Спорт, 4=Документальное, 5=Утреннее


-- ── notification_type (3 строки) ──
INSERT INTO notification_type (name) VALUES
    ('Статус заявки'),
    ('Оплата'),
    ('Назначение агента');
-- IDs: 1, 2, 3


-- ── request_status_type (5 строк) ──
INSERT INTO request_status_type (name) VALUES
    ('Новая'),
    ('В обсуждении'),
    ('Одобрена'),
    ('Оплачена'),
    ('Отменена');
-- IDs: 1=Новая, 2=В обсуждении, 3=Одобрена, 4=Оплачена, 5=Отменена


-- ── payment_type (4 строки) ──
INSERT INTO payment_type (name) VALUES
    ('Банковский перевод'),
    ('Карта'),
    ('Наличные'),
    ('Счёт-фактура');
-- IDs: 1=Банковский перевод, 2=Карта, 3=Наличные, 4=Счёт-фактура


-- ── users (9 строк, все роли) ──
INSERT INTO users (first_name, last_name, middle_name, email, password_hash, role, phone, is_active)
VALUES
    ('Иван',    'Иванов',   'Иванович',   'ivanov@mail.ru',         'hash_customer1', 'customer',   '+7-900-111-11-11', TRUE),
    ('Анна',    'Петрова',  'Сергеевна',  'petrova@mail.ru',        'hash_customer2', 'customer',   '+7-900-222-22-22', TRUE),
    ('Кирилл',  'Сидоров',  'Петрович',   'sidorov@mail.ru',        'hash_customer3', 'customer',   '+7-900-333-33-33', TRUE),
    ('Дмитрий', 'Козлов',   'Олегович',   'kozlov@tvcompany.ru',    'hash_agent1',    'agent',      '+7-900-444-44-44', TRUE),
    ('Елена',   'Белова',   'Викторовна', 'belova@tvcompany.ru',    'hash_agent2',    'agent',      '+7-900-555-55-55', TRUE),
    ('Максим',  'Орлов',    'Андреевич',  'orlov@tvcompany.ru',     'hash_commerc1',  'commercial', '+7-900-666-66-66', TRUE),
    ('Ольга',   'Морозова', 'Николаевна', 'morozova@tvcompany.ru',  'hash_account1',  'accountant', '+7-900-777-77-77', TRUE),
    ('Сергей',  'Волков',   'Игоревич',   'volkov@tvcompany.ru',    'hash_admin1',    'admin',      '+7-900-888-88-88', TRUE),
    ('Алексей', 'Новиков',  'Михайлович', 'novikov@tvcompany.ru',   'hash_director1', 'director',   '+7-900-999-99-99', TRUE);
-- IDs: 1-3=customer, 4-5=agent, 6=commercial, 7=accountant, 8=admin, 9=director


-- ── tv_show (3 строки) ──
INSERT INTO tv_show (title, advertising_minutes, price_per_minute, show_type_id, description, is_active)
VALUES
    ('Утреннее шоу «Доброе утро»', 15.0, 10000.00, 5, 'Ежедневное утреннее шоу с новостями и гостями', TRUE),
    ('Вечерние новости',            12.0, 25000.00, 1, 'Главные новости дня',                            TRUE),
    ('Дневной сериал «Судьба»',     10.0, 15000.00, 2, 'Популярный дневной сериал',                      TRUE);
-- IDs: 1=Утреннее шоу, 2=Вечерние новости, 3=Дневной сериал


-- ── show_schedule (6 строк) ──
INSERT INTO show_schedule (tv_show_id, start_datetime, air_date, air_time)
VALUES
    (1, '2026-03-01 08:00:00+03', '2026-03-01', '08:00:00'),
    (2, '2026-03-01 19:00:00+03', '2026-03-01', '19:00:00'),
    (3, '2026-03-01 12:00:00+03', '2026-03-01', '12:00:00'),
    (1, '2026-03-02 08:00:00+03', '2026-03-02', '08:00:00'),
    (2, '2026-03-02 19:00:00+03', '2026-03-02', '19:00:00'),
    (3, '2026-03-02 12:00:00+03', '2026-03-02', '12:00:00');
-- IDs: 1-6


-- ── request (3 строки) ──
INSERT INTO request (customer_id, agent_id, schedule_id, duration_seconds, status_id, total_cost, description, contact_phone, payment_type_id, payment_due_date)
VALUES
    (1, 4, 1, 30, 3, 5000.00,
     'Реклама сети ресторанов «Вкусно»',
     '+7-900-111-11-11', 2, '2026-03-15'),

    (2, 4, 2, 60, 4, 25000.00,
     'Реклама автосалона «АвтоМир»',
     '+7-900-222-22-22', 1, '2026-03-10'),

    (3, 5, 3, 15, 1, 3750.00,
     'Реклама интернет-магазина «ТехноДом»',
     '+7-900-333-33-33', NULL, NULL);
-- IDs: 1, 2, 3


-- ── contract (3 строки) ──
INSERT INTO contract (request_id, contract_number, contract_date, amount, description, agent_commission)
VALUES
    (1, 'DOG-2026-000001', '2026-02-20', 5000.00,
     'Реклама сети ресторанов «Вкусно»',    250.00),

    (2, 'DOG-2026-000002', '2026-02-21', 25000.00,
     'Реклама автосалона «АвтоМир»',       1250.00),

    (3, 'DOG-2026-000003', '2026-02-24', 3750.00,
     'Реклама интернет-магазина «ТехноДом»', 187.50);


-- ── notification (3 строки) ──
INSERT INTO notification (notification_type_id, user_id, message, is_read)
VALUES
    (1, 1, 'Ваша заявка на размещение в «Утреннем шоу» одобрена.',                TRUE),
    (2, 2, 'Спасибо за оплату! Рекламный ролик запланирован на 01.03.2026.',       TRUE),
    (3, 4, 'Вам назначена новая заявка от клиента Сидоров К.П.',                   FALSE);


-- ── chat_message (3 строки) ──
INSERT INTO chat_message (request_id, sender_id, content)
VALUES
    (1, 1, 'Здравствуйте! Хочу разместить рекламу в утреннем шоу.'),
    (1, 4, 'Добрый день! Принято, передаю на согласование коммерческому отделу.'),
    (2, 4, 'Орлов, прошу согласовать заявку на вечерние новости (ID 2).');


-- ── audit_log (3 строки) ──
INSERT INTO audit_log (entity_name, entity_id, action, performed_by_id, data)
VALUES
    ('request', 1, 'INSERT', 4,
     '{"status": "Новая", "customer": "Иванов И.И.", "show": "Утреннее шоу"}'),

    ('request', 1, 'UPDATE', 6,
     '{"old_status": "В обсуждении", "new_status": "Одобрена"}'),

    ('users', 8, 'UPDATE', 8,
     '{"action": "activated_user", "target_user_id": 5}');


-- ─────────────────────────────────────────────────────────────
--  6. ПРОВЕРКА: количество строк в каждой таблице
-- ─────────────────────────────────────────────────────────────

SELECT 'show_type'           AS table_name, COUNT(*) AS rows FROM show_type
UNION ALL SELECT 'notification_type',        COUNT(*) FROM notification_type
UNION ALL SELECT 'request_status_type',      COUNT(*) FROM request_status_type
UNION ALL SELECT 'payment_type',             COUNT(*) FROM payment_type
UNION ALL SELECT 'users',                    COUNT(*) FROM users
UNION ALL SELECT 'tv_show',                  COUNT(*) FROM tv_show
UNION ALL SELECT 'show_schedule',            COUNT(*) FROM show_schedule
UNION ALL SELECT 'request',                  COUNT(*) FROM request
UNION ALL SELECT 'contract',                 COUNT(*) FROM contract
UNION ALL SELECT 'notification',             COUNT(*) FROM notification
UNION ALL SELECT 'chat_message',             COUNT(*) FROM chat_message
UNION ALL SELECT 'audit_log',                COUNT(*) FROM audit_log
ORDER BY table_name;
