use std::{fs, io::ErrorKind, path::PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[derive(Debug, Serialize)]
struct NativeCommandError {
    code: &'static str,
    message: String,
}

impl NativeCommandError {
    fn invalid(message: impl Into<String>) -> Self {
        Self { code: "invalid-request", message: message.into() }
    }

    fn native(message: impl Into<String>) -> Self {
        Self { code: "native-window-error", message: message.into() }
    }

    fn persistence(message: impl Into<String>) -> Self {
        Self { code: "persistence-failed", message: message.into() }
    }

    fn not_found(message: impl Into<String>) -> Self {
        Self { code: "window-not-found", message: message.into() }
    }

}

type CommandResult<T> = Result<T, NativeCommandError>;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExternalWindowRequest {
    feature_id: String,
    label: String,
    title: String,
    width: f64,
    height: f64,
    min_width: f64,
    min_height: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExternalWindowOperationResult {
    created: bool,
}

fn is_safe_feature_id(feature_id: &str) -> bool {
    !feature_id.is_empty()
        && feature_id.len() <= 80
        && feature_id.chars().all(|character| character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-')
}

fn is_safe_external_label(label: &str) -> bool {
    label.strip_prefix("ember-feature-").is_some_and(is_safe_feature_id)
}

fn validate_external_request(request: &ExternalWindowRequest) -> CommandResult<()> {
    if !is_safe_feature_id(&request.feature_id) || request.label != format!("ember-feature-{}", request.feature_id) {
        return Err(NativeCommandError::invalid("The external feature label is invalid."));
    }
    let dimensions = [request.width, request.height, request.min_width, request.min_height];
    if dimensions.iter().any(|dimension| !dimension.is_finite() || *dimension <= 0.0) {
        return Err(NativeCommandError::invalid("Window dimensions must be finite positive numbers."));
    }
    Ok(())
}

#[tauri::command]
fn open_external_feature_window(app: AppHandle, request: ExternalWindowRequest) -> CommandResult<ExternalWindowOperationResult> {
    validate_external_request(&request)?;
    if let Some(window) = app.get_webview_window(&request.label) {
        window.show().map_err(|error| NativeCommandError::native(error.to_string()))?;
        window.set_focus().map_err(|error| NativeCommandError::native(error.to_string()))?;
        return Ok(ExternalWindowOperationResult { created: false });
    }

    let url = format!("/?window=external&feature={}", request.feature_id);
    let closed_app = app.clone();
    let closed_label = request.label.clone();
    let window = WebviewWindowBuilder::new(&app, &request.label, WebviewUrl::App(url.into()))
        .title(&request.title)
        .decorations(false)
        .transparent(false)
        .resizable(true)
        .inner_size(request.width, request.height)
        .min_inner_size(request.min_width, request.min_height)
        .build()
        .map_err(|error| NativeCommandError::native(error.to_string()))?;
    window.on_window_event(move |event| {
        if matches!(event, WindowEvent::Destroyed) {
            let _ = closed_app.emit("ember://external-window-closed", closed_label.clone());
        }
    });

    Ok(ExternalWindowOperationResult { created: true })
}

#[tauri::command]
fn focus_external_feature_window(app: AppHandle, label: String) -> CommandResult<()> {
    if !is_safe_external_label(&label) { return Err(NativeCommandError::invalid("The requested external window label is invalid.")); }
    let window = app.get_webview_window(&label).ok_or_else(|| NativeCommandError::not_found("The requested external window does not exist."))?;
    window.show().map_err(|error| NativeCommandError::native(error.to_string()))?;
    window.set_focus().map_err(|error| NativeCommandError::native(error.to_string()))
}

#[tauri::command]
fn close_external_feature_window(app: AppHandle, label: String) -> CommandResult<()> {
    if !is_safe_external_label(&label) { return Err(NativeCommandError::invalid("The requested external window label is invalid.")); }
    let window = app.get_webview_window(&label).ok_or_else(|| NativeCommandError::not_found("The requested external window does not exist."))?;
    window.close().map_err(|error| NativeCommandError::native(error.to_string()))
}

fn app_settings_path(app: &AppHandle) -> CommandResult<PathBuf> {
    app.path().app_data_dir()
        .map(|directory| directory.join("settings.json"))
        .map_err(|error| NativeCommandError::persistence(error.to_string()))
}

#[tauri::command]
async fn load_settings(app: AppHandle) -> CommandResult<Option<String>> {
    let path = app_settings_path(&app)?;
    tauri::async_runtime::spawn_blocking(move || match fs::read_to_string(path) {
        Ok(value) => Ok(Some(value)),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    })
    .await
    .map_err(|_| NativeCommandError::persistence("The settings operation did not complete."))?
    .map_err(|error| NativeCommandError::persistence(error.to_string()))
}

#[tauri::command]
async fn save_settings(app: AppHandle, content: String) -> CommandResult<()> {
    let path = app_settings_path(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(directory) = path.parent() { fs::create_dir_all(directory)?; }
        fs::write(path, content)
    })
    .await
    .map_err(|_| NativeCommandError::persistence("The settings operation did not complete."))?
    .map_err(|error| NativeCommandError::persistence(error.to_string()))
}

#[tauri::command]
async fn clear_settings(app: AppHandle) -> CommandResult<()> {
    let path = app_settings_path(&app)?;
    tauri::async_runtime::spawn_blocking(move || match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error),
    })
    .await
    .map_err(|_| NativeCommandError::persistence("The settings operation did not complete."))?
    .map_err(|error| NativeCommandError::persistence(error.to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_external_feature_window,
            focus_external_feature_window,
            close_external_feature_window,
            load_settings,
            save_settings,
            clear_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ember Studio");
}
