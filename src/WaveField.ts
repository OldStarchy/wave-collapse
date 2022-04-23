import Tile from './model/Tile';
import TileState from './model/TileState';
import TileType from './model/TileType';
import Side from './Side';

/**
 * A wave field on a 2D grid.
 */
class WaveField {
	protected readonly tileset: Readonly<Set<TileType>>;

	protected field: Map<`${number}-${number}`, Tile>;

	public constructor(tileset: Set<TileType>) {
		this.tileset = tileset;
		this.field = new Map();
	}

	public forEach(callback: (tile: Tile) => void): void {
		this.field.forEach(callback);
	}

	protected *getDefaultTileState() {
		const types = this.tileset.values();

		let result = types.next();
		while (!result.done) {
			yield { tileType: result.value, rotation: 0 };
			if (result.value.canBeRotated) {
				yield { tileType: result.value, rotation: 1 };
				yield { tileType: result.value, rotation: 2 };
				yield { tileType: result.value, rotation: 3 };
			}
			result = types.next();
		}
	}

	public getDefaultSuperState() {
		return Array.from(this.getDefaultTileState());
	}

	public clear() {
		this.field.clear();
	}

	public getTile(x: number, y: number): Tile | undefined {
		const key = `${x}-${y}` as const;

		return this.field.get(key);
	}

	public getOrMakeTile(x: number, y: number): Tile {
		const key = `${x}-${y}` as const;

		let tile = this.field.get(key);

		if (tile === undefined) {
			tile = {
				superState: Array.from(this.getDefaultTileState()),
				x,
				y,
				dirty: false,
			};

			this.field.set(key, tile);
		}

		return tile;
	}

	public setTileState(x: number, y: number, tileState: TileState): void {
		const tile = this.getOrMakeTile(x, y);

		tile.superState = [tileState];

		this.propagateState(tile);
	}

	public collapse(x: number, y: number): TileState | null {
		const tile = this.getOrMakeTile(x, y);

		if (tile.superState.length === 0) {
			return null;
		}

		const weightedStates: [TileState, number][] = [];
		let totalWeight = 0;

		for (const state of tile.superState) {
			const weight = this.computeWeight(x, y, state);
			totalWeight += weight;
			weightedStates.push([state, weight]);
		}

		let random = Math.random() * totalWeight;

		for (const [state, weight] of weightedStates) {
			if (random < weight) {
				return state;
			}

			random -= weight;
		}

		return null;
	}

	protected computeWeight(x: number, y: number, state: TileState): number {
		// Maybe some smarts can go in here later.
		return 1;
	}

	protected propagateState(tile: Tile, ignoreSide?: Side): void {
		const openCoords = new Set<`${number}-${number}`>();
		const openTiles: { tile: Tile; ignoreSide?: Side }[] = [];

		function pushTile(tile: Tile, ignoreSide?: Side) {
			const key = `${tile.x}-${tile.y}` as const;

			if (openCoords.has(key)) {
				return;
			}

			openCoords.add(key);
			openTiles.push({ tile, ignoreSide });
		}

		function shiftTile() {
			const tile = openTiles.shift()!;
			openCoords.delete(`${tile.tile.x}-${tile.tile.y}`);
			return tile;
		}

		pushTile(tile, ignoreSide);
		let counter = 0;

		while (openTiles.length > 0) {
			const { tile, ignoreSide } = shiftTile();

			if (counter > 100) {
				tile.dirty = true;
				continue;
			}

			counter++;

			if (tile.superState.length === 0) {
				continue;
			}

			const modifiedTiles = new Map<Side, Tile>();

			// For each global direction
			for (const globalDirection of Side.sides) {
				if (ignoreSide && globalDirection === ignoreSide) {
					continue;
				}

				const allowedConnectionKeys = new Set<string>();

				for (const state of tile.superState) {
					// Find the counter-rotated connetion side (eg. a tile rotated once, the global "top" will be its local "right")
					const localSide = Side.rotate(
						globalDirection,
						-state.rotation
					);

					const connectionKey =
						state.tileType.connectionKeys[localSide];
					allowedConnectionKeys.add(connectionKey);
				}

				const offset = Side.offset[globalDirection];

				const connectedTile = this.getOrMakeTile(
					tile.x + offset.x,
					tile.y + offset.y
				);
				const backDirection = Side.getOppositeSide(globalDirection);

				// Remove any states from the connected tile that don't connect to this tile
				for (
					let index = connectedTile.superState.length - 1;
					index >= 0;
					index--
				) {
					const connectedState = connectedTile.superState[index];
					const localBackDirection = Side.rotate(
						backDirection,
						-connectedState.rotation
					);
					const connectionKey =
						connectedState.tileType.connectionKeys[
							localBackDirection
						];

					if (!allowedConnectionKeys.has(connectionKey)) {
						connectedTile.superState.splice(index, 1);
						modifiedTiles.set(backDirection, connectedTile);
					}
				}
			}

			// Propagate the state to the connected tiles
			modifiedTiles.forEach((tile, side) => {
				pushTile(tile, side);
			});
		}
	}
}

export default WaveField;
