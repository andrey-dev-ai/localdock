use std::collections::{HashMap, HashSet};
use std::ffi::c_void;
use std::os::windows::ffi::OsStringExt;
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

// --- Windows API FFI для получения CWD процесса ---

const PROCESS_QUERY_INFORMATION: u32 = 0x0400;
const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;
const PROCESS_VM_READ: u32 = 0x0010;

#[repr(C)]
struct ProcessBasicInformation {
    reserved1: *mut c_void,
    peb_base_address: *mut c_void,
    reserved2: [*mut c_void; 2],
    unique_process_id: usize,
    reserved3: *mut c_void,
}

#[link(name = "ntdll")]
extern "system" {
    fn NtQueryInformationProcess(
        process_handle: *mut c_void,
        info_class: u32,
        info: *mut c_void,
        info_length: u32,
        return_length: *mut u32,
    ) -> i32;
}

#[link(name = "kernel32")]
extern "system" {
    fn OpenProcess(access: u32, inherit: i32, pid: u32) -> *mut c_void;
    fn ReadProcessMemory(
        process: *mut c_void,
        base: *const c_void,
        buf: *mut c_void,
        size: usize,
        read: *mut usize,
    ) -> i32;
    fn CloseHandle(handle: *mut c_void) -> i32;
    fn GetProcessTimes(
        process: *mut c_void,
        creation: *mut u64,
        exit: *mut u64,
        kernel: *mut u64,
        user: *mut u64,
    ) -> i32;
    fn GetSystemTimeAsFileTime(time: *mut u64);
}

/// Получить CWD процесса через Windows API (NtQueryInformationProcess + PEB)
/// Работает только на x64 Windows 10/11
fn get_process_cwd_native(pid: u32) -> Option<String> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
        if handle.is_null() {
            return None;
        }

        let result = (|| -> Option<String> {
            // 1. Получить PEB address
            let mut pbi: ProcessBasicInformation = std::mem::zeroed();
            let status = NtQueryInformationProcess(
                handle,
                0, // ProcessBasicInformation
                &mut pbi as *mut _ as *mut c_void,
                std::mem::size_of::<ProcessBasicInformation>() as u32,
                std::ptr::null_mut(),
            );
            if status < 0 || pbi.peb_base_address.is_null() {
                return None;
            }

            // 2. Прочитать ProcessParameters pointer из PEB (offset 0x20 на x64)
            let mut params_ptr: *mut c_void = std::ptr::null_mut();
            let params_addr = (pbi.peb_base_address as usize + 0x20) as *const c_void;
            let ok = ReadProcessMemory(
                handle,
                params_addr,
                &mut params_ptr as *mut _ as *mut c_void,
                std::mem::size_of::<*mut c_void>(),
                std::ptr::null_mut(),
            );
            if ok == 0 || params_ptr.is_null() {
                return None;
            }

            // 3. Прочитать CurrentDirectory.DosPath (UNICODE_STRING) из ProcessParameters
            //    Offset 0x38 на x64: Length(u16) + MaxLength(u16) + padding(4) + Buffer(*u16)
            let unicode_str_addr = (params_ptr as usize + 0x38) as *const c_void;
            let mut length: u16 = 0;
            let ok = ReadProcessMemory(
                handle,
                unicode_str_addr,
                &mut length as *mut _ as *mut c_void,
                2,
                std::ptr::null_mut(),
            );
            if ok == 0 || length == 0 {
                return None;
            }

            // Buffer pointer at offset +8 (after Length u16 + MaxLength u16 + 4 bytes padding)
            let buffer_ptr_addr = (params_ptr as usize + 0x38 + 8) as *const c_void;
            let mut buffer_ptr: *mut u16 = std::ptr::null_mut();
            let ok = ReadProcessMemory(
                handle,
                buffer_ptr_addr,
                &mut buffer_ptr as *mut _ as *mut c_void,
                std::mem::size_of::<*mut u16>(),
                std::ptr::null_mut(),
            );
            if ok == 0 || buffer_ptr.is_null() {
                return None;
            }

            // 4. Прочитать wide string (CWD)
            let char_count = (length as usize) / 2;
            let mut wide_buf: Vec<u16> = vec![0u16; char_count];
            let ok = ReadProcessMemory(
                handle,
                buffer_ptr as *const c_void,
                wide_buf.as_mut_ptr() as *mut c_void,
                length as usize,
                std::ptr::null_mut(),
            );
            if ok == 0 {
                return None;
            }

            // 5. Конвертировать в String
            let os_str = std::ffi::OsString::from_wide(&wide_buf);
            let mut path = os_str.to_string_lossy().to_string();

            // Убрать trailing backslash (CWD обычно заканчивается на \)
            if path.ends_with('\\') && !path.ends_with(":\\") {
                path.pop();
            }

            Some(path)
        })();

        CloseHandle(handle);
        result
    }
}

/// БАТЧ: получить CWD для всех указанных PIDs (нативно, без PowerShell)
pub fn get_all_process_cwds(pids: &[u32]) -> HashMap<u32, String> {
    let mut cwds = HashMap::new();
    for &pid in pids {
        if let Some(cwd) = get_process_cwd_native(pid) {
            cwds.insert(pid, cwd);
        }
    }
    cwds
}

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

/// Получить uptime процесса через Windows API (GetProcessTimes)
fn get_process_uptime_native(pid: u32) -> Option<u64> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return None;
        }

        let mut creation: u64 = 0;
        let mut exit: u64 = 0;
        let mut kernel: u64 = 0;
        let mut user: u64 = 0;

        let ok = GetProcessTimes(handle, &mut creation, &mut exit, &mut kernel, &mut user);
        CloseHandle(handle);

        if ok == 0 || creation == 0 {
            return None;
        }

        // FILETIME: 100ns intervals since 1601-01-01
        let mut now: u64 = 0;
        GetSystemTimeAsFileTime(&mut now);
        Some((now - creation) / 10_000_000) // в секунды
    }
}

/// БАТЧ: получить uptime ВСЕХ указанных PIDs через Windows API (без PowerShell)
pub fn get_all_uptimes(pids: &[u32]) -> HashMap<u32, u64> {
    let mut uptimes: HashMap<u32, u64> = HashMap::new();
    for &pid in pids {
        if let Some(secs) = get_process_uptime_native(pid) {
            uptimes.insert(pid, secs);
        }
    }
    uptimes
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

