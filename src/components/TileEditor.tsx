import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import React, { createRef, useCallback, useEffect, useState } from 'react';
import DragContext from '../context/DragContext';
import TileType from '../model/TileType';
import Side from '../Side';
import ConnectionSelector from './ConnectionSelector';
import FontAwesomeButton from './FontAwesomeButton';
import Hidden from './Hidden';
import TabbedPanel from './TabbedPanel';
import './TileEditor.css';

function TileEditor({ tile }: { tile: TileType | undefined }) {
	const [selectedImage, setSelectedImage] = useState<number>(0);
	const [, _rerender] = useState({});
	const rerender = useCallback(() => _rerender({}), [_rerender]);

	const [isDraggingOver, setIsDraggingOver] = useState(false);

	useEffect(() => {
		setSelectedImage(0);
	}, [tile]);

	const uploadFieldRef = createRef<HTMLInputElement>();
	const pasteZoneRef = createRef<HTMLDivElement>();

	const loadImages = useCallback(
		async function loadImages(files: Iterable<File>) {
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
		},
		[tile, rerender]
	);

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

	const handlePaste = useCallback(
		(event: ClipboardEvent) => {
			if (!event.clipboardData) return;
			if (document.activeElement !== pasteZoneRef.current) return;

			event.preventDefault();
			const items = event.clipboardData.items;
			if (items) {
				const files = Array.from(items)
					.filter(
						(item) => item.kind === 'file' || item.kind === 'image'
					)
					.map((item) => item.getAsFile()!);

				if (files.length > 0) {
					loadImages(files);
				}
			}
		},
		[loadImages, pasteZoneRef]
	);

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	useEffect(() => {
		document.addEventListener('paste', handlePaste);

		return () => {
			document.removeEventListener('paste', handlePaste);
		};
	}, [handlePaste]);

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
			<TabbedPanel defaultTab="Images" className="TileEditor__Properties">
				{{
					Images: (
						<div
							className="TileImageSelector"
							key={tile.name}
							tabIndex={0}
							ref={pasteZoneRef}
						>
							<DragContext.Consumer>
								{({ isDragging }) => (
									<>
										<div
											className="TileImageSelector__Images"
											// display none instead of removing the element from dom;
											// if dragging starts from inside this element and the element then disappears,
											// we get a dragEnter event but no dragLeave event
											style={{
												display: isDragging
													? 'none'
													: undefined,
											}}
										>
											{tile.images.map((image, i) => (
												<div
													className={`TileImageSelector__Image ${
														i === selectedImage &&
														'TileImageSelector__Image--selected'
													}`}
													key={i}
													onClick={() =>
														setSelectedImage(i)
													}
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
												title="Add images"
											/>
										</div>

										{isDragging && (
											<div
												className={`TileImageSelector__DropZone ${
													isDraggingOver
														? 'TileImageSelector__DropZone--isDraggingOver'
														: ''
												}`}
												onDrop={handleDrop}
												onDragOver={handleDragOver}
												onDragEnter={() =>
													setIsDraggingOver(true)
												}
												onDragLeave={() =>
													setIsDraggingOver(false)
												}
											>
												Drop images here
											</div>
										)}
									</>
								)}
							</DragContext.Consumer>
						</div>
					),
					Connections: (
						<div
							className="TileEditor__Connections"
							key={tile.name}
						>
							<ConnectionSelector
								label="Right"
								value={tile.connectionKeys[Side.RIGHT]}
								onChange={(value) => {
									//TODO: Don't mutate props
									tile.connectionKeys[Side.RIGHT] = value;
									rerender();
								}}
							/>
							<ConnectionSelector
								label="Top"
								value={tile.connectionKeys[Side.TOP]}
								onChange={(value) => {
									//TODO: Don't mutate props
									tile.connectionKeys[Side.TOP] = value;
									rerender();
								}}
							/>
							<ConnectionSelector
								label="Left"
								value={tile.connectionKeys[Side.LEFT]}
								onChange={(value) => {
									//TODO: Don't mutate props
									tile.connectionKeys[Side.LEFT] = value;
									rerender();
								}}
							/>
							<ConnectionSelector
								label="Bottom"
								value={tile.connectionKeys[Side.BOTTOM]}
								onChange={(value) => {
									//TODO: Don't mutate props
									tile.connectionKeys[Side.BOTTOM] = value;
									rerender();
								}}
							/>

							<span>Can Rotate</span>
							<input
								type="checkbox"
								checked={tile.canBeRotated}
								onChange={(e) => {
									tile.canBeRotated = e.target.checked;
									rerender();
								}}
							/>
						</div>
					),
				}}
			</TabbedPanel>
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
