# Agent Assignment System

## Обзор

Система назначения заявок агентам позволяет агентам видеть только те заявки, которые они взяли в работу, и обеспечивает изоляцию чатов между агентами.

## Как это работает

### Для агента

1. **Просмотр доступных заявок**
   - Перейдите на страницу `/agent/available-applications`
   - Или нажмите кнопку "Взять новую заявку" в чате
   - Отображаются только заявки со статусом `pending` без назначенного агента

2. **Взятие заявки в работу**
   - Нажмите кнопку "Взять" на карточке заявки
   - Система автоматически:
     * Назначает заявку на вас (`agent_id = your_user_id`)
     * Меняет статус на `in_progress`
     * Перенаправляет вас в чат с клиентом

3. **Работа с заявками**
   - В разделе "Чаты" (`/agent/chat`) вы видите только свои заявки
   - В разделе "Заявки" (`/agent/applications`) отображаются только ваши заявки
   - Фильтрация по статусу работает в пределах ваших заявок

### Для клиента

1. **Просмотр своих заявок**
   - Клиент видит только свои заявки (фильтр `customerId`)
   - Клиент видит чаты только с теми агентами, которые взяли его заявки в работу

2. **Чат с агентом**
   - Чат становится доступен после того, как агент берет заявку в работу
   - Клиент не видит переписки с другими агентами

## API Endpoints

### GET /api/applications?agentId={userId}
Получить все заявки, назначенные на конкретного агента.

**Query Parameters:**
- `agentId` - ID агента (UUID)
- `status` - фильтр по статусу (опционально)

**Response:**
```json
[
  {
    "id": "uuid",
    "customer_name": "Имя клиента",
    "agent_id": "uuid агента",
    "status": "in_progress",
    "show_name": "Название шоу",
    "cost": 5000,
    ...
  }
]
```

### POST /api/applications/[id]/assign
Взять заявку в работу (назначить на текущего агента).

**Authentication:** Требуется JWT token с ролью `agent`

**Response:**
```json
{
  "id": "uuid",
  "agent_id": "uuid агента",
  "status": "in_progress",
  ...
}
```

**Errors:**
- `400` - Заявка не в статусе `pending`
- `403` - Пользователь не является агентом
- `409` - Заявка уже назначена другому агенту

## Миграция базы данных

Файл миграции: `docs/db/migrations/add_agent_assignment.sql`

Создает индексы для оптимизации запросов:
```sql
CREATE INDEX idx_applications_agent_id ON applications(agent_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_agent_status ON applications(agent_id, status);
CREATE INDEX idx_applications_customer_id ON applications(customer_id);
```

## Применение миграции

```bash
psql -U postgres -d tv_ad_db -f docs/db/migrations/add_agent_assignment.sql
```

## Состояния заявки

1. **pending** - Заявка создана, ждет агента (видна всем агентам в available-applications)
2. **in_progress** - Заявка взята агентом (видна только назначенному агенту)
3. **sent_to_commercial** - Заявка отправлена в коммерческий отдел
4. **approved** - Заявка одобрена
5. **rejected** - Заявка отклонена

## Компоненты

### Новые страницы
- `src/pages/agent/available-applications.tsx` - Список доступных для взятия заявок

### Обновленные страницы
- `src/pages/agent/chat.tsx` - Добавлена кнопка "Взять новую заявку", фильтрация по agent_id
- `src/pages/agent/applications.tsx` - Фильтрация только своих заявок

### Новые API endpoints
- `src/pages/api/applications/[id]/assign.ts` - Endpoint для назначения заявки

## Безопасность

1. **Изоляция данных**
   - Агент видит только свои заявки через фильтр `agentId`
   - Клиент видит только свои заявки через фильтр `customerId`

2. **Проверки на сервере**
   - Только агенты могут брать заявки в работу
   - Нельзя взять заявку, уже назначенную другому агенту
   - Нельзя взять заявку не в статусе `pending`

3. **JWT Authentication**
   - Все endpoints требуют валидный JWT token
   - Role-based access control (RBAC)

## Примеры использования

### Взять заявку в работу (Frontend)

```typescript
const takeApplication = async (applicationId: string) => {
  try {
    const response = await fetch(`/api/applications/${applicationId}/assign`, {
      method: 'POST',
      credentials: 'same-origin'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Application assigned:', data)
      // Redirect to chat
      router.push(`/agent/chat?room=application-${applicationId}`)
    }
  } catch (error) {
    console.error('Failed to assign application:', error)
  }
}
```

### Загрузить свои заявки

```typescript
const loadMyApplications = async (userId: string) => {
  const response = await fetch(`/api/applications?agentId=${userId}`, {
    credentials: 'same-origin'
  })
  const applications = await response.json()
  return applications
}
```

## Troubleshooting

### Агент не видит свои заявки
- Проверьте, что `agent_id` правильно установлен в базе данных
- Убедитесь, что параметр `agentId` передается в API запрос

### Кнопка "Взять" не работает
- Проверьте статус заявки (должен быть `pending`)
- Убедитесь, что заявка не назначена другому агенту
- Проверьте роль пользователя в токене

### Заявка не появляется после взятия
- Проверьте, что статус изменился на `in_progress`
- Убедитесь, что `agent_id` установлен правильно
- Перезагрузите список заявок
