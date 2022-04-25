import Side from '../Side';

export default interface TileType {
	id: string;
	name: string;
	description: string;
	images: HTMLImageElement[];
	canBeRotated: boolean;

	connectionKeys: {
		[side in typeof Side.sides[number]]: string | null;
	};
}
