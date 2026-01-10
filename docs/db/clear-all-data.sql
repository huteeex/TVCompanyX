-- Скрипт для полной очистки всех данных из БД
-- ВНИМАНИЕ: Удаляет ВСЕ записи из всех таблиц!

-- Удаляем все данные (TRUNCATE быстрее DELETE и сбрасывает счетчики)
-- CASCADE автоматически очистит все зависимые таблицы
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE shows CASCADE;
TRUNCATE TABLE contracts CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE rejected_applications CASCADE;
TRUNCATE TABLE approved_applications CASCADE;
TRUNCATE TABLE pending_applications CASCADE;

-- Готово! Все данные удалены
SELECT 'База данных очищена!' AS status;
