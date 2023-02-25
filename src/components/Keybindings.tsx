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

declare global {
	/**
	 * Add commands to this interface to make them available to the command palette
	 * and keybindings.
	 *
	 * eg.
	 * ```tsx
	 * declare global {
	 * 	interface ProvideCommands {
	 * 		'command.name': never, // no options
	 * 		'command.alert': { message: string }, // with options
	 * 	}
	 * }
	 * ```
	 */
	interface ProvideCommands {}
}

export interface Command<TOptions = never> {
	id: CommandName;
	title: string;
	execute: (options?: TOptions) => void;
}

type CommandOptions<T> = T extends Command<infer TOptions> ? TOptions : never;

type Commands = {
	[name in CommandName]?: Command<ProvideCommands[name]>;
};

export type CommandName = keyof ProvideCommands extends never
	? string
	: keyof ProvideCommands;

type Register = (command: Command) => void;
type Execute = <TName extends CommandName>(
	command: TName,
	options?: CommandOptions<Commands[TName]>,
) => void;

const CommandsContext = createContext<{
	commands: Commands;
	/**
	 * Registers a command. Each command should only be registered once.
	 *
	 * eg.
	 * ```tsx
	 * register({
	 * 	id: 'command.alert',
	 * 	title: 'Alert',
	 * 	execute: ({message}: {message: string}) => {
	 * 		alert(message);
	 * 	},
	 * });
	 * ```
	 */
	register: Register;
	/**
	 * Executes a command by name. If the command has options, it may be passed
	 * as the second argument.
	 *
	 * eg.
	 * ```tsx
	 * execute('command.name');
	 * execute('command.alert', { message: 'Hello world!' });
	 * ```
	 *
	 * see {@link ProvideCommands} for more information.
	 */
	execute: Execute;
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
		setCommands((prevCommands): Commands => {
			if (prevCommands[command.id] !== command)
				return {
					...prevCommands,
					[command.id]: command,
				};
			return prevCommands;
		});
	}, []);

	const execute = useCallback(
		<TName extends CommandName>(
			command: TName,
			options?: CommandOptions<Commands[TName]>,
		) => {
			const cmd = commands[command];
			if (cmd) {
				cmd.execute(options);
			}
		},
		[commands],
	);

	return (
		<CommandsContext.Provider value={{ commands, register, execute }}>
			{children}
		</CommandsContext.Provider>
	);
}

/**
 * Provides access to the commands API. This includes the {@link Register} and {@link Execute} functions as well as
 * the list of registered commands. If keybindings are required, use {@link useCommandsHelper} instead.
 */
export function useCommands() {
	return useContext(CommandsContext);
}

/**
 * Combines the {@link CommandProvider} and {@link KeybindingProvider} into a single context, and adds a `bindings` prop
 * to the {@link Register} function that can be used to register keybindings.
 */
export function useCommandsHelper() {
	const {
		register: registerCommand,
		commands,
		execute,
	} = useContext(CommandsContext);
	const { bindings, bind } = useContext(KeybindingContext);

	const register = useCallback(
		(command: { bindings?: string[] } & Command) => {
			registerCommand(command);

			command.bindings?.forEach((binding) => {
				if (isKeyChord(binding)) {
					bind(binding, command.id);
				} else {
					throw new Error(`Invalid keybinding: ${binding}`);
				}
			});
		},
		[registerCommand, bind],
	);

	const findCommand = useCallback(
		(
			command: CommandName,
		):
			| {
					id: CommandName;
					title: string;
					bindings: KeyChord[];
			  }
			| undefined => {
			const cmd = commands[command];

			if (cmd) {
				const binding = Object.entries(bindings)
					.filter(([, cmd]) => cmd === command)
					.map(([keyChord]) => keyChord as KeyChord);

				return { id: cmd.id, title: cmd.title, bindings: binding };
			}

			return undefined;
		},
		[bindings, commands],
	);

	return useMemo(
		() => ({ commands, execute, register, findCommand }),
		[commands, execute, register, findCommand],
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
		keyChord,
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
		[bindings, execute],
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
