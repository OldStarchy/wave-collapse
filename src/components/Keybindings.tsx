import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

//TODO: Make this whole file heaps neater
//TODO: Add chorded keybindings (eg. `ctrl+k, ctrl+d`)
//TODO: add context keys to commands, eg. `editorHasFocus` or `!mapIsEmpty`
// This can be used to automatically disable buttons when certain conditions are not met
//TODO: add command parameters (like clickMap(x, y) or loadFile(file))

declare global {
	interface ProvideCommands {}
}

interface Command {
	id: CommandName;
	title: string;
	execute: () => void;
}
type Commands = { [name in CommandName]?: Command };

export type CommandName = keyof ProvideCommands extends never
	? string
	: keyof ProvideCommands;

const CommandsContext = createContext<{
	commands: Commands;
	register: (command: Command) => void;
	execute: (command: CommandName) => void;
}>({
	commands: {},
	register: () => {},
	execute: () => {},
});

export const CommandConsumer = CommandsContext.Consumer;

export default function CommandProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [commands, setCommands] = useState<Commands>({});

	const register = useCallback((command: Command) => {
		setCommands(
			(prevCommands): Commands => ({
				...prevCommands,
				[command.id]: command,
			})
		);
	}, []);

	const execute = useCallback(
		(command: CommandName) => {
			const cmd = commands[command];
			if (cmd) {
				cmd.execute();
			}
		},
		[commands]
	);

	return (
		<CommandsContext.Provider value={{ commands, register, execute }}>
			{children}
		</CommandsContext.Provider>
	);
}

export function useCommands() {
	return useContext(CommandsContext);
}

export function useCommandsHelper() {
	const commandContext = useContext(CommandsContext);
	const { bindings, bind } = useContext(KeybindingContext);

	const register = useCallback(
		(command: { bindings?: string[] } & Command) => {
			commandContext.register(command);

			command.bindings?.forEach((binding) => {
				if (isKeyChord(binding)) {
					bind(binding, command.id);
				} else {
					throw new Error(`Invalid keybinding: ${binding}`);
				}
			});
		},
		[commandContext, bind]
	);

	const findCommand = useCallback(
		(
			command: CommandName
		):
			| {
					id: CommandName;
					title: string;
					bindings: KeyChord[];
			  }
			| undefined => {
			const cmd = commandContext.commands[command];

			if (cmd) {
				const binding = Object.entries(bindings)
					.filter(([, cmd]) => cmd === command)
					.map(([keyChord]) => keyChord as KeyChord);

				return { id: cmd.id, title: cmd.title, bindings: binding };
			}

			return undefined;
		},
		[bindings, commandContext]
	);

	return useMemo(
		() => ({ ...commandContext, register, findCommand }),
		[commandContext, register, findCommand]
	);
}

interface Bindings {
	[keyChord: KeyChord]: CommandName;
}

type KeyChord = string & { __isKeyChord: true };

function normalizeModifier(modifier: string) {
	switch (modifier) {
		case 'control':
			return 'ctrl';
		case 'cmd':
			return 'meta';
		case 'opt':
			return 'alt';
		default:
			return modifier;
	}
}

function normalizeKeyChord(keyChord: KeyChord): KeyChord {
	return keyChord
		.split(',')
		.map((binding) => {
			const [key, ...modifiers] = binding
				.split('+')
				.map((s) => s.trim())
				.reverse();

			modifiers.sort();

			return [...modifiers.map(normalizeModifier), key].join('+');
		})
		.join(', ')
		.toLowerCase() as KeyChord;
}

function isKeyChord(keyChord: string): keyChord is KeyChord {
	return /^(?:(?:(?:cmd|opt|ctrl|alt|shift|meta)\+)*[a-z]+)(?:\s*,\s*(?:(?:cmd|opt|ctrl|alt|shift|meta)\+)*[a-z]+)*$/.test(
		keyChord
	);
}

export function getChordFromEvent(event: KeyboardEvent): KeyChord {
	const modifiers = {
		meta: event.metaKey,
		ctrl: event.ctrlKey,
		alt: event.altKey,
		shift: event.shiftKey,
	};

	const modifiersString = Object.entries(modifiers)
		.filter(([, value]) => value)
		.map(([key]) => key)
		.sort();

	return [...modifiersString, event.key.toLowerCase()].join('+') as KeyChord;
}

const KeybindingContext = createContext<{
	bindings: Bindings;
	bind: (keyChord: string, command: CommandName) => void;
	unbind: (keyChord: string) => void;
}>({
	bindings: {},
	bind: () => {},
	unbind: () => {},
});

export const KeybindingConsumer = KeybindingContext.Consumer;

export function KeybindingProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [bindings, setBindings] = useState<Bindings>({});

	const { execute } = useCommands();

	const bind = useCallback((keyChord: string, command: CommandName) => {
		if (isKeyChord(keyChord)) {
			keyChord = normalizeKeyChord(keyChord);

			setBindings((prevBindings) => ({
				...prevBindings,
				[keyChord]: command,
			}));
		} else {
			throw new Error(`Invalid key chord: ${keyChord}`);
		}
	}, []);

	const unbind = useCallback((keyChord: string) => {
		if (isKeyChord(keyChord)) {
			setBindings((prevBindings) => {
				const bindings = { ...prevBindings };
				delete bindings[keyChord];
				return bindings;
			});
		} else {
			throw new Error(`Invalid key chord: ${keyChord}`);
		}
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const keyChord = getChordFromEvent(event);

			console.log(keyChord);
			const command = bindings[keyChord];

			if (command) {
				event.preventDefault();
				execute(command);
			}
		},
		[bindings, execute]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	return (
		<KeybindingContext.Provider value={{ bindings, bind, unbind }}>
			{children}
		</KeybindingContext.Provider>
	);
}

export function useKeybinds() {
	return useContext(KeybindingContext);
}
