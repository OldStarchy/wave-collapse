import {
	CSSProperties,
	Dispatch,
	ReactNode,
	SetStateAction,
	useState,
} from 'react';

export function MapControls({
	transform,
	onTransformChange,
	onMouseMove,
	children,
	style,
	maxZoom = 4,
	minZoom = 0.125,
	zoomExponent = 0.2,
}: {
	transform: DOMMatrix;
	onTransformChange: Dispatch<SetStateAction<DOMMatrix>>;
	onMouseMove?: (worldPosition: { x: number; y: number }) => void;
	children: ReactNode;
	style?: CSSProperties;
	maxZoom?: number;
	minZoom?: number;
	zoomExponent?: number;
}) {
	const [clientMousePosition, setClientMousePosition] = useState<{
		x: number;
		y: number;
	}>();

	return (
		<div
			onMouseMove={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const mousePosition = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				};

				setClientMousePosition(mousePosition);

				const wCurrentPosition = transform
					.inverse()
					.transformPoint(mousePosition);

				onMouseMove?.(wCurrentPosition);

				if (e.buttons === 1) {
					if (clientMousePosition) {
						const wPreviousPosition = transform
							.inverse()
							.transformPoint(clientMousePosition);

						const worldSpaceDelta = {
							x: wCurrentPosition.x - wPreviousPosition.x,
							y: wCurrentPosition.y - wPreviousPosition.y,
						};

						onTransformChange(
							transform.translate(
								worldSpaceDelta.x,
								worldSpaceDelta.y,
							),
						);
					}
				}
			}}
			onWheel={(e) => {
				const wPreviousPosition = transform
					.inverse()
					.transformPoint(clientMousePosition!);

				const currentZoom = {
					min: Math.min(transform.a, transform.d),
					max: Math.max(transform.a, transform.d),
				};

				let zoomFactor = 2 ** (zoomExponent * (-e.deltaY / 100));

				const newZoom = {
					min: currentZoom.min * zoomFactor,
					max: currentZoom.max * zoomFactor,
				};

				if (newZoom.min < minZoom) {
					zoomFactor *= minZoom / newZoom.min;
				}
				if (newZoom.max > maxZoom) {
					zoomFactor *= maxZoom / newZoom.max;
				}

				onTransformChange((transform) =>
					transform
						.translate(wPreviousPosition.x, wPreviousPosition.y)
						.scale(zoomFactor)
						.translate(-wPreviousPosition.x, -wPreviousPosition.y),
				);
			}}
			style={style}
		>
			{children}
			<div
				style={{
					position: 'absolute',
					top: 0,
					right: 0,
					background: '#222',
				}}
			>
				{clientMousePosition?.x}, {clientMousePosition?.y}
			</div>
		</div>
	);
}
