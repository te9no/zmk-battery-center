import { invoke } from "@tauri-apps/api/core";

/**
 * @typedef {Object} BleDeviceInfo
 * @property {string} name デバイス名
 * @property {string} id デバイスID
 */
/** @export */
export type BleDeviceInfo = {
	name: string;
	id: string;
};

/**
 * @typedef {Object} BatteryInfo
 * @property {number|null} battery_level バッテリー残量（%）
 * @property {string|null} user_descriptor ユーザ記述子
 */
/** @export */
export type BatteryInfo = {
	battery_level: number | null;
	user_descriptor: string | null;
};

/**
 * デバイス一覧を取得
 * @returns {Promise<BleDeviceInfo[]>}
 */
export async function listBatteryDevices(): Promise<BleDeviceInfo[]> {
	return await invoke("list_battery_devices");
}

/**
 * 指定デバイスのバッテリー情報を取得
 * @param {string} id デバイスID
 * @returns {Promise<BatteryInfo[]>}
 */
export async function getBatteryInfo(id: string): Promise<BatteryInfo[]> {
	return await invoke("get_battery_info", { id });
}
