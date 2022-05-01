import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ConfigContext, {
	AppConfig,
	defaultConfig,
} from '../context/ConfigContext';
import DragContext from '../context/DragContext';
import TileType from '../model/TileType';
import Side from '../Side';
import WaveFieldResolver, { WaveField } from '../WaveField';
import './App.css';
import MapView from './MapView';
import ProgressBar from './ProgressBar';
import TileEditor from './TileEditor';
import TileTypeList from './TileTypeList';

function useUndo<TState>(state: TState, setState: (state: TState) => void) {
	const history = useRef({ history: [] as TState[], head: 0 });

	useEffect(() => {
		if (history.current.history[history.current.head] !== state) {
			history.current.history.splice(
				history.current.head + 1,
				Infinity,
				state
			);
			history.current.head = history.current.history.length - 1;
		}
	}, [state]);

	const canUndo = useCallback(() => history.current.head > 0, []);
	const canRedo = useCallback(
		() => history.current.head < history.current.history.length - 1,
		[]
	);

	const undo = useCallback(() => {
		if (history.current.head === 0) {
			return;
		}

		history.current.head--;
		setState(history.current.history[history.current.head]);
	}, [setState]);

	const redo = useCallback(() => {
		if (history.current.head === history.current.history.length - 1) {
			return;
		}

		history.current.head++;
		setState(history.current.history[history.current.head]);
	}, [setState]);

	return { canUndo, canRedo, undo, redo };
}

