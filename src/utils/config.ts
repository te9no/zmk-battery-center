import { load } from '@tauri-apps/plugin-store';

enum NotificationType {
	LowBattery = 'low_battery',
	Disconnected = 'disconnected',
	Connected = 'connected',
}

export type Config = {
	fetchInterval: number;
	pushNotificationOn: NotificationType[];
}

export const defaultConfig: Config = {
	fetchInterval: 30000,
	pushNotificationOn: [NotificationType.LowBattery, NotificationType.Disconnected, NotificationType.Connected],
};

const configStore = await load('config.json', { autoSave: true });

export const getConfig = async (): Promise<Config> => {
	const config = await configStore.get<Config>('config');
	return {
		...defaultConfig,
		...config,
	};
};

export const setConfig = async (config: Config) => {
	await configStore.set('config', config);
};