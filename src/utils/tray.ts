import { once, emit, listen } from '@tauri-apps/api/event';
import { printRust } from './common';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { Menu, MenuItem, Submenu, CheckMenuItem } from '@tauri-apps/api/menu';
import { showWindow } from './window';
import { exitApp } from './common';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getConfig, setConfig, type Config } from './config';

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

// Load the initial config to set the menu item's checked state
const initialConfig = await getConfig();

// Keep track of the menu item instance
let manualWindowPositioningMenuItem: CheckMenuItem | null = null;

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

						// Update the menu item's checked state visually
						await thisMenu.setChecked(isChecked);

						// Emit an event to update the config via ConfigContext
						await emit('update-config', { manualWindowPositioning: isChecked });

						printRust(`Emitted update-config: manualWindowPositioning = ${isChecked}`);
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

// Get the menu item instance after creation
const controlSubmenu = await menu.get('control') as Submenu | null;
manualWindowPositioningMenuItem = await controlSubmenu?.get('manual_window_positioning') as CheckMenuItem | null;

// Listen for config changes from ConfigContext
await listen<Partial<Config>>('config-changed', async (event) => {
	const changedConfig = event.payload;
	printRust(`Received config-changed event: ${JSON.stringify(changedConfig)}`);
	if (manualWindowPositioningMenuItem && typeof changedConfig.manualWindowPositioning === 'boolean') {
		const currentCheckedState = await manualWindowPositioningMenuItem.isChecked();
		if (currentCheckedState !== changedConfig.manualWindowPositioning) {
			await manualWindowPositioningMenuItem.setChecked(changedConfig.manualWindowPositioning);
			printRust(`Updated manual_window_positioning menu checked state to ${changedConfig.manualWindowPositioning}`);
		}
	}
});

tray?.setMenu(menu);
tray?.setShowMenuOnLeftClick(false);
