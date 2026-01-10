-- Скрипт для полной очистки БД и создания IT-администратора
-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из базы данных!

-- 1. Удаляем все записи из таблиц (в правильном порядке, учитывая внешние ключи)

-- Удаляем зависимые данные
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE contracts CASCADE;
TRUNCATE TABLE application_history CASCADE;
TRUNCATE TABLE agent_commissions CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE rejected_applications CASCADE;
TRUNCATE TABLE approved_applications CASCADE;
TRUNCATE TABLE pending_applications CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE show_schedule CASCADE;
TRUNCATE TABLE shows CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE chat_rooms CASCADE;

-- Удаляем пользователей (последними, так как на них есть ссылки)
TRUNCATE TABLE users CASCADE;

-- 2. Создаем IT-администратора
-- Пароль: admin123 (хэш bcrypt)
INSERT INTO users (
  id,
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'admin@tvcompany.com',
  '$2b$10$lCOphRZ8B2n0BAi/1drL1OGDG/fFNaG9rKeeaaaLwkfPxhux1Dddu',
  'it_admin',
  'IT',
  'Администратор',
  true,
  now(),
  now()
);

-- 3. Выводим информацию о созданном пользователе
SELECT 
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM users
WHERE role = 'it_admin';

-- Готово!
-- Используйте следующие данные для входа:
-- Email: admin@tvcompany.com
-- Пароль: admin123
