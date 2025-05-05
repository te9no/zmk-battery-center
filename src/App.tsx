import "./App.css";
import { listBatteryDevices, getBatteryInfo, BleDeviceInfo, BatteryInfo } from "./utils/ble";
import { useState, useEffect } from "react";
import { mockRegisteredDevices } from "./utils/mockData";
import Button from "./components/Button";
import RegisteredDevicesPanel from "./components/RegisteredDevicesPanel";
// @ts-ignore 'printRust' is declared but its value is never read.
import { printRust, sleep } from "./utils/common";
import { resizeWindowToContent } from "./utils/window";
import { PlusIcon, ArrowPathIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";
import Modal from "./components/Modal";
import { useConfigContext } from "@/context/ConfigContext";
import { load } from '@tauri-apps/plugin-store';
import SettingsScreen from "@/components/SettingsScreen";
import { sendNotification } from "./utils/notificaion";
import { NotificationType } from "./utils/config";

export type RegisteredDevice = {
	id: string;
	name: string;
	batteryInfos: BatteryInfo[];
	isDisconnected: boolean;
}

enum State {
	main = 'main',
	addDeviceModal = 'addDeviceModal',
	settings = 'settings',
	fetchingDevices = 'fetchingDevices',
	fetchingBatteryInfo = 'fetchingBatteryInfo',
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
	// エラーメッセージ
	const [error, setError] = useState("");

	// config値
	const { config } = useConfigContext();

	// 画面表示状態
	const [state, setState] = useState<State>(State.main);

	// 保存された値を取得
	useEffect(() => {
		const fetchRegisteredDevices = async () => {
			const deviceStore = await load('devices.json', { autoSave: true });
			const devices = await deviceStore.get<RegisteredDevice[]>("devices");
			setRegisteredDevices(devices || []);
			printRust(`Loaded saved registered devices: ${JSON.stringify(devices, null, 4)}`);
			setIsLoaded(true);
		};
		fetchRegisteredDevices();
	}, []);

	// デバイス一覧取得
	async function fetchDevices() {
		setState(State.fetchingDevices);
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
					setState(State.addDeviceModal);
					reject(new Error(msg));
				}, 20000);
			});
			const result = await Promise.race([
				listBatteryDevices(),
				timeoutPromise
			]);
			if (!finished) {
				setDevices(result as BleDeviceInfo[]);
				setState(State.addDeviceModal);
			}
		} catch (e: any) {
			if (!finished) {
				let msg = e.toString();
				if (isMac && !msg.includes("Bluetooth permission")) {
					msg += " If you are using macOS, please make sure Bluetooth permission is granted.";
				}
				setError(msg);
				setState(State.addDeviceModal);
			}
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
		}
	}

	const mapIsLowBattery = (batteryInfos: BatteryInfo[]) => {
		return batteryInfos.map(info => info.battery_level !== null ? info.battery_level <= 20 : false);
	}

	// デバイス追加
	const handleAddDevice = async (id: string) => {
		if (!registeredDevices.some(d => d.id === id)) {
			const device = devices.find(d => d.id === id);
			if (!device) return;
			setState(State.fetchingBatteryInfo);
			const info = await getBatteryInfo(id);
			const newDevice: RegisteredDevice = {
				id: device.id,
				name: device.name,
				batteryInfos: Array.isArray(info) ? info : [info],
				isDisconnected: false
			};
			setRegisteredDevices(prev => [...prev, newDevice]);
		}
		handleCloseModal();
	};

	// バッテリー情報を更新する関数
	const updateBatteryInfo = async (device: RegisteredDevice) => {
		const isDisconnectedPrev = device.isDisconnected;
		const isLowBatteryPrev = mapIsLowBattery(device.batteryInfos);

		let attempts = 0;
		const maxAttempts = isDisconnectedPrev ? 1 : 3;

		while (attempts < maxAttempts) {
			printRust(`Updating battery info for: ${device.id} (attempt ${attempts + 1} of ${maxAttempts})`);
			try {
				const info = await getBatteryInfo(device.id);
				const infoArray = Array.isArray(info) ? info : [info];
				setRegisteredDevices(prev => prev.map(d => d.id === device.id ? { ...d, batteryInfos: infoArray, isDisconnected: false } : d));

				if(isDisconnectedPrev && config.pushNotification && config.pushNotificationWhen[NotificationType.Connected]){
					await sendNotification(`${device.name} has been connected.`);
				}

				if(config.pushNotification && config.pushNotificationWhen[NotificationType.LowBattery]){
					const isLowBattery = mapIsLowBattery(infoArray);
					for(let i = 0; i < isLowBattery.length && i < isLowBatteryPrev.length; i++){
						if(!isLowBatteryPrev[i] && isLowBattery[i]){
							sendNotification(`${device.name}${
								infoArray.length >= 2 ?
									' ' + (infoArray[i].user_descriptor ?? 'Central') + ' '
									: ''
							}has low battery.`);
							printRust(`${device.name} has low battery.`);
						}
					}
				}

				return;
			} catch {
				attempts++;
				if (attempts >= maxAttempts) {
					setRegisteredDevices(prev => prev.map(d => d.id === device.id ? { ...d, isDisconnected: true } : d));

					if(!isDisconnectedPrev && config.pushNotification && config.pushNotificationWhen[NotificationType.Disconnected]){
						await sendNotification(`${device.name} has been disconnected.`);
						return;
					}
				}
			}
			await sleep(500);
		}
	};

	const handleCloseModal = () => {
		setState(State.main);
		setError("");
	};

	// +ボタン押下時
	const handleOpenModal = async () => {
		setState(State.addDeviceModal);
		await fetchDevices();
	};

	// リロードボタン押下時
	const handleReload = async () => {
		setState(State.fetchingBatteryInfo);
		await Promise.all(registeredDevices.map(updateBatteryInfo));
		setState(State.main);
	};

	// ウィンドウサイズ変更
	useEffect(() => {
		resizeWindowToContent();
	}, [registeredDevices, state]);

	useEffect(() => {
		// デバイス一覧保存
		if(isLoaded){
			const saveRegisteredDevices = async () => {
				const deviceStore = await load('devices.json', { autoSave: true });
				await deviceStore.set("devices", registeredDevices);
				printRust('Saved registered devices');
			};
			saveRegisteredDevices();
		}

		// 一定時間ごとにバッテリー情報を更新
		let isUnmounted = false;

		const interval = setInterval(() => {
			if(isUnmounted) return;
			registeredDevices.forEach(updateBatteryInfo);
		}, config.fetchInterval);

		return () => {
			isUnmounted = true;
			clearInterval(interval);
		};
	}, [registeredDevices, config.fetchInterval]);

	// UI
	return (
		<div id="app" className={`relative w-90 flex flex-col bg-background text-foreground rounded-lg p-2 ${
			state === State.main && registeredDevices.length > 0 ? '' :
			state === State.fetchingBatteryInfo ? 'min-h-58' :
			state === State.settings ? 'min-h-85' :
			'min-h-90'
		}`}>
			{state === State.settings ? (
				<SettingsScreen
					onExit={async () => { setState(State.main); }}
				/>
			) : (
				<>
					<div>
						{/* デバッグモード切り替えボタン */}
						{IS_DEV && (
							<div className="fixed top-4 left-4">
								<button
									className={`px-3 py-1 rounded-lg text-sm ${isDebugMode ? 'bg-yellow-600' : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'} hover:opacity-80 transition duration-200`}
									onClick={toggleDebugMode}
								>
									{isDebugMode ? 'Debug Mode' : 'Production Mode'}
								</button>
							</div>
						)}

						<div className="flex flex-row ml-auto justify-end">
							{/* 右上+ボタン */}
							<Button
								className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-2xl !p-0 !px-0 !py-0 hover:bg-secondary"
								onClick={handleOpenModal}
								aria-label="Add Device"
							>
								<PlusIcon className="size-5" />
							</Button>

							{/* リロードボタン */}
							<Button
								className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-2xl !p-0 text-foreground hover:bg-secondary disabled:!text-muted-foreground disabled:hover:bg-transparent"
								onClick={handleReload}
								aria-label="Reload"
								disabled={registeredDevices.length === 0 || state === State.fetchingBatteryInfo}
							>
								<ArrowPathIcon className="size-5" />
							</Button>

							{/* 設定ボタン */}
							<Button
								className="w-10 h-10 rounded-lg bg-transparent hover:bg-secondary flex items-center justify-center text-2xl !text-foreground !p-0"
								onClick={() => setState(State.settings)}
								aria-label="Settings"
							>
								<Cog8ToothIcon className="size-5" />
							</Button>
						</div>
					</div>

					{/* モーダル（デバイス選択） */}
					{(state === State.addDeviceModal || state === State.fetchingDevices) && (
						<Modal
							open={true}
							onClose={handleCloseModal}
							title="Select Device"
							isLoading={state === State.fetchingDevices}
							error={error}
							loadingText="Fetching devices..."
						>
							{(state as string) !== (State.fetchingDevices as string) && (
								<ul className="max-h-60 overflow-y-auto rounded-sm">
									{devices.filter(d => !registeredDevices.some(rd => rd.id === d.id)).length === 0 && (
										<li className="text-muted-foreground">No devices found</li>
									)}
									{devices.filter(d => !registeredDevices.some(rd => rd.id === d.id)).map((d) => (
										<li key={d.id}>
											<Button
												className="w-full text-left rounded-none bg-card text-card-foreground hover:bg-muted transition-colors duration-300 !p-2"
												onClick={() => handleAddDevice(d.id)}
												disabled={state === State.fetchingDevices}
											>
												{d.name}
											</Button>
										</li>
									))}
								</ul>
							)}
						</Modal>
					)}

					{/* デバイス未登録時 */}
					{registeredDevices.length === 0 && (
						<div className="flex-1 flex flex-col items-center justify-center gap-6">
							<h1 className="text-2xl text-foreground">No devices registered</h1>
							<Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleOpenModal}>
								Add Device
							</Button>
						</div>
					)}

					{/* デバイス登録時 */}
					{registeredDevices.length > 0 && (
						<main className="container mx-auto">
							<RegisteredDevicesPanel
								registeredDevices={registeredDevices}
								setRegisteredDevices={setRegisteredDevices}
							/>
						</main>
					)}

					{/* Add Deviceでデバイス選択後のローディング表示 */}
					<Modal
						open={state === State.fetchingBatteryInfo}
						onClose={() => {}}
						isLoading={true}
						loadingText="Fetching battery info..."
						showCloseButton={false}
					/>
				</>
			)}
		</div>
	);
}

export default App;
