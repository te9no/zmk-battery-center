use tauri::Emitter;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_opener::OpenerExt;

// モジュール宣言を追加
mod ble;
mod common;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            common::print_rust,
            ble::list_battery_devices,
            ble::get_battery_info
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

                // メニューアイテムを作成
                let show_item = MenuItemBuilder::with_id("show", "Show").build(app)?;
                let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
                let view_on_github = MenuItemBuilder::with_id("view_on_github", "View on GitHub").build(app)?;

                // メニューを構築
                let menu = MenuBuilder::new(app)
                    .items(&[
                        &show_item,
                        &quit_item,
                        &view_on_github,
                    ])
                    .build()?;

                let tray = app.tray_by_id("tray_icon").unwrap();
                tray.set_menu(Some(menu))
                    .expect("トレイメニューの設定に失敗しました");
                let _ = tray.set_show_menu_on_left_click(false);

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
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                println!("show menu item was clicked");
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.move_window(Position::TrayCenter);
                    let _ = window.emit("tray-position-set", true);
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                println!("quit menu item was clicked");
                app.exit(0);
            }
            "view_on_github" => {
                println!("visit github menu item was clicked");
                app.opener().open_path("https://github.com/kot149/zmk-battery-center", None::<&str>).unwrap();
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
