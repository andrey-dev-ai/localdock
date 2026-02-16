# LocalDock

Компактный десктопный менеджер localhost серверов. Показывает все запущенные dev-серверы, позволяет остановить или открыть в браузере.

## Какую проблему решает

При разработке нескольких проектов одновременно сложно отслеживать, какие dev-серверы запущены на каких портах. LocalDock автоматически находит все слушающие серверы и показывает их в компактном окне.

## Стек

- Tauri v2 (Rust) — бэкенд
- React 19 + TypeScript — фронтенд
- Tailwind CSS — стили
- Vite 6 — сборка фронтенда

## Быстрый старт

### Требования
- Rust (rustup.rs)
- Node.js 18+

### Установка и запуск
```bash
git clone https://github.com/andrey-dev-ai/localdock.git
cd localdock
npm install
npx tauri dev
```

### Сборка
```bash
npx tauri build
# → src-tauri/target/release/localdock.exe (~8MB)
```

## Возможности

- Автоматическое обнаружение серверов на localhost (polling каждые 3с)
- Описания процессов — 50 известных (Visual Studio Code, Node.js, Windows Service Host...)
- Определение фреймворка (Next.js, Vite, Python, Express и др.)
- Отображение uptime каждого сервера
- Остановка сервера одним кликом
- Открытие в браузере одним кликом
- Дедупликация IPv4/IPv6 портов
- CSP, валидация портов, безопасный kill

## Статус

v0.1.2 — UI redesign + bugfixes.

## Документация

- [CLAUDE.md](CLAUDE.md) — инструкции для Claude Code
- [docs/architecture.md](docs/architecture.md) — архитектура
- [docs/setup.md](docs/setup.md) — установка
- [docs/changelog.md](docs/changelog.md) — история изменений
