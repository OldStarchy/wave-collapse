import classNames from 'classnames';
import { ButtonHTMLAttributes } from 'react';
import './Button.scss';
import { CommandName, useCommandsHelper } from './Keybindings';

type ButtonProps = {
	text?: string;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
} & (
	| ({
			onClick?: () => void;
			title: string | undefined;
			destructive?: boolean;
	  } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'title'>)
	| ({
			destructive?: boolean;
			command: CommandName;
	  } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'title'>)
);

function Button({
	text,
	disabled,
	className,
	children,
	destructive,
	...props
}: ButtonProps) {
	const { execute, findCommand } = useCommandsHelper();

	let onClick = 'onClick' in props ? props.onClick : undefined;
	let title = 'title' in props ? props.title : undefined;

	if ('command' in props) {
		const command = props.command;

		onClick = () => {
			execute(command);
		};

		const commandInfo = findCommand(command);

		if (commandInfo) {
			const keybinding = commandInfo?.bindings[0];

			title = [commandInfo.title, keybinding && `(${keybinding})`]
				.filter((w) => w)
				.join(' ');
		}
	}

	return (
		<button
			{...props}
			className={classNames(
				'Button',
				{
					'Button--destructive': destructive,
				},
				className
			)}
			onClick={onClick}
			disabled={disabled}
			title={title}
		>
			{text || children}
		</button>
	);
}

export default Button;
