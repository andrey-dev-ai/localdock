# Архитектура LocalDock

## Общая схема

```
┌──────────────────────────────┐
│     React UI (Vite dev)      │
│  Header → ServerList → Cards │
│  useServers() polling 3s     │
│          │ invoke()          │
└──────────┼───────────────────┘
           ▼
┌──────────────────────────────┐
│     Tauri Rust Backend       │
│  scanner.rs  → netstat parse │
│  detector.rs → framework ID  │
│  process.rs  → taskkill      │
└──────────────────────────────┘
```

## Компоненты

### Rust (src-tauri/src/)

| Модуль | Ответственность |
|--------|----------------|
| `scanner.rs` | Парсинг `netstat -ano`, получение PID→порт маппинга, имени процесса, uptime |
| `detector.rs` | Определение фреймворка по package.json, определение имени проекта |
| `process.rs` | Завершение процессов через `taskkill /PID /F /T` |
| `lib.rs` | Tauri commands: `get_servers`, `kill_server`, `open_in_browser` |

### React (src/)

| Компонент | Ответственность |
|-----------|----------------|
| `useServers.ts` | Polling бэкенда каждые 3с, состояние серверов, действия kill/open |
| `Header.tsx` | Заголовок с иконкой и счётчиком серверов |
| `ServerCard.tsx` | Карточка сервера: имя, порт, фреймворк, uptime, кнопки |
| `ServerList.tsx` | Список карточек + пустое состояние |
| `StatusBar.tsx` | Время последнего обновления + кнопка refresh |

## Поток данных

1. `useServers` вызывает `invoke("get_servers")` каждые 3 секунды
2. Rust выполняет `netstat -ano` и парсит вывод
3. Для каждого PID: получает имя процесса, рабочую папку, uptime
4. По рабочей папке определяет фреймворк
5. Возвращает `Vec<Server>` → JSON → React state
6. React рендерит список карточек

## Ключевые решения

- **netstat вместо WMI/API** — проще, надёжнее, достаточно быстро для 3с интервала
- **Фильтрация системных процессов** — по чёрному списку имён (svchost, explorer и др.)
- **Tailwind 3 (не 4)** — стабильная версия, проще настройка
- **Без restart** — нет надёжного способа узнать команду запуска чужого процесса
