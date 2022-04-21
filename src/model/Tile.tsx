export interface Tile {
	x: number;
	y: number;

	optionWeights: {
		[type: string]: number;
	};
}
