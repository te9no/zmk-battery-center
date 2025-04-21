import React, { useState } from "react";
import BatteryIcon from "./BatteryIcon";
import { BleDeviceInfo, BatteryInfo } from "./ble";

interface DeviceListProps {
	registeredDevices: string[];
	devices: BleDeviceInfo[];
	batteryInfos: Record<string, BatteryInfo[]>;
	setRegisteredDevices: React.Dispatch<React.SetStateAction<string[]>>;
	handleRemoveDevice: (id: string) => void;
	disconnected: Record<string, boolean>;
}

const RegisteredDevicesPanel: React.FC<DeviceListProps> = ({
	registeredDevices,
	devices,
	batteryInfos,
	setRegisteredDevices,
	handleRemoveDevice,
	disconnected,
}) => {
	const [menuOpen, setMenuOpen] = useState<string | null>(null);
	const handleMenuOpen = (id: string) => setMenuOpen(id);
	const handleMenuClose = () => setMenuOpen(null);

	return (
		<div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{registeredDevices.map((id, idx) => {
				const info = batteryInfos[id] || [];
				return (
					<div key={id} className="group rounded-lg shadow-lg p-4 flex flex-col gap-2 relative">
						{/* ・・・ボタンとメニュー */}
						<div className="absolute top-2 right-2">
							<button
								className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 group-hover:opacity-100 opacity-0 hover:bg-gray-800 hover:text-white text-2xl focus:outline-none transition-colors duration-200"
								onClick={() => handleMenuOpen(id)}
								aria-label="Open menu"
							>
								{/* 横並び三点リーダー */}
								<span className="flex flex-row items-center justify-center gap-0.5">
									<span className="w-1 h-1 bg-current rounded-full"></span>
									<span className="w-1 h-1 bg-current rounded-full"></span>
									<span className="w-1 h-1 bg-current rounded-full"></span>
								</span>
							</button>
							{/* メニュー */}
							{menuOpen === id && (
								<div className="absolute right-0 mt-2 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
									<button
										className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-t-lg"
										onClick={() => { if (idx > 0) { setRegisteredDevices(prev => { const arr = [...prev]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return arr; }); } handleMenuClose(); }}
										disabled={idx === 0}
										style={{ opacity: idx === 0 ? 0.5 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
									>
										Move Up
									</button>
									<button
										className="w-full text-left px-4 py-2 hover:bg-gray-800"
										onClick={() => { if (idx < registeredDevices.length - 1) { setRegisteredDevices(prev => { const arr = [...prev]; [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]]; return arr; }); } handleMenuClose(); }}
										disabled={idx === registeredDevices.length - 1}
										style={{ opacity: idx === registeredDevices.length - 1 ? 0.5 : 1, cursor: idx === registeredDevices.length - 1 ? 'not-allowed' : 'pointer' }}
									>
										Move Down
									</button>
									<button
										className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-800 rounded-b-lg"
										onClick={() => { handleRemoveDevice(id); handleMenuClose(); }}
									>
										Delete
									</button>
								</div>
							)}
						</div>
						{/* メニュー外クリックで閉じる */}
						{menuOpen === id && (
							<div className="fixed inset-0 z-0" onClick={handleMenuClose}></div>
						)}
						{/* デバイス情報 */}
						<div className="flex flex-row justify-center px-4 py-2 gap-2">
							<div className="flex flex-col items-start min-w-[60px] w-[60px]">
								<span className="text-base font-semibold">{devices.find(d => d.id === id)?.name}</span>
								{disconnected[id] && (
									<span className="text-xs text-red-400 mt-1">disconnected</span>
								)}
							</div>
							<div className="flex flex-col gap-1 flex-1">
								{info.length === 0 ? (
									<div className="text-gray-400">No battery information</div>
								) : (
									info.map((b, idx) => (
										<div key={idx} className="flex flex-col gap-0.5 justify-center items-start">
											<div className="flex gap-1 items-center">
												<span className="text-sm text-gray-300 w-20 min-w-[80px]">{b.user_descriptor ?? "Central"}</span>
												<BatteryIcon percentage={b.battery_level ?? 0} size={22} />
												<span className="w-[35px] min-w-[35px] text-right text-sm">{b.battery_level !== null ? `${b.battery_level}%` : "N/A"}</span>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default RegisteredDevicesPanel;