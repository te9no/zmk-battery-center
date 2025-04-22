import "./App.css";
import { listBatteryDevices, getBatteryInfo, BleDeviceInfo, BatteryInfo } from "./utils/ble";
import { useState, useEffect, useRef } from "react";
import Button from "./components/Button";
import RegisteredDevicesPanel from "./components/RegisteredDevicesPanel";
// @ts-ignore 'printRust' is declared but its value is never read.
import { printRust, sleep } from "./utils/common";
import { resizeWindowToContent } from "./utils/window";
export type RegisteredDevice = {
	id: string;
	name: string;
	batteryInfos: BatteryInfo[];
	isDisconnected: boolean;
}

/**
 * DeviceListModalのProps型
 */
type DeviceListModalProps = {
	open: boolean;
	onClose: () => void;
	devices: BleDeviceInfo[];
	onSelect: (id: string) => void;
	isLoading: boolean;
};

// モーダルコンポーネント
function DeviceListModal({ open, onClose, devices, onSelect, isLoading, error }: DeviceListModalProps & { error?: string }) {
	const [show, setShow] = useState(open);
	const [animate, setAnimate] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (open) {
			setShow(true);
			setTimeout(() => setAnimate(true), 10); // 少し遅延してアニメ開始
		} else {
			setAnimate(false);
			timeoutRef.current = setTimeout(() => setShow(false), 200); // アニメ後に非表示
		}
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [open]);

	if (!show) return null;
	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-950 bg-opacity-60 transition-opacity duration-200 ${animate ? 'opacity-100' : 'opacity-0'}`}
			onClick={onClose}
		>
			<div
				className={`bg-gray-900 rounded-lg shadow-lg p-6 min-w-[200px] relative transform transition-all duration-200 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
				onClick={e => e.stopPropagation()}
			>
				{/* 右上バツボタン */}
				<button
					className="absolute top-2 right-2 w-10 h-10 rounded-lg bg-transparent hover:bg-gray-700 flex items-center justify-center text-xl font-bold text-white focus:outline-none transition-colors duration-300"
					onClick={onClose}
					aria-label="モーダルを閉じる"
				>
					×
				</button>
				<h2 className="text-white text-lg mb-4">Select Device</h2>
				{error && <div className="mb-4 bg-red-900 text-white px-4 py-2 rounded shadow-lg">{error}</div>}
				{isLoading ? (
					<div className="flex justify-center items-center py-8">
						<div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 animate-spin"></div>
						<span className="ml-4 text-white">Fetching devices...</span>
					</div>
				) : (
					<ul className="max-h-60 overflow-y-auto">
						{devices.length === 0 && (
							<li className="text-gray-400">No devices found</li>
						)}
						{devices.map((d) => (
							<li key={d.id}>
								<Button
									className="w-full text-left rounded-none hover:bg-gray-700 text-white bg-gray-800 transition-colors duration-300"
									onClick={() => onSelect(d.id)}
									disabled={isLoading}
								>
									{d.name}
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function App() {
	// 登録済みデバイス
	const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
	// デバイス取得用
	const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
	// モーダル表示状態
	const [isModalOpen, setIsModalOpen] = useState(false);
	// isLoadingを2つに分離
	const [isDeviceLoading, setIsDeviceLoading] = useState(false);
	const [isBatteryLoading, setIsBatteryLoading] = useState(false);
	const [error, setError] = useState("");

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

	// ウィンドウサイズ変更
	useEffect(() => {
		resizeWindowToContent();
	}, [registeredDevices, isModalOpen]);

	// 一定時間ごとにバッテリー情報を更新
	useEffect(() => {
		let isUnmounted = false;

		// バッテリー情報を更新する関数
		const updateBatteryInfo = async (device: RegisteredDevice) => {
			if (isUnmounted) return;
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

		const interval = setInterval(() => {
			registeredDevices.forEach(updateBatteryInfo);
		}, 10000);

		return () => {
			isUnmounted = true;
			clearInterval(interval);
		};
	}, [registeredDevices]);

	// UI
	return (
		<div id="app" className="bg-gray-950 text-white relative min-w-[300px] p-2">
			{/* 右上+ボタン */}
			<Button
				className="absolute top-2 right-2 w-10 h-10 rounded-lg bg-transparent hover:bg-gray-700 flex items-center justify-center text-2xl shadow-lg text-white"
				onClick={handleOpenModal}
				aria-label="Add Device"
			>
				＋
			</Button>
			{/* モーダル */}
			<DeviceListModal
				open={isModalOpen}
				onClose={handleCloseModal}
				devices={devices.filter(d => !registeredDevices.some(rd => rd.id === d.id))}
				onSelect={handleAddDevice}
				isLoading={isDeviceLoading}
				error={error}
			/>
			{/* デバイス未登録時 */}
			{registeredDevices.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 space-y-6">
					<h1 className="text-2xl">No devices registered</h1>
					<Button onClick={handleOpenModal}>
						Add Device
					</Button>
				</div>
			) : (
				<main className="container mx-auto pt-10">
					<RegisteredDevicesPanel
						registeredDevices={registeredDevices}
						setRegisteredDevices={setRegisteredDevices}
					/>
				</main>
			)}
			{/* Add Deviceでデバイス選択後のローディング表示 */}
			{isBatteryLoading && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 bg-opacity-60">
					<div className="bg-gray-900 rounded-lg shadow-lg p-8 flex flex-col items-center">
						<div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-10 h-10 animate-spin mb-4"></div>
						<span className="text-white">Fetching battery info...</span>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
