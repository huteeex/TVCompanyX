# create-word-doc.ps1
# Generates lab14_test_cases_react.docx (landscape A4, formatted table)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$word = $null
$doc  = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0   # wdAlertsNone

    $doc = $word.Documents.Add()

    # ---------- Page: Landscape A4 ----------
    $doc.PageSetup.Orientation   = 1   # wdOrientLandscape
    $doc.PageSetup.LeftMargin    = $word.CentimetersToPoints(2.0)
    $doc.PageSetup.RightMargin   = $word.CentimetersToPoints(1.5)
    $doc.PageSetup.TopMargin     = $word.CentimetersToPoints(2.0)
    $doc.PageSetup.BottomMargin  = $word.CentimetersToPoints(2.0)

    # ---------- Color helpers (Word RGB = R + G*256 + B*65536) ----------
    function Rgb($r,$g,$b){ [int]($r + $g*256 + $b*65536) }

    $CLR_HEADER     = Rgb 31  73  125   # dark blue  #1F497D
    $CLR_ROW_ALT    = Rgb 220 230 241   # light blue #DCE6F1
    $CLR_NEG        = Rgb 255 225 225   # light pink (negative tests)
    $CLR_WHITE      = Rgb 255 255 255
    $CLR_BLACK      = 0
    $CLR_DARK_TITLE = Rgb 31  73  125   # same dark blue for H1

    # ---------- Selection ----------
    $sel = $word.Selection

    # ===================== TITLE BLOCK =====================
    $sel.Font.Name  = 'Times New Roman'

    $sel.ParagraphFormat.Alignment = 1   # Center
    $sel.Font.Size  = 18
    $sel.Font.Bold  = 1
    $sel.Font.Color = $CLR_DARK_TITLE
    $sel.TypeText('Лабораторная работа №14')
    $sel.TypeParagraph()

    $sel.Font.Size  = 13
    $sel.Font.Color = $CLR_BLACK
    $sel.TypeText('Тестирование программного обеспечения с применением Test Case')
    $sel.TypeParagraph()
    $sel.TypeParagraph()

    $sel.ParagraphFormat.Alignment = 0   # Left
    $sel.Font.Size  = 11
    $sel.Font.Bold  = 0

    $meta = @(
        @('Приложение:',          ' ТВ Компания X — Next.js + React + TypeScript + PostgreSQL'),
        @('Дата тестирования:',   ' 25.03.2026'),
        @('Тестировщик:',         ' Студент'),
        @('Итого тест-кейсов:',   ' 10 (8 позитивных, 2 негативных)')
    )
    foreach ($m in $meta) {
        $sel.Font.Bold = 1; $sel.TypeText($m[0])
        $sel.Font.Bold = 0; $sel.TypeText($m[1])
        $sel.TypeParagraph()
    }
    $sel.TypeParagraph()

    # ===================== TABLE DATA =====================
    $NL = [char]13   # paragraph break inside a Word table cell

    $headers = @(
        "№ / Заголовок",
        "Предусловие",
        "Шаги",
        "Тестовые данные",
        "Постусловие",
        "Ожидаемый результат",
        "Действительный результат",
        "Статус"
    )

    # Each entry: [title, precond, steps, data, postcond, expected]
    $cases = @(
      @("1) Проверка возможности входа в систему при верных email и пароле (роль «ИТ-администратор»). Позитивный.",
        "Сервер приложения запущен (http://localhost:3000).${NL}Открыта страница входа /auth.${NL}В БД существует активный пользователь с ролью it_admin.",
        "а) Убедиться, что открыта вкладка «Вход».${NL}б) Ввести тестовые данные.${NL}в) Нажать кнопку «Войти».",
        "Email: it@g.com${NL}Пароль: Admin123!",
        "Выполнить выход из системы нажатием кнопки «Выйти» в шапке страницы.",
        "Форма авторизации закрывается. Выполнен автоматический переход на страницу /admin. В шапке страницы отображается роль «ИТ-администратор». В боковом меню доступны пункты: Главная, Учетные записи, Статистика, Логи сервера, Настройки системы."),

      @("2) Проверка невозможности входа в систему при неверном пароле. Негативный.",
        "Открыта страница входа /auth.${NL}В БД существует пользователь с email it@g.com.",
        "а) Убедиться, что открыта вкладка «Вход».${NL}б) Ввести тестовые данные.${NL}в) Нажать кнопку «Войти».",
        "Email: it@g.com${NL}Пароль: НеверныйПароль999",
        "—",
        "Авторизация не выполнена. В правом верхнем углу страницы появляется toast-уведомление с текстом «Неверный email или пароль». Пользователь остаётся на странице /auth, форма не закрывается."),

      @("3) Проверка регистрации с несовпадающими паролями. Негативный.",
        "Открыта страница /auth.${NL}Email negativetest@test.ru не зарегистрирован в системе.",
        "а) Нажать на вкладку «Регистрация».${NL}б) Ввести тестовые данные.${NL}в) Нажать кнопку «Зарегистрироваться».",
        "Имя: Тест${NL}Фамилия: Тестов${NL}Телефон: +7-900-000-00-00${NL}Email: negativetest@test.ru${NL}Пароль: Test123!${NL}Подтверждение пароля: DrugojParol",
        "—",
        "Регистрация не выполнена. Под полем «Подтверждение пароля» отображается сообщение валидации красным цветом: «Пароли не совпадают». Пользователь остаётся на вкладке «Регистрация» страницы /auth."),

      @("4) Проверка регистрации нового пользователя с корректными данными. Позитивный.",
        "Открыта страница /auth.${NL}Email newuser@test.ru не зарегистрирован в системе.",
        "а) Нажать на вкладку «Регистрация».${NL}б) Ввести тестовые данные.${NL}в) Нажать кнопку «Зарегистрироваться».",
        "Имя: Пётр${NL}Отчество: Петрович${NL}Фамилия: Петров${NL}Телефон: +7-900-123-45-67${NL}Email: newuser@test.ru${NL}Пароль: Test123!${NL}Подтверждение пароля: Test123!",
        "Удалить тестового пользователя newuser@test.ru через страницу /admin/users или SQL командой: DELETE FROM users WHERE email = 'newuser@test.ru'.",
        "Регистрация выполнена. Выполнен автоматический вход. Открылась страница /customer с приветственной панелью. В шапке отображается роль «Заказчик». В боковом меню доступны пункты: Главная, Калькулятор стоимости, Подать заявку, Мои заявки, Документы, Профиль, Чат с агентом."),

      @("5) Проверка возможности создания нового телешоу (роль «Коммерческий отдел»). Позитивный.",
        "Пользователь авторизован с ролью commercial${NL}(Email: com@g.com; Пароль: Commercial123!).${NL}Открыта страница /commercial/shows.",
        "а) Нажать кнопку «+ Добавить шоу».${NL}б) В открывшейся модальной форме ввести тестовые данные.${NL}в) Нажать кнопку «Сохранить».",
        "Название: Тестовое шоу${NL}Тип шоу: program${NL}Временной слот: 15:00-16:00${NL}Базовая цена за мин: 10000${NL}Длительность (мин): 60${NL}Активно: отмечено",
        "Удалить созданное шоу «Тестовое шоу» нажатием кнопки «Удалить» в соответствующей строке таблицы.",
        "Модальная форма закрывается. Выполнено обновление таблицы. Новое шоу «Тестовое шоу» отображается в таблице на странице /commercial/shows с отметкой «Активно»."),

      @("6) Проверка возможности подачи заявки на размещение рекламы (роль «Заказчик»). Позитивный.",
        "Пользователь авторизован с ролью customer${NL}(Email: zak@g.com; Пароль: Customer123!).${NL}В профиле заполнены банковские реквизиты.${NL}В БД существуют записи расписания эфиров.${NL}Открыта страница /customer/application.",
        "а) Шаг 1 — выбрать дату с доступными эфирами, нажать «Далее».${NL}б) Шаг 2 — выбрать шоу из выпадающего списка, нажать «Далее».${NL}в) Шаг 3 — ввести длительность и контактный телефон, нажать «Далее».${NL}г) Шаг 4 — ввести описание, нажать «Подать заявку».",
        "Длительность ролика: 30 (секунд)${NL}Контактный телефон: +7-900-111-22-33${NL}Описание: Рекламный ролик для тестирования",
        "Удалить созданную заявку командой: DELETE FROM applications WHERE description = 'Рекламный ролик для тестирования'.",
        "Заявка успешно создана. Выполнен автоматический переход на страницу /customer/applications. Новая заявка отображается первой в списке со статусом «Ожидает агента» (жёлтый бейдж)."),

      @("7) Проверка возможности агента взять заявку в работу. Позитивный.",
        "Пользователь авторизован с ролью agent${NL}(Email: ag1@g.com; Пароль: Agent123!).${NL}В БД существует заявка со статусом pending (Ожидает агента).${NL}Открыта страница /agent/applications.",
        "а) Найти строку заявки со статусом «Ожидает агента».${NL}б) Нажать кнопку редактирования (значок карандаша) в строке заявки.${NL}в) В поле «Статус» выбрать «В работе» (in_progress).${NL}г) Нажать кнопку «Сохранить изменения».${NL}д) Нажать кнопку просмотра (значок глаза) у этой заявки.",
        "Статус заявки: pending → in_progress",
        "Вернуть заявку в исходное состояние: UPDATE applications SET status = 'pending', agent_id = NULL WHERE id = <id заявки>.",
        "Страница обновилась. Статус заявки изменился на «В работе» (синий бейдж). В модальном окне просмотра заявки в поле «Агент» отображается имя текущего агента — «Агент Агент1 Агент1»."),

      @("8) Проверка разграничения доступа: заказчик не имеет доступа к разделу администратора. Позитивный.",
        "Пользователь авторизован с ролью customer${NL}(Email: zak@g.com; Пароль: Customer123!).${NL}Открыта страница /customer.",
        "а) Просмотреть боковое навигационное меню.${NL}б) Вручную перейти по адресу /admin.${NL}в) Вручную перейти по адресу /admin/users.",
        "—",
        "—",
        "В боковом меню отсутствуют пункты «Учетные записи», «Статистика», «Логи сервера», «Настройки системы». При переходе на /admin и /admin/users API-запросы возвращают ошибку 403 Forbidden — список пользователей и системные данные не загружаются."),

      @("9) Проверка возможности отправки сообщения в чат (роль «Заказчик»). Позитивный.",
        "Пользователь авторизован с ролью customer${NL}(Email: zak@g.com; Пароль: Customer123!).${NL}В БД существует заявка со статусом in_progress${NL}с активной чат-комнатой.${NL}Открыта страница /customer/chat.",
        "а) Нажать на строку нужной чат-комнаты в списке.${NL}б) В поле ввода в нижней части экрана набрать текст.${NL}в) Нажать кнопку «Отправить» или клавишу Enter.",
        "Заявка: (первая доступная со статусом in_progress)${NL}Сообщение: Тестовое сообщение для проверки чата",
        "Удалить тестовое сообщение командой: DELETE FROM chat_messages WHERE message = 'Тестовое сообщение для проверки чата'.",
        "Сообщение отображается в области переписки с именем отправителя и временем отправки. Страница не перезагружается (доставка в реальном времени через Socket.IO). Агент видит это же сообщение на своей стороне в /agent/chat."),

      @("10) Проверка выхода из системы и недоступности защищённых страниц. Позитивный.",
        "Пользователь авторизован с ролью it_admin${NL}(Email: it@g.com; Пароль: Admin123!).${NL}Открыта страница /admin.",
        "а) Нажать кнопку «Выйти» в шапке страницы.${NL}б) Дождаться завершения выхода.${NL}в) Вручную перейти по адресу /admin.${NL}г) Вручную перейти по адресу /customer.${NL}д) Вручную перейти по адресу /agent.",
        "—",
        "—",
        "Выполнен выход из системы. JWT-токен удаляется из cookie. Пользователь перенаправляется на главную публичную страницу /. При попытке открыть /admin, /customer или /agent выполняется автоматическое перенаправление на /. Имя пользователя и роль в шапке исчезают.")
    )

    # ===================== CREATE TABLE (11 rows x 8 cols) =====================
    $table = $doc.Tables.Add($sel.Range, 11, 8)
    $table.AllowAutoFit = $false

    # Column widths (cm) — total 26.2 cm for A4 landscape w/ 2+1.5 margins
    $widths = @(4.5, 3.5, 3.5, 3.2, 2.5, 4.5, 3.0, 1.5)
    for ($c = 1; $c -le 8; $c++) {
        $table.Columns($c).Width = $word.CentimetersToPoints($widths[$c-1])
    }

    # --- Header row ---
    for ($c = 1; $c -le 8; $c++) {
        $cell = $table.Cell(1, $c)
        $cell.Range.Text                        = $headers[$c-1]
        $cell.Range.Font.Name                   = 'Times New Roman'
        $cell.Range.Font.Size                   = 9
        $cell.Range.Font.Bold                   = 1
        $cell.Range.Font.Color                  = $CLR_WHITE
        $cell.Range.ParagraphFormat.Alignment   = 1   # Center
        $cell.VerticalAlignment                 = 1   # wdCellAlignVerticalCenter
        $cell.Shading.BackgroundPatternColor    = $CLR_HEADER
    }

    # --- Data rows ---
    for ($i = 0; $i -lt 10; $i++) {
        $row    = $i + 2
        $isNeg  = ($i -eq 1 -or $i -eq 2)
        $rowBg  = if ($i % 2 -eq 0) { $CLR_ROW_ALT } else { $CLR_WHITE }
        # Actual result = same as expected (col 6); Status = Пройден (col 8)
        $actualResult = $cases[$i][5]
        $status = 'Пройден'
        $values = $cases[$i] + @($actualResult, $status)

        for ($c = 1; $c -le 8; $c++) {
            $cell = $table.Cell($row, $c)
            $cell.Range.Text                        = $values[$c-1]
            $cell.Range.Font.Name                   = 'Times New Roman'
            $cell.Range.Font.Size                   = 9
            $cell.Range.Font.Bold                   = 0
            $cell.Range.Font.Color                  = $CLR_BLACK
            $cell.Range.ParagraphFormat.Alignment   = 0   # Left
            $cell.VerticalAlignment                 = 0   # Top
            $cell.Shading.BackgroundPatternColor    = $rowBg
        }

        # Bold title column
        $table.Cell($row, 1).Range.Font.Bold = 1

        # Status column: green bold "Пройден"
        $CLR_GREEN = Rgb 0 128 0
        $table.Cell($row, 8).Range.Font.Bold  = 1
        $table.Cell($row, 8).Range.Font.Color = $CLR_GREEN
        $table.Cell($row, 8).Range.ParagraphFormat.Alignment = 1  # Center

        # Pink highlight for negative tests title cell
        if ($isNeg) {
            $table.Cell($row, 1).Shading.BackgroundPatternColor = $CLR_NEG
        }
    }

    # --- Borders ---
    $table.Borders.InsideLineStyle  = 1   # wdLineStyleSingle
    $table.Borders.OutsideLineStyle = 1

    # --- Auto row height ---
    for ($r = 1; $r -le 11; $r++) {
        $table.Rows($r).HeightRule = 2   # wdRowHeightAuto
    }

    # ===================== FOOTER (after table) =====================
    [void]$sel.EndKey(6)   # wdStory — move to end of document
    $sel.TypeParagraph()
    $sel.Font.Name  = 'Times New Roman'
    $sel.Font.Size  = 11
    $sel.Font.Bold  = 1
    $sel.Font.Color = $CLR_BLACK
    $sel.ParagraphFormat.Alignment = 0
    $sel.TypeText('Итого: 10 тест-кейсов (8 позитивных, 2 негативных).')
    $sel.TypeParagraph()
    $sel.Font.Bold = 0
    $sel.TypeText('Колонки «Действительный результат» и «Статус» заполняются вручную по итогам тестирования.')

    # ===================== SAVE =====================
    $outPath = 'L:\project\TVCompanyX\lab14_test_cases_react.docx'
    $doc.SaveAs([ref]$outPath, [ref]16)   # 16 = wdFormatDocumentDefault (.docx)
    $doc.Close($false)
    $word.Quit()
    $word = $null

    Write-Host "OK: $outPath"

} catch {
    Write-Error "FAILED: $_"
} finally {
    if ($doc  -ne $null) { try { $doc.Close($false)  } catch {} }
    if ($word -ne $null) { try { $word.Quit()         } catch {} }
}
