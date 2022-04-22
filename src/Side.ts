enum Side {
	RIGHT = 0,
	TOP = 1,
	LEFT = 2,
	BOTTOM = 3,
}

namespace Side {
	export const sides = [
		Side.RIGHT,
		Side.TOP,
		Side.LEFT,
		Side.BOTTOM,
	] as const;

	export function rotate(side: Side, rotation: number): Side {
		return (((side + rotation) % 4) + 4) % 4;
	}

	export const offset = [
		{ x: 1, y: 0 }, // right
		{ x: 0, y: -1 }, // top
		{ x: -1, y: 0 }, // left
		{ x: 0, y: 1 }, // bottom
	] as const;

	export function getOppositeSide(side: Side): Side {
		return (side + 2) % 4;
	}
}

export default Side;
