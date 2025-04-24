import { load } from '@tauri-apps/plugin-store';

export enum NotificationType {
	LowBattery = 'low_battery',
	Disconnected = 'disconnected',
	Connected = 'connected',
}

export type Config = {
	fetchInterval: number;
	autoStart: boolean;
	pushNotification: boolean;
	pushNotificationOn: Record<NotificationType, boolean>;
}

export const defaultConfig: Config = {
	fetchInterval: 30000,
	autoStart: false,
	pushNotification: false,
	pushNotificationOn: {
		[NotificationType.Connected]: false,
		[NotificationType.Disconnected]: false,
		[NotificationType.LowBattery]: false,
	},
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