function App() {
	const [selectedTileType, setSelectedTileType] = useState<
		TileType['id'] | undefined
	>(undefined);

	const [config, setConfig] = useState<AppConfig>(defaultConfig);
	const [tileTypes, setTileTypes] = useState<
		Record<TileType['id'], TileType>
	>({});
	const [waveField, setWaveField] = useState<WaveField>({});

	const mapHistory = useUndo(waveField, setWaveField);

	const [dragCounter, setDragCounter] = useState(0);
	const [imageLoadProgress, setImageLoadProgress] = useState(1);

	const [isPlaying, setIsPlaying] = useState(false);

	const loading = imageLoadProgress < 1;

	const selectedTile = selectedTileType ? tileTypes[selectedTileType] : null;

	useEffect(() => {
		setIsPlaying(false);
	}, [tileTypes]);

	useEffect(() => {
		let timeout: number | undefined;

		const animate: TimerHandler = () => {
			if (isPlaying) {
				setWaveField(
					WaveFieldResolver.collapseOne(waveField, tileTypes)
				);
				timeout = setTimeout(animate, 1000 / config.autogenFps);
			}
		};

		if (isPlaying) {
			animate();
		}

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [isPlaying, config, waveField, tileTypes]);

	const save = () => {
		const data = JSON.stringify(
			Object.values(tileTypes).map(prepareTileTypeForSave)
		);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'map.json';
		link.click();
		URL.revokeObjectURL(url);
	};

	const load = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files![0];
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = JSON.parse(
					e.target!.result as string
				) as ReturnType<typeof prepareTileTypeForSave>[];
				setTileTypes(
					data.reduce((types, type) => {
						const loadedType = createTileTypeFromSave(type);
						return {
							...types,
							[loadedType.id]: loadedType,
						};
					}, {} as Record<TileType['id'], TileType>)
				);
			};
			reader.readAsText(file);
		};
		input.click();
	};

	return (
		<ConfigContext.Provider value={[config, setConfig]}>
			<div
				className="App"
				onDragEnter={(e) => {
					setDragCounter((dragCounter) => dragCounter + 1);
				}}
				onDragLeave={(e) => {
					setDragCounter((dragCounter) => dragCounter - 1);
				}}
				onDragEnd={(e) => {
					setDragCounter(0);
				}}
				onDrop={(e) => {
					setDragCounter(0);
				}}
			>
				<DragContext.Provider value={{ isDragging: dragCounter > 0 }}>
					<div
						className={
							'App__Content' +
							(config.showGui ? '' : ' App__Content--nogui')
						}
					>
						<MapView
							waveField={waveField}
							tileset={tileTypes}
							onClickPosition={(x, y, button) => {
								if (button === 0) {
									if (selectedTile) {
										const [newField] =
											WaveFieldResolver.setTileState(
												waveField,
												{ x, y },
												{
													tileType: selectedTile,
													rotation: 0,
												},
												tileTypes
											);

										setWaveField(newField);
									}
								} else if (button === 1) {
									const newField = WaveFieldResolver.collapse(
										waveField,
										{ x, y },
										tileTypes
									);
									setWaveField(newField);
								} else if (button === 2) {
									const newField =
										WaveFieldResolver.deleteTile(
											waveField,
											{ x, y }
										);
									setWaveField(newField);
								}
							}}
							mapHistory={mapHistory}
							onStepButtonClick={() => {
								const newField = WaveFieldResolver.collapseOne(
									waveField,
									tileTypes
								);
								setWaveField(newField);
								setIsPlaying(false);
							}}
							onPlayButtonClick={() => {
								setIsPlaying((isPlaying) => !isPlaying);
							}}
							onClearButtonClick={() => {
								if (window.confirm('Are you sure?')) {
									setWaveField({});
									setIsPlaying(false);
								}
							}}
							//TODO: This should be done via context
							isPlaying={isPlaying}
							onSaveButtonClick={save}
							onLoadButtonClick={load}
							onNewButtonClick={() => {
								//TODO: Don't use ugly window.confirm
								if (window.confirm('Are you sure?')) {
									setTileTypes({});
									setIsPlaying(false);
								}
							}}
							renderUnknownTiles={false}
						/>
						{config.showGui && (
							<>
								{/* TODO: make the tile editor and tile type list collapsible to make map view bigger */}
								<TileTypeList
									tiles={tileTypes}
									selectedTileType={selectedTileType}
									setSelectedTileType={setSelectedTileType}
									onAddTileButtonClick={() => {
										if (
											Object.keys(waveField).length ===
												0 ||
											window.confirm(
												'This will clear the map. Continue?'
											)
										) {
											setTileTypes((types) => {
												let nameSuffix =
													Object.keys(types).length;
												let newName: string;
												do {
													newName = `tile ${nameSuffix}`;
												} while (
													Object.values(types).some(
														// eslint-disable-next-line no-loop-func
														(type) =>
															type.name ===
															newName
													) &&
													nameSuffix++
												);

												const newType = {
													...tileTypeDefaults(),
													name: newName,
												};

												return {
													...types,
													[newType.id]: newType,
												};
											});
										}
									}}
								/>
								<TileEditor
									tile={selectedTile}
									hasOtherTiles={
										Object.keys(tileTypes).length > 0
									}
								/>
							</>
						)}
					</div>
					{loading && <ProgressBar progress={imageLoadProgress} />}
				</DragContext.Provider>
			</div>
		</ConfigContext.Provider>
	);
}

export default App;

function prepareTileTypeForSave(tileType: TileType) {
	const { images, ...rest } = tileType;
	return {
		...rest,
		images: images.map((image) => {
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(image, 0, 0);
			return canvas.toDataURL('image/png');
		}),
	};
}

const tileTypeDefaults: () => TileType = () => ({
	id: newTileTypeId(),
	name: 'unnamedTile',
	description: '',
	canBeRotated: false,
	connectionKeys: {
		[Side.TOP]: null,
		[Side.BOTTOM]: null,
		[Side.LEFT]: null,
		[Side.RIGHT]: null,
	},
	images: [],
});

function createTileTypeFromSave(
	tileType: Partial<ReturnType<typeof prepareTileTypeForSave>>
): TileType {
	const { images, ...rest } = tileType;
	return {
		...tileTypeDefaults(),

		images:
			images?.map((image) => {
				const img = new Image();
				img.src = image;
				return img;
			}) ?? [],

		...rest,
	};
}

function newTileTypeId() {
	return uuidv4();
}
