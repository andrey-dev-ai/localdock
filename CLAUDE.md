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
├── lib.rs         # Tauri commands (get_servers, kill_server, open_in_browser)
├── scanner.rs     # Сканирование портов через netstat -ano
├── detector.rs    # Определение фреймворка (package.json → Next.js/Vite/etc)
└── process.rs     # Kill процессов (taskkill /PID /F /T)

src/
├── App.tsx              # Главный компонент
├── types.ts             # Типы Server
├── hooks/useServers.ts  # Polling каждые 3с + kill/open actions
├── components/
│   ├── Header.tsx       # Заголовок + счётчик серверов
│   ├── ServerList.tsx   # Список + пустое состояние
│   ├── ServerCard.tsx   # Карточка сервера + кнопки
│   └── StatusBar.tsx    # Время обновления + refresh
└── styles/globals.css   # Tailwind + тёмная тема + scrollbar
```

## Команды
```bash
npm install          # Установить зависимости
npx tauri dev        # Режим разработки (hot reload)
npx tauri build      # Сборка exe → src-tauri/target/release/localdock.exe
```

## Как работает
1. Rust парсит `netstat -ano` каждые 3 секунды
2. По PID получает имя процесса, рабочую папку, uptime
3. По файлам в папке определяет фреймворк
4. React отображает список с кнопками kill/open

## Дизайн
- Окно: 380x550px, нерастягиваемое
- Тёмная тема: #0a0a0f фон, #1a1a2e карточки
- Кнопки: открыть в браузере, остановить

## Ограничения
- Только Windows (netstat + taskkill)
- Restart недоступен (нет информации о команде запуска)
- Системные процессы фильтруются по имени
