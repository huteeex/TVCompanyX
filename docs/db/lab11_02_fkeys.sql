-- ============================================================
-- Файл 2/3 — DDL: Внешние ключи с ON DELETE / ON UPDATE
-- Диалект: MS SQL Server (для онлайн-песочницы)
-- Запускать ПОСЛЕ файла 1 (lab11_01_schema.sql)
-- ============================================================

-- show_schedule → shows
ALTER TABLE show_schedule
    ADD CONSTRAINT FK_show_schedule_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- applications → users (customer_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE NO ACTION
    ON UPDATE CASCADE;

-- applications → users (agent_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;

-- applications → users (commercial_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_commercial
    FOREIGN KEY (commercial_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;

-- applications → shows (show_id)
ALTER TABLE applications
    ADD CONSTRAINT FK_applications_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE NO ACTION
    ON UPDATE CASCADE;

-- commissions → users (agent_id)
ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- commissions → applications (application_id)
ALTER TABLE commissions
    ADD CONSTRAINT FK_commissions_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- contracts → applications (application_id)
ALTER TABLE contracts
    ADD CONSTRAINT FK_contracts_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE NO ACTION
    ON UPDATE CASCADE;

-- contracts → users (customer_id)
ALTER TABLE contracts
    ADD CONSTRAINT FK_contracts_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- contracts → users (agent_id)
ALTER TABLE contracts
    ADD CONSTRAINT FK_contracts_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;

-- chat_messages → users (sender_id)
ALTER TABLE chat_messages
    ADD CONSTRAINT FK_chat_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- chat_messages → applications (application_id)
ALTER TABLE chat_messages
    ADD CONSTRAINT FK_chat_messages_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- notifications → users (user_id)
ALTER TABLE notifications
    ADD CONSTRAINT FK_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- services_feed → applications (application_id)
ALTER TABLE services_feed
    ADD CONSTRAINT FK_services_feed_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- audit_log → users (changed_by)
ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_log_user
    FOREIGN KEY (changed_by) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
