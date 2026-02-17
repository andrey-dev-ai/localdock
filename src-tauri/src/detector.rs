use serde_json::Value;
use std::fs;
use std::path::Path;

/// Читает и парсит package.json из папки проекта
fn read_package_json(project_path: &Path) -> Option<Value> {
    let pkg_path = project_path.join("package.json");
    let content = fs::read_to_string(&pkg_path).ok()?;
    serde_json::from_str(&content).ok()
}

/// Проверяет наличие пакета в dependencies или devDependencies
fn has_dependency(json: &Value, package: &str) -> bool {
    let check = |field: &str| -> bool {
        json.get(field)
            .and_then(|v| v.as_object())
            .map_or(false, |deps| deps.contains_key(package))
    };
    check("dependencies") || check("devDependencies")
}

/// Определить фреймворк по файлам в папке проекта
pub fn detect_framework(project_path: &str) -> String {
    let path = Path::new(project_path);

    // Проверяем package.json
    if let Some(json) = read_package_json(path) {
        // Порядок важен: более специфичные фреймворки сначала
        let frameworks: &[(&str, &str)] = &[
            ("next", "Next.js"),
            ("nuxt", "Nuxt"),
            ("svelte", "Svelte"),
            ("astro", "Astro"),
            ("react-scripts", "CRA"),
            ("express", "Express"),
            ("fastify", "Fastify"),
        ];

        for (package, name) in frameworks {
            if has_dependency(&json, package) {
                return name.to_string();
            }
        }

        // Vite: основной пакет или любой @vitejs/* плагин
        if has_dependency(&json, "vite") || has_vitejs_plugin(&json) {
            return "Vite".to_string();
        }

        return "Node.js".to_string();
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

/// Проверяет наличие @vitejs/* плагинов в dependencies/devDependencies
fn has_vitejs_plugin(json: &Value) -> bool {
    let check = |field: &str| -> bool {
        json.get(field)
            .and_then(|v| v.as_object())
            .map_or(false, |deps| deps.keys().any(|k| k.starts_with("@vitejs/")))
    };
    check("dependencies") || check("devDependencies")
}

/// Определить имя проекта из package.json или имени папки
pub fn detect_project_name(project_path: &str) -> String {
    let path = Path::new(project_path);

    // Попробовать из package.json
    if let Some(json) = read_package_json(path) {
        if let Some(name) = json.get("name").and_then(|v| v.as_str()) {
            return name.to_string();
        }
    }

    // Иначе — имя папки
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn create_temp_project(pkg_json: &str) -> tempfile::TempDir {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("package.json"), pkg_json).unwrap();
        dir
    }

    #[test]
    fn test_detect_nextjs_in_dependencies() {
        let dir = create_temp_project(r#"{
            "name": "my-app",
            "dependencies": { "next": "14.0.0", "react": "18.0.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Next.js");
    }

    #[test]
    fn test_detect_nextjs_in_devdependencies() {
        let dir = create_temp_project(r#"{
            "name": "my-app",
            "devDependencies": { "next": "14.0.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Next.js");
    }

    #[test]
    fn test_no_false_positive_on_description() {
        let dir = create_temp_project(r#"{
            "name": "my-tool",
            "description": "next generation tool for astro navigation",
            "dependencies": { "express": "4.18.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Express");
    }

    #[test]
    fn test_no_false_positive_description_only() {
        let dir = create_temp_project(r#"{
            "name": "my-tool",
            "description": "the next best thing with vite speed"
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Node.js");
    }

    #[test]
    fn test_detect_vite_main_package() {
        let dir = create_temp_project(r#"{
            "name": "vite-app",
            "devDependencies": { "vite": "5.0.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Vite");
    }

    #[test]
    fn test_detect_vite_plugin() {
        let dir = create_temp_project(r#"{
            "name": "react-app",
            "devDependencies": { "@vitejs/plugin-react": "4.0.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Vite");
    }

    #[test]
    fn test_detect_svelte() {
        let dir = create_temp_project(r#"{
            "name": "svelte-app",
            "dependencies": { "svelte": "4.0.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Svelte");
    }

    #[test]
    fn test_detect_express() {
        let dir = create_temp_project(r#"{
            "name": "api",
            "dependencies": { "express": "4.18.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Express");
    }

    #[test]
    fn test_fallback_nodejs() {
        let dir = create_temp_project(r#"{
            "name": "plain-node",
            "dependencies": { "lodash": "4.17.0" }
        }"#);
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Node.js");
    }

    #[test]
    fn test_detect_project_name() {
        let dir = create_temp_project(r#"{ "name": "cool-project" }"#);
        assert_eq!(detect_project_name(dir.path().to_str().unwrap()), "cool-project");
    }

    #[test]
    fn test_project_name_fallback_to_folder() {
        let dir = tempfile::tempdir().unwrap();
        let name = detect_project_name(dir.path().to_str().unwrap());
        // Имя папки tempdir — не "unknown"
        assert_ne!(name, "unknown");
    }

    #[test]
    fn test_python_django() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("requirements.txt"), "django==4.0").unwrap();
        fs::write(dir.path().join("manage.py"), "").unwrap();
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Django");
    }

    #[test]
    fn test_rust_project() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("Cargo.toml"), "[package]").unwrap();
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Rust");
    }

    #[test]
    fn test_go_project() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("go.mod"), "module example").unwrap();
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Go");
    }

    #[test]
    fn test_unknown_project() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(detect_framework(dir.path().to_str().unwrap()), "Unknown");
    }
}