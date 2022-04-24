import TileState from './TileState';

export default interface Tile {
	x: number;
	y: number;

	/*
		TODO: this should be inverted such that, if any tile changes, all other tiles should be marked as dirty... maybe
		But its kinda complicated, at the moment tiles only affect adjacent tiles, but later they will affect any tile, all of which will
		need to be updated.
	*/
	/**
	 * If this tile is dirty, it's state has changed but that change hasn't been propagated out to other tiles.
	 */
	dirty: boolean;

	superState: TileState[];
}
