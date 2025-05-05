use tauri;

#[tauri::command]
pub fn print_rust(str: &str) -> () {
    println!("{}", str);
}

#[tauri::command]
pub fn exit_app() -> () {
    std::process::exit(0);
}
