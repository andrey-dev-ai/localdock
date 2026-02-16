mod detector;
mod process;
mod scanner;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Server {
    pub pid: u32,
    pub port: u16,
    pub project_name: String,
    pub framework: String,
    pub uptime_seconds: u64,
    pub process_name: String,
}

#[tauri::command]
fn get_servers() -> Vec<Server> {
    let pid_ports = scanner::scan_listening_ports();
    let mut servers: Vec<Server> = Vec::new();

    for (pid, ports) in &pid_ports {
        let process_name = scanner::get_process_name(*pid).unwrap_or_default();

        // Пропускаем системные процессы
        if is_system_process(&process_name) {
            continue;
        }

        let cwd = scanner::get_process_cwd(*pid);
        let (project_name, framework) = match &cwd {
            Some(path) => (
                detector::detect_project_name(path),
                detector::detect_framework(path),
            ),
            None => (process_name.clone(), "Unknown".to_string()),
        };

        let uptime = scanner::get_process_uptime(*pid).unwrap_or(0);

        for port in ports {
            servers.push(Server {
                pid: *pid,
                port: *port,
                project_name: project_name.clone(),
                framework: framework.clone(),
                uptime_seconds: uptime,
                process_name: process_name.clone(),
            });
        }
    }

    // Сортировка по порту
    servers.sort_by_key(|s| s.port);
    servers
}

fn is_system_process(name: &str) -> bool {
    let system = [
        "System",
        "svchost.exe",
        "lsass.exe",
        "services.exe",
        "wininit.exe",
        "csrss.exe",
        "smss.exe",
        "Registry",
        "Memory Compression",
        "dwm.exe",
        "explorer.exe",
        "SearchHost.exe",
        "RuntimeBroker.exe",
        "ShellExperienceHost.exe",
        "sihost.exe",
        "taskhostw.exe",
        "fontdrvhost.exe",
        "WmiPrvSE.exe",
        "sqlservr.exe",
    ];
    system.iter().any(|s| name.eq_ignore_ascii_case(s))
}

#[tauri::command]
fn kill_server(pid: u32) -> bool {
    process::kill_process(pid)
}

#[tauri::command]
fn open_in_browser(port: u16) {
    let url = format!("http://localhost:{}", port);
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", &url])
        .spawn();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_servers,
            kill_server,
            open_in_browser
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
