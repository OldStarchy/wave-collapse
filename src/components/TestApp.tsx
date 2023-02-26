import { useEffect, useRef, useState } from 'react';
import { useResize } from '../hooks/useResize';
import { MapControls } from './MapControls';

export function TestApp() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [transform, setTransform] = useState(new DOMMatrix());

	const canvasSize = useResize(canvasRef);

	useEffect(() => {
		if (!canvasRef.current) return;
		if (!canvasSize) return;

		const { width, height } = canvasSize;

		canvasRef.current.width = width;
		canvasRef.current.height = height;
	}, [canvasRef, canvasSize]);

	useEffect(
		function render() {
			if (!canvasRef.current) return;
			const context = canvasRef.current.getContext('2d');
			if (!context) return;

			const { width, height } = canvasRef.current;

			context.clearRect(0, 0, width, height);
			context.fillStyle = 'black';
			context.fillRect(0, 0, width, height);

			context.save();
			context.setTransform(transform);

			const wCenter = transform
				.inverse()
				.transformPoint({ x: width / 2, y: height / 2 });

			context.strokeStyle = '#aaa';
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(wCenter.x, wCenter.y);
			context.stroke();

			context.strokeStyle = 'white';
			context.beginPath();
			context.arc(0, 0, 10, 0, Math.PI * 2);
			context.stroke();

			context.restore();
		},
		[canvasRef, transform, canvasSize],
	);

	return (
		<div
			style={{
				display: 'grid',
				placeContent: 'center',
				grid: '600px / 800px',
				width: '100vw',
				height: '100vh',
			}}
		>
			<MapControls
				transform={transform}
				onTransformChange={setTransform}
				style={{
					boxShadow: '0 0 10px 0 rgba(0, 0, 0)',
					backgroundColor: '#1e1e20',
					position: 'relative',
					display: 'grid',
					placeItems: 'stretch',
					grid: '1fr / 1fr',
				}}
			>
				<canvas
					onKeyDown={(e) => {
						if (e.key === 'w') {
							setTransform(transform.translate(0, -10));
						}
						if (e.key === 'a') {
							setTransform(transform.translate(-10, 0));
						}
						if (e.key === 's') {
							setTransform(transform.translate(0, 10));
						}
						if (e.key === 'd') {
							setTransform(transform.translate(10, 0));
						}
					}}
					tabIndex={0}
					style={{ minWidth: 0, minHeight: 0 }}
					ref={canvasRef}
				/>
			</MapControls>
		</div>
	);
}
