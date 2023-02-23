import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import classNames from 'classnames';
import {
	createRef,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import ConfigContext from '../context/ConfigContext';
import { useResize } from '../hooks/useResize';
import WaveFieldResolver, { TileSet, WaveField } from '../WaveField';
import FontAwesomeButton from './FontAwesomeButton';
import BufferedInput from './input/BufferedInput';
import './MapView.scss';

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
	className,
	waveField,
	onClickPosition,
	settings: _settings,
	isPlaying,
	renderUnknownTiles,
	mapHistory,
	tileset,
}: {
	className?: string;
	waveField: WaveField;
	onClickPosition: (
		x: number,
		y: number,
		which: MouseEvent['button'],
	) => void;
	settings?: Partial<MapViewSettings>;
	tileset: TileSet;

	isPlaying: boolean;
	renderUnknownTiles: boolean;

	mapHistory: {
		canUndo: () => boolean;
		canRedo: () => boolean;
		undo: () => void;
		redo: () => void;
	};
}) {
	const settings = useMemo(
		() => ({ ...defaultSettings, ...(_settings ?? {}) }),
		[_settings],
	);
	const mapView = createRef<HTMLCanvasElement>();

	const [config, setConfig] = useContext(ConfigContext);

	const [viewportTransform, setViewportTransform] = useState<DOMMatrix>(
		new DOMMatrix(),
	);

	const [visualViewportTransform, setVisualViewportTransform] =
		useState<DOMMatrix>(new DOMMatrix());

	const [mousePositionTransformed, setMousePositionTransformed] = useState<
		{ x: number; y: number } | undefined
	>(undefined);

	const [dragStart, setDragStart] = useState<
		| undefined
		| {
				x: number;
				y: number;
		  }
	>(undefined);

	//TODO: instead of pulling variables from css, try to inject them into css from a ThemeProvider component
	// and use a useTheme consumer hook here
	const cssVar = useCallback(
		(name: string) => {
			return getComputedStyle(mapView.current!).getPropertyValue(name);
		},
		[mapView],
	);

	const fixCanvasSize = useCallback(() => {
		if (!mapView.current) return;

		const oldCenter = {
			x: mapView.current.width / 2,
			y: mapView.current.height / 2,
		};
		const newCenter = {
			x: mapView.current.clientWidth / 2,
			y: mapView.current.clientHeight / 2,
		};

		mapView.current.width = mapView.current.clientWidth;
		mapView.current.height = mapView.current.clientHeight;

		setViewportTransform(
			viewportTransform.translate(
				newCenter.x - oldCenter.x,
				newCenter.y - oldCenter.y,
			),
		);
		setVisualViewportTransform(
			visualViewportTransform.translate(
				newCenter.x - oldCenter.x,
				newCenter.y - oldCenter.y,
			),
		);
	}, [mapView, viewportTransform, visualViewportTransform]);

	const draw = useCallback(() => {
		const canvas = mapView.current!;
		const ctx = mapView.current?.getContext('2d');
		if (!ctx) return;

		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = cssVar('--color-background');
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();

		ctx.transform(
			visualViewportTransform.a,
			visualViewportTransform.b,
			visualViewportTransform.c,
			visualViewportTransform.d,
			visualViewportTransform.e,
			visualViewportTransform.f,
		);

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
		// let renderedTiles = 0;
		const defaultSuperState =
			WaveFieldResolver.getDefaultTileSuperState(tileset);
		for (let x = topLeft.x; x < bottomRight.x; x += TILE_SIZE) {
			for (let y = topLeft.y; y < bottomRight.y; y += TILE_SIZE) {
				const superState =
					WaveFieldResolver.getTile(waveField, {
						x: x / TILE_SIZE,
						y: y / TILE_SIZE,
					})?.superState ??
					(renderUnknownTiles ? defaultSuperState : null);
				if (superState === null) continue;

				// map.forEach(({ superState, x, y }) => {
				// 	if (x * TILE_SIZE < topLeft.x || x * TILE_SIZE > bottomRight.x)
				// 		return;
				// 	if (y * TILE_SIZE < topLeft.y || y * TILE_SIZE > bottomRight.y)
				// 		return;

				// renderedTiles++;
				superState.forEach(({ tileType, rotation }, i) => {
					//psudorandom based on x and y
					if (tileType.images.length === 0) {
						ctx.beginPath();
						ctx.arc(
							x + 0.5 * TILE_SIZE,
							y + 0.5 * TILE_SIZE,
							0.5 * 0.5 * TILE_SIZE,
							0,
							2 * Math.PI,
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
						ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
						ctx.rotate(-(rotation * Math.PI) / 2);
						ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
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
		if (mousePositionTransformed) {
			//TODO: Track mouse position outside of the draw loop
			// (but also keep track of the(inverse) transform so we know where it is on the map too)

			const tileX = Math.floor(mousePositionTransformed.x / TILE_SIZE);
			const tileY = Math.floor(mousePositionTransformed.y / TILE_SIZE);

			ctx.strokeStyle = cssVar('--color-grid');
			ctx.fillStyle = cssVar('--color-highlight-background');
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.rect(
				tileX * TILE_SIZE,
				tileY * TILE_SIZE,
				TILE_SIZE,
				TILE_SIZE,
			);
			ctx.stroke();
			ctx.fill();
		} else {
			setMousePositionTransformed(undefined);
		}

		ctx.restore();
	}, [
		cssVar,
		mapView,
		mousePositionTransformed,
		renderUnknownTiles,
		settings.drawGrid,
		settings.drawOrigin,
		tileset,
		visualViewportTransform.a,
		visualViewportTransform.b,
		visualViewportTransform.c,
		visualViewportTransform.d,
		visualViewportTransform.e,
		visualViewportTransform.f,
		waveField,
	]);

	const onResize = useCallback(() => {
		fixCanvasSize();
		draw();
	}, [draw, fixCanvasSize]);

	useResize(mapView, onResize);

	//animate zoom
	useEffect(() => {
		if (
			visualViewportTransform.a === viewportTransform.a &&
			visualViewportTransform.b === viewportTransform.b &&
			visualViewportTransform.c === viewportTransform.c &&
			visualViewportTransform.d === viewportTransform.d &&
			visualViewportTransform.e === viewportTransform.e &&
			visualViewportTransform.f === viewportTransform.f
		) {
			return;
		}

		const start = Date.now();
		const duration = 200;
		const startTransform = visualViewportTransform;
		const endTransform = viewportTransform;

		let stop = false;

		const animate = () => {
			if (stop) return;

			const now = Date.now();
			const progress = (now - start) / duration;

			if (progress > 1) {
				setVisualViewportTransform(endTransform);
				return;
			}

			const interpolatedTransform = new DOMMatrix([
				startTransform.a +
					(endTransform.a - startTransform.a) * progress,
				startTransform.b +
					(endTransform.b - startTransform.b) * progress,
				startTransform.c +
					(endTransform.c - startTransform.c) * progress,
				startTransform.d +
					(endTransform.d - startTransform.d) * progress,
				startTransform.e +
					(endTransform.e - startTransform.e) * progress,
				startTransform.f +
					(endTransform.f - startTransform.f) * progress,
			]);

			setVisualViewportTransform(interpolatedTransform);

			requestAnimationFrame(animate);
		};

		animate();

		return () => {
			stop = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewportTransform]);

	useEffect(() => {
		draw();
	}, [draw, viewportTransform, waveField, settings]);

	return (
		<div
			className={classNames('MapView', className)}
			tabIndex={-1}
			onKeyDown={(e) => {
				switch (e.key) {
					case TRANSLATE_CONTROLS.up:
						setViewportTransform(
							viewportTransform.translate(
								0,
								TILE_SIZE / viewportTransform.a,
							),
						);
						break;
					case TRANSLATE_CONTROLS.left:
						setViewportTransform(
							viewportTransform.translate(
								TILE_SIZE / viewportTransform.a,
								0,
							),
						);
						break;
					case TRANSLATE_CONTROLS.down:
						setViewportTransform(
							viewportTransform.translate(
								0,
								-TILE_SIZE / viewportTransform.a,
							),
						);
						break;
					case TRANSLATE_CONTROLS.right:
						setViewportTransform(
							viewportTransform.translate(
								-TILE_SIZE / viewportTransform.a,
								0,
							),
						);
						break;
				}
			}}
		>
			<canvas
				ref={mapView}
				className="MapView__Canvas"
				onWheel={(e) => {
					const realMouse = {
						x: e.nativeEvent.offsetX,
						y: e.nativeEvent.offsetY,
					};

					const mouse = viewportTransform
						.inverse()
						.transformPoint(realMouse);

					const currentZoom = viewportTransform.a;
					let scale = 2 ** (ZOOM_FACTOR * (-e.deltaY / 100));
					const newZoom = currentZoom * scale;

					if (newZoom < MIN_ZOOM) {
						scale *= MIN_ZOOM / newZoom;
					} else if (newZoom > MAX_ZOOM) {
						scale *= MAX_ZOOM / newZoom;
					}

					const newTransform = viewportTransform
						.translate(mouse.x, mouse.y)
						.scale(scale)
						.translate(-mouse.x, -mouse.y);

					setViewportTransform(newTransform);
				}}
				onMouseDown={(e) => {
					setDragStart(mousePositionTransformed);
				}}
				onMouseMove={(e) => {
					const mousePos = {
						x: e.nativeEvent.offsetX,
						y: e.nativeEvent.offsetY,
					};
					const mousePosTransformed = viewportTransform
						.inverse()
						.transformPoint(mousePos);

					setMousePositionTransformed(mousePosTransformed);

					if (dragStart) {
						const newTransform = viewportTransform.translate(
							mousePosTransformed.x - dragStart.x,
							mousePosTransformed.y - dragStart.y,
						);
						setViewportTransform(newTransform);
						setVisualViewportTransform(newTransform);
					}
				}}
				onMouseUp={(e) => {
					setDragStart(undefined);
				}}
				onAuxClick={(e) => {
					if (mousePositionTransformed) {
						const tileX = Math.floor(
							mousePositionTransformed.x / TILE_SIZE,
						);
						const tileY = Math.floor(
							mousePositionTransformed.y / TILE_SIZE,
						);
						onClickPosition(tileX, tileY, e.button);
					}
				}}
				onContextMenu={(e) => {
					if (e.shiftKey) return;

					e.preventDefault();
					if (mousePositionTransformed) {
						const tileX = Math.floor(
							mousePositionTransformed.x / TILE_SIZE,
						);
						const tileY = Math.floor(
							mousePositionTransformed.y / TILE_SIZE,
						);
						onClickPosition(tileX, tileY, e.button);
					}
				}}
				onClick={(e) => {
					if (mousePositionTransformed) {
						const tileX = Math.floor(
							mousePositionTransformed.x / TILE_SIZE,
						);
						const tileY = Math.floor(
							mousePositionTransformed.y / TILE_SIZE,
						);
						onClickPosition(tileX, tileY, e.button);
					}
				}}
				onMouseLeave={() => {
					setDragStart(undefined);
				}}
			></canvas>
			<div className="MapView__Controls MapView__Controls--Bottom">
				{config.showGui && (
					<>
						Autogen FPS:
						<BufferedInput
							validator={(autogenFps) => {
								if (!/^\d+$/.test(autogenFps)) {
									return 'Must be a number';
								}

								const n = parseInt(autogenFps);
								if (n < 1) {
									return 'Must be greater than 0';
								}

								if (n > 1000) {
									return 'Max 1000';
								}

								return null;
							}}
							onChange={(autogenFps) => {
								setConfig({
									...config,
									autogenFps: Number.parseInt(autogenFps),
								});
							}}
							value={config.autogenFps.toString()}
							placeholder="Autogen FPS"
						/>
					</>
				)}
				<FontAwesomeButton
					className="MapView__Control"
					icon={config.showGui ? solid('eye') : solid('eye-slash')}
					onClick={() => {
						setConfig({
							...config,
							showGui: !config.showGui,
						});
					}}
					title={config.showGui ? 'Hide GUI' : 'Show GUI'}
				/>
			</div>

			{config.showGui && (
				<>
					<div className="MapView__Controls MapView__Controls--Top">
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('file')}
							command="editor.new"
						/>
						<div></div>

						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('save')}
							command="editor.saveTileset"
							disabled={Object.keys(tileset).length === 0}
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('folder')}
							command="editor.loadTileset"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('image')}
							title="Export map (not yet implemented)"
							disabled
						/>

						<div></div>

						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('undo')}
							command="editor.undo"
							title="Undo"
							disabled={!mapHistory.canUndo()}
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('redo')}
							command="editor.redo"
							title="Redo"
							disabled={!mapHistory.canRedo()}
						/>

						<div></div>

						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('trash')}
							command="editor.clearMap"
							title="Clear map"
							disabled={Object.keys(waveField).length === 0}
						/>

						<div></div>

						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('forward-step')}
							command="editor.step"
							disabled={Object.keys(tileset).length === 0}
							title="Step"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={isPlaying ? solid('pause') : solid('play')}
							command="editor.playPause"
							disabled={Object.keys(tileset).length === 0}
							title={isPlaying ? 'Pause' : 'Play'}
						/>
					</div>
					<div className="MapView__Controls MapView__Controls--Side">
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('plus')}
							onClick={() => {
								const center = viewportTransform
									.inverse()
									.transformPoint({
										x: (mapView?.current?.width ?? 0) / 2,
										y: (mapView?.current?.height ?? 0) / 2,
									});
								setViewportTransform(
									viewportTransform
										.translate(center.x, center.y)
										.scale(2 ** ZOOM_FACTOR)
										.translate(-center.x, -center.y),
								);
							}}
							disabled={viewportTransform.a >= MAX_ZOOM}
							title="Zoom in"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('minus')}
							onClick={() => {
								const center = viewportTransform
									.inverse()
									.transformPoint({
										x: (mapView?.current?.width ?? 0) / 2,
										y: (mapView?.current?.height ?? 0) / 2,
									});
								setViewportTransform(
									viewportTransform
										.translate(center.x, center.y)
										.scale(2 ** -ZOOM_FACTOR)
										.translate(-center.x, -center.y),
								);
							}}
							disabled={viewportTransform.a <= MIN_ZOOM}
							title="Zoom out"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('sync-alt')}
							onClick={() => {
								setViewportTransform(
									viewportTransform.scale(
										1 / viewportTransform.a,
									),
								);
							}}
							disabled={viewportTransform.a === 1}
							title="Reset zoom"
						/>
					</div>
				</>
			)}
		</div>
	);
}

export default MapView;

const stringHash = (s: string) => {
	for (var i = 0, h = 9; i < s.length; )
		h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
	return h ^ (h >>> 9);
};
