---
title: Процесс подачи заявки на рекламу
---

sequenceDiagram
    actor Customer as Клиент
    participant Portal as Клиентский портал
    participant Server as Серверная часть
    actor Agent as Рекламный агент
    actor Commercial as Коммерческий отдел

    %% Подача заявки
    rect rgb(230, 245, 255)
        Note over Customer,Server: ПОДАЧА ЗАЯВКИ
        Customer->>Portal: 1. Войти в систему
        Customer->>Portal: 2. Отобразить форму заявки
        Customer->>Portal: 3. Заполнить форму
        
        Portal->>Server: 4. Отправить заявку
        Server->>Server: 5. Проверить слоты и<br/>рассчитать стоимость
        Server->>Server: 6. Расчет стоимости
        Server->>Portal: 7. Показать расчет
        Portal->>Customer: 7. Показать расчет
    end

    %% Согласование
    rect rgb(240, 255, 240)
        Note over Server,Commercial: СОГЛАСОВАНИЕ
        Server->>Agent: 8. Уведомление о новой заявке
        Agent->>Server: 9. Получить детали заявки
        Server->>Agent: 10. Данные заявки
        
        Agent->>Commercial: 11. Связаться для согласования
        Agent->>Commercial: 12. Подтвердить согласие
    end

    %% Принятие решения
    rect rgb(255, 250, 230)
        Note over Commercial,Agent: ПРИНЯТИЕ РЕШЕНИЯ
        
        alt Заявка одобрена
            Commercial->>Server: 13. Отправить на оценку
            Server->>Server: 14. Провести анализ
            Server->>Commercial: 15. Результаты анализа
            
            Commercial->>Server: 16. Решение по заявке
            Server->>Agent: 17. Утвердить заявку
            Agent->>Server: 18. Уведомление об одобрении
            
            Server->>Customer: 19. Заявка одобрена ✅
        else Заявка отклонена
            Commercial->>Server: 20. Отклонить заявку
            Server->>Agent: 21. Уведомление об отказе
            Agent->>Customer: 22. Заявка отклонена ❌
        end
    end

    %% Завершение
    rect rgb(230, 255, 255)
        Note over Customer,Portal: ЗАВЕРШЕНИЕ
        Customer->>Portal: 23. Проверить статус заявки
        Portal->>Server: 24. Получить статус
        Server->>Portal: 25. Текущий статус
        Portal->>Customer: 26. Отобразить статус
    end
