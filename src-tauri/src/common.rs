use tauri;

#[tauri::command]
pub fn print_rust(str: &str) -> () {
    println!("{}", str);
}