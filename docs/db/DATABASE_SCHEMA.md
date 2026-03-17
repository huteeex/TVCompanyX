# TVCompanyX — Описание физической модели базы данных

**СУБД:** PostgreSQL 15+  
**Расширения:** `uuid-ossp`, `citext`  
**Обновлено:** 2026-03-03

---

## Содержание

1. [Перечисления (ENUM)](#перечисления-enum)
2. [Таблица `users`](#таблица-users)
3. [Таблица `shows`](#таблица-shows)
4. [Таблица `show_schedule`](#таблица-show_schedule)
5. [Таблица `applications`](#таблица-applications)
6. [Таблица `commissions`](#таблица-commissions)
7. [Таблица `contracts`](#таблица-contracts)
8. [Таблица `chat_messages`](#таблица-chat_messages)
9. [Таблица `notifications`](#таблица-notifications)
10. [Таблица `audit_log`](#таблица-audit_log)
11. [Связи между таблицами](#связи-между-таблицами)

---

## Перечисления (ENUM)

### `user_role` — Роль пользователя

| Значение     | Описание                    |
|--------------|-----------------------------|
| `customer`   | Заказчик рекламы            |
| `agent`      | Агент, ведёт клиента        |
| `commercial` | Коммерческий директор       |
| `accountant` | Бухгалтер                   |
| `admin`      | Системный администратор     |
| `director`   | Директор                    |

### `application_status` — Статус заявки

| Значение              | Описание                             |
|-----------------------|--------------------------------------|
| `pending`             | Новая заявка, ожидает обработки      |
| `in_progress`         | Агент обрабатывает                   |
| `sent_to_commercial`  | Отправлена на одобрение              |
| `approved`            | Одобрена коммерческим директором     |
| `rejected`            | Отклонена                            |
| `paid`                | Оплачена                             |
| `overdue`             | Просрочена                           |

> Жизненный цикл: `pending` → `in_progress` → `sent_to_commercial` → `approved` / `rejected` → `paid` / `overdue`

### `payment_method` — Способ оплаты

| Значение    | Описание              |
|-------------|-----------------------|
| `card`      | Банковская карта      |
| `transfer`  | Банковский перевод    |
| `cash`      | Наличные              |

### `show_type` — Тип телешоу

| Значение        | Описание          |
|-----------------|-------------------|
| `news`          | Новости           |
| `entertainment` | Развлекательное   |
| `sport`         | Спортивное        |
| `documentary`   | Документальное    |
| `morning`       | Утреннее шоу      |

### `contract_status` — Статус договора

| Значение     | Описание                  |
|--------------|---------------------------|
| `sent`       | Договор отправлен клиенту |
| `viewed`     | Клиент просмотрел         |
| `downloaded` | Клиент скачал             |
| `signed`     | Подписан                  |

---

## Таблица `users`

**Описание:** Единая таблица пользователей системы. Роль определяет уровень доступа и набор доступных операций.

| Столбец        | Тип            | Ограничения                          | Описание                                   |
|----------------|----------------|--------------------------------------|--------------------------------------------|
| `id`           | `uuid`         | PK, DEFAULT `uuid_generate_v4()`     | Уникальный идентификатор пользователя      |
| `first_name`   | `varchar(100)` | NOT NULL                             | Имя                                        |
| `last_name`    | `varchar(100)` | NOT NULL                             | Фамилия                                    |
| `middle_name`  | `varchar(100)` | —                                    | Отчество (необязательно)                   |
| `email`        | `citext`       | NOT NULL, UNIQUE                     | Электронная почта (без учёта регистра)     |
| `password_hash`| `text`         | —                                    | bcrypt-хеш пароля                          |
| `role`         | `user_role`    | NOT NULL                             | Роль пользователя в системе                |
| `is_active`    | `boolean`      | NOT NULL, DEFAULT `true`             | Активен ли аккаунт                         |
| `phone`        | `varchar(30)`  | —                                    | Контактный телефон                         |
| `created_at`   | `timestamptz`  | NOT NULL, DEFAULT `now()`            | Дата регистрации                           |
| `updated_at`   | `timestamptz`  | NOT NULL, DEFAULT `now()`            | Дата последнего обновления                 |

**Индексы:**
- `idx_users_email` — UNIQUE по `email`
- `idx_users_role` — по `role`
- `idx_users_fullname` — по `(last_name, first_name)`

---

## Таблица `shows`

**Описание:** Справочник телевизионных программ, в которых доступно размещение рекламы.

| Столбец              | Тип             | Ограничения                      | Описание                                   |
|----------------------|-----------------|----------------------------------|--------------------------------------------|
| `id`                 | `uuid`          | PK, DEFAULT `uuid_generate_v4()` | Уникальный идентификатор шоу               |
| `name`               | `varchar(255)`  | NOT NULL                         | Название телешоу                           |
| `time_slot`          | `varchar(50)`   | NOT NULL                         | Временной слот эфира, напр. `08:00-09:00`  |
| `base_price_per_min` | `numeric(12,2)` | NOT NULL                         | Базовая цена за 1 минуту рекламы           |
| `show_type`          | `show_type`     | —                                | Тип шоу                                    |
| `description`        | `text`          | —                                | Описание программы                         |
| `is_active`          | `boolean`       | NOT NULL, DEFAULT `true`         | Шоу в эфире                                |
| `created_at`         | `timestamptz`   | NOT NULL, DEFAULT `now()`        | Дата создания записи                       |
| `updated_at`         | `timestamptz`   | NOT NULL, DEFAULT `now()`        | Дата последнего обновления                 |

**Индексы:**
- `idx_shows_active` — по `is_active`
- `idx_shows_type` — по `show_type`

---

## Таблица `show_schedule`

**Описание:** Конкретные даты выхода шоу в эфир. Одна строка = один выпуск программы.

| Столбец            | Тип           | Ограничения                                   | Описание                                              |
|--------------------|---------------|-----------------------------------------------|-------------------------------------------------------|
| `id`               | `uuid`        | PK, DEFAULT `uuid_generate_v4()`              | Уникальный идентификатор выпуска                      |
| `show_id`          | `uuid`        | NOT NULL, FK → `shows.id`                     | Ссылка на телешоу                                     |
| `scheduled_date`   | `date`        | NOT NULL                                      | Дата конкретного выпуска                              |
| `duration_minutes` | `int`         | NOT NULL, CHECK > 0                           | Общая длительность выпуска в минутах                  |
| `ad_minutes`       | `int`         | NOT NULL, DEFAULT `0`, CHECK >= 0             | Количество рекламных минут в выпуске                  |
| `created_at`       | `timestamptz` | NOT NULL, DEFAULT `now()`                     | Дата создания записи                                  |
| `updated_at`       | `timestamptz` | NOT NULL, DEFAULT `now()`                     | Дата последнего обновления                            |

**Индексы:**
- `uq_show_schedule_date` — UNIQUE по `(show_id, scheduled_date)` — один выпуск шоу в один день
- `idx_schedule_date` — по `scheduled_date`

---

## Таблица `applications`

**Описание:** Заявка на размещение рекламы. Центральная сущность системы. Связывает заказчика, агента, шоу и проходит через цикл статусов до оплаты.

| Столбец            | Тип                  | Ограничения                                        | Описание                                        |
|--------------------|----------------------|----------------------------------------------------|-------------------------------------------------|
| `id`               | `uuid`               | PK, DEFAULT `uuid_generate_v4()`                   | Уникальный идентификатор заявки                 |
| `customer_id`      | `uuid`               | NOT NULL, FK → `users.id`                          | Заказчик рекламы                                |
| `agent_id`         | `uuid`               | FK → `users.id`                                    | Агент (NULL — клиент пришёл напрямую)           |
| `show_id`          | `uuid`               | NOT NULL, FK → `shows.id`                          | Телешоу, в котором размещается реклама          |
| `scheduled_at`     | `timestamptz`        | NOT NULL                                           | Запланированная дата и время выхода рекламы     |
| `duration_seconds` | `int`                | NOT NULL, CHECK 5..300                             | Длительность ролика в секундах                  |
| `status`           | `application_status` | NOT NULL, DEFAULT `pending`                        | Текущий статус заявки                           |
| `cost`             | `numeric(14,2)`      | NOT NULL, DEFAULT `0`                              | Рассчитанная стоимость размещения               |
| `description`      | `text`               | —                                                  | Пожелания / дополнительное описание             |
| `contact_phone`    | `varchar(30)`        | —                                                  | Контактный телефон по данной заявке             |
| `payment_method`   | `payment_method`     | —                                                  | Способ оплаты                                   |
| `payment_date`     | `timestamptz`        | —                                                  | Фактическая дата оплаты                         |
| `due_date`         | `timestamptz`        | —                                                  | Срок оплаты                                     |
| `created_at`       | `timestamptz`        | NOT NULL, DEFAULT `now()`                          | Дата создания заявки                            |
| `updated_at`       | `timestamptz`        | NOT NULL, DEFAULT `now()`                          | Дата последнего обновления                      |

**Индексы:**
- `idx_applications_customer` — по `customer_id`
- `idx_applications_agent` — по `agent_id`
- `idx_applications_show` — по `show_id`
- `idx_applications_status` — по `status`
- `idx_applications_scheduled` — по `scheduled_at`
- `idx_applications_customer_status` — по `(customer_id, status)`

---

## Таблица `commissions`

**Описание:** Комиссионное вознаграждение агента по конкретной заявке. Рассчитывается и фиксируется автоматически при одобрении заявки.

| Столбец          | Тип             | Ограничения                                                 | Описание                                      |
|------------------|-----------------|-------------------------------------------------------------|-----------------------------------------------|
| `id`             | `uuid`          | PK, DEFAULT `uuid_generate_v4()`                            | Уникальный идентификатор записи               |
| `agent_id`       | `uuid`          | NOT NULL, FK → `users.id`                                   | Агент, получающий комиссию                    |
| `application_id` | `uuid`          | NOT NULL, FK → `applications.id`                            | Заявка, по которой начислена комиссия         |
| `percent`        | `numeric(5,2)`  | NOT NULL, CHECK >= 0                                        | Процент комиссии агента                       |
| `amount`         | `numeric(14,2)` | NOT NULL, DEFAULT `0`                                       | Рассчитанная сумма комиссии в рублях          |
| `created_at`     | `timestamptz`   | NOT NULL, DEFAULT `now()`                                   | Дата начисления комиссии                      |

**Индексы:**
- `uq_commission_agent_app` — UNIQUE по `(agent_id, application_id)` — одна комиссия агента на одну заявку
- `idx_commissions_agent` — по `agent_id`
- `idx_commissions_app` — по `application_id`

---

## Таблица `contracts`

**Описание:** Договор создаётся автоматически при одобрении заявки. Соотношение с заявкой — 1:1.

| Столбец           | Тип              | Ограничения                                         | Описание                                                 |
|-------------------|------------------|-----------------------------------------------------|----------------------------------------------------------|
| `id`              | `uuid`           | PK, DEFAULT `uuid_generate_v4()`                    | Уникальный идентификатор договора                        |
| `application_id`  | `uuid`           | NOT NULL, UNIQUE, FK → `applications.id` ON DELETE CASCADE | Заявка, по которой создан договор               |
| `contract_number` | `varchar(50)`    | UNIQUE                                              | Номер договора, напр. `DOG-2026-000001`                  |
| `contract_date`   | `timestamptz`    | NOT NULL, DEFAULT `now()`                           | Дата подписания договора                                 |
| `cost`            | `numeric(14,2)`  | NOT NULL, DEFAULT `0`                               | Стоимость, зафиксированная в договоре                    |
| `description`     | `text`           | —                                                   | Дополнительные условия договора                          |
| `status`          | `contract_status`| NOT NULL, DEFAULT `sent`                            | Статус договора                                          |
| `created_at`      | `timestamptz`    | NOT NULL, DEFAULT `now()`                           | Дата создания                                            |
| `updated_at`      | `timestamptz`    | NOT NULL, DEFAULT `now()`                           | Дата последнего обновления                               |

**Индексы:**
- `uq_contracts_application` — UNIQUE по `application_id`
- `uq_contracts_number` — UNIQUE по `contract_number`
- `idx_contracts_status` — по `status`
- `idx_contracts_created_at` — по `created_at`

---

## Таблица `chat_messages`

**Описание:** Сообщения внутреннего чата. Комнаты идентифицируются текстовым ключом `room_id` (например, `app-{id}` для чата по заявке).

| Столбец      | Тип            | Ограничения                       | Описание                                                     |
|--------------|----------------|-----------------------------------|--------------------------------------------------------------|
| `id`         | `uuid`         | PK, DEFAULT `uuid_generate_v4()`  | Уникальный идентификатор сообщения                           |
| `room_id`    | `varchar(255)` | NOT NULL                          | Идентификатор комнаты чата, напр. `app-42`, `support-general`|
| `sender_id`  | `uuid`         | FK → `users.id`                   | Отправитель (NULL = системное сообщение)                     |
| `content`    | `text`         | NOT NULL                          | Текст сообщения                                              |
| `created_at` | `timestamptz`  | NOT NULL, DEFAULT `now()`         | Дата и время отправки                                        |

**Индексы:**
- `idx_chat_room` — по `room_id`
- `idx_chat_sender` — по `sender_id`
- `idx_chat_room_time` — по `(room_id, created_at)` — быстрая загрузка истории комнаты

---

## Таблица `notifications`

**Описание:** Push-уведомления пользователям. Генерируются триггерами при изменении статусов заявок и других событиях.

| Столбец      | Тип            | Ограничения                       | Описание                                                    |
|--------------|----------------|-----------------------------------|-------------------------------------------------------------|
| `id`         | `uuid`         | PK, DEFAULT `uuid_generate_v4()`  | Уникальный идентификатор уведомления                        |
| `user_id`    | `uuid`         | NOT NULL, FK → `users.id`         | Получатель уведомления                                      |
| `type`       | `varchar(50)`  | NOT NULL                          | Код типа уведомления, напр. `application_approved`          |
| `title`      | `varchar(255)` | NOT NULL                          | Заголовок уведомления                                       |
| `message`    | `text`         | NOT NULL                          | Текст уведомления                                           |
| `is_read`    | `boolean`      | NOT NULL, DEFAULT `false`         | Прочитано ли пользователем                                  |
| `created_at` | `timestamptz`  | NOT NULL, DEFAULT `now()`         | Дата создания уведомления                                   |

**Индексы:**
- `idx_notifications_user` — по `user_id`
- `idx_notifications_user_unread` — по `(user_id, is_read)` — быстрый подсчёт непрочитанных
- `idx_notifications_created` — по `created_at`

---

## Таблица `audit_log`

**Описание:** Журнал аудита всех значимых изменений в системе. Заполняется триггерами. Используется для отчётности и разбора инцидентов.

| Столбец      | Тип            | Ограничения                       | Описание                                                          |
|--------------|----------------|-----------------------------------|-------------------------------------------------------------------|
| `id`         | `bigserial`    | PK, AUTOINCREMENT                 | Порядковый номер записи аудита                                    |
| `entity`     | `varchar(100)` | NOT NULL                          | Название таблицы, напр. `applications`, `users`                   |
| `entity_id`  | `uuid`         | NOT NULL                          | ID изменённой записи                                              |
| `action`     | `varchar(20)`  | NOT NULL                          | Тип действия: `INSERT`, `UPDATE`, `DELETE`, `STATUS_CHANGE`       |
| `changed_by` | `uuid`         | FK → `users.id`                   | Пользователь, совершивший действие (NULL = система / триггер)     |
| `changed_at` | `timestamptz`  | NOT NULL, DEFAULT `now()`         | Дата и время выполнения действия                                  |
| `payload`    | `jsonb`        | —                                 | Дельта изменений в формате JSON: `{"old": {...}, "new": {...}}`   |

**Индексы:**
- `idx_audit_entity` — по `(entity, entity_id)`
- `idx_audit_actor` — по `changed_by`
- `idx_audit_time` — по `changed_at`

---

## Связи между таблицами

| Связь                                    | Тип   | ON DELETE    | ON UPDATE |
|------------------------------------------|-------|--------------|-----------|
| `applications.customer_id` → `users.id` | N : 1 | RESTRICT     | CASCADE   |
| `applications.agent_id` → `users.id`    | N : 1 | SET NULL     | CASCADE   |
| `applications.show_id` → `shows.id`     | N : 1 | RESTRICT     | CASCADE   |
| `show_schedule.show_id` → `shows.id`    | N : 1 | CASCADE      | CASCADE   |
| `commissions.agent_id` → `users.id`     | N : 1 | CASCADE      | CASCADE   |
| `commissions.application_id` → `applications.id` | N : 1 | CASCADE | CASCADE |
| `contracts.application_id` → `applications.id`   | 1 : 1 | CASCADE | CASCADE |
| `chat_messages.sender_id` → `users.id`  | N : 1 | SET NULL     | CASCADE   |
| `notifications.user_id` → `users.id`    | N : 1 | CASCADE      | CASCADE   |
| `audit_log.changed_by` → `users.id`     | N : 1 | SET NULL     | CASCADE   |
