import { invoke } from "@tauri-apps/api/core";

export async function sleep(ms: number) {
	await new Promise(resolve => setTimeout(resolve, ms));
}

export async function exitApp() {
	await invoke("exit_app");
}
