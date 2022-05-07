import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import './Resizable.scss';

//TODO: min size and max size are arbitrary
// min size should _probably_ be based on the size of the content
// and max size should be based on the available size of the parent (maybe useContext?)
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isResizing, delta, direction]
		//this works only because `size` is not a dependency, delta gets updated when you first click so the value of size is captured then
		// if the value of size were to update in this fuction, it would drift
	);

	const handleResizeEnd = () => {
		setIsResizing(false);
	};

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
			className={classNames(
				'Resizable',
				{
					[`Resizable--${direction}`]: direction,
					'Resizable--resizing': isResizing,
				},
				className
			)}
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
