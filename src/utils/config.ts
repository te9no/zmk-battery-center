import { load, type Store } from '@tauri-apps/plugin-store';
import { printRust } from './common';
import { Theme } from '@/components/theme-provider';

export enum NotificationType {
	LowBattery = 'low_battery',
	Disconnected = 'disconnected',
	Connected = 'connected',
}

export type Config = {
	theme: Theme;
	autoStart: boolean;
	fetchInterval: number;
	pushNotification: boolean;
	pushNotificationWhen: Record<NotificationType, boolean>;
}

export const defaultConfig: Config = {
	theme: 'dark',
	fetchInterval: 30000,
	autoStart: false,
	pushNotification: false,
	pushNotificationWhen: {
		[NotificationType.Connected]: false,
		[NotificationType.Disconnected]: false,
		[NotificationType.LowBattery]: false,
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
	printRust(`Set config: ${JSON.stringify(config, null, 4)}`);
};