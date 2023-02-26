import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import classNames from 'classnames';
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import ConfigContext from '../context/ConfigContext';
import { useResize } from '../hooks/useResize';
import TileType from '../model/TileType';
import WaveFieldResolver, { TileSet, WaveField } from '../WaveField';
import FontAwesomeButton from './FontAwesomeButton';
import BufferedInput from './input/BufferedInput';
import { MapControls } from './MapControls';
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
	selectedTile,
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
	selectedTile: TileType | null;

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
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvasSize = useResize(canvasRef);
	const [wMousePosition, setWMousePosition] = useState<{
		x: number;
		y: number;
	}>();

	const [config, setConfig] = useContext(ConfigContext);

	const [transform, setTransform] = useState<DOMMatrix>(new DOMMatrix());

	//TODO: instead of pulling variables from css, try to inject them into css from a ThemeProvider component
	// and use a useTheme consumer hook here
	const cssVar = useCallback(
		(name: string) => {
			if (!canvasRef.current) return '';
			return getComputedStyle(canvasRef.current).getPropertyValue(name);
		},
		[canvasRef],
	);

	const fixCanvasSize = useCallback(() => {
		if (!canvasRef.current) return;

		const oldCenter = {
			x: canvasRef.current.width / 2,
			y: canvasRef.current.height / 2,
		};
		const newCenter = {
			x: canvasRef.current.clientWidth / 2,
			y: canvasRef.current.clientHeight / 2,
		};

		canvasRef.current.width = canvasRef.current.clientWidth;
		canvasRef.current.height = canvasRef.current.clientHeight;

		setTransform((transform) =>
			transform.translate(
				newCenter.x - oldCenter.x,
				newCenter.y - oldCenter.y,
			),
		);
	}, [canvasRef]);

	const draw = useCallback(() => {
		const canvas = canvasRef.current!;
		const ctx = canvasRef.current?.getContext('2d');
		if (!ctx) return;

		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = cssVar('--color-background');
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.setTransform(transform);

		const inverseMatrix = transform.inverse();

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
		if (wMousePosition) {
			const tileX = Math.floor(wMousePosition.x / TILE_SIZE);
			const tileY = Math.floor(wMousePosition.y / TILE_SIZE);

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
		}

		ctx.restore();
	}, [
		cssVar,
		canvasRef,
		wMousePosition,
		renderUnknownTiles,
		settings.drawGrid,
		settings.drawOrigin,
		tileset,
		transform,
		waveField,
	]);

	useEffect(() => {
		fixCanvasSize();
		draw();
	}, [draw, fixCanvasSize, canvasSize]);

	useEffect(() => {
		draw();
	}, [draw, transform, waveField, settings]);

	return (
		<div className={classNames('MapView', className)}>
			<MapControls
				transform={transform}
				onTransformChange={(t) => {
					if (!selectedTile) setTransform(t);
				}}
				onMouseMove={setWMousePosition}
			>
				<canvas
					ref={canvasRef}
					className="MapView__Canvas"
					tabIndex={0}
					onKeyDown={(e) => {
						switch (e.key) {
							case TRANSLATE_CONTROLS.up:
								setTransform((transform) =>
									transform.translate(
										0,
										TILE_SIZE / transform.a,
									),
								);
								break;
							case TRANSLATE_CONTROLS.left:
								setTransform((transform) =>
									transform.translate(
										TILE_SIZE / transform.a,
										0,
									),
								);
								break;
							case TRANSLATE_CONTROLS.down:
								setTransform((transform) =>
									transform.translate(
										0,
										-TILE_SIZE / transform.a,
									),
								);
								break;
							case TRANSLATE_CONTROLS.right:
								setTransform((transform) =>
									transform.translate(
										-TILE_SIZE / transform.a,
										0,
									),
								);
								break;
						}
					}}
					onAuxClick={(e) => {
						if (wMousePosition) {
							const tileX = Math.floor(
								wMousePosition.x / TILE_SIZE,
							);
							const tileY = Math.floor(
								wMousePosition.y / TILE_SIZE,
							);
							onClickPosition(tileX, tileY, e.button);
						}
					}}
					onContextMenu={(e) => {
						if (e.shiftKey) return;

						e.preventDefault();
						if (wMousePosition) {
							const tileX = Math.floor(
								wMousePosition.x / TILE_SIZE,
							);
							const tileY = Math.floor(
								wMousePosition.y / TILE_SIZE,
							);
							onClickPosition(tileX, tileY, e.button);
						}
					}}
					onClick={(e) => {
						if (wMousePosition) {
							const tileX = Math.floor(
								wMousePosition.x / TILE_SIZE,
							);
							const tileY = Math.floor(
								wMousePosition.y / TILE_SIZE,
							);
							onClickPosition(tileX, tileY, e.button);
						}
					}}
				/>
			</MapControls>
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
								const center = transform
									.inverse()
									.transformPoint({
										x: (canvasRef?.current?.width ?? 0) / 2,
										y:
											(canvasRef?.current?.height ?? 0) /
											2,
									});
								setTransform((transform) =>
									transform
										.translate(center.x, center.y)
										.scale(2 ** ZOOM_FACTOR)
										.translate(-center.x, -center.y),
								);
							}}
							disabled={transform.a >= MAX_ZOOM}
							title="Zoom in"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('minus')}
							onClick={() => {
								const center = transform
									.inverse()
									.transformPoint({
										x: (canvasRef?.current?.width ?? 0) / 2,
										y:
											(canvasRef?.current?.height ?? 0) /
											2,
									});
								setTransform((transform) =>
									transform
										.translate(center.x, center.y)
										.scale(2 ** -ZOOM_FACTOR)
										.translate(-center.x, -center.y),
								);
							}}
							disabled={transform.a <= MIN_ZOOM}
							title="Zoom out"
						/>
						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('sync-alt')}
							onClick={() => {
								setTransform((transform) =>
									transform.scale(1 / transform.a),
								);
							}}
							disabled={transform.a === 1}
							title="Reset zoom"
						/>

						<FontAwesomeButton
							className="MapView__Control"
							icon={solid('ban')}
							command="editor.deselectTileType"
							disabled={!selectedTile}
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
