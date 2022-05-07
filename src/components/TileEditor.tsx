import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import classNames from 'classnames';
import React, { createRef, useCallback, useEffect, useState } from 'react';
import DragContext from '../context/DragContext';
import TileType from '../model/TileType';
import Side from '../Side';
import ConnectionSelector from './ConnectionSelector';
import FontAwesomeButton from './FontAwesomeButton';
import Hidden from './Hidden';
import BufferedInput from './input/BufferedInput';
import TabbedPanel from './TabbedPanel';
import './TileEditor.scss';

function TileEditor({
	tile,
	//TODO: Move this to context
	hasOtherTiles,
	setTileProps,
	className,
}: {
	tile: Readonly<TileType> | null;
	hasOtherTiles: boolean;
	setTileProps: (
		id: TileType['id'],
		props: Partial<Omit<TileType, 'id'>>
	) => void;
	className?: string;
}) {
	const [selectedImage, setSelectedImage] = useState<number>(0);

	const [isDraggingOver, setIsDraggingOver] = useState(false);

	useEffect(() => {
		setSelectedImage(0);
	}, [tile]);

	const uploadFieldRef = createRef<HTMLInputElement>();
	const pasteZoneRef = createRef<HTMLDivElement>();

	const loadImages = useCallback(
		async function loadImages(files: Iterable<File>) {
			if (!tile) return;

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

			const images = await Promise.all(promises);

			setTileProps(tile.id, {
				images: [...tile.images, ...images],
			});
		},
		[tile, setTileProps]
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
		<div className={classNames('TileEditor', className)}>
			<div className="TileEditor__Image">
				<div className="TileEditor__ImageContainer">
					{tile.images[selectedImage] && (
						<img
							src={tile.images[selectedImage].src}
							alt={tile.name}
						/>
					)}
				</div>
			</div>
			<div className="TileEditor__Info">
				<BufferedInput
					className="TileEditor__Name"
					value={tile.name}
					validator={(value) => {
						if (value.length === 0) {
							return 'Name is required';
						}

						if (value.length > 32) {
							return 'Name is too long';
						}

						return null;
					}}
					onChange={(value) => {
						setTileProps(tile.id, { name: value });
					}}
				/>
				<textarea
					className="TileEditor__Description"
					onChange={(e) => {
						setTileProps(tile.id, { description: e.target.value });
					}}
					placeholder="Click to add a description"
					value={tile.description}
				/>
			</div>
			<TabbedPanel defaultTab="Images" className="TileEditor__Properties">
				{{
					Images: (
						<div
							className="TileImageSelector"
							key={tile.id}
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
													className={classNames(
														'TileImageSelector__Image',
														{
															'TileImageSelector__Image--selected':
																i ===
																selectedImage,
														}
													)}
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
												className={classNames(
													'TileImageSelector__DropZone',
													{
														'TileImageSelector__DropZone--isDraggingOver':
															isDraggingOver,
													}
												)}
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
						<div className="TileEditor__Connections" key={tile.id}>
							<ConnectionSelector
								label="Right"
								value={tile.connectionKeys[Side.RIGHT]}
								onChange={(value) => {
									setTileProps(tile.id, {
										connectionKeys: {
											...tile.connectionKeys,
											[Side.RIGHT]: value,
										},
									});
								}}
							/>
							<ConnectionSelector
								label="Top"
								value={tile.connectionKeys[Side.TOP]}
								onChange={(value) => {
									setTileProps(tile.id, {
										connectionKeys: {
											...tile.connectionKeys,
											[Side.TOP]: value,
										},
									});
								}}
							/>
							<ConnectionSelector
								label="Left"
								value={tile.connectionKeys[Side.LEFT]}
								onChange={(value) => {
									setTileProps(tile.id, {
										connectionKeys: {
											...tile.connectionKeys,
											[Side.LEFT]: value,
										},
									});
								}}
							/>
							<ConnectionSelector
								label="Bottom"
								value={tile.connectionKeys[Side.BOTTOM]}
								onChange={(value) => {
									setTileProps(tile.id, {
										connectionKeys: {
											...tile.connectionKeys,
											[Side.BOTTOM]: value,
										},
									});
								}}
							/>

							<span>Can Rotate</span>
							<input
								type="checkbox"
								checked={tile.canBeRotated}
								onChange={(e) => {
									setTileProps(tile.id, {
										canBeRotated: e.target.checked,
									});
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
		<div className="TileEditor TileEditor--Empty">
			{!hasOtherTiles ? (
				<>Add a new tile type on the right to begin. 😊</>
			) : (
				<>
					Now select a tile to add images and configure which
					connections it has. 😊
				</>
			)}
		</div>
	);
}

export default TileEditor;
