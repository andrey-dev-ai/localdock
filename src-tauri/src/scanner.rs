use std::collections::{HashMap, HashSet};
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Результат сканирования: PID → порты (LISTENING, дедуплицированные)
pub fn scan_listening_ports() -> HashMap<u32, HashSet<u16>> {
    let mut pid_ports: HashMap<u32, HashSet<u16>> = HashMap::new();

    let output = Command::new("netstat")
        .args(["-ano", "-p", "TCP"])
        .creation_flags(CREATE_NO_WINDOW)
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

        let local_addr = parts[1];
        let pid_str = parts[4];

        let port = extract_port(local_addr);
        let pid: u32 = match pid_str.parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        if pid == 0 {
            continue;
        }
        if let Some(p) = port {
            if p < 1024 {
                continue;
            }
            pid_ports.entry(pid).or_default().insert(p);
        }
    }

    pid_ports
}

fn extract_port(addr: &str) -> Option<u16> {
    if let Some(pos) = addr.rfind(':') {
        addr[pos + 1..].parse().ok()
    } else {
        None
    }
}

/// БАТЧ: получить имена ВСЕХ процессов за один вызов tasklist
pub fn get_all_process_names() -> HashMap<u32, String> {
    let mut names: HashMap<u32, String> = HashMap::new();

    let output = Command::new("tasklist")
        .args(["/FO", "CSV", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return names,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);

    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Формат: "name.exe","1234","Console","1","12,345 K"
        // split(',') ломается на запятых внутри кавычек — парсим корректно
        if let Some((name, pid_str)) = parse_csv_first_two(line) {
            if let Ok(pid) = pid_str.parse::<u32>() {
                if !name.is_empty() {
                    names.insert(pid, name.to_string());
                }
            }
        }
    }

    names
}

/// БАТЧ: получить uptime ВСЕХ указанных PIDs за один вызов PowerShell
pub fn get_all_uptimes(pids: &[u32]) -> HashMap<u32, u64> {
    let mut uptimes: HashMap<u32, u64> = HashMap::new();

    if pids.is_empty() {
        return uptimes;
    }

    // Формируем список PIDs через запятую
    let pids_str: Vec<String> = pids.iter().map(|p| p.to_string()).collect();
    let pids_joined = pids_str.join(",");

    let script = format!(
        "Get-Process -Id {} -ErrorAction SilentlyContinue | ForEach-Object {{ \"$($_.Id),$([int](New-TimeSpan $_.StartTime (Get-Date)).TotalSeconds)\" }}",
        pids_joined
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return uptimes,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);

    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Формат: "1234,567"
        let parts: Vec<&str> = line.splitn(2, ',').collect();
        if parts.len() == 2 {
            if let (Ok(pid), Ok(secs)) = (parts[0].parse::<u32>(), parts[1].parse::<u64>()) {
                uptimes.insert(pid, secs);
            }
        }
    }

    uptimes
}

/// Получить рабочую папку процесса по PID (только для dev-процессов)
/// Без wmic — один PowerShell-вызов
pub fn get_process_cwd(pid: u32) -> Option<String> {
    // Получаем CommandLine через PowerShell (быстрее чем wmic)
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "(Get-CimInstance Win32_Process -Filter \"ProcessId={}\").CommandLine",
                pid
            ),
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;

    let cmd_line = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if cmd_line.is_empty() {
        return None;
    }

    extract_project_path(&cmd_line)
}

/// Парсит первые два поля CSV строки с учётом кавычек.
/// "name.exe","1234",... → Some(("name.exe", "1234"))
fn parse_csv_first_two(line: &str) -> Option<(&str, &str)> {
    let line = line.trim();
    if !line.starts_with('"') {
        return None;
    }
    let end1 = line[1..].find('"')? + 1;
    let name = &line[1..end1];
    let rest = &line[end1 + 1..];
    if !rest.starts_with(",\"") {
        return None;
    }
    let rest = &rest[2..];
    let end2 = rest.find('"')?;
    let pid_str = &rest[..end2];
    Some((name, pid_str))
}

fn extract_project_path(cmd_line: &str) -> Option<String> {
    // Ищем пути типа d:\...\projects\name или C:\Users\...\name
    for part in cmd_line.split_whitespace().rev() {
        let clean = part.trim_matches('"');
        if (clean.contains(":\\") || clean.contains(":/")) && !clean.ends_with(".exe") {
            let path = std::path::Path::new(clean);
            if path.exists() && path.is_dir() {
                return Some(clean.to_string());
            }
        }
    }
    None
}
