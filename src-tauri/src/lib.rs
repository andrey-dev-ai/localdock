mod detector;
mod process;
mod scanner;

use serde::Serialize;
use tauri::Manager;

#[derive(Debug, Clone, Serialize)]
pub struct Server {
    pub pid: u32,
    pub port: u16,
    pub project_name: String,
    pub framework: String,
    pub uptime_seconds: u64,
    pub process_name: String,
    pub category: String,
    pub description: String,
}

#[tauri::command]
fn get_servers() -> Vec<Server> {
    // 1. Порты — один вызов netstat
    let pid_ports = scanner::scan_listening_ports();
    if pid_ports.is_empty() {
        return Vec::new();
    }

    // 2. Имена — один вызов tasklist (ВСЕ процессы)
    let all_names = scanner::get_all_process_names();

    // 3. Классификация — in-memory, мгновенно
    let pids: Vec<u32> = pid_ports.keys().copied().collect();

    // 4. Uptime — нативный Windows API (GetProcessTimes)
    let all_uptimes = scanner::get_all_uptimes(&pids);

    // 5. CWD для dev-процессов — batch native вызов (без PowerShell)
    let dev_pids: Vec<u32> = pid_ports
        .keys()
        .filter(|pid| {
            all_names
                .get(pid)
                .map(|name| lookup_process(name).category == "dev")
                .unwrap_or(false)
        })
        .copied()
        .collect();
    let all_cwds = scanner::get_all_process_cwds(&dev_pids);

    // 6. Собираем серверы
    let mut servers: Vec<Server> = Vec::new();

    for (pid, ports) in &pid_ports {
        let process_name = match all_names.get(pid) {
            Some(name) => name.clone(),
            None => continue,
        };

        let info = lookup_process(&process_name);
        let category = info.category.to_string();

        let (project_name, framework) = if info.category == "dev" {
            match all_cwds.get(pid) {
                Some(path) => (
                    detector::detect_project_name(path),
                    detector::detect_framework(path),
                ),
                None => (process_name.clone(), "Unknown".to_string()),
            }
        } else {
            (process_name.clone(), String::new())
        };

        let uptime = all_uptimes.get(pid).copied().unwrap_or(0);

        let description = info.description.to_string();

        for port in ports {
            servers.push(Server {
                pid: *pid,
                port: *port,
                project_name: project_name.clone(),
                framework: framework.clone(),
                uptime_seconds: uptime,
                process_name: process_name.clone(),
                category: category.clone(),
                description: description.clone(),
            });
        }
    }

    // Сортировка: dev первые, потом apps, потом system
    servers.sort_by(|a, b| {
        let cat_order = |c: &str| match c {
            "dev" => 0,
            "app" => 1,
            _ => 2,
        };
        cat_order(&a.category)
            .cmp(&cat_order(&b.category))
            .then(a.port.cmp(&b.port))
    });

    servers
}

#[derive(Debug, Clone, Copy)]
struct ProcessInfo {
    category: &'static str,
    description: &'static str,
}

