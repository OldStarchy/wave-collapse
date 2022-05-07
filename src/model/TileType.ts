import Side from '../Side';

export default interface TileType {
	id: string;
	name: string;
	description: string;
	//TODO: this probably shouldn't be a rich object (aka should not be HTMLImageElement)
	images: HTMLImageElement[];
	canBeRotated: boolean;

	connectionKeys: {
		[side in typeof Side.sides[number]]: string | null;
	};
}
