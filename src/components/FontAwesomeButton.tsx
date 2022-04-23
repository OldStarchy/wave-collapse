import {
	FontAwesomeIcon,
	FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import Button from './Button';
import './FontAwesomeButton.css';

function FontAwesomeButton({
	icon,
	className,
	...buttonProps
}: {
	icon: FontAwesomeIconProps['icon'];
} & React.ComponentProps<typeof Button>) {
	className = className
		? `${className} FontAwesomeButton`
		: 'FontAwesomeButton';

	return (
		<Button className={className} {...buttonProps}>
			<FontAwesomeIcon icon={icon} />
		</Button>
	);
}

export default FontAwesomeButton;
