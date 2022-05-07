import classNames from 'classnames';
import { ButtonHTMLAttributes } from 'react';
import './Button.scss';

function Button({
	text,
	onClick,
	disabled,
	className,
	children,
	title,
	destructive,
	...props
}: {
	text?: string;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
	title: string | undefined;
	destructive?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
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
