import './Button.css';

function Button({
	text,
	onClick,
	disabled,
	className,
	children,
	...props
}: {
	text?: string;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<button
			{...props}
			className={`Button ${className || ''}`}
			onClick={onClick}
			disabled={disabled}
		>
			{text || children}
		</button>
	);
}

export default Button;
