import { useEffect, useMemo, useState } from 'react';
import DragContext from '../context/DragContext';
import TileType from '../model/TileType';
import Side from '../Side';
import WaveField from '../WaveField';
import './App.css';
import MapView from './MapView';
import ProgressBar from './ProgressBar';
import TileEditor from './TileEditor';
import TileTypeList from './TileTypeList';

function App() {
	const [selectedTileType, setSelectedTileType] = useState<
		string | undefined
	>(undefined);

	const [tileTypes, setTileTypes] = useState<TileType[]>([]);
	const map = useMemo(() => new WaveField(new Set(tileTypes)), [tileTypes]);

	const [dragCounter, setDragCounter] = useState(0);
	const [imageLoadProgress, setImageLoadProgress] = useState(0);

	const [isPlaying, setIsPlaying] = useState(false);

	const loading = imageLoadProgress < 1;

	const selectedTile = Array.from(tileTypes).find(
		(t) => t.name === selectedTileType
	);

	useEffect(() => {
		setIsPlaying(false);
	}, [map]);

	useEffect(() => {
		let timeout: number | undefined;

		const animate: TimerHandler = () => {
			if (isPlaying) {
				map.step();
				timeout = setTimeout(animate, 1000 / 10);
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
	}, [isPlaying, map]);

	return (
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
				<div className="App__Content">
					<MapView
						map={map}
						onClickPosition={(x, y, button) => {
							if (button === 0) {
								if (selectedTile) {
									map.setTileState(x, y, {
										tileType: selectedTile,
										rotation: 0,
									});
								}
							} else if (button === 1) {
								map.collapse(x, y);
							} else if (button === 2) {
								map.clearTile(x, y);
							}
						}}
						onStepButtonClick={() => {
							map.step();
							setIsPlaying(false);
						}}
						onPlayButtonClick={() => {
							setIsPlaying((isPlaying) => !isPlaying);
						}}
						onClearButtonClick={() => {
							map.clear();
							setIsPlaying(false);
						}}
						//TODO: This should be done via context
						isPlaying={isPlaying}
					/>
					<TileTypeList
						tiles={new Set(tileTypes)}
						selectedTileType={selectedTileType}
						setSelectedTileType={setSelectedTileType}
						onAddTileButtonClick={() => {
							setTileTypes((types) => [
								...types,
								{
									name: `tile${types.length}`,
									images: [],
									canBeRotated: false,
									connectionKeys: {
										[Side.TOP]: 'grass',
										[Side.BOTTOM]: 'grass',
										[Side.LEFT]: 'grass',
										[Side.RIGHT]: 'grass',
									},
								},
							]);
						}}
					/>
					<TileEditor tile={selectedTile} />
				</div>
				{loading && <ProgressBar progress={imageLoadProgress} />}
			</DragContext.Provider>
		</div>
	);
}

export default App;
