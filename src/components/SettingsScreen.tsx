import React from "react";
import Button from "./Button";
import { NotificationType, type Config } from "../utils/config";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SettingsScreenProps {
	config: Config;
	setConfig: React.Dispatch<React.SetStateAction<Config>>;
	onExit: () => Promise<void>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
	config,
	setConfig,
	onExit
}) => {
	const { setTheme, theme } = useTheme();

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95">
			{/* 右上閉じるボタン */}
			<Button
				type="button"
				className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-transparent hover:bg-muted flex items-center justify-center text-xl font-bold text-foreground !p-0"
				aria-label="Close"
				onClick={onExit}
			>
				<XMarkIcon className="size-5 text-foreground" />
			</Button>
			<div className="bg-card rounded-lg shadow-lg p-8 w-full h-full">
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-2xl text-center text-foreground">Settings</h2>
				</div>
				<div
					className="flex flex-col gap-2"
				>
					{/* テーマ */}
					<div className="flex items-center">
						<span className="w-48 text-left">Theme</span>
						<div className="flex-1 flex gap-2">
							{[
								{ key: "light", icon: <Sun className="w-5 h-5" />, label: "Light" },
								{ key: "dark", icon: <Moon className="w-5 h-5" />, label: "Dark" },
								{ key: "system", icon: (
									<span className="relative w-5 h-5 flex items-center justify-center">
										<Sun className="absolute w-4 h-4 left-[-5px] top-[-5px]" />
										<Moon className="absolute w-4 h-4 right-[-5px] bottom-[-5px]" />
										<svg className="absolute left-0 top-0 w-6 h-6 pointer-events-none" width="24" height="24">
											<line x1="0" y1="18" x2="18" y2="0" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
										</svg>
									</span>
								), label: "System" },
							].map(opt => (
								<Button
									key={opt.key}
									onClick={() => setTheme(opt.key as Theme)}
									className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors
										${theme === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}
									`}
									aria-label={opt.label}
								>
									{opt.icon}
								</Button>
							))}
						</div>
					</div>
					{/* 自動起動設定 */}
					<div className="flex items-center gap-4">
						<span className="w-48 text-left">Auto start</span>
						<div className="flex-1">
							<Switch
								checked={config.autoStart}
								onCheckedChange={checked => setConfig(c => ({ ...c, autoStart: checked }))}
							/>
						</div>
					</div>
					{/* バッテリー取得間隔 */}
					<div className="flex items-center gap-4">
						<span className="w-48 text-left">Battery fetch interval</span>
						<div className="flex-1">
							{(() => {
								const options = [
									{ label: '10 sec', value: 10_000 },
									{ label: '30 sec', value: 30_000 },
									{ label: '1 min', value: 60_000 },
									{ label: '3 min', value: 180_000 },
									{ label: '5 min', value: 300_000 },
									{ label: '10 min', value: 600_000 },
									{ label: '20 min', value: 1_200_000 },
									{ label: '30 min', value: 1_800_000 },
								];
								return (
									<Select value={config.fetchInterval.toString()} onValueChange={value => setConfig(c => ({ ...c, fetchInterval: Number(value) }))}>
										<SelectTrigger size="sm">
											<SelectValue placeholder="Select" />
										</SelectTrigger>
										<SelectContent>
											{options.map(opt => (
												<SelectItem key={opt.value} value={opt.value.toString()}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								);
							})()}
						</div>
					</div>
					{/* プッシュ通知設定 */}
					<div className="flex items-center gap-4">
						<span className="w-48 text-left">Push notifications</span>
						<div className="flex-1">
							<Switch
								checked={config.pushNotification}
								onCheckedChange={checked => setConfig(c => ({ ...c, pushNotification: checked }))}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-2 items-start">
						<ul className={`list-disc gap-2 ml-2 ${!config.pushNotification ? ' text-muted-foreground' : 'text-card-foreground'}`}>
							<li className="flex gap-2">
								<span className="mr-1 font-bold">•</span>
								<span className="min-w-50">when battery level ≤ 20%</span>
								<Switch
									checked={config.pushNotificationOn[NotificationType.LowBattery]}
									onCheckedChange={checked => setConfig(c => ({
										...c,
										pushNotificationOn: { ...c.pushNotificationOn, [NotificationType.LowBattery]: checked }
									}))}
									disabled={!config.pushNotification}
								/>
							</li>
							<li className="flex gap-2">
								<span className="mr-1 font-bold">•</span>
								<span className="min-w-50">on device connect</span>
								<Switch
									checked={config.pushNotificationOn[NotificationType.Connected]}
									onCheckedChange={checked => setConfig(c => ({
										...c,
										pushNotificationOn: { ...c.pushNotificationOn, [NotificationType.Connected]: checked }
									}))}
									disabled={!config.pushNotification}
								/>
							</li>
							<li className="flex gap-2">
								<span className="mr-1 font-bold">•</span>
								<span className="min-w-50">on device disconnect</span>
								<Switch
									checked={config.pushNotificationOn[NotificationType.Disconnected]}
									onCheckedChange={checked => setConfig(c => ({
										...c,
										pushNotificationOn: { ...c.pushNotificationOn, [NotificationType.Disconnected]: checked }
									}))}
									disabled={!config.pushNotification}
								/>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsScreen;