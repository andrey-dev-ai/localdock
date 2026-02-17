# Changelog

## 0.3.0 (2026-02-18)

### UI Redesign — Spacedrive Style
- Цветовая палитра: глубокий космос (#030014) + фиолетовый акцент (#7c5cfc)
- Glassmorphism карточки (backdrop-blur, полупрозрачные фоны)
- Кастомный titlebar (убрана Windows рамка, свои кнопки minimize/close)
- Lucide React иконки вместо inline SVG
- Анимации: fade-in при появлении, hover scale на карточках
- Типографика: Inter + JetBrains Mono (порты, uptime)
- Gradient text в заголовке "LocalDock"
- Pill badge для счётчика серверов в titlebar
- Spinner при загрузке (вместо текста)

### Window & Capabilities
- Фиксированный размер окна (resizable: false)
- Single instance — запуск только одного экземпляра (tauri-plugin-single-instance)
- Tauri v2 capabilities: добавлены allow-minimize, allow-close, allow-start-dragging
- Перетаскивание окна через startDragging() API (без data-tauri-drag-region)

### Improvements (Issues #7-#14)
- Нативный uptime через GetProcessTimes FFI (без PowerShell) (#7)
- PID whitelist перед kill_server (#8)
- open crate вместо cmd /C start (#9)
- Polling guard + visibility pause + diff comparison (#10)
- Loading/error feedback на кнопке Стоп (#11)
- Фильтр Ctrl+K + сворачиваемые группы (#12)
- Единый язык UI — українська (#13)
- Release profile оптимизации (strip, lto, opt-level s) (#14)

## 0.2.0 (2026-02-17)

### System Tray
- Сворачивание в системный трей при закрытии окна
- Иконка в трее + контекстное меню (Показати / Вихід)
- Клик по иконке — показать окно

### Auto-Start
- Toggle автозапуска при старте Windows в StatusBar
- Плагин tauri-plugin-autostart

### Kill Confirmation
- Диалог подтверждения при остановке системных процессов (svchost, lsass и т.д.)
- Dev/app процессы останавливаются сразу без подтверждения

## 0.1.2 (2026-02-17)

### UI Redesign
- Описания процессов — 50 известных процессов (Visual Studio Code, Node.js, Windows Service Host и т.д.)
- Бейдж "Невідомий процес" для неопознанных процессов
- Текстовые кнопки "Відкрити" / "Стоп" вместо непонятных иконок
- SVG якорь вместо эмодзи в хедере
- cursor-pointer и aria-labels на всех интерактивных элементах

### Bugfixes
- Включен CSP (Content Security Policy) — был полностью отключен
- Дедупликация портов — IPv4/IPv6 больше не создают дубликаты (HashSet)
- Корректный парсинг CSV из tasklist (кавычки в именах процессов)
- Единая таблица KNOWN_PROCESSES вместо 3 дублирующих списков
- Валидация порта в open_in_browser (блокировка системных < 1024)
- Убран `/T` из taskkill — не убивает дерево процессов
- Исправлен loading/retry в useServers (race condition, утечка таймеров)
- StatusBar тикает каждую секунду (раньше обновлялся только при poll)
- Правильное склонение "серверов" для чисел > 20

## 0.1.0 (2026-02-16)

- Первый релиз
- Автоматическое обнаружение серверов на localhost
- Определение фреймворка (Next.js, Vite, Python, Express и др.)
- Отображение uptime
- Остановка сервера (kill)
- Открытие в браузере
- Тёмная тема, компактное окно 380x550px
