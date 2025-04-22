import { invoke } from "@tauri-apps/api/core";

export async function printRust(str: string) {
	await invoke("print_rust", { str });
}
