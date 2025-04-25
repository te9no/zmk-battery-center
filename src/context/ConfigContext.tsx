import { createContext, useContext, Dispatch, SetStateAction, ReactNode, useState, useEffect } from 'react';
import { defaultConfig, getConfig, setConfig as storeSetConfig, type Config } from '../utils/config';

// Configとsetterをまとめて提供するContextの型定義
type ConfigContextType = {
	config: Config;
	setConfig: Dispatch<SetStateAction<Config>>;
};

// Contextの生成
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Providerコンポーネント
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const [config, setConfig] = useState<Config>(defaultConfig);
	const [isLoaded, setIsLoaded] = useState(false);

	// 初期設定をロード
	useEffect(() => {
		let isMounted = true;
		(async () => {
			const loaded = await getConfig();
			if (isMounted) {
				setConfig(loaded);
				setIsLoaded(true);
			}
		})();
		return () => { isMounted = false; };
	}, []);

	// 設定を永続化
	useEffect(() => {
		if (isLoaded) {
			(async () => {
				await storeSetConfig(config);
			})();
		}
	}, [config, isLoaded]);

	return (
		<ConfigContext.Provider value={{ config, setConfig }}>
			{children}
		</ConfigContext.Provider>
	);
};

// Contextを使うためのカスタムフック
export function useConfigContext(): ConfigContextType {
	const context = useContext(ConfigContext);
	if (!context) {
		throw new Error('useConfigContext must be used within a ConfigProvider');
	}
	return context;
}