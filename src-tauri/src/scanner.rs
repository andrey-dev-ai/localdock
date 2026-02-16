use std::collections::HashMap;
use std::process::Command;

/// Результат сканирования: PID → порт
pub fn scan_listening_ports() -> HashMap<u32, Vec<u16>> {
    let mut pid_ports: HashMap<u32, Vec<u16>> = HashMap::new();

    let output = Command::new("netstat")
        .args(["-ano", "-p", "TCP"])
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return pid_ports,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);

    for line in stdout.lines() {
        let line = line.trim();
        if !line.contains("LISTENING") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 5 {
            continue;
        }

        // parts[1] = local address (e.g., "127.0.0.1:3000" or "0.0.0.0:3000" or "[::]:3000")
        let local_addr = parts[1];
        // parts[4] = PID
        let pid_str = parts[4];

        let port = extract_port(local_addr);
        let pid: u32 = match pid_str.parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        // Игнорируем PID 0 (системный) и порты < 1024 (системные)
        if pid == 0 {
            continue;
        }
        if let Some(p) = port {
            if p < 1024 {
                continue;
            }
            pid_ports.entry(pid).or_default().push(p);
        }
    }

    pid_ports
}

fn extract_port(addr: &str) -> Option<u16> {
    // Handles "127.0.0.1:3000", "0.0.0.0:3000", "[::]:3000", "[::1]:3000"
    if let Some(pos) = addr.rfind(':') {
        addr[pos + 1..].parse().ok()
    } else {
        None
    }
}

/// Получить рабочую папку процесса по PID (Windows)
pub fn get_process_cwd(pid: u32) -> Option<String> {
    // Используем wmic для получения CommandLine (ExecutablePath не даёт cwd)
    // Через PowerShell получаем рабочую папку
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "(Get-Process -Id {} -ErrorAction SilentlyContinue).Path",
                pid
            ),
        ])
        .output()
        .ok()?;

    let exe_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if exe_path.is_empty() {
        return None;
    }

    // Пробуем получить commandline с аргументами, там может быть путь к проекту
    let output = Command::new("wmic")
        .args([
            "process",
            "where",
            &format!("ProcessId={}", pid),
            "get",
            "CommandLine",
            "/value",
        ])
        .output()
        .ok()?;

    let cmd_line = String::from_utf8_lossy(&output.stdout).trim().to_string();
    // Ищем путь к проекту в командной строке
    extract_project_path(&cmd_line)
}

fn extract_project_path(cmd_line: &str) -> Option<String> {
    // Ищем пути типа d:\...\projects\name или C:\Users\...\name
    // Простая эвристика: ищем последний аргумент, который выглядит как путь
    for part in cmd_line.split_whitespace().rev() {
        let clean = part.trim_matches('"');
        if (clean.contains(":\\") || clean.contains(":/")) && !clean.ends_with(".exe") {
            // Это может быть путь к проекту
            let path = std::path::Path::new(clean);
            if path.exists() && path.is_dir() {
                return Some(clean.to_string());
            }
        }
    }
    None
}

/// Получить имя процесса по PID
pub fn get_process_name(pid: u32) -> Option<String> {
    let output = Command::new("tasklist")
        .args(["/FI", &format!("PID eq {}", pid), "/FO", "CSV", "/NH"])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    // Формат: "name.exe","PID","Session Name","Session#","Mem Usage"
    let first_line = stdout.lines().next()?;
    let name = first_line.split(',').next()?;
    Some(name.trim_matches('"').to_string())
}

/// Получить время запуска процесса (Windows) → секунды uptime
pub fn get_process_uptime(pid: u32) -> Option<u64> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "$p = Get-Process -Id {} -ErrorAction SilentlyContinue; if($p) {{ [int](New-TimeSpan $p.StartTime (Get-Date)).TotalSeconds }}",
                pid
            ),
        ])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    stdout.parse().ok()
}
