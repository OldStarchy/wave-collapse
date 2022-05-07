import {
	FontAwesomeIcon,
	FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Button from './Button';
import './FontAwesomeButton.scss';

function FontAwesomeButton({
	icon,
	className,
	...buttonProps
}: {
	icon: FontAwesomeIconProps['icon'];
} & React.ComponentProps<typeof Button>) {
	return (
		<Button
			className={classNames('FontAwesomeButton', className)}
			{...buttonProps}
		>
			<FontAwesomeIcon icon={icon} />
		</Button>
	);
}

export default FontAwesomeButton;
