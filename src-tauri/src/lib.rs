use tauri::Emitter;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_positioner::{Position, WindowExt};

// モジュール宣言を追加
mod ble;
mod common;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
            .format(|out, message, record| {
                out.finish(format_args!(
                    "[{level}] [{target}]\n{message}",
                    level = record.level(),
                    target = record.target(),
                    message = message
                ))
            })
            .build()
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            common::exit_app,
            ble::list_battery_devices,
            ble::get_battery_info,
            window::get_windows_text_scale_factor,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                // mainウィンドウのフォーカスが外れたときに自動でhide
                if let Some(window) = app.get_webview_window("main") {
                    let window_ = window.clone();
                    window.on_window_event(move |event| {
                        if let tauri::WindowEvent::Focused(false) = event {
                            let _ = window_.hide();
                        }
                    });
                }

                let tray = app.tray_by_id("tray_icon").unwrap();

                tray.on_tray_icon_event(|tray_handle, event| {
                    let app = tray_handle.app_handle();

                    // Let positioner know about the event
                    tauri_plugin_positioner::on_tray_event(app, &event);

                    // Let frontend know about the event
                    let _ = app.emit("tray_event", event.clone());

                    // Handle click event
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap() {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.move_window(Position::TrayCenter);
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    }
                });
            }

            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
