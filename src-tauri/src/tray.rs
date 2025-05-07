use tauri;
use tauri::{
	AppHandle,
	Emitter,
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
};

pub fn init_tray(app_handle: AppHandle){
	let tray = app_handle.tray_by_id("tray_icon").unwrap();

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
				let _ = app.emit("tray_left_click", event.clone());
			}
			_ => {}
		}
	});
}
