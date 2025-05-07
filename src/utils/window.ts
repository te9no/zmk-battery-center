import { LogicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';
import { Position, moveWindow } from '@tauri-apps/plugin-positioner';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTrayPositionSet } from './tray';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './log';
import { restoreStateCurrent, saveWindowState, StateFlags } from '@tauri-apps/plugin-window-state';
import { manualWindowPositioning } from './tray';

export async function resizeWindow(x: number, y: number) {
	logger.info(`resizeWindow: ${x}x${y}`);
    const scaleFactor = await invoke<number>('get_windows_text_scale_factor');
    const width = x * scaleFactor;
    const height = y * scaleFactor;
    logger.info(`scaled size: ${width}x${height}`);

	const window = getCurrentWebviewWindow();
	if (window) {
		window.setSize(new LogicalSize(width, height));
	}
}

export async function resizeWindowToContent() {
    const width = document.getElementById('app')?.clientWidth ?? 0;
    const height = document.getElementById('app')?.clientHeight ?? 0;
    resizeWindow(width, height);
}

export function isWindowVisible() {
    return getCurrentWebviewWindow().isVisible();
}

export function showWindow() {
    if(!manualWindowPositioning){
        moveWindowToTrayCenter();
    }
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
        logger.info(`Window moved to tray center`);
    } else {
        logger.warn(`moveWindowToTrayCenter(): skipped because isTrayPositionSet is false`);
    }
}

export function moveWindowToCenter() {
    moveWindow(Position.Center);
}

export function moveWindowTo(x: number, y: number) {
    const window = getCurrentWebviewWindow();
    if (window) {
        window.setPosition(new PhysicalPosition(x, y));
    }
}

let isWindowMoving = false;
let isWindowFocused = false;
let moveTimeout: NodeJS.Timeout | null = null;
let focusTimeout: NodeJS.Timeout | null = null;

async function handleWindowEvent() {
    const window = getCurrentWebviewWindow();
    restoreStateCurrent(StateFlags.POSITION);

    const unlistenOnMoved = window.onMoved(() => {
        if(!isWindowMoving){
            logger.debug("Window move stard");
        }
        isWindowMoving = true;

        if(moveTimeout){
            clearTimeout(moveTimeout);
        }

        moveTimeout = setTimeout(async () => {
            isWindowMoving = false;
            logger.debug("Window move end");
            saveWindowState(StateFlags.POSITION);
        }, 200);
    });

    const unlistenOnFocusChanged = window.onFocusChanged(({ payload: isFocused }) => {
        isWindowFocused = isFocused;
        if(isFocused){
            logger.debug("Window focused");
        } else {
            logger.debug("Window focus lost");
        }

        if(!isWindowFocused && !isWindowMoving){
            if(focusTimeout) {
                clearTimeout(focusTimeout);
            }

            focusTimeout = setTimeout(() => {
                if(!isWindowFocused && !isWindowMoving){
                    hideWindow();
                    logger.debug("Hiding window");
                }
            }, 200);
        }
    });

    return async () => {
        (await unlistenOnMoved)();
        (await unlistenOnFocusChanged)();
    };
}

handleWindowEvent();