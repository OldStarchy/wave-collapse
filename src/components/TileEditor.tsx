import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createRef, useEffect, useState } from 'react';
import TileType from '../model/TileType';
import Button from './Button';
import Hidden from './Hidden';
import './TileEditor.css';

function TileEditor({ tile }: { tile: TileType | undefined }) {
	const [selectedImage, setSelectedImage] = useState<number>(0);
	const [, _rerender] = useState({});
	const rerender = () => _rerender({});

	useEffect(() => {
		setSelectedImage(0);
	}, [tile]);

	const uploadFieldRef = createRef<HTMLInputElement>();

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			const promises = Array.from(files).map((file) => {
				return new Promise<HTMLImageElement>((resolve, reject) => {
					if (file.type.startsWith('image/')) {
						const image = new Image();
						image.src = URL.createObjectURL(file);
						image.onload = () => {
							resolve(image);
						};
						image.onerror = () => {
							reject(file);
						};
					} else {
						reject(file);
					}
				});
			});
			Promise.all(promises).then((images) => {
				tile?.images.push(...images);
				rerender();
			});
		}
	};

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

				<Button
					className="TileImageSelector__AddNew"
					onClick={() => {
						uploadFieldRef.current!.click();
					}}
				>
					<FontAwesomeIcon icon={solid('plus')} />
				</Button>
			</div>
			<Hidden>
				<input
					ref={uploadFieldRef}
					type="file"
					accept="image/*"
					multiple
					onChange={handleImageChange}
				/>
			</Hidden>
		</div>
	) : (
		<div className="TileEditor TileEditor--Empty">Hi 😊</div>
	);
}

export default TileEditor;
