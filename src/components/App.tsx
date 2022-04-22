import { useEffect, useMemo, useState } from 'react';
import TileType from '../model/TileType';
import Side from '../Side';
import grass0 from '../tiles/grass0.png';
import grass1 from '../tiles/grass1.png';
import grass2 from '../tiles/grass2.png';
import sand0 from '../tiles/sand0.png';
import sand1 from '../tiles/sand1.png';
import sand2 from '../tiles/sand2.png';
import sand3 from '../tiles/sand3.png';
import sand4 from '../tiles/sand4.png';
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

	const [imageLoadProgress, setImageLoadProgress] = useState(0);

	useEffect(() => {
		const loadImages = async () => {
			const images = [
				{ name: 'sand', src: sand0 },
				{ name: 'sand', src: sand1 },
				{ name: 'sand', src: sand2 },
				{ name: 'sand', src: sand3 },
				{ name: 'sand', src: sand4 },
				{ name: 'grass', src: grass0 },
				{ name: 'grass', src: grass1 },
				{ name: 'grass', src: grass2 },
			];
			let progress = 0;
			const promises = images.map(({ name, src }) => {
				return new Promise<{ name: string; image: HTMLImageElement }>(
					(s) => {
						const image = new Image();
						image.src = src;
						image.onload = () => {
							progress += 1;
							setImageLoadProgress(progress / images.length);
							s({ name, image });
						};
					}
				);
			});
			const loadedImages = await Promise.all(promises);

			['sand', 'grass'].forEach((name) => {
				tileTypes.add({
					name,
					images: loadedImages
						.filter((i) => i.name === name)
						.map((i) => i.image),
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
		};
		loadImages();
	}, []);

	const loading = imageLoadProgress < 1;

	const selectedTile = Array.from(tileTypes).find(
		(t) => t.name === selectedTileType
	);
	return (
		<div className="App">
			<MapView
				map={map}
				tileTypes={tileTypes}
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
		</div>
	);
}

export default App;