/// Единая таблица: имя процесса (lowercase) → категория + описание.
/// Одно место для добавления новых процессов.
const KNOWN_PROCESSES: &[(&str, ProcessInfo)] = &[
    // Dev
    ("node.exe", ProcessInfo { category: "dev", description: "Node.js" }),
    ("python.exe", ProcessInfo { category: "dev", description: "Python" }),
    ("python3.exe", ProcessInfo { category: "dev", description: "Python" }),
    ("ruby.exe", ProcessInfo { category: "dev", description: "Ruby" }),
    ("java.exe", ProcessInfo { category: "dev", description: "Java" }),
    ("go.exe", ProcessInfo { category: "dev", description: "Go" }),
    ("deno.exe", ProcessInfo { category: "dev", description: "Deno" }),
    ("bun.exe", ProcessInfo { category: "dev", description: "Bun" }),
    ("cargo.exe", ProcessInfo { category: "dev", description: "Rust" }),
    ("rustc.exe", ProcessInfo { category: "dev", description: "Rust" }),
    ("php.exe", ProcessInfo { category: "dev", description: "PHP" }),
    ("dotnet.exe", ProcessInfo { category: "dev", description: ".NET" }),
    // Apps
    ("code.exe", ProcessInfo { category: "app", description: "Visual Studio Code" }),
    ("spotify.exe", ProcessInfo { category: "app", description: "Spotify" }),
    ("discord.exe", ProcessInfo { category: "app", description: "Discord" }),
    ("slack.exe", ProcessInfo { category: "app", description: "Slack" }),
    ("telegram.exe", ProcessInfo { category: "app", description: "Telegram" }),
    ("chrome.exe", ProcessInfo { category: "app", description: "Google Chrome" }),
    ("firefox.exe", ProcessInfo { category: "app", description: "Mozilla Firefox" }),
    ("msedge.exe", ProcessInfo { category: "app", description: "Microsoft Edge" }),
    ("brave.exe", ProcessInfo { category: "app", description: "Brave Browser" }),
    ("opera.exe", ProcessInfo { category: "app", description: "Opera Browser" }),
    ("postman.exe", ProcessInfo { category: "app", description: "Postman — API" }),
    ("docker desktop.exe", ProcessInfo { category: "app", description: "Docker Desktop" }),
    ("githubdesktop.exe", ProcessInfo { category: "app", description: "GitHub Desktop" }),
    ("figma.exe", ProcessInfo { category: "app", description: "Figma" }),
    ("notion.exe", ProcessInfo { category: "app", description: "Notion" }),
    ("obsidian.exe", ProcessInfo { category: "app", description: "Obsidian" }),
    ("windowsterminal.exe", ProcessInfo { category: "app", description: "Windows Terminal" }),
    ("localdock.exe", ProcessInfo { category: "app", description: "LocalDock" }),
    // System
    ("svchost.exe", ProcessInfo { category: "system", description: "Windows Service Host" }),
    ("vmms.exe", ProcessInfo { category: "system", description: "Hyper-V Manager" }),
    ("system", ProcessInfo { category: "system", description: "Windows System" }),
    ("lsass.exe", ProcessInfo { category: "system", description: "Windows Security" }),
    ("services.exe", ProcessInfo { category: "system", description: "Windows Services" }),
    ("spoolsv.exe", ProcessInfo { category: "system", description: "Print Spooler" }),
    ("searchhost.exe", ProcessInfo { category: "system", description: "Windows Search" }),
    ("runtimebroker.exe", ProcessInfo { category: "system", description: "Runtime Broker" }),
    ("dwm.exe", ProcessInfo { category: "system", description: "Desktop Window Manager" }),
    ("explorer.exe", ProcessInfo { category: "system", description: "Windows Explorer" }),
    ("dllhost.exe", ProcessInfo { category: "system", description: "COM Surrogate" }),
    ("conhost.exe", ProcessInfo { category: "system", description: "Console Host" }),
    ("wmiprvse.exe", ProcessInfo { category: "system", description: "WMI Provider" }),
    ("mdnsresponder.exe", ProcessInfo { category: "system", description: "Bonjour (mDNS)" }),
    ("battle.net.exe", ProcessInfo { category: "system", description: "Battle.net (Blizzard)" }),
    ("agent.exe", ProcessInfo { category: "system", description: "Battle.net Agent" }),
    ("httpd.exe", ProcessInfo { category: "system", description: "Apache HTTP Server" }),
    ("nginx.exe", ProcessInfo { category: "system", description: "Nginx" }),
    ("mysqld.exe", ProcessInfo { category: "system", description: "MySQL" }),
    ("postgres.exe", ProcessInfo { category: "system", description: "PostgreSQL" }),
];

fn lookup_process(name: &str) -> ProcessInfo {
    let lower = name.to_lowercase();
    KNOWN_PROCESSES
        .iter()
        .find(|(n, _)| *n == lower.as_str())
        .map(|(_, info)| *info)
        .unwrap_or(ProcessInfo { category: "system", description: "" })
}

#[tauri::command]
fn kill_server(pid: u32) -> bool {
    // Whitelist: разрешаем kill только для процессов, слушающих порт >= 1024
    let listening = scanner::scan_listening_ports();
    if !listening.contains_key(&pid) {
        return false;
    }
    process::kill_process(pid)
}

#[tauri::command]
fn open_in_browser(port: u16) {
    if port < 1024 {
        return;
    }
    let _ = open::that(format!("http://localhost:{}", port));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // При попытке запустить второй экземпляр — показываем существующее окно
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // Tray icon with context menu
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let show = MenuItem::with_id(app, "show", "Показати", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Вихід", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_servers,
            kill_server,
            open_in_browser
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_get_servers_performance() {
        let start = Instant::now();
        let servers = get_servers();
        let elapsed = start.elapsed();

        println!("Found {} servers in {:.2?}", servers.len(), elapsed);
        for s in &servers {
            println!(
                "  [{}] {}:{} (pid={}, uptime={}s, {})",
                s.category, s.process_name, s.port, s.pid, s.uptime_seconds, s.framework
            );
        }

        assert!(
            elapsed.as_secs() < 10,
            "get_servers() took too long: {:.2?}",
            elapsed
        );
    }
}
