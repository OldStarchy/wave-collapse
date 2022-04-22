import TileState from './TileState';

export default interface Tile {
	x: number;
	y: number;

	dirty: boolean;

	superState: TileState[];
}
