import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import classNames from 'classnames';
import { default as TileTypeModel } from '../model/TileType';
import FontAwesomeButton from './FontAwesomeButton';
import './TileTypeList.scss';

function TileTypeList({
	tiles,
	selectedTileType,
	setSelectedTileType,
	onAddTileButtonClick,
	className,
}: {
	tiles: Record<TileTypeModel['id'], TileTypeModel>;
	selectedTileType: string | undefined;
	setSelectedTileType: (tileType: TileTypeModel['id'] | undefined) => void;
	onAddTileButtonClick: () => void;
	className?: string;
}) {
	return (
		<div
			className={classNames('TileTypeList', className)}
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

	return (
		<div
			className={classNames('TileTypeList__Tile', {
				'TileTypeList__Tile--selected': selected,
			})}
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
