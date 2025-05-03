import { LogicalSize } from '@tauri-apps/api/dpi';
import { Position, moveWindow } from '@tauri-apps/plugin-positioner';
import { printRust } from './common';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTrayPositionSet } from './tray';
import { invoke } from '@tauri-apps/api/core';

export async function resizeWindow(x: number, y: number) {
	printRust(`resizeWindow: ${x}x${y}`);
    const scaleFactor = await invoke<number>('get_windows_text_scale_factor');
    const width = x * scaleFactor;
    const height = y * scaleFactor;
    printRust(`scaled size: ${width}x${height}`);

	const window = getCurrentWebviewWindow();
	if (window) {
		await window.setSize(new LogicalSize(width, height));
	}
    moveWindowToTrayCenter();
}

export async function resizeWindowToContent() {
    const width = document.getElementById('app')?.clientWidth ?? 0;
    const height = document.getElementById('app')?.clientHeight ?? 0;
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
    if(isTrayPositionSet){
        moveWindow(Position.TrayCenter);
    } else {
        printRust(`moveWindowToTrayCenter(): skipped because isTrayPositionSet is false`);
    }
}
