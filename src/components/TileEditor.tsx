import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import TileType from '../model/TileType';
import Button from './Button';
import './TileEditor.css';

function TileEditor({ tile }: { tile: TileType | undefined }) {
	const [selectedImage, setSelectedImage] = useState<number>(0);

	useEffect(() => {
		setSelectedImage(0);
	}, [tile]);

	return tile ? (
		<div className="TileEditor">
			<div className="TileEditor__Image">
				<div className="TileEditor__ImageContainer">
					{tile && tile.images[selectedImage] && (
						<img
							src={tile.images[selectedImage].src}
							alt={tile.name}
						/>
					)}
				</div>
			</div>
			<div className="TileEditor__Name">{tile && tile.name}</div>
			<div className="TileImageSelector">
				{tile.images.map((image, i) => (
					<div
						className={`TileImageSelector__Image ${
							i === selectedImage &&
							'TileImageSelector__Image--selected'
						}`}
						key={i}
						onClick={() => setSelectedImage(i)}
					>
						<div className="TileImageSelector__ImageContainer">
							<img src={image.src} alt={tile.name} />
						</div>
					</div>
				))}

				<Button className="TileImageSelector__AddNew">
					<FontAwesomeIcon icon={solid('plus')} />
				</Button>
			</div>
		</div>
	) : (
		<div className="TileEditor TileEditor--Empty">Hi 😊</div>
	);
}

export default TileEditor;
