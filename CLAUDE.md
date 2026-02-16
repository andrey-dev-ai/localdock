# LocalDock

Компактный менеджер localhost серверов для Windows.

## Стек
- **Backend:** Tauri v2 (Rust) — сканирование портов, управление процессами
- **Frontend:** React 19 + TypeScript 5 + Tailwind CSS 3 + Vite 6
- **Размер:** ~8MB exe

## Структура
```
src-tauri/src/
├── main.rs        # Точка входа
├── lib.rs         # Tauri commands + KNOWN_PROCESSES таблица (50 процессов)
├── scanner.rs     # Сканирование портов (netstat), имена (tasklist CSV), uptime (PowerShell)
├── detector.rs    # Определение фреймворка (package.json → Next.js/Vite/etc)
└── process.rs     # Kill процессов (taskkill /PID /F)

src/
├── App.tsx              # Главный компонент
├── types.ts             # Типы Server (pid, port, project_name, framework, uptime, process_name, category, description)
├── hooks/useServers.ts  # Polling каждые 3с + retry (3 попытки) + cleanup
├── components/
│   ├── Header.tsx       # SVG якорь + счётчик серверов (склонение)
│   ├── ServerList.tsx   # Список + пустое состояние
│   ├── ServerCard.tsx   # Карточка: описание, бейдж, кнопки "Відкрити"/"Стоп"
│   └── StatusBar.tsx    # Тикающий таймер + refresh
└── styles/globals.css   # Tailwind + тёмная тема + scrollbar
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
4. Для dev-процессов: PowerShell → CWD → detector → фреймворк
5. React отображает список с описаниями и кнопками

## Дизайн
- Окно: 380x550px
- Тёмная тема: #0a0a0f фон, #1a1a2e карточки
- Кнопки: текст + иконка ("Відкрити", "Стоп")
- Бейдж "Невідомий процес" для неизвестных
- StatusBar тикает каждую секунду

## Безопасность
- CSP включен (`default-src 'self'`)
- Валидация порта (< 1024 блокируется)
- taskkill без /T (не убивает дерево)

## Ограничения
- Только Windows (netstat + taskkill)
- Restart недоступен (нет информации о команде запуска)
