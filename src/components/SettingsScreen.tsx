import React from "react";
import Button from "./Button";
import { NotificationType, type Config } from "../utils/config";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

interface SettingsScreenProps {
	config: Config;
	setConfig: React.Dispatch<React.SetStateAction<Config>>;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

// DropdownMenuの簡易実装（重複を避けるため、ここにも記述）
const DropdownMenu: React.FC<{ trigger: React.ReactNode, children: React.ReactNode, align?: string }> = ({ trigger, children }) => {
	const [open, setOpen] = React.useState(false);
	return (
		<div className="relative inline-block text-left">
			<div onClick={() => setOpen(v => !v)}>{trigger}</div>
			{open && (
				<div className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-popover border border-border shadow-lg z-50">
					{React.Children.map(children, child =>
						React.isValidElement(child)
							? React.cloneElement(child as React.ReactElement<any>, { onClick: (...args: any[]) => { child.props.onClick?.(...args); setOpen(false); } })
							: child
					)}
				</div>
			)}
		</div>
	);
};

const DropdownMenuItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = "", ...props }) => (
	<button
		className={`w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors ${className}`}
		{...props}
	>
		{children}
	</button>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({
	config,
	setConfig,
	onSave,
	onCancel,
}) => {
	const { setTheme } = useTheme();
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95">
			<div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md">
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-2xl text-center text-foreground">Settings</h2>
					<DropdownMenu
						trigger={
							<Button className="relative w-10 h-10 flex items-center justify-center bg-muted text-foreground">
								<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
								<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
								<span className="sr-only">Toggle theme</span>
							</Button>
						}
					>
						<DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
					</DropdownMenu>
				</div>
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
							className="bg-input text-foreground rounded px-2 py-1"
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
								className="accent-primary"
								/>
								{key as string}
							</label>
						))}
					</div>
					<div className="flex gap-2 mt-6 justify-center">
						<Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
						<Button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SettingsScreen;