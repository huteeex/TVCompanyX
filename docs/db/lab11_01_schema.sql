-- ============================================================
-- Файл 1/3 — DDL: Создание таблиц с ограничениями
-- Диалект: MS SQL Server (для онлайн-песочницы)
-- ============================================================

CREATE TABLE users (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name            NVARCHAR(255)    NULL,
    first_name      NVARCHAR(100)    NULL,
    middle_name     NVARCHAR(100)    NULL,
    last_name       NVARCHAR(100)    NULL,
    email           NVARCHAR(255)    NOT NULL,
    password_hash   NVARCHAR(255)    NULL,
    role            NVARCHAR(50)     NOT NULL,
    is_active       BIT              NOT NULL DEFAULT 1,
    bank_details    NVARCHAR(MAX)    NULL,
    phone           NVARCHAR(50)     NULL,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN (
        'customer', 'agent', 'commercial', 'accountant', 'admin', 'director'
    ))
);

CREATE TABLE shows (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name                NVARCHAR(255)    NOT NULL,
    time_slot           NVARCHAR(50)     NOT NULL,
    base_price_per_min  DECIMAL(12,2)    NOT NULL,
    show_type           NVARCHAR(50)     NULL DEFAULT 'program',
    description         NVARCHAR(MAX)    NULL,
    is_active           BIT              NULL DEFAULT 1,
    is_recurring        BIT              NULL DEFAULT 0,
    recurring_days      NVARCHAR(50)     NULL,
    duration_minutes    INT              NULL DEFAULT 60,
    created_at          DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_shows PRIMARY KEY (id)
);

CREATE TABLE show_schedule (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    show_id           UNIQUEIDENTIFIER NOT NULL,
    scheduled_date    DATE             NOT NULL,
    duration_minutes  INT              NOT NULL,
    ad_minutes        INT              NOT NULL,
    available_slots   INT              NOT NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at        DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_show_schedule PRIMARY KEY (id),
    CONSTRAINT UQ_show_schedule_show_date UNIQUE (show_id, scheduled_date),
    CONSTRAINT CK_show_schedule_duration CHECK (duration_minutes > 0),
    CONSTRAINT CK_show_schedule_ad CHECK (ad_minutes >= 0),
    CONSTRAINT CK_show_schedule_slots CHECK (available_slots >= 0)
);

CREATE TABLE applications (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    customer_id       UNIQUEIDENTIFIER NOT NULL,
    agent_id          UNIQUEIDENTIFIER NULL,
    commercial_id     UNIQUEIDENTIFIER NULL,
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

CREATE TABLE contracts (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    application_id    UNIQUEIDENTIFIER NOT NULL,
    customer_id       UNIQUEIDENTIFIER NOT NULL,
    agent_id          UNIQUEIDENTIFIER NOT NULL,
    contract_number   NVARCHAR(50)     NULL,
    contract_date     DATETIME2        NULL DEFAULT GETDATE(),
    show_name         NVARCHAR(255)    NULL,
    scheduled_at      DATETIME2        NULL,
    duration_seconds  INT              NULL,
    cost              DECIMAL(10,2)    NULL,
    customer_name     NVARCHAR(255)    NULL,
    customer_email    NVARCHAR(255)    NULL,
    customer_phone    NVARCHAR(50)     NULL,
    company_name      NVARCHAR(255)    NULL DEFAULT N'ТВ Компания X',
    description       NVARCHAR(MAX)    NULL,
    status            NVARCHAR(50)     NULL DEFAULT 'sent',
    created_at        DATETIME2        NULL DEFAULT GETDATE(),
    updated_at        DATETIME2        NULL DEFAULT GETDATE(),
    viewed_at         DATETIME2        NULL,
    downloaded_at     DATETIME2        NULL,

    CONSTRAINT PK_contracts PRIMARY KEY (id),
    CONSTRAINT UQ_contracts_number UNIQUE (contract_number),
    CONSTRAINT CK_contracts_status CHECK (
        status IS NULL OR status IN ('sent', 'viewed', 'downloaded')
    )
);

CREATE TABLE chat_messages (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    room_id         NVARCHAR(255)    NOT NULL,
    sender_id       UNIQUEIDENTIFIER NULL,
    sender_name     NVARCHAR(255)    NULL,
    content         NVARCHAR(MAX)    NOT NULL,
    chat_type       NVARCHAR(50)     NULL DEFAULT 'customer-agent',
    application_id  UNIQUEIDENTIFIER NULL,
    file_url        NVARCHAR(500)    NULL,
    file_name       NVARCHAR(255)    NULL,
    file_size       BIGINT           NULL,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_chat_messages PRIMARY KEY (id),
    CONSTRAINT CK_chat_type CHECK (
        chat_type IS NULL OR chat_type IN ('customer-agent', 'agent-commercial')
    )
);

CREATE TABLE notifications (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    user_id     UNIQUEIDENTIFIER NOT NULL,
    type        NVARCHAR(100)    NOT NULL,
    title       NVARCHAR(255)    NOT NULL,
    message     NVARCHAR(MAX)    NOT NULL,
    [read]      BIT              NOT NULL DEFAULT 0,
    read_at     DATETIME2        NULL,
    data        NVARCHAR(MAX)    NULL,
    created_at  DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_notifications PRIMARY KEY (id)
);

CREATE TABLE services_feed (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    application_id    UNIQUEIDENTIFIER NOT NULL,
    show_name         NVARCHAR(255)    NOT NULL,
    client_name       NVARCHAR(255)    NOT NULL,
    date              DATETIME2        NOT NULL,
    duration_seconds  INT              NOT NULL,
    cost              DECIMAL(14,2)    NOT NULL,
    status            NVARCHAR(50)     NOT NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_services_feed PRIMARY KEY (id),
    CONSTRAINT CK_services_feed_status CHECK (status IN ('completed', 'scheduled'))
);

CREATE TABLE audit_log (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    entity      NVARCHAR(100)    NOT NULL,
    entity_id   UNIQUEIDENTIFIER NOT NULL,
    action      NVARCHAR(50)     NOT NULL,
    changed_by  UNIQUEIDENTIFIER NULL,
    changed_at  DATETIME2        NOT NULL DEFAULT GETDATE(),
    payload     NVARCHAR(MAX)    NULL,

    CONSTRAINT PK_audit_log PRIMARY KEY (id),
    CONSTRAINT CK_audit_action CHECK (action IN ('create', 'update', 'delete'))
);
