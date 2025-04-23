import "./App.css";
import { listBatteryDevices, getBatteryInfo, BleDeviceInfo, BatteryInfo } from "./utils/ble";
import { useState, useEffect, useRef } from "react";
import { mockRegisteredDevices } from "./utils/mockData";
import Button from "./components/Button";
import RegisteredDevicesPanel from "./components/RegisteredDevicesPanel";
// @ts-ignore 'printRust' is declared but its value is never read.
import { printRust, sleep } from "./utils/common";
import { resizeWindowToContent } from "./utils/window";
import { PlusIcon, ArrowPathIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";
import Modal from "./components/Modal";
import { getConfig, setConfig, type Config, defaultConfig } from "./utils/config";
import { load } from '@tauri-apps/plugin-store';

export type RegisteredDevice = {
	id: string;
	name: string;
	batteryInfos: BatteryInfo[];
	isDisconnected: boolean;
}

// デバッグモードの設定
const IS_DEV = process.env.NODE_ENV === 'development';

function App() {
	// デバッグモードの切り替え
	const [isDebugMode, setIsDebugMode] = useState(false);
	// 登録済みデバイス
	const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>(isDebugMode ? mockRegisteredDevices : []);
	// デバイスロード完了フラグ
	const [isLoaded, setIsLoaded] = useState(false);

	// デバッグモードの切り替え処理
	const toggleDebugMode = () => {
		setIsDebugMode(prev => {
			if (!prev) {
				setRegisteredDevices(mockRegisteredDevices);
			} else {
				setRegisteredDevices([]);
			}
			return !prev;
		});
	};

	// デバイス取得用
	const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
	// モーダル表示状態
	const [isModalOpen, setIsModalOpen] = useState(false);
	// デバイス一覧取得ローディング
	const [isDeviceLoading, setIsDeviceLoading] = useState(false);
	// バッテリー情報取得ローディング
	const [isBatteryLoading, setIsBatteryLoading] = useState(false);
	// エラーメッセージ
	const [error, setError] = useState("");

	// config値
	const [config, setConfig] = useState<Config>(defaultConfig);

	// 保存された値を取得
	useEffect(() => {
		const fetchConfig = async () => {
			const config = await getConfig();
			setConfig(config);
		};
		fetchConfig();

		const fetchRegisteredDevices = async () => {
			const deviceStore = await load('devices.json', { autoSave: true });
			const devices = await deviceStore.get<RegisteredDevice[]>("devices");
			setRegisteredDevices(devices || []);
			printRust(`Loaded saved registered devices: ${JSON.stringify(devices, null, 4)}`);
			setIsLoaded(true);
		};
		fetchRegisteredDevices();
	}, []);

	// デバイス一覧保存
	useEffect(() => {
		if (!isLoaded) return;
		const saveRegisteredDevices = async () => {
			const deviceStore = await load('devices.json', { autoSave: true });
			await deviceStore.set("devices", registeredDevices);
			await deviceStore.save();
			printRust('Saved registered devices');
		};
		saveRegisteredDevices();
	}, [registeredDevices]);

	// デバイス一覧取得
	async function fetchDevices() {
		setIsDeviceLoading(true);
		setError("");
		let timeoutId: number | null = null;
		let finished = false;

		// macOS判定
		const isMac = navigator.userAgent.includes("Macintosh") || navigator.userAgent.includes("Mac OS X");

		try {
			const timeoutPromise = new Promise<never>((_, reject) => {
				timeoutId = window.setTimeout(() => {
					finished = true;
					let msg = "Failed to fetch devices.";
					if (isMac) {
						msg += " If you are using macOS, please make sure Bluetooth permission is granted.";
					}
					setError(msg);
					setIsDeviceLoading(false);
					reject(new Error(msg));
				}, 20000);
			});
			const result = await Promise.race([
				listBatteryDevices(),
				timeoutPromise
			]);
			if (!finished) {
				setDevices(result as BleDeviceInfo[]);
			}
		} catch (e: any) {
			if (!finished) {
				let msg = e.toString();
				if (isMac && !msg.includes("Bluetooth permission")) {
					msg += " If you are using macOS, please make sure Bluetooth permission is granted.";
				}
				setError(msg);
			}
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
			if (!finished) setIsDeviceLoading(false);
		}
	}

	// デバイス追加
	const handleAddDevice = async (id: string) => {
		if (!registeredDevices.some(d => d.id === id)) {
			const device = devices.find(d => d.id === id);
			if (!device) return;
			setIsBatteryLoading(true);
			const info = await getBatteryInfo(id);
			const newDevice: RegisteredDevice = {
				id: device.id,
				name: device.name,
				batteryInfos: Array.isArray(info) ? info : [info],
				isDisconnected: false
			};
			setRegisteredDevices(prev => [...prev, newDevice]);
			setIsBatteryLoading(false);
		}
		setIsModalOpen(false);
	};

	// バッテリー情報を更新する関数
	const updateBatteryInfo = async (device: RegisteredDevice) => {
		let attempts = 0;
		const maxAttempts = device.isDisconnected ? 1 : 3;
		while (attempts < maxAttempts) {
			printRust(`Updating battery info for: ${device.id} (attempt ${attempts + 1} of ${maxAttempts})`);
			try {
				const info = await getBatteryInfo(device.id);
				setRegisteredDevices(prev => prev.map(d => d.id === device.id ? { ...d, batteryInfos: Array.isArray(info) ? info : [info], isDisconnected: false } : d));
				return;
			} catch {
				attempts++;
				if (attempts >= maxAttempts) {
					setRegisteredDevices(prev => prev.map(d => d.id === device.id ? { ...d, isDisconnected: true } : d));
				}
			}
			await sleep(1000);
		}
	};

	// モーダルを閉じたらエラーも消す
	const handleCloseModal = () => {
		setIsModalOpen(false);
		setError("");
	};

	// +ボタン押下時
	const handleOpenModal = async () => {
		setIsModalOpen(true); // 先にモーダルを表示
		await fetchDevices();
	};

	// リロードボタン押下時
	const handleReload = async () => {
		setIsBatteryLoading(true);
		await Promise.all(registeredDevices.map(updateBatteryInfo));
		setIsBatteryLoading(false);
	};

	// ウィンドウサイズ変更
	useEffect(() => {
		resizeWindowToContent();
	}, [registeredDevices, isModalOpen]);

	// 一定時間ごとにバッテリー情報を更新
	useEffect(() => {
		let isUnmounted = false;

		const interval = setInterval(() => {
			if(isUnmounted) return;
			registeredDevices.forEach(updateBatteryInfo);
		}, config.fetchInterval);

		return () => {
			isUnmounted = true;
			clearInterval(interval);
		};
	}, [registeredDevices]);

	// UI
	return (
		<div id="app" className={`text-white relative w-[300px] p-2 ${
			registeredDevices.length === 0 ? 'h-[300px] max-h-[300px]' : isModalOpen ? 'min-h-[300px]' : ''
		}`}>
			<div>
				{/* デバッグモード切り替えボタン */}
				{IS_DEV && (
					<div className="fixed top-4 left-4">
						<button
							className={`px-3 py-1 rounded-lg text-sm ${isDebugMode ? 'bg-yellow-600' : 'bg-transparent text-transparent hover:text-white hover:bg-gray-600'} hover:opacity-80 transition duration-200`}
							onClick={toggleDebugMode}
						>
							{isDebugMode ? 'Debug Mode' : 'Production Mode'}
						</button>
					</div>
				)}

				<div className="flex flex-row ml-auto justify-end">
					{/* 右上+ボタン */}
					<Button
						className="w-10 h-10 rounded-lg bg-transparent hover:bg-gray-700 flex items-center justify-center text-2xl shadow-lg text-white !p-0 !px-0 !py-0"
						onClick={handleOpenModal}
						aria-label="Add Device"
					>
						<PlusIcon className="size-5 text-white text-xl" />
					</Button>

					{/* リロードボタン */}
					<Button
						className={`w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-2xl shadow-lg !p-0 ${isBatteryLoading || registeredDevices.length === 0 ? '!text-gray-400 hover:bg-transparent' : '!text-white hover:bg-gray-700'}`}
						onClick={handleReload}
						aria-label="Reload"
						disabled={isBatteryLoading || registeredDevices.length === 0}
					>
						<ArrowPathIcon className="size-5 text-xl" />
					</Button>

					{/* 設定ボタン */}
					<Button
						className="w-10 h-10 rounded-lg bg-transparent hover:bg-gray-700 flex items-center justify-center text-2xl shadow-lg text-white !p-0"
						onClick={() => {}}
						aria-label="Settings"
					>
						<Cog8ToothIcon className="size-5 text-white text-xl" />
					</Button>
				</div>
			</div>

			{/* モーダル（デバイス選択） */}
			<Modal
				open={isModalOpen}
				onClose={handleCloseModal}
				title="Select Device"
				isLoading={isDeviceLoading}
				error={error}
				loadingText="Fetching devices..."
			>
				{!isDeviceLoading && (
					<ul className="max-h-60 overflow-y-auto rounded-sm">
						{devices.filter(d => !registeredDevices.some(rd => rd.id === d.id)).length === 0 && (
							<li className="text-gray-400">No devices found</li>
						)}
						{devices.filter(d => !registeredDevices.some(rd => rd.id === d.id)).map((d) => (
							<li key={d.id}>
								<Button
									className="w-full text-left rounded-none hover:bg-gray-700 text-white bg-gray-800 transition-colors duration-300 !p-2"
									onClick={() => handleAddDevice(d.id)}
									disabled={isDeviceLoading}
								>
									{d.name}
								</Button>
							</li>
						))}
					</ul>
				)}
			</Modal>

			{/* デバイス未登録時 */}
			{registeredDevices.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-full gap-6">
					<h1 className="text-2xl">No devices registered</h1>
					<Button onClick={handleOpenModal}>
						Add Device
					</Button>
				</div>
			) : (
				/* デバイス登録時 */
				<main className="container mx-auto">
					<RegisteredDevicesPanel
						registeredDevices={registeredDevices}
						setRegisteredDevices={setRegisteredDevices}
					/>
				</main>
			)}
			{/* Add Deviceでデバイス選択後のローディング表示 */}
			<Modal
				open={isBatteryLoading}
				onClose={() => {}}
				isLoading={true}
				loadingText="Fetching battery info..."
				showCloseButton={false}
			/>
		</div>
	);
}

export default App;
