-- ============================================================
-- Лабораторная работа №11 — Разработка БД
-- Диалект: MS SQL Server
-- БД: TVCompanyX — Система управления рекламными заявками телекомпании X
-- ============================================================
-- Структура скрипта:
--   1. Создание БД
--   2. DDL — создание таблиц с ограничениями (PK, UNIQUE, CHECK, DEFAULT)
--   3. DDL — внешние ключи с ON DELETE / ON UPDATE
--   4. DML — заполнение тестовыми данными (≥3 строки в каждой таблице)
-- ============================================================

-- =====================
-- 1. СОЗДАНИЕ БАЗЫ ДАННЫХ
-- =====================
USE master;
GO

-- Удаляем БД, если она существует (для повторного запуска)
IF DB_ID('TVCompanyX') IS NOT NULL
BEGIN
    ALTER DATABASE TVCompanyX SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TVCompanyX;
END
GO

CREATE DATABASE TVCompanyX;
GO

USE TVCompanyX;
GO


-- =====================
-- 2. СОЗДАНИЕ ТАБЛИЦ
-- =====================

-- ----------------------------
-- Таблица: users (Пользователи)
-- ----------------------------
CREATE TABLE users (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    first_name    NVARCHAR(100)    NOT NULL,
    middle_name   NVARCHAR(100)    NULL,
    last_name     NVARCHAR(100)    NOT NULL,
    email         NVARCHAR(255)    NOT NULL,
    password_hash NVARCHAR(255)    NULL,
    role          NVARCHAR(50)     NOT NULL,
    is_active     BIT              NOT NULL DEFAULT 1,
    phone         NVARCHAR(50)     NULL,
    created_at    DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_users       PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role  CHECK (role IN (
        'customer', 'agent', 'commercial', 'accountant', 'admin', 'director'
    ))
);
GO

-- ----------------------------
-- Таблица: shows (Телешоу)
-- ----------------------------
CREATE TABLE shows (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name                NVARCHAR(255)    NOT NULL,
    time_slot           NVARCHAR(50)     NOT NULL,
    base_price_per_min  DECIMAL(12,2)    NOT NULL,
    show_type           NVARCHAR(50)     NULL,
    description         NVARCHAR(MAX)    NULL,
    is_active           BIT              NOT NULL DEFAULT 1,
    created_at          DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_shows           PRIMARY KEY (id),
    CONSTRAINT CK_shows_show_type CHECK (
        show_type IS NULL OR show_type IN ('news', 'entertainment', 'sport', 'documentary', 'morning')
    )
);
GO

-- ----------------------------
-- Таблица: show_schedule (Расписание шоу)
-- ----------------------------
CREATE TABLE show_schedule (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    show_id          UNIQUEIDENTIFIER NOT NULL,
    scheduled_date   DATE             NOT NULL,
    duration_minutes INT              NOT NULL,
    ad_minutes       INT              NOT NULL DEFAULT 0,
    created_at       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at       DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_show_schedule           PRIMARY KEY (id),
    CONSTRAINT UQ_show_schedule_show_date UNIQUE (show_id, scheduled_date),
    CONSTRAINT CK_show_schedule_duration  CHECK (duration_minutes > 0),
    CONSTRAINT CK_show_schedule_ad        CHECK (ad_minutes >= 0)
);
GO

-- ----------------------------
-- Таблица: applications (Заявки)
-- ----------------------------
CREATE TABLE applications (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    customer_id       UNIQUEIDENTIFIER NOT NULL,
    agent_id          UNIQUEIDENTIFIER NULL,
    show_id           UNIQUEIDENTIFIER NOT NULL,
    scheduled_at      DATETIME2        NOT NULL,
    duration_seconds  INT              NOT NULL,
    status            NVARCHAR(20)     NOT NULL DEFAULT 'pending',
    cost              DECIMAL(14,2)    NOT NULL DEFAULT 0,
    description       NVARCHAR(MAX)    NULL,
    contact_phone     NVARCHAR(50)     NULL,
    payment_method    NVARCHAR(20)     NULL,
    payment_date      DATETIME2        NULL,
    due_date          DATETIME2        NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at        DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_applications PRIMARY KEY (id),
    CONSTRAINT CK_applications_duration CHECK (duration_seconds BETWEEN 5 AND 300),
    CONSTRAINT CK_applications_status CHECK (status IN (
        'pending', 'in_progress', 'sent_to_commercial', 'approved', 'rejected', 'paid', 'overdue'
    )),
    CONSTRAINT CK_applications_payment CHECK (
        payment_method IS NULL OR payment_method IN ('card', 'transfer', 'cash')
    )
);
GO

