import { ButtonHTMLAttributes } from 'react';
import './Button.css';

function Button({
	text,
	onClick,
	disabled,
	className,
	children,
	title,
	...props
}: {
	text?: string;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
	title: string | undefined;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={`Button ${className || ''}`}
			onClick={onClick}
			disabled={disabled}
			title={title}
		>
			{text || children}
		</button>
	);
}

export default Button;
