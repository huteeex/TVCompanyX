---
title: UML Use Case Diagram - TV Company Ad System
---

%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff','primaryTextColor':'#000','primaryBorderColor':'#000','lineColor':'#000','secondaryColor':'#f4f4f4','tertiaryColor':'#fff'}}}%%

flowchart TB
    %% Актёры (вынесены за границу системы)
    Customer([Заказчик<br/>рекламы])
    Agent([Рекламный<br/>агент])
    Commercial([Коммерческий<br/>отдел])
    Accountant([Бухгалтер])
    Director([Директор])
    ITAdmin([IT-Администратор])
    
    %% Граница системы
    subgraph System["Система управления рекламой телекомпании"]
        direction TB
        
        %% Прецеденты - Аутентификация
        UC_Login(("Авторизация/<br/>Регистрация<br/>на сайте"))
        UC_Profile(("Управлять<br/>профилем"))
        
        %% Прецеденты - Заявки
        UC_CreateApp(("Создать<br/>заявку"))
        UC_CalcCost(("Рассчитать<br/>стоимость<br/>рекламы"))
        UC_ViewApps(("Просмотреть<br/>заявки"))
        UC_EditApp(("Редактировать<br/>заявку"))
        UC_SubmitApp(("Подать заявку<br/>на размещение"))
        UC_AssignAgent(("Назначить<br/>агента"))
        UC_ApproveApp(("Одобрить<br/>заявку"))
        UC_RejectApp(("Отклонить<br/>заявку"))
        UC_ViewHistory(("Просмотреть<br/>историю<br/>заявок"))
        
        %% Прецеденты - Договоры
        UC_CreateContract(("Генерация<br/>документа<br/>по заказу"))
        UC_ViewContracts(("Просмотреть<br/>договоры"))
        UC_DownloadContract(("Скачать<br/>договор"))
        
        %% Прецеденты - Платежи
        UC_RegisterPayment(("Зарегистрировать<br/>платёж"))
        UC_ViewPayments(("Просмотреть<br/>платежи"))
        UC_ConfirmPayment(("Подтвердить<br/>оплату"))
        UC_FinReport(("Генерация<br/>отчетов"))
        
        %% Прецеденты - Комиссии
        UC_CalcCommission(("Рассчитать<br/>комиссию<br/>агента"))
        UC_ViewCommissions(("Просмотр<br/>комиссии"))
        UC_PayCommission(("Выплатить<br/>комиссию"))
        UC_CommissionReport(("Отчёт<br/>по комиссиям"))
        
        %% Прецеденты - Расписание
        UC_CreateShow(("Создать<br/>шоу"))
        UC_ViewSchedule(("Просмотр<br/>расписания<br/>шоу"))
        UC_ManageSlots(("Составление<br/>расписания<br/>передач"))
        UC_AdSchedule(("Составления<br/>графика<br/>рекламы"))
        
        %% Прецеденты - Коммуникация
        UC_Chat(("Чат"))
        UC_SendMessage(("Отправка<br/>сообщений<br/>клиенту"))
        UC_Notifications(("Отправка<br/>уведомлений<br/>клиенту"))
        
        %% Прецеденты - Отчеты
        UC_ExportReports(("Генерация<br/>отчетов<br/>по клиенту"))
        UC_ViewStats(("Просмотр<br/>статистики<br/>сотрудников"))
        UC_Dashboard(("Просмотр<br/>работы всех<br/>отделов"))
        
        %% Прецеденты - Администрирование
        UC_ManageUsers(("Просмотр<br/>учетных<br/>записисей<br/>сотрудников"))
        UC_Monitoring(("Просмотр<br/>работы<br/>всех отделов"))
        UC_SystemSettings(("Изменения<br/>процентов<br/>комиссий"))
    end
    
    %% ========================================
    %% СВЯЗИ ЗАКАЗЧИКА РЕКЛАМЫ
    %% ========================================
    Customer --- UC_Login
    Customer --- UC_CreateApp
    Customer --- UC_CalcCost
    Customer --- UC_SubmitApp
    Customer --- UC_EditApp
    Customer --- UC_ViewHistory
    Customer --- UC_ViewContracts
    Customer --- UC_DownloadContract
    Customer --- UC_Chat
    
    %% ========================================
    %% СВЯЗИ РЕКЛАМНОГО АГЕНТА
    %% ========================================
    Agent --- UC_Login
    Agent --- UC_Profile
    Agent --- UC_ViewApps
    Agent --- UC_EditApp
    Agent --- UC_ViewCommissions
    Agent --- UC_CreateContract
    Agent --- UC_SendMessage
    Agent --- UC_Notifications
    Agent --- UC_Chat
    Agent --- UC_ExportReports
    
    %% ========================================
    %% СВЯЗИ КОММЕРЧЕСКОГО ОТДЕЛА
    %% ========================================
    Commercial --- UC_Login
    Commercial --- UC_ViewApps
    Commercial --- UC_AssignAgent
    Commercial --- UC_ApproveApp
    Commercial --- UC_RejectApp
    Commercial --- UC_CreateShow
    Commercial --- UC_ViewSchedule
    Commercial --- UC_ManageSlots
    Commercial --- UC_AdSchedule
    Commercial --- UC_Chat
    Commercial --- UC_SendMessage
    Commercial --- UC_ViewStats
    
    %% ========================================
    %% СВЯЗИ БУХГАЛТЕРА
    %% ========================================
    Accountant --- UC_Login
    Accountant --- UC_RegisterPayment
    Accountant --- UC_ViewPayments
    Accountant --- UC_ConfirmPayment
    Accountant --- UC_FinReport
    Accountant --- UC_CalcCommission
    Accountant --- UC_ViewCommissions
    Accountant --- UC_PayCommission
    Accountant --- UC_CommissionReport
    Accountant --- UC_ExportReports
    
    %% ========================================
    %% СВЯЗИ ДИРЕКТОРА
    %% ========================================
    Director --- UC_Login
    Director --- UC_Dashboard
    Director --- UC_ViewStats
    Director --- UC_ViewPayments
    Director --- UC_CommissionReport
    Director --- UC_FinReport
    Director --- UC_ExportReports
    
    %% ========================================
    %% СВЯЗИ IT-АДМИНИСТРАТОРА
    %% ========================================
    ITAdmin --- UC_Login
    ITAdmin --- UC_ManageUsers
    ITAdmin --- UC_Monitoring
    ITAdmin --- UC_SystemSettings
    ITAdmin --- UC_ViewStats
    
    %% ========================================
    %% ЗАВИСИМОСТИ <<extend>> и <<include>>
    %% ========================================
    UC_ViewApps -.->|"<<extend>>"| UC_SendMessage
    UC_CreateContract -.->|"<<extend>>"| UC_Notifications
    UC_SubmitApp -.->|"<<include>>"| UC_CalcCost
    UC_ApproveApp -.->|"<<include>>"| UC_CalcCommission
    
    %% Стили для прецедентов (овалы)
    classDef usecaseStyle fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    classDef actorStyle fill:#f9f9f9,stroke:#000000,stroke-width:2px,color:#000000
    classDef systemStyle fill:#ffffff,stroke:#000000,stroke-width:3px,color:#000000
    
    class UC_Login,UC_Profile,UC_CreateApp,UC_ViewApps,UC_EditApp,UC_CalcCost,UC_SubmitApp,UC_AssignAgent,UC_ApproveApp,UC_RejectApp,UC_ViewHistory,UC_CreateContract,UC_ViewContracts,UC_DownloadContract,UC_RegisterPayment,UC_ViewPayments,UC_ConfirmPayment,UC_FinReport,UC_CalcCommission,UC_ViewCommissions,UC_PayCommission,UC_CommissionReport,UC_CreateShow,UC_ViewSchedule,UC_ManageSlots,UC_AdSchedule,UC_Chat,UC_SendMessage,UC_Notifications,UC_ExportReports,UC_ViewStats,UC_Dashboard,UC_ManageUsers,UC_Monitoring,UC_SystemSettings usecaseStyle
    
    class Customer,Agent,Commercial,Accountant,Director,ITAdmin actorStyle
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
<!-- [MermaidChart: e188cac3-91f9-4bf4-8b2a-ee7cd819cd2a] -->
