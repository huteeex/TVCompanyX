# Скрипт для очистки БД и создания IT-администратора
# Использование: .\reset-db.ps1

Write-Host "================================" -ForegroundColor Yellow
Write-Host "ОЧИСТКА БАЗЫ ДАННЫХ" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "ВНИМАНИЕ! Это действие удалит ВСЕ данные из базы данных!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Вы уверены? Введите 'YES' для продолжения"

if ($confirmation -ne "YES") {
    Write-Host "Операция отменена." -ForegroundColor Green
    exit
}

Write-Host ""
Write-Host "Выполняется очистка базы данных..." -ForegroundColor Cyan

# Получаем переменные окружения из .env файла
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
}

# Формируем строку подключения
$DB_HOST = [Environment]::GetEnvironmentVariable("DB_HOST")
$DB_PORT = [Environment]::GetEnvironmentVariable("DB_PORT")
$DB_NAME = [Environment]::GetEnvironmentVariable("DB_NAME")
$DB_USER = [Environment]::GetEnvironmentVariable("DB_USER")
$DB_PASSWORD = [Environment]::GetEnvironmentVariable("DB_PASSWORD")

if (-not $DB_HOST) { $DB_HOST = "localhost" }
if (-not $DB_PORT) { $DB_PORT = "5432" }
if (-not $DB_NAME) { $DB_NAME = "tvcompany" }
if (-not $DB_USER) { $DB_USER = "postgres" }

Write-Host "Подключение к базе данных: $DB_NAME на $DB_HOST:$DB_PORT" -ForegroundColor Cyan

# Устанавливаем переменную окружения для пароля
$env:PGPASSWORD = $DB_PASSWORD

# Выполняем SQL скрипт
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "docs/db/reset-and-create-admin.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "ГОТОВО!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "База данных очищена и создан IT-администратор:" -ForegroundColor Green
    Write-Host "Email: admin@tvcompany.com" -ForegroundColor Cyan
    Write-Host "Пароль: admin123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Войдите в систему по адресу: http://localhost:3000/auth" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ОШИБКА при выполнении скрипта!" -ForegroundColor Red
    Write-Host "Проверьте настройки подключения к базе данных в .env файле" -ForegroundColor Red
}

# Очищаем переменную пароля
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
