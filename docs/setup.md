# Установка и настройка

## Требования

- **Rust** — установить через https://rustup.rs
- **Node.js 18+** — https://nodejs.org
- **Windows 10/11**

## Установка

```bash
cd d:\AI\projects\localdock
npm install
```

## Разработка

```bash
npx tauri dev
```

Откроется окно приложения с hot reload. Изменения в React применяются мгновенно, изменения в Rust требуют перекомпиляции (~10с).

## Сборка

```bash
npx tauri build
```

Результат: `src-tauri/target/release/localdock.exe` (~8MB)

## Запуск готового exe

Просто запустить `localdock.exe`. Не требует установки — portable.
