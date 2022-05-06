import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import './Resizable.scss';

function Resizable({
	className,
	children,
	direction,
	initialSize,
	minimumSize,
	maximumSize,
	canMinimize,
}: {
	className?: string;
	children: React.ReactNode;
	direction: 'left' | 'right' | 'top' | 'bottom';
	initialSize?: number;
	minimumSize?: number;
	maximumSize?: number;
	canMinimize?: boolean;
}) {
	const [isResizing, setIsResizing] = useState(false);
	const [delta, setDelta] = useState(0);
	const [size, _setSize] = useState<number>(initialSize ?? 200);
	const [minimized, setMinimized] = useState(false);

	const setSize = useCallback(
		(size: number) => {
			if (minimumSize && size < minimumSize) {
				size = minimumSize;
			} else if (maximumSize && size > maximumSize) {
				size = maximumSize;
			}
			_setSize(size);
		},
		[minimumSize, maximumSize]
	);

	const handleMouseDown = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		// e.preventDefault();
		setIsResizing(true);

		switch (direction) {
			case 'left':
				setDelta(e.clientX);
				break;
			case 'right':
				setDelta(size - e.clientX);
				break;
			case 'top':
				setDelta(e.clientY);
				break;
			case 'bottom':
				setDelta(size - e.clientY);
				break;
		}
	};

	const handleMouseUp = useCallback(() => {
		setIsResizing(false);
	}, []);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();
			const end =
				direction === 'left' || direction === 'right'
					? e.clientX
					: e.clientY;

			if (isResizing) {
				switch (direction) {
					case 'left':
					case 'top':
						setSize(size - (end - delta));
						break;
					case 'right':
					case 'bottom':
						setSize(end + delta);
						break;
				}
			}
		},
		[isResizing, delta, direction]
	);

	const handleResizeEnd = () => {
		setIsResizing(false);
	};

	const classes = classNames(
		'Resizable',
		{
			[`Resizable--${direction}`]: direction,
			[`Resizable--${isResizing ? 'resizing' : ''}`]: isResizing,
		},
		className
	);

	useEffect(() => {
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('mousemove', handleMouseMove);
		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('mousemove', handleMouseMove);
		};
	});

	return (
		<div
			className={classes}
			style={{
				...(!minimized && {
					[direction === 'left' || direction === 'right'
						? 'width'
						: 'height']: size,
				}),
			}}
		>
			{!minimized && <div className="Resizable__Content">{children}</div>}

			<div
				className="Resizable__Handle"
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onDragStart={(e) => e.preventDefault()}
				onDragEnd={handleResizeEnd}
				onSelect={(e) => e.preventDefault()}
				onDoubleClick={(e) => {
					e.preventDefault();
					if (canMinimize) {
						setMinimized(!minimized);
					}
				}}
			/>
		</div>
	);
}

export default Resizable;