-- ----------------------------
-- Таблица: commissions (Комиссии агентов)
-- ----------------------------
CREATE TABLE commissions (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    agent_id        UNIQUEIDENTIFIER NOT NULL,
    application_id  UNIQUEIDENTIFIER NOT NULL,
    [percent]       DECIMAL(5,2)     NOT NULL,
    amount          DECIMAL(14,2)    NOT NULL DEFAULT 0,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_commissions PRIMARY KEY (id),
    CONSTRAINT UQ_commissions_agent_app UNIQUE (agent_id, application_id),
    CONSTRAINT CK_commissions_percent CHECK ([percent] >= 0)
);
GO

-- ----------------------------
-- Таблица: contracts (Договоры)
-- ----------------------------
CREATE TABLE contracts (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    application_id  UNIQUEIDENTIFIER NOT NULL,
    contract_number NVARCHAR(50)     NULL,
    contract_date   DATETIME2        NOT NULL DEFAULT GETDATE(),
    cost            DECIMAL(14,2)    NOT NULL DEFAULT 0,
    description     NVARCHAR(MAX)    NULL,
    status          NVARCHAR(50)     NOT NULL DEFAULT 'sent',
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_contracts        PRIMARY KEY (id),
    CONSTRAINT UQ_contracts_app    UNIQUE (application_id),
    CONSTRAINT UQ_contracts_number UNIQUE (contract_number),
    CONSTRAINT CK_contracts_status CHECK (
        status IN ('sent', 'viewed', 'downloaded', 'signed')
    )
);
GO

-- ----------------------------
-- Таблица: chat_messages (Сообщения чата)
-- ----------------------------
CREATE TABLE chat_messages (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    room_id     NVARCHAR(255)    NOT NULL,
    sender_id   UNIQUEIDENTIFIER NULL,
    content     NVARCHAR(MAX)    NOT NULL,
    created_at  DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_chat_messages PRIMARY KEY (id)
);
GO

-- ----------------------------
-- Таблица: notifications (Уведомления)
-- ----------------------------
CREATE TABLE notifications (
    id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    user_id    UNIQUEIDENTIFIER NOT NULL,
    type       NVARCHAR(100)    NOT NULL,
    title      NVARCHAR(255)    NOT NULL,
    message    NVARCHAR(MAX)    NOT NULL,
    is_read    BIT              NOT NULL DEFAULT 0,
    created_at DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_notifications PRIMARY KEY (id)
);
GO

-- ----------------------------
-- Таблица: audit_log (Журнал аудита)
-- ----------------------------
CREATE TABLE audit_log (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    entity      NVARCHAR(100)    NOT NULL,
    entity_id   UNIQUEIDENTIFIER NOT NULL,
    action      NVARCHAR(50)     NOT NULL,
    changed_by  UNIQUEIDENTIFIER NULL,
    changed_at  DATETIME2        NOT NULL DEFAULT GETDATE(),
    payload     NVARCHAR(MAX)    NULL,          -- JSON-данные

    CONSTRAINT PK_audit_log PRIMARY KEY (id),
    CONSTRAINT CK_audit_action CHECK (action IN ('create', 'update', 'delete'))
);
GO


-- =====================
-- 3. ВНЕШНИЕ КЛЮЧИ с ON DELETE / ON UPDATE
-- =====================

-- show_schedule → shows
ALTER TABLE show_schedule
    ADD CONSTRAINT FK_show_schedule_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE CASCADE            -- удаление шоу удаляет его расписание
    ON UPDATE CASCADE;
