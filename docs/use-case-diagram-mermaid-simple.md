%% UML Use Case Diagram - TV Company Ad System (Simplified)
%% Для Mermaid Live Editor: https://mermaid.live/
%% Упрощённая версия для лучшей читаемости

graph LR
    %% Актёры
    Customer["👤<br/>Заказчик"]
    Agent["👔<br/>Агент"]
    Commercial["🏢<br/>Коммерция"]
    Accountant["💼<br/>Бухгалтер"]
    Director["⭐<br/>Директор"]
    ITAdmin["🔧<br/>IT-Админ"]
    
    %% Основные модули
    subgraph System["🎬 Система управления рекламой"]
        
        subgraph Apps["📝 Заявки"]
            CreateApp["Создать заявку"]
            ViewApps["Просмотреть заявки"]
            CalcCost["Калькулятор"]
            ApproveReject["Одобрить/Отклонить"]
        end
        
        subgraph Contracts["📄 Договоры"]
            CreateContract["Создать договор"]
            ViewContracts["Просмотр договоров"]
            DownloadContract["Скачать"]
        end
        
        subgraph Money["💰 Финансы"]
            RegisterPayment["Платежи"]
            ViewCommissions["Комиссии"]
            FinReport["Отчёты"]
        end
        
        subgraph Comm["💬 Коммуникация"]
            Chat["Чат"]
            Notifications["Уведомления"]
        end
        
        subgraph Schedule["📅 Расписание"]
            ManageShows["Управление шоу"]
            AdSlots["Рекламные слоты"]
        end
        
        subgraph Admin["⚙️ Администрирование"]
            ManageUsers["Пользователи"]
            Monitoring["Мониторинг"]
        end
        
    end
    
    %% Связи Заказчика
    Customer --> CreateApp
    Customer --> ViewApps
    Customer --> CalcCost
    Customer --> ViewContracts
    Customer --> DownloadContract
    Customer --> Chat
    Customer --> Notifications
    
    %% Связи Агента
    Agent --> ViewApps
    Agent --> CreateContract
    Agent --> ViewContracts
    Agent --> ViewCommissions
    Agent --> Chat
    Agent --> Notifications
    
    %% Связи Коммерции
    Commercial --> ViewApps
    Commercial --> ApproveReject
    Commercial --> ManageShows
    Commercial --> AdSlots
    Commercial --> Chat
    Commercial --> Notifications
    
    %% Связи Бухгалтера
    Accountant --> ViewApps
    Accountant --> RegisterPayment
    Accountant --> ViewCommissions
    Accountant --> FinReport
    Accountant --> Notifications
    
    %% Связи Директора
    Director --> ViewApps
    Director --> ViewCommissions
    Director --> FinReport
    Director --> Notifications
    
    %% Связи IT-Админа
    ITAdmin --> ManageUsers
    ITAdmin --> Monitoring
    ITAdmin --> Notifications
    
    %% Зависимости
    CreateApp -.->|включает| CalcCost
    ApproveReject -.->|уведомляет| Notifications
    CreateContract -.->|уведомляет| Notifications
    
    %% Стили
    classDef customerStyle fill:#FFE4E1,stroke:#333,stroke-width:3px
    classDef agentStyle fill:#E0FFE0,stroke:#333,stroke-width:3px
    classDef commercialStyle fill:#FFFACD,stroke:#333,stroke-width:3px
    classDef accountantStyle fill:#FFE4B5,stroke:#333,stroke-width:3px
    classDef directorStyle fill:#E6E6FA,stroke:#333,stroke-width:3px
    classDef adminStyle fill:#F0F8FF,stroke:#333,stroke-width:3px
    
    class Customer customerStyle
    class Agent agentStyle
    class Commercial commercialStyle
    class Accountant accountantStyle
    class Director directorStyle
    class ITAdmin adminStyle
