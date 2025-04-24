import React from "react";
import Button from "./Button";
import { NotificationType, type Config } from "../utils/config";

interface SettingsScreenProps {
	config: Config;
	setConfig: React.Dispatch<React.SetStateAction<Config>>;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
	config,
	setConfig,
	onSave,
	onCancel,
}) => {
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 bg-opacity-95">
			<div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md">
				<h2 className="text-white text-2xl mb-6 text-center">Settings</h2>
				<form
					className="flex flex-col gap-4"
					onSubmit={async (e) => {
						e.preventDefault();
						await onSave();
					}}
				>
					<label className="flex flex-col gap-1">
						<span>Fetch interval (ms)</span>
						<input
							type="number"
							min={1000}
							step={1000}
							value={config.fetchInterval}
							onChange={e => setConfig(c => ({ ...c, fetchInterval: Number(e.target.value) }))}
							className="bg-gray-800 text-white rounded px-2 py-1"
						/>
					</label>
					<div>
						<span className="block mb-1">Push notification on</span>
						{Object.entries(NotificationType).map(([key, value]) => (
							<label key={value as string} className="flex items-center gap-2 mb-1">
								<input
									type="checkbox"
									checked={config.pushNotificationOn.includes(value as NotificationType)}
									onChange={() => {
									setConfig(c => {
										const arr = c.pushNotificationOn.includes(value as NotificationType)
											? c.pushNotificationOn.filter(v => v !== value)
											: [...c.pushNotificationOn, value as NotificationType];
										return { ...c, pushNotificationOn: arr };
									});
								}}
								className="accent-blue-500"
								/>
								{key as string}
							</label>
						))}
					</div>
					<div className="flex gap-2 mt-6 justify-center">
						<Button type="submit">Save</Button>
						<Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SettingsScreen;