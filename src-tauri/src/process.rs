use std::process::Command;

/// Убить процесс по PID
pub fn kill_process(pid: u32) -> bool {
    let output = Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/F", "/T"])
        .output();

    match output {
        Ok(o) => o.status.success(),
        Err(_) => false,
    }
}
