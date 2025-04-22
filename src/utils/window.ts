import { LogicalSize } from '@tauri-apps/api/dpi';
import { Position, moveWindow } from '@tauri-apps/plugin-positioner';
import { printRust } from './common';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export async function resizeWindow(x: number, y: number) {
	printRust(`resizeWindow: ${x} ${y}`);
	const window = getCurrentWebviewWindow();
	if (window) {
		await window.setSize(new LogicalSize(x, y));
	}
	moveWindowToTrayCenter();
}

export async function resizeWindowToContent() {
    const width = document.getElementById('app')?.scrollWidth ?? 0;
    const height = document.getElementById('app')?.scrollHeight ?? 0;
    resizeWindow(width, height);
}

export function showWindow() {
    getCurrentWebviewWindow().show();
}

export function hideWindow() {
    getCurrentWebviewWindow().hide();
}

export function setWindowFocus() {
    getCurrentWebviewWindow().setFocus();
}

export function moveWindowToTrayCenter() {
    moveWindow(Position.TrayCenter);
}
