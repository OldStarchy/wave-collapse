import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ConfigContext, {
	AppConfig,
	defaultConfig,
} from '../context/ConfigContext';
import DragContext from '../context/DragContext';
import useUndo from '../hooks/useUndo';
import TileType from '../model/TileType';
import Side from '../Side';
import WaveFieldResolver, { WaveField } from '../WaveField';
import './App.scss';
import EditorWindow from './EditorWindow';
import HelpContent from './HelpContent';
import { useCommandsHelper } from './Keybindings';
import MapView from './MapView';
import Resizable from './Resizable';
import TileEditor from './TileEditor';
import TileTypeList from './TileTypeList';

declare global {
	interface ProvideCommands {
		'editor.saveTileset': void;
		'editor.loadTileset': { jsonLiteral: string } | { url: string };
		'editor.playPause': void;
		'editor.step': void;
		'editor.undo': void;
		'editor.redo': void;
		'editor.clearMap': void;
		'editor.new': void;
		'editor.newTileType': void;
	}
}

function App() {
	const [tileTypes, setTileTypes] = useState<
		Record<TileType['id'], TileType>
	>({});
	const [waveField, setWaveField] = useState<WaveField>({});
	const [config, setConfig] = useState<AppConfig>(defaultConfig);

	const [selectedTileType, setSelectedTileType] = useState<
		TileType['id'] | undefined
	>(undefined);
	const selectedTile = selectedTileType ? tileTypes[selectedTileType] : null;
	const [dragCounter, setDragCounter] = useState(0);

	//TODO: do something with the progress bar at some point...
	//Maybe use it with a context provider so that any subcomponent can access it?
	// const [imageLoadProgress, setImageLoadProgress] = useState(1);
	// const loading = imageLoadProgress < 1;

	const [isPlaying, setIsPlaying] = useState(false);

	const mapHistory = useUndo(waveField, setWaveField);

	// Reset the map if the tile definitions change
	useEffect(() => {
		setWaveField({});
		setIsPlaying(false);
	}, [tileTypes]);

	// Automatically generate the map
	useEffect(() => {
		let timeout: number | undefined;

		const animate: TimerHandler = () => {
			if (isPlaying) {
				setWaveField(
					WaveFieldResolver.collapseOne(waveField, tileTypes),
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

	const clear = useCallback(() => {
		if (window.confirm('Are you sure?')) {
			setWaveField({});
			setIsPlaying(false);
		}
	}, []);

	const save = useCallback(() => {
		const data = JSON.stringify(
			Object.values(tileTypes).map(prepareTileTypeForSave),
		);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'map.json';
		link.click();
		URL.revokeObjectURL(url);
	}, [tileTypes]);

	const loadJson = useCallback(
		(json: ReturnType<typeof prepareTileTypeForSave>[]) => {
			if (Object.keys(waveField).length > 0) {
				if (
					!window.confirm(
						'Are you sure? This will clear your current map',
					)
				) {
					return;
				}
			}
			setTileTypes(
				json.reduce((types, type) => {
					const loadedType = createTileTypeFromSave(type);
					return {
						...types,
						[loadedType.id]: loadedType,
					};
				}, {} as Record<TileType['id'], TileType>),
			);
		},
		[waveField],
	);

	const loadJsonLiteral = useCallback(
		(jsonLiteral: string) => {
			const data = JSON.parse(jsonLiteral as string) as ReturnType<
				typeof prepareTileTypeForSave
			>[];

			loadJson(data);
		},
		[loadJson],
	);

	const load = useCallback(
		async (
			options: { jsonLiteral: string } | { url: string } | {} = {},
		) => {
			if ('jsonLiteral' in options) {
				loadJsonLiteral(options.jsonLiteral);
				return;
			}

			if ('url' in options) {
				const response = await fetch(options.url, {
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				});
				const data = await response.json();

				try {
					loadJson(
						data as ReturnType<typeof prepareTileTypeForSave>[],
					);
				} catch (e) {
					console.error(e);
					alert('Error loading tileset');
				}
				return;
			}

			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'application/json';
			input.onchange = (e) => {
				const file = (e.target as HTMLInputElement).files![0];
				const reader = new FileReader();
				reader.onload = (e) => {
					loadJsonLiteral(e.target!.result as string);
				};
				reader.readAsText(file);
			};
			input.click();
		},
		[loadJson, loadJsonLiteral],
	);

	const step = useCallback(() => {
		const newField = WaveFieldResolver.collapseOne(waveField, tileTypes);
		setWaveField(newField);
		setIsPlaying(false);
	}, [tileTypes, waveField]);

	const newTileType = useCallback(() => {
		if (
			Object.keys(waveField).length === 0 ||
			window.confirm('This will clear the map. Continue?')
		) {
			setTileTypes((types) => {
				let nameSuffix = Object.keys(types).length;
				let newName: string;
				do {
					newName = `tile ${nameSuffix}`;
				} while (
					Object.values(types).some(
						// eslint-disable-next-line no-loop-func
						(type) => type.name === newName,
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
	}, [waveField]);

	const { register } = useCommandsHelper();

	useEffect(() => {
		register({
			id: 'editor.new',
			title: 'New',
			execute: () => {
				//TODO: Don't use ugly window.confirm
				if (window.confirm('Are you sure?')) {
					setTileTypes({});
					setIsPlaying(false);
				}
			},
			bindings: ['ctrl+n'],
		});

		register({
			id: 'editor.clearMap',
			execute: clear,
			title: 'Clear map',
			bindings: ['ctrl+shift+delete'],
		});

		register({
			id: 'editor.saveTileset',
			execute: save,
			title: 'Save Tileset',
			bindings: ['ctrl+s'],
		});

		register({
			id: 'editor.loadTileset',
			title: 'Load Tileset',
			execute: load,
			bindings: ['ctrl+o'],
		});

		register({
			id: 'editor.undo',
			title: 'Undo',
			execute: mapHistory.undo,
			bindings: ['ctrl+z'],
		});

		register({
			id: 'editor.redo',
			title: 'Redo',
			execute: mapHistory.redo,
			bindings: ['ctrl+y', 'ctrl+shift+y'],
		});

		register({
			id: 'editor.step',
			title: 'Step',
			execute: step,
			bindings: ['ctrl+shift+p'],
		});

		register({
			id: 'editor.playPause',
			title: 'Play/Pause',
			execute: () => setIsPlaying((isPlaying) => !isPlaying),
			bindings: ['ctrl+p'],
		});

		register({
			id: 'editor.newTileType',
			title: 'Add new tile type',
			execute: newTileType,
			//TODO: think of a good keybind for this
			// Chrome doesn't allow overriding ctrl+n, ctrl+shift+n, ctrl+t, ctrl+shift+t, and probably some others
			// bindings: ['ctrl+n'],
		});
	}, [clear, save, load, mapHistory, step, newTileType, register]);

	return (
		<ConfigContext.Provider value={[config, setConfig]}>
			<DragContext.Provider value={{ isDragging: dragCounter > 0 }}>
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
					<EditorWindow
						className="App__Content"
						mainContent={
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
													tileTypes,
												);

											setWaveField(newField);
										}
									} else if (button === 1) {
										const newField =
											WaveFieldResolver.collapse(
												waveField,
												{ x, y },
												tileTypes,
											);
										setWaveField(newField);
									} else if (button === 2) {
										const newField =
											WaveFieldResolver.deleteTile(
												waveField,
												{ x, y },
											);
										setWaveField(newField);
									}
								}}
								mapHistory={mapHistory}
								//TODO: This should be done via context
								isPlaying={isPlaying}
								renderUnknownTiles={false}
							/>
						}
						leftContent={
							<Resizable
								direction="right"
								initialSize={350}
								minimumSize={200}
								canMinimize
							>
								<HelpContent />
							</Resizable>
						}
						rightContent={
							<Resizable
								direction="left"
								initialSize={350}
								minimumSize={200}
								canMinimize
							>
								<TileTypeList
									tiles={tileTypes}
									selectedTileType={selectedTileType}
									setSelectedTileType={setSelectedTileType}
								/>
							</Resizable>
						}
						footerContent={
							<Resizable
								className="EditorWindow__Footer"
								direction="top"
								initialSize={350}
								minimumSize={200}
								canMinimize
							>
								<TileEditor
									tile={selectedTile}
									setTileProps={(id, props) => {
										setTileTypes((types) => {
											const newTypes = {
												...types,
												[id]: {
													...types[id],
													...props,
												},
											};
											return newTypes;
										});
									}}
									onDeleteTileClicked={(id) => {
										if (
											window.confirm(
												'Are you sure you want to delete this tile? It will clear the current map.',
											)
										) {
											setTileTypes((types) => {
												const newTypes = {
													...types,
												};
												delete newTypes[id];
												return newTypes;
											});
										}
									}}
									hasOtherTiles={
										Object.keys(tileTypes).length > 0
									}
								/>
							</Resizable>
						}
					/>
					{/* {loading && <ProgressBar progress={imageLoadProgress} />} */}
				</div>
			</DragContext.Provider>
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
	tileType: Partial<ReturnType<typeof prepareTileTypeForSave>>,
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
