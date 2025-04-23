import { once } from '@tauri-apps/api/event';
import { printRust } from './common';
import { TrayIconEvent } from '@tauri-apps/api/tray';

export let isTrayPositionSet = false;

once<TrayIconEvent>('tray_event', () => {
    isTrayPositionSet = true;
	printRust(`isTrayPositionSet: ${isTrayPositionSet}`);
});