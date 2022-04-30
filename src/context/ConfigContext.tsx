import { createContext } from 'react';

export interface AppConfig {
	autogenFps: number;
	showGui: boolean;
}

export const defaultConfig: AppConfig = {
	autogenFps: 60,
	showGui: true,
};

export default createContext<[AppConfig, (config: AppConfig) => void]>([
	defaultConfig,
	() => {},
]);
