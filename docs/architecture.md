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
│  lib.rs      → KNOWN_PROCESSES table, commands │
│  scanner.rs  → netstat parse, uptimes          │
│  detector.rs → framework ID                    │
│  process.rs  → taskkill                        │
└──────────────────────────────┘
```

## Компоненты

### Rust (src-tauri/src/)

| Модуль | Ответственность |
|--------|----------------|
| `lib.rs` | Tauri commands (`get_servers`, `kill_server`, `open_in_browser`), единая таблица `KNOWN_PROCESSES` (50 процессов: категория + описание) |
| `scanner.rs` | Парсинг `netstat -ano`, получение PID→порт маппинга (HashSet для дедупликации), имени процесса, uptime через PowerShell |
| `detector.rs` | Определение фреймворка по package.json, определение имени проекта |
| `process.rs` | Завершение процессов через `taskkill /PID /F` (без /T — не трогает дерево) |

### React (src/)

| Компонент | Ответственность |
|-----------|----------------|
| `useServers.ts` | Polling бэкенда каждые 3с, retry с backoff (3 попытки), cleanup таймеров |
| `Header.tsx` | SVG якорь + счётчик серверов с правильным склонением |
| `ServerCard.tsx` | Карточка: имя, описание/бейдж, порт, фреймворк, uptime, кнопки "Відкрити" / "Стоп" |
| `ServerList.tsx` | Список карточек + пустое состояние |
| `StatusBar.tsx` | Тикающий таймер "X сек назад" (обновляется каждую секунду) + refresh |

## Поток данных

1. `useServers` вызывает `invoke("get_servers")` каждые 3 секунды
2. Rust выполняет `netstat -ano` и парсит вывод → `HashMap<PID, HashSet<Port>>`
3. `tasklist /FO CSV` → имена процессов (CSV парсинг с кавычками)
4. `lookup_process()` → категория (dev/app/system) + описание из единой таблицы
5. Для dev-процессов: PowerShell → CWD → detector → фреймворк + имя проекта
6. PowerShell → uptime всех PIDs за один вызов
7. Возвращает `Vec<Server>` → JSON → React state
8. React рендерит список карточек, StatusBar тикает каждую секунду

## Безопасность

- **CSP:** `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'`
- **Port validation:** `open_in_browser` блокирует порты < 1024
- **Process kill:** только целевой PID, без дерева процессов (/T убран)
- **CREATE_NO_WINDOW:** все shell-команды скрыты (netstat, tasklist, powershell, taskkill)

## Ключевые решения

- **netstat вместо WMI/API** — проще, надёжнее, достаточно быстро для 3с интервала
- **Единая таблица KNOWN_PROCESSES** — одно место для категории + описания (раньше было 3 списка)
- **HashSet для портов** — автоматическая дедупликация IPv4/IPv6
- **Tailwind 3 (не 4)** — стабильная версия, проще настройка
- **Без restart** — нет надёжного способа узнать команду запуска чужого процесса
