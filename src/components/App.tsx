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

	const tileTypes = useMemo(() => new Set<TileType>(), []);
	const map = useMemo(() => new WaveField(tileTypes), []);

	const [dragCounter, setDragCounter] = useState(0);
	const [imageLoadProgress, setImageLoadProgress] = useState(0);

	useEffect(() => {
		if (tileTypes.size === 0) {
			['sand', 'grass'].forEach((name) => {
				tileTypes.add({
					name,
					images: [],
					canBeRotated: false,
					connectionKeys: {
						[Side.TOP]: name,
						[Side.BOTTOM]: name,
						[Side.LEFT]: name,
						[Side.RIGHT]: name,
					},
				});
			});

			setImageLoadProgress(1);
		}
	}, []);

	const loading = imageLoadProgress < 1;

	const selectedTile = Array.from(tileTypes).find(
		(t) => t.name === selectedTileType
	);

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
				<MapView
					map={map}
					onClickPosition={(x, y) => {
						if (selectedTile) {
							map.setTileState(x, y, {
								tileType: selectedTile,
								rotation: 0,
							});
						}
					}}
				/>
				<TileTypeList
					tiles={tileTypes}
					selectedTileType={selectedTileType}
					setSelectedTileType={setSelectedTileType}
				/>
				<TileEditor tile={selectedTile} />
				{loading && <ProgressBar progress={imageLoadProgress} />}
			</DragContext.Provider>
		</div>
	);
}

export default App;
