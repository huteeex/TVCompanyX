# Инструкция по развёртыванию TVCompanyX на VPS

## Содержание

1. [Требования к VPS](#1-требования-к-vps)
2. [Подготовка сервера](#2-подготовка-сервера)
3. [Загрузка проекта на VPS](#3-загрузка-проекта-на-vps)
4. [Вариант A — ASP.NET Core MVC + PostgreSQL](#4-вариант-a--aspnet-core-mvc--postgresql)
5. [Вариант B — Next.js (React) + PostgreSQL](#5-вариант-b--nextjs-react--postgresql)
6. [Вариант C — Оба проекта одновременно (разные БД)](#6-вариант-c--оба-проекта-одновременно-разные-бд)
7. [Настройка Nginx (reverse proxy)](#7-настройка-nginx-reverse-proxy)
8. [SSL-сертификат (Let's Encrypt)](#8-ssl-сертификат-lets-encrypt)
9. [Полезные команды](#9-полезные-команды)
10. [Устранение проблем](#10-устранение-проблем)

---

## 1. Требования к VPS

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| ОС | Ubuntu 22.04 / 24.04 | Ubuntu 24.04 LTS |
| RAM | 1 ГБ (один проект) | 2 ГБ (оба проекта) |
| CPU | 1 ядро | 2 ядра |
| Диск | 10 ГБ | 20 ГБ |
| Порты | 22, 80, 443 | 22, 80, 443 |

---

## 2. Подготовка сервера

### 2.1 Подключение по SSH

```bash
ssh root@ВАШ_IP
```

### 2.2 Обновление системы

```bash
apt update && apt upgrade -y
```

### 2.3 Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com | sh

# Добавить текущего пользователя в группу docker (чтобы не писать sudo)
usermod -aG docker $USER

# Проверить
docker --version
docker compose version
```

### 2.4 Установка Git

```bash
apt install -y git
```

### 2.5 Установка Nginx (для reverse proxy)

```bash
apt install -y nginx
systemctl enable nginx
```

---

## 3. Загрузка проекта на VPS

```bash
# Клонируем репозиторий
cd /opt
git clone https://github.com/ВАШ_ПОЛЬЗОВАТЕЛЬ/TVCompanyX.git
cd TVCompanyX
```

> **Если репозиторий приватный**, создайте SSH-ключ на VPS:
> ```bash
> ssh-keygen -t ed25519
> cat ~/.ssh/id_ed25519.pub   # добавьте этот ключ в GitHub → Settings → SSH keys
> ```

---

## 4. Вариант A — ASP.NET Core MVC + PostgreSQL

ASP.NET проект расположен в папке `lab12/`. Использует **PostgreSQL** с базой `TVVVV`.

### 4.1 Перейти в папку

```bash
cd /opt/TVCompanyX/lab12
```

### 4.2 Проверить/изменить пароль БД (по желанию)

Откройте `docker-compose.yml` и измените пароль если нужно:

```bash
nano docker-compose.yml
```

Измените `POSTGRES_PASSWORD` и соответствующую строку подключения в секции `app.environment`.

### 4.3 Запуск

```bash
docker compose up -d --build
```

Это поднимет:
- **PostgreSQL 16** (порт 5432 внутри сети, не открыт наружу)
- **ASP.NET Core** (порт **80** на VPS → 8080 внутри контейнера)

### 4.4 Проверка

```bash
# Статус контейнеров
docker compose ps

# Логи приложения
docker compose logs -f app

# Проверка в браузере
curl http://localhost
```

Откройте в браузере: `http://ВАШ_IP`

### 4.5 База данных

SQL-дамп `tvvvv.sql` автоматически применяется при первом запуске PostgreSQL (через `docker-entrypoint-initdb.d`).

Если нужно переинициализировать БД:

```bash
docker compose down -v    # удалит volume с данными
docker compose up -d      # создаст БД заново из tvvvv.sql
```

---

## 5. Вариант B — Next.js (React) + PostgreSQL

React проект находится в корне. Использует **PostgreSQL** с базой `TVShow`.

### 5.1 Создать .env файл

```bash
cd /opt/TVCompanyX

# Скопируйте пример и отредактируйте
cp env.example .env
nano .env
```

Содержимое `.env`:

```env
# База данных
DATABASE_URL=postgresql://postgres:YOUR_SECURE_PASSWORD@db:5432/TVShow
DB_HOST=db
DB_PORT=5432
DB_NAME=TVShow
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_SSL=false

# API (оставьте пустым — Next.js использует относительные /api маршруты)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=http://ВАШ_IP:4000

# JWT секрет (замените на длинную случайную строку!)
JWT_SECRET=сгенерируйте-случайную-строку-минимум-32-символа
```

> Для генерации JWT_SECRET:
> ```bash
> openssl rand -base64 48
> ```

### 5.2 Добавить output: 'standalone' в next.config.js

Для работы Docker-образа нужно убедиться что в `next.config.js` есть `output: 'standalone'`:

```bash
nano next.config.js
```

Добавьте в объект `nextConfig`:

```js
const nextConfig = {
  output: 'standalone',    // ← добавить эту строку
  reactStrictMode: true,
  // ... остальное
}
```

### 5.3 Создать docker-compose для production

Создайте файл `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: tvcompany_react_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: TVShow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD
    volumes:
      - react_pgdata:/var/lib/postgresql/data
      - ./docs/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./docs/db/functions.sql:/docker-entrypoint-initdb.d/02-functions.sql
      - ./docs/db/triggers.sql:/docker-entrypoint-initdb.d/03-triggers.sql
      - ./docs/db/seed.sql:/docker-entrypoint-initdb.d/04-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d TVShow"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - react-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tvcompany_react_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:YOUR_SECURE_PASSWORD@db:5432/TVShow
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: TVShow
      DB_USER: postgres
      DB_PASSWORD: YOUR_SECURE_PASSWORD
      DB_SSL: "false"
      JWT_SECRET: сгенерируйте-случайную-строку
      NEXT_PUBLIC_API_URL: ""
      NEXT_PUBLIC_SOCKET_URL: http://ВАШ_IP:4000
    depends_on:
      db:
        condition: service_healthy
    networks:
      - react-network

  socket:
    build:
      context: .
      dockerfile: Dockerfile.socket
    container_name: tvcompany_socket
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      SOCKET_PORT: 4000
      SOCKET_API_URL: http://frontend:3000
    depends_on:
      - frontend
    networks:
      - react-network

volumes:
  react_pgdata:

networks:
  react-network:
    driver: bridge
```

### 5.4 Создать Dockerfile для Socket-сервера

```bash
nano Dockerfile.socket
```

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY server/ ./server/
EXPOSE 4000
CMD ["node", "server/socket-server.js"]
```

### 5.5 Запуск

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5.6 Проверка

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f frontend

# В браузере
curl http://localhost:3000
```

Откройте: `http://ВАШ_IP:3000`

---

## 6. Вариант C — Оба проекта одновременно (разные БД)

Запускаем **оба** приложения на одном VPS, каждое со своей базой данных.

### Схема портов

| Сервис | Порт | База данных |
|--------|------|-------------|
| ASP.NET Core MVC | 8080 | TVVVV (PostgreSQL) |
| Next.js (React) | 3000 | TVShow (PostgreSQL) |
| Socket.io сервер | 4000 | — |
| Nginx (прокси) | 80 / 443 | — |

### 6.1 Запуск ASP.NET

```bash
cd /opt/TVCompanyX/lab12
```

Измените порт в `docker-compose.yml`, чтобы не конфликтовал с Nginx:

```bash
nano docker-compose.yml
```

Замените `"80:8080"` на `"8080:8080"`:

```yaml
    ports:
      - "8080:8080"    # ← изменить с "80:8080"
```

```bash
docker compose up -d --build
```

### 6.2 Запуск React

```bash
cd /opt/TVCompanyX

# Создайте .env (см. раздел 5.1)
# Добавьте output: 'standalone' в next.config.js (см. раздел 5.2)
# Создайте docker-compose.prod.yml и Dockerfile.socket (см. разделы 5.3-5.4)

docker compose -f docker-compose.prod.yml up -d --build
```

### 6.3 Проверка обоих

```bash
# ASP.NET
curl http://localhost:8080

# React
curl http://localhost:3000
```

---

## 7. Настройка Nginx (reverse proxy)

### 7.1 Только ASP.NET (один домен/IP)

```bash
nano /etc/nginx/sites-available/tvcompany
```

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2 Только React (один домен/IP)

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    # Next.js  
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 7.3 Оба проекта (разные поддомены)

```nginx
# ASP.NET — asp.tvcompany.ru
server {
    listen 80;
    server_name asp.tvcompany.ru;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# React — react.tvcompany.ru
server {
    listen 80;
    server_name react.tvcompany.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 7.4 Оба проекта (один домен, разные пути)

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН;

    # React — корень
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ASP.NET — по пути /asp
    location /asp/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 7.5 Активация конфигурации

```bash
ln -s /etc/nginx/sites-available/tvcompany /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default    # удалить дефолтный сайт
nginx -t                               # проверка синтаксиса
systemctl reload nginx
```

---

## 8. SSL-сертификат (Let's Encrypt)

> **Требуется**: домен, направленный на IP вашего VPS (A-запись в DNS).

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ВАШ_ДОМЕН
```

Для двух поддоменов:

```bash
certbot --nginx -d asp.tvcompany.ru -d react.tvcompany.ru
```

Автопродление уже настроено через systemd timer. Проверить:

```bash
certbot renew --dry-run
```

---

## 9. Полезные команды

### Управление контейнерами

```bash
# Статус
docker compose ps                                         # в текущей папке
docker compose -f docker-compose.prod.yml ps              # React

# Логи
docker compose logs -f                                    # все сервисы
docker compose logs -f app                                # только ASP.NET
docker compose -f docker-compose.prod.yml logs -f frontend  # только React

# Перезапуск
docker compose restart
docker compose -f docker-compose.prod.yml restart

# Остановка
docker compose down
docker compose -f docker-compose.prod.yml down

# Пересборка и запуск
docker compose up -d --build
docker compose -f docker-compose.prod.yml up -d --build
```

### Работа с БД

```bash
# Подключиться к БД ASP.NET (TVVVV)
docker exec -it tvcompanyx_db psql -U postgres -d TVVVV

# Подключиться к БД React (TVShow)
docker exec -it tvcompany_react_db psql -U postgres -d TVShow

# Бэкап БД
docker exec tvcompanyx_db pg_dump -U postgres TVVVV > backup_aspnet_$(date +%F).sql
docker exec tvcompany_react_db pg_dump -U postgres TVShow > backup_react_$(date +%F).sql

# Восстановление из бэкапа
cat backup.sql | docker exec -i tvcompanyx_db psql -U postgres -d TVVVV
```

### Обновление проекта

```bash
cd /opt/TVCompanyX
git pull origin main

# Пересобрать ASP.NET
cd lab12
docker compose up -d --build

# Пересобрать React
cd /opt/TVCompanyX
docker compose -f docker-compose.prod.yml up -d --build
```

### Очистка Docker

```bash
# Удалить неиспользуемые образы
docker image prune -f

# Удалить всё неиспользуемое (образы, контейнеры, сети)
docker system prune -f
```

---

## 10. Устранение проблем

### Контейнер не запускается

```bash
docker compose logs app     # посмотреть ошибку
docker compose ps           # проверить статус
```

### БД не инициализируется

SQL-файлы в `docker-entrypoint-initdb.d` выполняются **только при первом создании** volume.
Чтобы переинициализировать:

```bash
docker compose down -v      # ВНИМАНИЕ: удалит все данные!
docker compose up -d
```

### Порт уже занят

```bash
# Проверить какой процесс занимает порт
ss -tlnp | grep :80
ss -tlnp | grep :3000

# Остановить процесс
kill <PID>
```

### Next.js — ошибка "Cannot find module"

Убедитесь что в `next.config.js` есть `output: 'standalone'`:

```js
const nextConfig = {
  output: 'standalone',
  // ...
}
```

### Нет доступа извне

```bash
# Проверить firewall
ufw status
ufw allow 80
ufw allow 443
ufw allow 22
```

---

## Краткая сводка

```
┌──────────────────────────────────────────────────────────────┐
│                         VPS (Ubuntu)                         │
│                                                              │
│   Nginx (:80 / :443)                                        │
│   ├── asp.domain.ru  → http://127.0.0.1:8080 (ASP.NET)     │
│   └── react.domain.ru → http://127.0.0.1:3000 (Next.js)    │
│                          ↘ /socket.io → :4000               │
│                                                              │
│   Docker containers:                                         │
│   ┌─────────────────┐  ┌──────────────────┐                 │
│   │ ASP.NET :8080   │  │ Next.js :3000    │                 │
│   │ PostgreSQL      │  │ PostgreSQL       │                 │
│   │ БД: TVVVV       │  │ БД: TVShow       │                 │
│   └─────────────────┘  │ Socket.io :4000  │                 │
│                         └──────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```
