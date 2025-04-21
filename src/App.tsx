import "./App.css";
import { listBatteryDevices, getBatteryInfo, BleDeviceInfo, BatteryInfo } from "./ble";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import RegisteredDevicesPanel from "./RegisteredDevicesPanel";

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
	const [registeredDevices, setRegisteredDevices] = useState<string[]>([]);
	// デバイス取得用
	const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
	// バッテリー情報: { [deviceId]: BatteryInfo[] }
	const [batteryInfos, setBatteryInfos] = useState<Record<string, BatteryInfo[]>>({});
	// モーダル表示状態
	const [isModalOpen, setIsModalOpen] = useState(false);
	// ローディング・エラー
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// デバイス一覧取得
	async function fetchDevices() {
		setIsLoading(true);
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
					setIsLoading(false);
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
			if (!finished) setIsLoading(false);
		}
	}

	// バッテリー情報取得
	async function fetchAndSetBatteryInfo(id: string) {
		setIsLoading(true);
		setError("");
		try {
			const info = await getBatteryInfo(id);
			setBatteryInfos((prev) => ({ ...prev, [id]: Array.isArray(info) ? info : [info] }));
		} catch (e: any) {
			setError(e.toString());
		} finally {
			setIsLoading(false);
		}
	}

	// デバイス追加
	const handleAddDevice = async (id: string) => {
		if (!registeredDevices.includes(id)) {
			setRegisteredDevices((prev) => [...prev, id]);
			await fetchAndSetBatteryInfo(id);
		}
		setIsModalOpen(false);
	};

	// デバイス削除
	const handleRemoveDevice = (id: string) => {
		setRegisteredDevices((prev) => prev.filter((d) => d !== id));
		setBatteryInfos((prev) => {
			const newInfo = { ...prev };
			delete newInfo[id];
			return newInfo;
		});
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

	// 初回は何もしない

	// UI
	return (
		<div className="min-h-screen bg-gray-950 text-white relative">
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
				devices={devices.filter(d => !registeredDevices.includes(d.id))}
				onSelect={handleAddDevice}
				isLoading={isLoading}
				error={error}
			/>
			{/* デバイス未登録時 */}
			{registeredDevices.length === 0 ? (
				<div className="flex flex-col items-center justify-center min-h-screen space-y-8">
					<h1 className="text-2xl">No devices registered</h1>
					<Button onClick={handleOpenModal}>
						Add Device
					</Button>
				</div>
			) : (
				<main className="container mx-auto pt-10">
					<RegisteredDevicesPanel
						registeredDevices={registeredDevices}
						devices={devices}
						batteryInfos={batteryInfos}
						setRegisteredDevices={setRegisteredDevices}
						handleRemoveDevice={handleRemoveDevice}
					/>
				</main>
			)}
		</div>
	);
}

export default App;
