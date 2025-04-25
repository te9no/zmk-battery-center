import { load, type Store } from '@tauri-apps/plugin-store';
import { printRust } from './common';
import { Theme } from '@/context/theme-provider';
import { enable as enableAutostart, isEnabled as isAutostartEnabled, disable as disableAutostart } from '@tauri-apps/plugin-autostart';
import { requestNotificationPermission } from './notificaion';

export enum NotificationType {
	LowBattery = 'low_battery',
	Disconnected = 'disconnected',
	Connected = 'connected',
}

export type Config = {
	theme: Theme;
	fetchInterval: number;
	autoStart: boolean;
	pushNotification: boolean;
	pushNotificationWhen: Record<NotificationType, boolean>;
}

export const defaultConfig: Config = {
	theme: 'dark',
	fetchInterval: 30000,
	autoStart: false,
	pushNotification: false,
	pushNotificationWhen: {
		[NotificationType.LowBattery]: false,
		[NotificationType.Connected]: false,
		[NotificationType.Disconnected]: false,
	},
};

let configStoreInstance: Store | null = null;

async function getConfigStore() {
	if (!configStoreInstance) {
		configStoreInstance = await load('config.json', { autoSave: true });
	}
	return configStoreInstance;
}

export async function getConfig(): Promise<Config> {
	const config = await getConfigStore().then((store: Store) => store.get<Config>('config'));
	return {
		...defaultConfig,
		...config,
	};
};

export async function setConfig(config: Config) {
	await getConfigStore().then((store: Store) => store.set('config', config));
	const isEnabled = await isAutostartEnabled();

	// Set/Unset autostart
	if (config.autoStart && !isEnabled) {
		await enableAutostart();
	} else if (!config.autoStart && isEnabled) {
		await disableAutostart();
	}

	// Set/Unset notification permission
	if (config.pushNotification) {
		const isGranted = await requestNotificationPermission();
		if(isGranted){
			printRust('Notification permission granted');
		} else {
			printRust('Notification permission not granted');
		}
	}

	printRust(`Set config: ${JSON.stringify(config, null, 4)}`);
};