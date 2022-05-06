import classNames from 'classnames';
import React, { cloneElement } from 'react';
import './Typography.scss';

function Typography({
	children,
	className,
}: React.PropsWithChildren<{
	className?: string;
}>) {
	return (
		<div className={classNames(className, 'Typography')}>{children}</div>
	);
}

export function Accordion({
	children,
	className,
	heading,
}: React.PropsWithChildren<{
	className?: string;
	heading: React.ReactElement<React.HTMLAttributes<HTMLHeadingElement>>;
}>) {
	const [collapsed, setCollapsed] = React.useState(true);

	const toggle = () => {
		setCollapsed(!collapsed);
	};

	return (
		<section className={classNames(className, 'Accordion')}>
			{cloneElement(heading, {
				onClick: toggle,
			})}
			<div
				className={classNames(
					'Accordion__content',
					collapsed ? 'Accordion__content--collapsed' : ''
				)}
			>
				{children}
			</div>
		</section>
	);
}

export function Image({
	float,
	style,
	alt,
	...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
	float?: 'left' | 'right';
}) {
	const computedStyle = React.useMemo(() => {
		const _style = {
			...style,
		};

		if (float) {
			_style.float = float;
			if (float === 'left') {
				_style.marginRight = '1rem';
			} else {
				_style.marginLeft = '1rem';
			}
		}
		return _style;
	}, [style, float]);

	return <img style={computedStyle} alt={alt} {...props} />;
}

export default Typography;
