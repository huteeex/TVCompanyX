# 🚀 Быстрый запуск TV Company Ad System

## Требования
- **Node.js** 18.0.0 или выше
- **PostgreSQL** 12 или выше
- **npm** или **yarn**

---

## ⚡ Быстрый старт (5 минут)

### 1️⃣ Установка зависимостей
```powershell
npm install
```

### 2️⃣ Настройка базы данных

#### Создать БД в PostgreSQL:
```powershell
psql -U postgres
CREATE DATABASE TVShow;
\q
```

#### Применить схему и миграции:
```powershell
psql -U postgres -d TVShow -f docs/db/init_full_schema.sql
```

### 3️⃣ Настройка переменных окружения
Файл `.env` уже создан. Проверьте настройки:
```env
DATABASE_URL=postgresql://postgres:0112@localhost:5432/TVShow
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4️⃣ Запуск серверов

#### Вариант 1: Запуск всех серверов одновременно (рекомендуется)
Откройте **3 терминала** в VS Code и выполните:

**Терминал 1 - Next.js сервер (порт 3000):**
```powershell
npm run dev
```

**Терминал 2 - Socket.io сервер (порт 4001):**
```powershell
npm run socket-server
```

**Терминал 3 - PostgreSQL (уже запущен)**
База данных должна быть запущена

#### Вариант 2: Использование PowerShell Job (фоновый режим)
```powershell
# Запуск Next.js в фоне
Start-Job -Name "NextJS" -ScriptBlock { 
    Set-Location "d:\ALL\projectMy\TVCompanyX"
    npm run dev 
}

# Запуск Socket сервера в фоне
Start-Job -Name "Socket" -ScriptBlock { 
    Set-Location "d:\ALL\projectMy\TVCompanyX"
    npm run socket-server 
}

# Проверить статус
Get-Job
```

### 5️⃣ Открыть приложение
🌐 **Основной сайт:** http://localhost:3000  
🔌 **Socket сервер:** http://localhost:4001  

---

## 📋 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск Next.js в режиме разработки (порт 3000) |
| `npm run build` | Сборка production версии |
| `npm start` | Запуск production версии |
| `npm run socket-server` | Запуск Socket.io сервера (порт 4001) |
| `npm run init-db` | Инициализация базы данных |
| `npm run quick-init` | Быстрая инициализация БД |
| `npm test` | Запуск тестов |

---

## 🔧 Порты

| Сервис | Порт |
|--------|------|
| Next.js Web Server | 3000 |
| Socket.io Server | 4001 |
| PostgreSQL Database | 5432 |

---

## 👥 Тестовые пользователи

После инициализации БД будут доступны:

| Email | Пароль | Роль |
|-------|--------|------|
| customer@test.com | password123 | Заказчик |
| agent@test.com | password123 | Агент |
| commercial@test.com | password123 | Коммерческий отдел |
| accountant@test.com | password123 | Бухгалтер |
| director@test.com | password123 | Директор |
| admin@test.com | password123 | IT-Администратор |

---

## 🛠️ Решение проблем

### ❌ Ошибка подключения к БД
```powershell
# Проверьте, что PostgreSQL запущен
Get-Service postgresql*

# Проверьте подключение
psql -U postgres -d TVShow -c "SELECT version();"
```

### ❌ Порт 3000 занят
```powershell
# Найти процесс на порту 3000
netstat -ano | findstr :3000

# Убить процесс (замените PID)
taskkill /PID <номер_процесса> /F

# Или запустите на другом порту
$env:PORT=3001; npm run dev
```

### ❌ Socket сервер не работает
```powershell
# Проверьте порт 4001
netstat -ano | findstr :4001

# Перезапустите socket сервер
npm run socket-server
```

---

## 🐳 Альтернатива: Docker

Если есть Docker:
```powershell
docker-compose up -d
```

---

## 📚 Дополнительная документация

- `README.md` - Полная документация проекта
- `docs/QUICK_START.md` - Детальное руководство по запуску
- `docs/database-setup.md` - Настройка базы данных
- `docs/CONTRACTS_SYSTEM.md` - Система договоров
- `docs/NOTIFICATIONS_SYSTEM.md` - Система уведомлений

---

## ✅ Проверка работоспособности

После запуска проверьте:

1. ✅ http://localhost:3000 - Главная страница открывается
2. ✅ http://localhost:3000/auth - Страница входа работает
3. ✅ Socket подключение - В консоли браузера нет ошибок WebSocket
4. ✅ База данных - Можно войти тестовым пользователем

---

**Версия:** 1.0.0  
**Последнее обновление:** 27 ноября 2025
