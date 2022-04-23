import Side from '../Side';

export default interface TileType {
	name: string;
	images: HTMLImageElement[];
	canBeRotated: boolean;

	connectionKeys: {
		[side in typeof Side.sides[number]]: string | null;
	};
}
