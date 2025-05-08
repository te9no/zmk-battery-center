import { LogicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';
import { Position, moveWindow } from '@tauri-apps/plugin-positioner';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTrayPositionSet } from './tray';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './log';
import { manualWindowPositioning } from './tray';
import { emit } from '@tauri-apps/api/event';

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

    const unlistenOnMoved = window.onMoved(async ({ payload: position }) => {
        if(!isWindowMoving){
            logger.debug("Window move start");
        }
        isWindowMoving = true;

        if(moveTimeout){
            clearTimeout(moveTimeout);
        }

        moveTimeout = setTimeout(async () => {
            isWindowMoving = false;
            logger.debug("Window move end");

            await emit('update-window-position', { x: position.x, y: position.y });
            logger.info(`Emitted update-window-position: ${position.x}, ${position.y}`);
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

export async function restoreWindowPosition(position?: { x: number; y: number }) {
    try {
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
            logger.info(`Restoring window position from provided config: ${position.x}, ${position.y}`);
            const currentWindow = getCurrentWebviewWindow();
            await currentWindow.setPosition(new PhysicalPosition(position.x, position.y));
        } else {
            logger.info('No saved window position provided or position is invalid for restoreWindowPosition.');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to restore window position: ' + errorMessage);
    }
}