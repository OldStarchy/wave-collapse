import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { createRef, useEffect, useState } from 'react';
import DragContext from '../context/DragContext';
import TileType from '../model/TileType';
import FontAwesomeButton from './FontAwesomeButton';
import Hidden from './Hidden';
import './TileEditor.css';

function TileEditor({ tile }: { tile: TileType | undefined }) {
	const [selectedImage, setSelectedImage] = useState<number>(0);
	const [, _rerender] = useState({});
	const rerender = () => _rerender({});

	const [isDraggingOver, setIsDraggingOver] = useState(false);

	useEffect(() => {
		setSelectedImage(0);
	}, [tile]);

	const uploadFieldRef = createRef<HTMLInputElement>();

	async function loadImages(files: FileList) {
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

		//TODO: don't mutate props
		const images = await Promise.all(promises);

		tile?.images.push(...images);
		rerender();
	}

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			loadImages(files);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const files = event.dataTransfer.files;
		if (files) {
			loadImages(files);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
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
			<DragContext.Consumer>
				{({ isDragging }) => (
					<div className="TileImageSelector">
						{isDragging ? (
							<div
								className={`TileImageSelector__DropZone ${
									isDraggingOver
										? 'TileImageSelector__DropZone--isDraggingOver'
										: ''
								}`}
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onDragEnter={() => setIsDraggingOver(true)}
								onDragLeave={() => setIsDraggingOver(false)}
							>
								Drop images here
							</div>
						) : (
							<div className="TileImageSelector__Images">
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
											<img
												src={image.src}
												alt={tile.name}
											/>
										</div>
									</div>
								))}

								<FontAwesomeButton
									className="TileImageSelector__AddNew"
									icon={solid('plus')}
									onClick={() => {
										uploadFieldRef.current!.click();
									}}
								/>
							</div>
						)}
					</div>
				)}
			</DragContext.Consumer>
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
