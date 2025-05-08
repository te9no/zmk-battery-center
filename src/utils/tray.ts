import { once, listen, emit } from '@tauri-apps/api/event';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { Menu, Submenu, CheckMenuItem } from '@tauri-apps/api/menu';
import { isWindowVisible, showWindow } from './window';
import { exitApp } from './common';
import { openUrl } from '@tauri-apps/plugin-opener';
import { logger } from './log';
import { hideWindow, moveWindowToTrayCenter, setWindowFocus } from './window';
import { Config } from './config';
/*
	plugin-positionerが動作可能かを判断するためのフラグ。
	一度ユーザーがトレイクリック/ホバーするまでplugin-positionerが動作しない。
*/
export let isTrayPositionSet = false;

export let manualWindowPositioning = false;

once<TrayIconEvent>('tray_event', () => {
    isTrayPositionSet = true;
	logger.info(`Tray position set`);
});

once<Config>('config-changed', async ({ payload: initialConfig }) => {
	manualWindowPositioning = initialConfig.manualWindowPositioning;

	async function setupTray(){
		const tray = await TrayIcon.getById('tray_icon');

		listen('tray_left_click', async (_event) => {
			const isVisible = await isWindowVisible();
			if(isVisible){
				hideWindow();
			} else {
				showWindow();
				if(!manualWindowPositioning){
					moveWindowToTrayCenter();
				}
				setWindowFocus();
			}
		});


		const menu = await Menu.new({
			items: [
				{
					id: 'show',
					text: 'Show',
					action: () => {
						showWindow();
						if(!manualWindowPositioning){
							moveWindowToTrayCenter();
						}
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
								if(!manualWindowPositioning){
									moveWindowToTrayCenter();
								}
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
								manualWindowPositioning = isChecked;
								showWindow();
								if(!manualWindowPositioning){
									moveWindowToTrayCenter();
								}

								await emit('update-config', { manualWindowPositioning: isChecked });
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
});
