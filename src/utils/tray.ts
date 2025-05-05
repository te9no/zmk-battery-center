import { once } from '@tauri-apps/api/event';
import { printRust } from './common';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { Menu, MenuItem, Submenu, CheckMenuItem } from '@tauri-apps/api/menu';
import { showWindow } from './window';
import { exitApp } from './common';
import { openUrl } from '@tauri-apps/plugin-opener';

/*
	plugin-positionerが動作可能かを判断するためのフラグ。
	一度ユーザーがトレイクリック/ホバーするまでplugin-positionerが動作しない。
*/
export let isTrayPositionSet = false;

once<TrayIconEvent>('tray_event', () => {
    isTrayPositionSet = true;
	printRust(`Tray position set`);
});

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
					action: async (trayId: string) => {
						const controlMenu = await menu?.get('control') as Submenu | null;
						const thisMenu = await controlMenu?.get(trayId) as CheckMenuItem | null;
						const isChecked = await thisMenu?.isChecked() || false;
						printRust(isChecked.toString());
					},
					checked: false
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
