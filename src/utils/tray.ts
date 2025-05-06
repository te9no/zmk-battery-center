import { once, emit, listen } from '@tauri-apps/api/event';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { Menu, Submenu, CheckMenuItem } from '@tauri-apps/api/menu';
import { showWindow } from './window';
import { exitApp } from './common';
import { openUrl } from '@tauri-apps/plugin-opener';
import { logger } from './log';
import { getConfig } from './config';

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

	// Load the initial config to set the menu item's checked state
	const initialConfig = await getConfig();

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
				id: 'control',
				text: 'Control',
				items: [
					{
						id: 'refresh',
						text: 'Refresh window',
						action: () => {
							location.reload();
							showWindow();
						},
					},
					{
						id: 'manual_window_positioning',
						text: 'Manual window positioning',
						checked: initialConfig.manualWindowPositioning,
						action: async (trayId: string) => {
							const controlMenu = await menu?.get('control') as Submenu | null;
							const thisMenu = await controlMenu?.get(trayId) as CheckMenuItem | null;
							if (!thisMenu) return;

							const isChecked = await thisMenu.isChecked();

							await emit('update-config', { manualWindowPositioning: isChecked });

							logger.info(`Emitted update-config: manualWindowPositioning = ${isChecked}`);
						},
					},
				]
			},
			{
				id: 'about',
				text: 'About',
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