GO

-- applications → users (customer_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE NO ACTION          -- нельзя удалить пользователя с заявками
    ON UPDATE CASCADE;
GO

-- applications → users (agent_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE SET NULL            -- при удалении агента — обнуляем ссылку
    ON UPDATE NO ACTION;
GO

-- applications → shows (show_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE NO ACTION          -- нельзя удалить шоу с заявками
    ON UPDATE CASCADE;
GO

-- commissions → users (agent_id)
ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE CASCADE            -- удаление агента удаляет его комиссии
    ON UPDATE CASCADE;
GO

-- commissions → applications (application_id)
ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE            -- удаление заявки удаляет её комиссию
    ON UPDATE CASCADE;
GO

-- contracts → applications (application_id)
ALTER TABLE contracts
    ADD CONSTRAINT FK_contracts_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE            -- удаление заявки удаляет договор
    ON UPDATE CASCADE;
GO

-- chat_messages → users (sender_id)
ALTER TABLE chat_messages
    ADD CONSTRAINT FK_chat_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE SET NULL            -- при удалении пользователя — обнуляем автора
    ON UPDATE CASCADE;
GO

-- notifications → users (user_id)
ALTER TABLE notifications
    ADD CONSTRAINT FK_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE            -- удаление пользователя удаляет уведомления
    ON UPDATE CASCADE;
GO

-- audit_log → users (changed_by)
ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_log_user
    FOREIGN KEY (changed_by) REFERENCES users(id)
    ON DELETE SET NULL            -- при удалении пользователя — обнуляем автора
    ON UPDATE CASCADE;
GO


-- =====================
-- 4. ЗАПОЛНЕНИЕ ТЕСТОВЫМИ ДАННЫМИ (≥3 строки на таблицу)
-- =====================

-- Фиксированные GUID для ссылочной целостности
DECLARE @user_customer1  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @user_customer2  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000002';
DECLARE @user_customer3  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000003';
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_agent2     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000002';
DECLARE @user_commercial UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000001';
DECLARE @user_accountant UNIQUEIDENTIFIER = 'A0000004-0000-0000-0000-000000000001';
DECLARE @user_admin      UNIQUEIDENTIFIER = 'A0000005-0000-0000-0000-000000000001';
DECLARE @user_director   UNIQUEIDENTIFIER = 'A0000006-0000-0000-0000-000000000001';

DECLARE @show1 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000001';
DECLARE @show2 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000002';
DECLARE @show3 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000003';

DECLARE @sched1 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000001';
DECLARE @sched2 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000002';
DECLARE @sched3 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000003';

DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';
DECLARE @app3 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000003';

-- ----- users (9 строк, все 6 ролей) -----
INSERT INTO users (id, first_name, middle_name, last_name, email, password_hash, role, is_active, phone)
VALUES
    (@user_customer1,  N'Иван',    N'Иванович',    N'Иванов',   N'ivanov@mail.ru',         N'$2b$10$hashedpassword1', 'customer',   1, N'+7-900-111-11-11'),
    (@user_customer2,  N'Анна',    N'Сергеевна',   N'Петрова',  N'petrova@mail.ru',        N'$2b$10$hashedpassword2', 'customer',   1, N'+7-900-222-22-22'),
    (@user_customer3,  N'Кирилл',  N'Петрович',    N'Сидоров',  N'sidorov@mail.ru',        N'$2b$10$hashedpassword3', 'customer',   1, N'+7-900-333-33-33'),
    (@user_agent1,     N'Дмитрий', N'Олегович',    N'Козлов',   N'kozlov@tvcompany.ru',    N'$2b$10$hashedpassword4', 'agent',      1, N'+7-900-444-44-44'),
    (@user_agent2,     N'Елена',   N'Викторовна',  N'Белова',   N'belova@tvcompany.ru',    N'$2b$10$hashedpassword5', 'agent',      1, N'+7-900-555-55-55'),
    (@user_commercial, N'Максим',  N'Андреевич',   N'Орлов',    N'orlov@tvcompany.ru',     N'$2b$10$hashedpassword6', 'commercial', 1, N'+7-900-666-66-66'),
    (@user_accountant, N'Ольга',   N'Николаевна',  N'Морозова', N'morozova@tvcompany.ru',  N'$2b$10$hashedpassword7', 'accountant', 1, N'+7-900-777-77-77'),
    (@user_admin,      N'Сергей',  N'Игоревич',    N'Волков',   N'volkov@tvcompany.ru',    N'$2b$10$hashedpassword8', 'admin',      1, N'+7-900-888-88-88'),
    (@user_director,   N'Алексей', N'Михайлович',  N'Новиков',  N'novikov@tvcompany.ru',   N'$2b$10$hashedpassword9', 'director',   1, N'+7-900-999-99-99');
GO

-- ----- shows (3 строки) -----
-- Повторно объявляем переменные (область видимости — один пакет GO)
DECLARE @show1 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000001';
DECLARE @show2 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000002';
DECLARE @show3 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000003';

INSERT INTO shows (id, name, time_slot, base_price_per_min, show_type, description, is_active)
VALUES
    (@show1, N'Утреннее шоу «Доброе утро»', N'08:00-10:00', 10000.00, N'morning',       N'Ежедневное утреннее шоу с новостями и гостями', 1),
    (@show2, N'Дневной сериал «Судьба»',    N'12:00-13:00', 15000.00, N'entertainment', N'Популярный дневной сериал',                      1),
    (@show3, N'Вечерние новости',            N'19:00-20:00', 25000.00, N'news',          N'Главные новости дня',                            1);
GO

-- ----- show_schedule (3+ строки) -----
DECLARE @show1 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000001';
DECLARE @show2 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000002';
DECLARE @show3 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000003';
DECLARE @sched1 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000001';
DECLARE @sched2 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000002';
DECLARE @sched3 UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000003';

INSERT INTO show_schedule (id, show_id, scheduled_date, duration_minutes, ad_minutes)
VALUES
    (@sched1, @show1, '2026-03-01', 120, 30),
    (@sched2, @show2, '2026-03-01',  60, 15),
    (@sched3, @show3, '2026-03-01',  60, 20),
    (NEWID(), @show1, '2026-03-02', 120, 28),
    (NEWID(), @show2, '2026-03-02',  60, 14),
    (NEWID(), @show3, '2026-03-02',  60, 19);
GO

-- ----- applications (3 строки) -----
DECLARE @user_customer1  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @user_customer2  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000002';
DECLARE @user_customer3  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000003';
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_agent2     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000002';
DECLARE @user_commercial UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000001';
DECLARE @show1 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000001';
DECLARE @show2 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000002';
DECLARE @show3 UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000003';
DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';
DECLARE @app3 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000003';

INSERT INTO applications (id, customer_id, agent_id, show_id, scheduled_at, duration_seconds, status, cost, description, contact_phone, payment_method, due_date)
VALUES
    (@app1, @user_customer1, @user_agent1, @show1,
     '2026-03-01 08:30:00', 30, 'approved', 5000.00,
     N'Реклама сети ресторанов «Вкусно»', N'+7-900-111-11-11', 'card',
     '2026-03-15 23:59:59'),

    (@app2, @user_customer2, @user_agent1, @show3,
     '2026-03-01 19:15:00', 60, 'paid', 25000.00,
     N'Реклама автосалона «АвтоМир»', N'+7-900-222-22-22', 'transfer',
     '2026-03-10 23:59:59'),

    (@app3, @user_customer3, @user_agent2, @show2,
     '2026-03-02 12:10:00', 15, 'pending', 3750.00,
     N'Реклама интернет-магазина «ТехноДом»', N'+7-900-333-33-33', NULL,
     NULL);
GO

-- ----- commissions (3 строки) -----
DECLARE @user_agent1 UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_agent2 UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000002';
DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';
DECLARE @app3 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000003';

INSERT INTO commissions (id, agent_id, application_id, [percent], amount)
VALUES
    (NEWID(), @user_agent1, @app1, 5.00,  250.00),   -- 5% от 5000
    (NEWID(), @user_agent1, @app2, 5.00, 1250.00),   -- 5% от 25000
    (NEWID(), @user_agent2, @app3, 5.00,  187.50);   -- 5% от 3750
GO

-- ----- contracts (3 строки) -----
DECLARE @user_customer1  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @user_customer2  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000002';
DECLARE @user_customer3  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000003';
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_agent2     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000002';
DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';
DECLARE @app3 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000003';

INSERT INTO contracts (application_id, contract_number, contract_date, cost, description, status)
VALUES
    (@app1, N'DOG-2026-000001', '2026-02-20', 5000.00,
     N'Реклама сети ресторанов «Вкусно»', 'viewed'),

    (@app2, N'DOG-2026-000002', '2026-02-21', 25000.00,
     N'Реклама автосалона «АвтоМир»', 'downloaded'),

    (@app3, N'DOG-2026-000003', '2026-02-24', 3750.00,
     N'Реклама интернет-магазина «ТехноДом»', 'sent');
GO

-- ----- chat_messages (3 строки) -----
DECLARE @user_customer1  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_commercial UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000001';
DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';

INSERT INTO chat_messages (room_id, sender_id, content)
VALUES
    (N'room-app1-cust-agent', @user_customer1,
     N'Здравствуйте! Хочу разместить рекламу в утреннем шоу.'),

    (N'room-app1-cust-agent', @user_agent1,
     N'Добрый день! Принято, передаю на согласование.'),

    (N'room-app2-cust-agent', @user_agent1,
     N'Максим, прошу согласовать заявку на вечерние новости.');
GO

-- ----- notifications (3 строки) -----
DECLARE @user_customer1  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @user_customer2  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000002';
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';

INSERT INTO notifications (user_id, type, title, message, is_read)
VALUES
    (@user_customer1, N'application', N'Заявка одобрена',
     N'Ваша заявка на размещение в «Утреннем шоу» одобрена.', 1),

    (@user_customer2, N'billing', N'Оплата получена',
     N'Спасибо за оплату! Рекламный ролик запланирован на 01.03.2026.', 1),

    (@user_agent1, N'application', N'Новая заявка',
     N'Вам назначена новая заявка от клиента Сидоров К.П.', 0);
GO

-- ----- audit_log (3 строки) -----
DECLARE @user_agent1     UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
DECLARE @user_commercial UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000001';
DECLARE @user_admin      UNIQUEIDENTIFIER = 'A0000005-0000-0000-0000-000000000001';
DECLARE @app1 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000001';
DECLARE @app2 UNIQUEIDENTIFIER = 'D0000001-0000-0000-0000-000000000002';

INSERT INTO audit_log (entity, entity_id, action, changed_by, payload)
VALUES
    (N'applications', @app1, 'create', @user_agent1,
     N'{"status":"pending","customer":"Иванов И.И.","show":"Утреннее шоу"}'),

    (N'applications', @app1, 'update', @user_commercial,
     N'{"old_status":"pending","new_status":"approved"}'),

    (N'users', @user_admin, 'update', @user_admin,
     N'{"action":"activated_user","target":"agent2"}');
GO


-- =====================
-- ПРОВЕРКА: количество строк в таблицах
-- =====================
SELECT 'users'          AS [Таблица], COUNT(*) AS [Строк] FROM users
UNION ALL SELECT 'shows',           COUNT(*) FROM shows
UNION ALL SELECT 'show_schedule',   COUNT(*) FROM show_schedule
UNION ALL SELECT 'applications',    COUNT(*) FROM applications
UNION ALL SELECT 'commissions',     COUNT(*) FROM commissions
UNION ALL SELECT 'contracts',       COUNT(*) FROM contracts
UNION ALL SELECT 'chat_messages',   COUNT(*) FROM chat_messages
UNION ALL SELECT 'notifications',   COUNT(*) FROM notifications
UNION ALL SELECT 'audit_log',       COUNT(*) FROM audit_log
ORDER BY [Таблица];
GO

PRINT N'=== Скрипт ЛР 11 выполнен успешно ===';
GO
