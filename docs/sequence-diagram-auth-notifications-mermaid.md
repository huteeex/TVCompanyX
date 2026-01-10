---
title: Процесс создания договора и оплаты
---

sequenceDiagram
    actor Customer as Клиент
    participant Portal as Клиентский портал
    participant Server as Серверная часть
    actor Agent as Рекламный агент
    actor Accountant as Бухгалтер

    %% Генерация договора
    rect rgb(230, 245, 255)
        Note over Agent,Customer: ГЕНЕРАЦИЯ ДОГОВОРА
        Note right of Agent: После одобрения заявки
        
        Agent->>Server: 1. Создать договор
        Server->>Server: 2. Сгенерировать номер<br/>DOG-2025-XXXXXX
        Server->>Server: 3. Заполнить шаблон договора
        Server->>Agent: 4. Договор создан ✅
        
        Agent->>Server: 5. Отправить договор клиенту
        Server->>Customer: 6. 📄 Уведомление о договоре
    end

    %% Просмотр договора
    rect rgb(240, 255, 240)
        Note over Customer,Portal: ПРОСМОТР ДОГОВОРА
        Customer->>Portal: 7. Войти в раздел "Документы"
        Portal->>Server: 8. Запросить договоры
        Server->>Portal: 9. Список договоров
        Portal->>Customer: 10. Показать договоры
        
        Customer->>Portal: 11. Открыть договор
        Portal->>Server: 12. Получить детали
        Server->>Portal: 13. Данные договора
        Portal->>Customer: 14. Показать договор
        
        Customer->>Portal: 15. Скачать договор
        Portal->>Server: 16. Генерация PDF
        Server->>Portal: 17. 📄 PDF файл
        Portal->>Customer: 18. Скачивание документа
    end

    %% Регистрация оплаты
    rect rgb(255, 250, 230)
        Note over Accountant,Customer: РЕГИСТРАЦИЯ ОПЛАТЫ
        Note right of Accountant: Клиент произвел оплату
        
        Accountant->>Server: 19. Зарегистрировать платеж
        Server->>Server: 20. Обновить статус заявки
        Server->>Server: 21. Рассчитать комиссию агента
        Server->>Accountant: 22. Платеж зарегистрирован ✅
        
        Server->>Agent: 23. 💰 Уведомление о платеже
        Server->>Customer: 24. ✅ Подтверждение оплаты
    end

    %% Завершение
    rect rgb(230, 255, 255)
        Note over Customer,Portal: ЗАВЕРШЕНИЕ
        Customer->>Portal: 25. Проверить статус
        Portal->>Server: 26. Запрос статуса
        Server->>Portal: 27. Статус: "Оплачено"
        Portal->>Customer: 28. ✅ Отобразить статус
    end
