import { once } from '@tauri-apps/api/event';
import { printRust } from './common';
import { TrayIconEvent } from '@tauri-apps/api/tray';

/*
	plugin-positionerが動作可能かを判断するためのフラグ。
	一度ユーザーがトレイクリック/ホバーするまでplugin-positionerが動作しない。
*/
export let isTrayPositionSet = false;

once<TrayIconEvent>('tray_event', () => {
    isTrayPositionSet = true;
	printRust(`Tray position set`);
});
