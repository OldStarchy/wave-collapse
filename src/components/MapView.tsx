import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { createRef, useCallback, useEffect, useState } from 'react';
import WaveField from '../WaveField';
import FontAwesomeButton from './FontAwesomeButton';
import './MapView.css';

const TILE_SIZE = 32;

const MAX_ZOOM = 4;
const MIN_ZOOM = 0.5;
const ZOOM_FACTOR = 0.2;

const TRANSLATE_CONTROLS = {
	up: 'w',
	left: 'a',
	down: 's',
	right: 'd',
};

interface MapViewSettings {
	drawOrigin: boolean;
	drawGrid: boolean;
}
const defaultSettings = {
	drawOrigin: true,
	drawGrid: true,
};

function randomFrom2(x: number, y: number) {
	return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
}

function MapView({
	map,
	onClickPosition,
	settings: _settings = {},
}: {
	map: WaveField;
	onClickPosition: (x: number, y: number) => void;
	settings?: Partial<MapViewSettings>;
}) {
	const settings = { ...defaultSettings, ..._settings };
	const mapView = createRef<HTMLCanvasElement>();

	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [zoom, setZoomNative] = useState(1);

	const [visualOffset, setVisualOffset] = useState({ x: 0, y: 0 });
	const [visualZoom, setVisualZoom] = useState(1);

	const [mousePosition, setMousePosition] = useState<
		| undefined
		| {
				x: number;
				y: number;
		  }
	>(undefined);

	const setZoom = useCallback(
		(zoom: number) => {
			if (zoom < MIN_ZOOM) {
				setZoomNative(MIN_ZOOM);
			} else if (zoom > MAX_ZOOM) {
				setZoomNative(MAX_ZOOM);
			} else {
				setZoomNative(zoom);
			}
		},
		[setZoomNative]
	);

	function cssVar(name: string) {
		return getComputedStyle(mapView.current!).getPropertyValue(name);
	}

	function fixCanvasSize() {
		mapView.current!.width = mapView.current!.clientWidth;
		mapView.current!.height = mapView.current!.clientHeight;
	}
	function onResize() {
		fixCanvasSize();
		draw();
	}

	useEffect(() => {
		if (!mapView.current) return;

		fixCanvasSize();
		draw();

		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
		};
	});

	//animate zoom
	useEffect(() => {
		if (
			zoom === visualZoom &&
			offset.x === visualOffset.x &&
			offset.y === visualOffset.y
		)
			return;

		const start = Date.now();
		const duration = 200;
		const startZoom = visualZoom;
		const endZoom = zoom;

		const startOffset = { x: visualOffset.x, y: visualOffset.y };
		const endOffset = { x: offset.x, y: offset.y };

		let stop = false;

		const animate = () => {
			if (stop) return;

			const now = Date.now();
			const progress = (now - start) / duration;

			if (progress > 1) {
				setVisualZoom(endZoom);
				setVisualOffset(endOffset);
				return;
			}

			const zoom = startZoom + (endZoom - startZoom) * progress;
			const offset = {
				x: startOffset.x + (endOffset.x - startOffset.x) * progress,
				y: startOffset.y + (endOffset.y - startOffset.y) * progress,
			};

			setVisualZoom(zoom);
			setVisualOffset(offset);

			requestAnimationFrame(animate);
		};

		animate();

		return () => {
			stop = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [zoom, offset]);

	const [mousePos, setMousePos] = useState<
		{ x: number; y: number } | undefined
	>(undefined);

	function draw() {
		const canvas = mapView.current!;
		const ctx = mapView.current?.getContext('2d');
		if (!ctx) return;

		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = cssVar('--color-background');
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.scale(visualZoom, visualZoom);
		ctx.translate(-visualOffset.x, -visualOffset.y);

		const inverseMatrix = ctx.getTransform().inverse();

		const topLeft = inverseMatrix.transformPoint({ x: 0, y: 0 });
		const bottomRight = inverseMatrix.transformPoint({
			x: canvas.width,
			y: canvas.height,
		});

		topLeft.x = Math.floor(topLeft.x / TILE_SIZE) * TILE_SIZE;
		topLeft.y = Math.floor(topLeft.y / TILE_SIZE) * TILE_SIZE;

		//draw grid
		if (settings.drawGrid) {
			ctx.strokeStyle = cssVar('--color-grid');
			ctx.lineWidth = 1;
			ctx.beginPath();

			for (let x = topLeft.x; x < bottomRight.x; x += TILE_SIZE) {
				ctx.moveTo(x, topLeft.y);
				ctx.lineTo(x, bottomRight.y);
			}

			for (let y = topLeft.y; y < bottomRight.y; y += TILE_SIZE) {
				ctx.moveTo(topLeft.x, y);
				ctx.lineTo(bottomRight.x, y);
			}
			ctx.stroke();
		}

		//draw origin
		if (settings.drawOrigin) {
			ctx.strokeStyle = cssVar('--color-grid');
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-TILE_SIZE / 2, 0);
			ctx.lineTo(TILE_SIZE / 2, 0);
			ctx.moveTo(0, -TILE_SIZE / 2);
			ctx.lineTo(0, TILE_SIZE / 2);
			ctx.stroke();
		}

		//draw tiles
		let renderedTiles = 0;
		const defaultSuperState = map.getDefaultSuperState();
		for (let x = topLeft.x; x < bottomRight.x; x += TILE_SIZE) {
			for (let y = topLeft.y; y < bottomRight.y; y += TILE_SIZE) {
				const superState =
					map.getTile(x / TILE_SIZE, y / TILE_SIZE)?.superState ??
					defaultSuperState;

				// map.forEach(({ superState, x, y }) => {
				// 	if (x * TILE_SIZE < topLeft.x || x * TILE_SIZE > bottomRight.x)
				// 		return;
				// 	if (y * TILE_SIZE < topLeft.y || y * TILE_SIZE > bottomRight.y)
				// 		return;

				renderedTiles++;
				superState.forEach(({ tileType, rotation }, i) => {
					//psudorandom based on x and y
					if (tileType.images.length === 0) {
						ctx.beginPath();
						ctx.arc(
							x + 0.5 * TILE_SIZE,
							y + 0.5 * TILE_SIZE,
							0.5 * 0.5 * TILE_SIZE,
							0,
							2 * Math.PI
						);
						//random color based off tile name
						ctx.fillStyle =
							'#' +
							Math.abs(stringHash(tileType.name))
								.toString(16)
								.substring(0, 6) +
							((255 / (i + 1)) | 0).toString(16);
						ctx.strokeStyle = cssVar('--color-border');
						// ctx.stroke();
						ctx.fill();
					} else {
						const imageIndex =
							(randomFrom2(x, y) * tileType.images.length) | 0;
						const image = tileType.images[imageIndex];

						ctx.save();
						ctx.translate(x, y);
						ctx.rotate(rotation);
						ctx.globalAlpha = 1 / (i + 1);
						ctx.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
						ctx.restore();
					}
				});
				// });
			}
		}
		//TODO: report renderedTiles to diagnostics
		// console.log(renderedTiles);

		//highlight tile under mouse
		if (mousePosition) {
			//TODO: Calculate mouse position on move without redrawing the whole map
			const mouse = inverseMatrix.transformPoint({
				x: mousePosition.x,
				y: mousePosition.y,
			});
			if (mousePos?.x !== mouse.x || mousePos?.y !== mouse.y) {
				setMousePos(mouse);
			}

			const tileX = Math.floor(mouse.x / TILE_SIZE);
			const tileY = Math.floor(mouse.y / TILE_SIZE);

			ctx.strokeStyle = cssVar('--color-grid');
			ctx.fillStyle = cssVar('--color-highlight-background');
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.rect(
				tileX * TILE_SIZE,
				tileY * TILE_SIZE,
				TILE_SIZE,
				TILE_SIZE
			);
			ctx.stroke();
			ctx.fill();

			// ctx.drawImage(
			// 	images['sand0'],
			// 	tileX * TILE_SIZE,
			// 	tileY * TILE_SIZE
			// );
		} else {
			setMousePos(undefined);
		}

		ctx.restore();
	}

	return (
		<div
			className="MapView"
			tabIndex={-1}
			onKeyDown={(e) => {
				switch (e.key) {
					case TRANSLATE_CONTROLS.up:
						setOffset({
							x: offset.x,
							y: offset.y - TILE_SIZE / zoom,
						});
						break;
					case TRANSLATE_CONTROLS.left:
						setOffset({
							x: offset.x - TILE_SIZE / zoom,
							y: offset.y,
						});
						break;
					case TRANSLATE_CONTROLS.down:
						setOffset({
							x: offset.x,
							y: offset.y + TILE_SIZE / zoom,
						});
						break;
					case TRANSLATE_CONTROLS.right:
						setOffset({
							x: offset.x + TILE_SIZE / zoom,
							y: offset.y,
						});
						break;
				}
			}}
		>
			<canvas
				ref={mapView}
				className="MapView__Canvas"
				onWheel={(e) => {
					//TODO: zoom centered around mouse
					setZoom(zoom * 2 ** (ZOOM_FACTOR * (-e.deltaY / 100)));
				}}
				onMouseMove={(e) => {
					setMousePosition({
						x: e.clientX,
						y: e.clientY,
					});
				}}
				onClick={(e) => {
					if (mousePos) {
						const tileX = Math.floor(mousePos.x / TILE_SIZE);
						const tileY = Math.floor(mousePos.y / TILE_SIZE);
						onClickPosition(tileX, tileY);
					}
				}}
				onMouseLeave={() => {
					setMousePosition(undefined);
				}}
			></canvas>
			<div className="MapView__Controls MapView__Controls--Top">
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('save')}
				/>
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('folder')}
				/>
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('image')}
				/>

				<div></div>

				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('trash')}
					onClick={() => {
						map.clear();
					}}
				/>

				<div></div>

				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('play')}
				/>
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('fast-forward')}
				/>
			</div>
			<div className="MapView__Controls MapView__Controls--Side">
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('plus')}
					onClick={() => {
						setZoom(zoom * 2 ** ZOOM_FACTOR);
					}}
				/>
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('minus')}
					onClick={() => {
						setZoom(zoom * 2 ** -ZOOM_FACTOR);
					}}
				/>
				<FontAwesomeButton
					className="MapView__Control"
					icon={solid('sync-alt')}
					onClick={() => {
						setZoom(1);
					}}
				/>
			</div>
		</div>
	);
}

export default MapView;

const stringHash = (s: string) => {
	for (var i = 0, h = 9; i < s.length; )
		h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
	return h ^ (h >>> 9);
};
