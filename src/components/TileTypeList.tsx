import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { default as TileTypeModel } from '../model/TileType';
import FontAwesomeButton from './FontAwesomeButton';
import './TileTypeList.scss';

function TileTypeList({
	tiles,
	selectedTileType,
	setSelectedTileType,
	onAddTileButtonClick,
}: {
	tiles: Record<TileTypeModel['id'], TileTypeModel>;
	selectedTileType: string | undefined;
	setSelectedTileType: (tileType: TileTypeModel['id'] | undefined) => void;
	onAddTileButtonClick: () => void;
}) {
	return (
		<div
			className="TileTypeList"
			onClick={() => {
				setSelectedTileType(undefined);
			}}
		>
			{Object.values(tiles).map((tile) => (
				<TileType
					key={tile.id}
					{...tile}
					selected={selectedTileType === tile.id}
					onClick={() => setSelectedTileType(tile.id)}
				/>
			))}

			<FontAwesomeButton
				icon={solid('plus')}
				className="TileTypeList__AddNew"
				onClick={onAddTileButtonClick}
				title="Add new tile type"
			/>
		</div>
	);
}

function TileType({
	name,
	images,
	selected,
	onClick,
}: TileTypeModel & {
	selected: boolean;
	onClick: () => void;
}) {
	const image = images[0];
	const classes = ['TileTypeList__Tile'];
	if (selected) classes.push('TileTypeList__Tile--selected');

	return (
		<div
			className={classes.join(' ')}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			<div className="TileTypeList__Image">
				<div className="TileTypeList__ImageContainer">
					{image && <img src={image.src} alt={name} />}
				</div>
			</div>
			<div className="TileTypeList__Name">{name}</div>
		</div>
	);
}

export default TileTypeList;
