const bcrypt = require('bcryptjs');

// Генерируем хэш для пароля "admin123"
const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('\n================================');
console.log('ХЭШИРОВАНИЕ ПАРОЛЯ');
console.log('================================\n');
console.log('Пароль:', password);
console.log('Хэш:', hash);
console.log('\nИспользуйте этот хэш в SQL скрипте reset-and-create-admin.sql');
console.log('================================\n');

// Проверяем хэш
const isValid = bcrypt.compareSync(password, hash);
console.log('Проверка хэша:', isValid ? '✓ Корректный' : '✗ Ошибка');
console.log('');
