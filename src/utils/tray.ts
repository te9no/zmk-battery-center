import { once } from '@tauri-apps/api/event';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { Menu } from '@tauri-apps/api/menu';
import { showWindow } from './window';
import { exitApp } from './common';
import { openUrl } from '@tauri-apps/plugin-opener';
import { logger } from './log';

/*
	plugin-positionerが動作可能かを判断するためのフラグ。
	一度ユーザーがトレイクリック/ホバーするまでplugin-positionerが動作しない。
*/
export let isTrayPositionSet = false;

once<TrayIconEvent>('tray_event', () => {
    isTrayPositionSet = true;
	logger.info(`Tray position set`);
});

async function setupTray(){
	const tray = await TrayIcon.getById('tray_icon');
	const menu = await Menu.new({
		items: [
			{
				id: 'show',
				text: 'Show',
				action: () => {
					showWindow();
				}
			},
			{
				id: 'refresh',
				text: 'Refresh window',
				action: () => {
					location.reload();
				},
			},
			{
				id: 'view_on_github',
				text: 'View on GitHub',
				action: () => {
					openUrl('https://github.com/kot149/zmk-battery-center');
				}
			},
			{
				id: 'quit',
				text: 'Quit',
				action: () => {
					exitApp();
				}
			}
		]
	});

	tray?.setMenu(menu);
	tray?.setShowMenuOnLeftClick(false);
}

setupTray();
