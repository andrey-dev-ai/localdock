use std::fs;
use std::path::Path;

/// Определить фреймворк по файлам в папке проекта
pub fn detect_framework(project_path: &str) -> String {
    let path = Path::new(project_path);

    // Проверяем package.json
    let pkg_path = path.join("package.json");
    if pkg_path.exists() {
        if let Ok(content) = fs::read_to_string(&pkg_path) {
            if content.contains("\"next\"") {
                return "Next.js".to_string();
            }
            if content.contains("\"nuxt\"") {
                return "Nuxt".to_string();
            }
            if content.contains("\"vite\"") || content.contains("\"@vitejs") {
                return "Vite".to_string();
            }
            if content.contains("\"svelte\"") {
                return "Svelte".to_string();
            }
            if content.contains("\"astro\"") {
                return "Astro".to_string();
            }
            if content.contains("\"react-scripts\"") {
                return "CRA".to_string();
            }
            if content.contains("\"express\"") {
                return "Express".to_string();
            }
            if content.contains("\"fastify\"") {
                return "Fastify".to_string();
            }
            return "Node.js".to_string();
        }
    }

    // Python
    if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
        if path.join("manage.py").exists() {
            return "Django".to_string();
        }
        return "Python".to_string();
    }

    // Go
    if path.join("go.mod").exists() {
        return "Go".to_string();
    }

    // Rust
    if path.join("Cargo.toml").exists() {
        return "Rust".to_string();
    }

    "Unknown".to_string()
}

/// Определить имя проекта из package.json или имени папки
pub fn detect_project_name(project_path: &str) -> String {
    let path = Path::new(project_path);

    // Попробовать из package.json
    let pkg_path = path.join("package.json");
    if pkg_path.exists() {
        if let Ok(content) = fs::read_to_string(&pkg_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(name) = json.get("name").and_then(|v| v.as_str()) {
                    return name.to_string();
                }
            }
        }
    }

    // Иначе — имя папки
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string()
}
