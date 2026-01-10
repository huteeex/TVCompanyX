%% UML Use Case Diagram - TV Company Ad System (By Roles)
%% Для Mermaid Live Editor: https://mermaid.live/
%% Диаграмма по ролям - горизонтальная компоновка

graph TB
    
    subgraph Customer_Block["👤 ЗАКАЗЧИК (Customer)"]
        C1["Создать заявку"]
        C2["Калькулятор стоимости"]
        C3["Просмотр договоров"]
        C4["Чат с агентом"]
        C5["История заявок"]
        C6["Уведомления"]
    end
    
    subgraph Agent_Block["👔 АГЕНТ (Agent)"]
        A1["Обработка заявок"]
        A2["Создание договоров"]
        A3["Чат с клиентом"]
        A4["Чат с коммерцией"]
        A5["Просмотр комиссий"]
        A6["Формирование отчётов"]
        A7["Загрузка файлов"]
    end
    
    subgraph Commercial_Block["🏢 КОММЕРЧЕСКИЙ ОТДЕЛ (Commercial)"]
        COM1["Одобрение заявок"]
        COM2["Отклонение заявок"]
        COM3["Назначение агентов"]
        COM4["Управление шоу"]
        COM5["Расписание эфира"]
        COM6["Рекламные слоты"]
        COM7["Статистика"]
    end
    
    subgraph Accountant_Block["💼 БУХГАЛТЕР (Accountant)"]
        ACC1["Регистрация платежей"]
        ACC2["Подтверждение оплат"]
        ACC3["Расчёт комиссий"]
        ACC4["Выплата комиссий"]
        ACC5["Финансовые отчёты"]
        ACC6["Контроль просрочек"]
        ACC7["Экспорт в PDF/Excel"]
    end
    
    subgraph Director_Block["⭐ ДИРЕКТОР (Director)"]
        D1["Дашборд аналитики"]
        D2["Финансовая статистика"]
        D3["Отчёты по заявкам"]
        D4["Контроль комиссий"]
        D5["Мониторинг платежей"]
    end
    
    subgraph ITAdmin_Block["🔧 IT-АДМИНИСТРАТОР (IT Admin)"]
        IT1["Управление пользователями"]
        IT2["Назначение ролей"]
        IT3["Мониторинг БД"]
        IT4["Системные логи"]
        IT5["Настройки системы"]
        IT6["Статистика пользователей"]
    end
    
    subgraph Common["🔐 ОБЩИЕ МОДУЛИ"]
        Auth["Аутентификация"]
        Notif["Система уведомлений"]
        Profile["Управление профилем"]
    end
    
    %% Связи с общими модулями
    Customer_Block --> Auth
    Agent_Block --> Auth
    Commercial_Block --> Auth
    Accountant_Block --> Auth
    Director_Block --> Auth
    ITAdmin_Block --> Auth
    
    Customer_Block --> Notif
    Agent_Block --> Notif
    Commercial_Block --> Notif
    Accountant_Block --> Notif
    Director_Block --> Notif
    ITAdmin_Block --> Notif
    
    Customer_Block --> Profile
    Agent_Block --> Profile
    Commercial_Block --> Profile
    Accountant_Block --> Profile
    Director_Block --> Profile
    ITAdmin_Block --> Profile
    
    %% Взаимодействия между ролями
    C1 -.->|создаёт| A1
    A2 -.->|отправляет| C3
    COM1 -.->|одобряет| A1
    ACC1 -.->|обрабатывает| A1
    
    %% Стили
    classDef customerStyle fill:#FFE4E1,stroke:#FF6B6B,stroke-width:2px
    classDef agentStyle fill:#E0FFE0,stroke:#4CAF50,stroke-width:2px
    classDef commercialStyle fill:#FFFACD,stroke:#FFD700,stroke-width:2px
    classDef accountantStyle fill:#FFE4B5,stroke:#FFA500,stroke-width:2px
    classDef directorStyle fill:#E6E6FA,stroke:#9370DB,stroke-width:2px
    classDef adminStyle fill:#F0F8FF,stroke:#4682B4,stroke-width:2px
    classDef commonStyle fill:#F5F5F5,stroke:#333,stroke-width:2px
    
    class C1,C2,C3,C4,C5,C6 customerStyle
    class A1,A2,A3,A4,A5,A6,A7 agentStyle
    class COM1,COM2,COM3,COM4,COM5,COM6,COM7 commercialStyle
    class ACC1,ACC2,ACC3,ACC4,ACC5,ACC6,ACC7 accountantStyle
    class D1,D2,D3,D4,D5 directorStyle
    class IT1,IT2,IT3,IT4,IT5,IT6 adminStyle
    class Auth,Notif,Profile commonStyle
