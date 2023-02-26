import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import CommandProvider, {
	Command,
	KeybindingProvider,
	useCommandsHelper,
} from './components/Keybindings';
import { TestApp } from './components/TestApp';
import './index.scss';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement,
);

declare global {
	interface ProvideCommands {
		'root.toggleTestMode': never;
	}
}

function AppRoot() {
	const { register } = useCommandsHelper();
	const [isTestMode, setIsTestMode] = useState(false);

	const toggleTestModeCommand = useMemo(
		(): Command & { bindings: string[] } => ({
			id: 'root.toggleTestMode',
			title: 'Toggle Test Mode',
			//ctrl+shift+t is not allowed in browsers so an alternate must be used
			bindings: ['alt+shift+t'],
			execute: () => {
				if (
					isTestMode ||
					window.confirm(
						'Entering test mode will clear all data. Continue?',
					)
				) {
					setIsTestMode(!isTestMode);
				}
			},
		}),
		[isTestMode],
	);

	useEffect(() => {
		register(toggleTestModeCommand);
	}, [register, toggleTestModeCommand]);

	if (isTestMode) {
		return <TestApp />;
	} else {
		return <App />;
	}
}

root.render(
	<React.StrictMode>
		<CommandProvider>
			<KeybindingProvider>
				<AppRoot />
			</KeybindingProvider>
		</CommandProvider>
	</React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
