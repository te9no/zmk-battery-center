import React, { useState } from "react";
import BatteryIcon from "@/components/BatteryIcon";
import type { RegisteredDevice } from "@/App";
import { Button } from "@/components/Button";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

interface DeviceListProps {
	registeredDevices: RegisteredDevice[];
	setRegisteredDevices: React.Dispatch<React.SetStateAction<RegisteredDevice[]>>;
}

const RegisteredDevicesPanel: React.FC<DeviceListProps> = ({
	registeredDevices,
	setRegisteredDevices,
}) => {
	const [menuOpen, setMenuOpen] = useState<string | null>(null);
	const handleMenuOpen = (id: string) => setMenuOpen(id);
	const handleMenuClose = () => setMenuOpen(null);

	return (
		<div className="max-w-3xl mx-auto rounded-xl shadow-md overflow-hidden">
			<div className="p-4 pt-2">
				<div className="space-y-4">
					{registeredDevices.map((device, deviceIdx) => (
						<div key={device.id} className="relative group bg-gray-800 rounded-lg p-4">
							{/* メニュー（右上） */}
							<div className="absolute top-2 right-2 z-10">
								<Button
									className="w-10 h-8 text-gray-400 group-hover:opacity-100 opacity-0 bg-transparent hover:bg-gray-700 hover:text-white !p-0"
									onClick={() => handleMenuOpen(device.id)}
									aria-label="Open menu"
								>
									<EllipsisHorizontalIcon className="size-6 mx-auto" />
								</Button>
								{menuOpen === device.id && (
									<div className={`absolute right-0 w-24 bg-gray-900 text-sm border border-gray-700 rounded-lg shadow-lg z-20`}>
										{ deviceIdx !== 0 && (
											<Button
												className="w-full text-left rounded-none !text-sm !px-2 !py-1 bg-gray-900 hover:bg-gray-800 rounded-t-lg"
												onClick={() => {
													if (deviceIdx > 0) {
														setRegisteredDevices(prev => {
															const arr = [...prev];
															[arr[deviceIdx-1], arr[deviceIdx]] = [arr[deviceIdx], arr[deviceIdx-1]];
															return arr;
														});
													}
													handleMenuClose();
												}}
											>
												Move Up
											</Button>
										)}
										{ deviceIdx !== registeredDevices.length - 1 && (
											<Button
												className="w-full text-left rounded-none !text-sm !px-2 !py-1 bg-gray-900 hover:bg-gray-800"
												onClick={() => {
													if (deviceIdx < registeredDevices.length - 1) {
														setRegisteredDevices(prev => {
															const arr = [...prev];
															[arr[deviceIdx+1], arr[deviceIdx]] = [arr[deviceIdx], arr[deviceIdx+1]];
															return arr;
														});
													}
													handleMenuClose();
												}}
											>
												Move Down
											</Button>
										)}
										<Button
											className="w-full text-left rounded-none !text-sm !px-2 !py-1 bg-gray-900 !text-red-500 hover:bg-gray-800 rounded-b-lg"
											onClick={() => { setRegisteredDevices(prev => prev.filter(d => d.id !== device.id)); handleMenuClose(); }}
										>
											Remove
										</Button>
									</div>
								)}
							</div>
							{/* メニュー外クリックで閉じる */}
							{menuOpen === device.id && (
								<div className="fixed inset-0 z-0" onClick={handleMenuClose}></div>
							)}

							{/* デバイス名＋disconnected? */}
							<div className="flex items-center gap-2 mb-2">
								<span className={`text-lg font-semibold truncate ${device.isDisconnected ? 'max-w-[150px]' : 'max-w-[200px]'}`}>{device.name}</span>
								{device.isDisconnected && (
									<span className="text-xs text-red-400">disconnected</span>
								)}
							</div>

							{/* バッテリー情報リスト */}
							{device.batteryInfos.length === 0 ? (
								<div className="text-gray-400 mx-auto">No battery information</div>
							) : (
								<div className="space-y-1 ml-7">
									{device.batteryInfos.map((b, propIdx) => (
										<div key={propIdx} className="flex items-center gap-4">
											<span className="min-w-[90px] text-gray-300">{b.user_descriptor ?? "Central"}</span>
											<BatteryIcon percentage={b.battery_level ?? 0} />
											<span className="w-[35px] min-w-[35px] text-right text-sm">{b.battery_level !== null ? `${b.battery_level}%` : "N/A"}</span>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default RegisteredDevicesPanel;