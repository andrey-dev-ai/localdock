# LocalDock

Компактный менеджер localhost серверов для Windows.

## Стек
- **Backend:** Tauri v2 (Rust) — сканирование портов, управление процессами
- **Frontend:** React 19 + TypeScript 5 + Tailwind CSS 3 + Vite 6
- **Иконки:** Lucide React
- **Размер:** ~8MB exe

## Структура
```
src-tauri/src/
├── main.rs        # Точка входа
├── lib.rs         # Tauri commands + KNOWN_PROCESSES таблица (50 процессов)
├── scanner.rs     # Сканирование портов (netstat), имена (tasklist CSV), uptime (GetProcessTimes FFI), CWD (NtQueryInformationProcess)
├── detector.rs    # Определение фреймворка (package.json → Next.js/Vite/etc)
└── process.rs     # Kill процессов (taskkill /PID /F)

src/
├── App.tsx              # Главный компонент (фильтр Ctrl+K)
├── types.ts             # Типы Server
├── hooks/useServers.ts  # Polling 3с + visibility pause + diff guard
├── components/
│   ├── TitleBar.tsx     # Кастомный titlebar (drag, minimize, close)
│   ├── ServerList.tsx   # Группы (dev/app/system), сворачиваемые
│   ├── ServerCard.tsx   # Glassmorphism карточка, кнопки + kill confirmation
│   └── StatusBar.tsx    # Таймер + autostart toggle + refresh
└── styles/globals.css   # Tailwind + glassmorphism + анимации
```

## Команды
```bash
npm install          # Установить зависимости
npx tauri dev        # Режим разработки (hot reload)
npx tauri build      # Сборка exe → src-tauri/target/release/localdock.exe
cargo test -- --nocapture  # Тесты (из src-tauri/)
```

## Как работает
1. Rust парсит `netstat -ano` → `HashMap<PID, HashSet<Port>>` (дедупликация IPv4/IPv6)
2. `tasklist /FO CSV` → имена процессов (парсинг с кавычками)
3. `lookup_process()` → категория + описание из единой таблицы KNOWN_PROCESSES
4. Для dev-процессов: нативный Windows API (NtQueryInformationProcess) → CWD → detector → фреймворк
5. Uptime: нативный GetProcessTimes FFI (без PowerShell)
6. React отображает список с glassmorphism карточками

## Дизайн (v0.3.0 — Spacedrive Style)
- Окно: 380x550px, фиксированный размер, без Windows рамки
- Тёмная тема: #030014 фон (космос), rgba карточки (glassmorphism)
- Акцент: #7c5cfc (фиолетовый), #22d97f (зелёный), #ff6b6b (красный)
- Шрифты: Inter (UI) + JetBrains Mono (порты, uptime)
- Анимации: fade-in, hover scale, rotate chevrons
- Single instance: только один экземпляр приложения

## Tauri v2 Capabilities
Файл: `src-tauri/capabilities/default.json`
- Все оконные операции ОБЯЗАТЕЛЬНО прописывать: `core:window:allow-*`
- Без разрешения JS-вызов молча игнорируется (без ошибок!)
- Текущие: show, hide, minimize, close, set-focus, unminimize, start-dragging
- Autostart: allow-enable, allow-disable, allow-is-enabled

## Безопасность
- CSP включен (self + Google Fonts)
- PID whitelist перед kill (только процессы с портом)
- Валидация порта (< 1024 блокируется)
- taskkill без /T (не убивает дерево)

## Ограничения
- Только Windows (netstat + taskkill + Windows API FFI)
- Restart недоступен (нет информации о команде запуска)
