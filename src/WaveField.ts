import Tile from './model/Tile';
import TileState from './model/TileState';
import TileType from './model/TileType';
import Side from './Side';

export type Coordinate = { x: number; y: number };
export type TileKey = `${number}/${number}`;
export type WaveField = Readonly<Record<TileKey, Readonly<Tile>>>;
export type TileSet = Readonly<Record<TileType['id'], TileType>>;

//TODO: arbitrary 'grid' shape

namespace WaveFieldResolver {
	function getKey(position: Coordinate): TileKey;
	function getKey(tile: Tile): TileKey;
	function getKey(tileOrPosition: Tile | Coordinate): TileKey {
		const position =
			'position' in tileOrPosition
				? tileOrPosition.position
				: tileOrPosition;
		return `${position.x}/${position.y}`;
	}

	function addCoordinates(
		position: Coordinate,
		offset: Coordinate
	): Coordinate {
		return { x: position.x + offset.x, y: position.y + offset.y };
	}

	export function getTile(
		field: WaveField,
		position: Coordinate
	): Tile | undefined {
		const key = getKey(position);
		return field[key];
	}

	export function setTile(
		field: WaveField,
		tile: Tile
	): [newField: WaveField, newTile: Tile] {
		const existing = getTile(field, tile.position);

		if (tile === existing) return [field, existing];

		const newTile = {
			...existing,
			...tile,
		};

		return [
			{
				...field,
				[getKey(tile)]: newTile,
			},
			newTile,
		];
	}

	function makeTile(
		field: WaveField,
		position: Coordinate,
		tileset: TileSet
	): [newField: WaveField, newTile: Tile] {
		const tile: Tile = {
			position: { ...position },
			dirty: false,
			superState: getDefaultTileSuperState(tileset),
		};

		return setTile(field, tile);
	}

	function getOrMakeTile(
		field: WaveField,
		position: Coordinate,
		tileset: TileSet
	): [newField: WaveField, newTile: Tile] {
		const existing = getTile(field, position);

		if (existing) return [field, existing];

		return makeTile(field, position, tileset);
	}

	export function setTileState(
		field: WaveField,
		position: Coordinate,
		state: TileState,
		tileset: TileSet
	): [newField: WaveField, newTile: Tile] {
		let [newField, newTile] = getOrMakeTile(field, position, tileset);

		if (newTile.superState.length === 1 && newTile.superState[0] === state)
			return [newField, newTile];

		[newField, newTile] = setTile(newField, {
			...newTile,
			dirty: true,
			superState: [state],
		});

		newField = propagateState(newField, position, tileset);

		return [newField, getTile(newField, position)!];
	}

	export function getDefaultTileSuperState(tileset: TileSet): TileState[] {
		const states = [];

		const types = Object.values(tileset);

		for (const type of types) {
			states.push({ tileType: type, rotation: 0 });
			if (type.canBeRotated) {
				states.push({ tileType: type, rotation: 1 });
				states.push({ tileType: type, rotation: 2 });
				states.push({ tileType: type, rotation: 3 });
			}
		}

		return states;
	}

	function propagateState(
		field: WaveField,
		position: Coordinate,
		tileset: TileSet,
		ignoreSide?: Side,
		limit = 100
	): WaveField {
		let newField = field;

		const queue: { position: Coordinate; ignoreSide?: Side }[] = [];

		function enqueue(position: Coordinate, ignoreSide?: Side) {
			if (
				queue.some(
					({ position: queuePosition }) =>
						position.x === queuePosition.x &&
						position.y === queuePosition.y
				)
			)
				return;

			queue.push({ position, ignoreSide });
		}

		function dequeue() {
			return queue.shift();
		}

		enqueue(position, ignoreSide);

		let counter = 0;

		while (queue.length > 0 && counter < limit) {
			counter++;

			const { position, ignoreSide } = dequeue()!;

			let tile = getTile(newField, position);

			if (!tile) continue;

			if (tile.superState.length === 0) {
				console.warn(
					`Invalid tile state at ${position.x}, ${position.y}`
				);
				continue;
			}

			if (tile.dirty) {
				[newField, tile] = setTile(newField, {
					...tile,
					dirty: false,
				});
			}

			for (const globalDirection of Side.sides) {
				if (globalDirection === ignoreSide) continue;

				// A set of all allowed connections to this side.
				const allowedConnectionKeys = new Set<string>();

				for (const state of tile.superState) {
					const localSide = Side.rotate(
						globalDirection,
						-state.rotation
					);

					const connectionKey =
						state.tileType.connectionKeys[localSide];

					if (connectionKey !== null) {
						//Connecting the "north" side of one tile to the "south" side of another means the connection key needs to be flipped as the sides are 180 degrees rotated.
						const flippedKey = connectionKey
							.split('/')
							.reverse()
							.join('/');
						allowedConnectionKeys.add(flippedKey);
					}
				}

				const offset = Side.offset[globalDirection];
				let connectedTile: Tile;
				[newField, connectedTile] = getOrMakeTile(
					newField,
					addCoordinates(position, offset),
					tileset
				);

				const backDirection = Side.getOppositeSide(globalDirection);

				// Remove any states that don't connect to one of the allowed connections
				const newSuperState = connectedTile.superState.filter(
					(state) => {
						const localSide = Side.rotate(
							backDirection,
							-state.rotation
						);

						const connectionKey =
							state.tileType.connectionKeys[localSide];

						if (connectionKey === null)
							return allowedConnectionKeys.size === 0;

						return allowedConnectionKeys.has(connectionKey);
					}
				);

				if (newSuperState.length === connectedTile.superState.length) {
					continue;
				}

				[newField, connectedTile] = setTile(newField, {
					...connectedTile,
					dirty: true,
					superState: newSuperState,
				});

				enqueue(addCoordinates(position, offset), backDirection);
			}
		}

		return newField;
	}

	export function collapse(
		field: WaveField,
		position: Coordinate,
		tileset: TileSet
	): WaveField {
		let tile = getTile(field, position);
		if (tile && tile.superState.length < 2) return field;

		let newField = field;

		// Check connections from adjacent tiles
		for (const globalDirection of Side.sides) {
			const offset = Side.offset[globalDirection];
			const connectedTile = getTile(
				newField,
				addCoordinates(position, offset)
			);
			if (connectedTile && connectedTile.dirty)
				newField = propagateState(
					newField,
					addCoordinates(position, offset),
					tileset
				);
		}

		[newField, tile] = getOrMakeTile(newField, position, tileset);

		const weightedStates: [TileState, number][] = [];
		let totalWeight = 0;

		for (const state of tile.superState) {
			const weight = computeWeight(field, position, state);
			totalWeight += weight;
			weightedStates.push([state, weight]);
		}

		let random = Math.random() * totalWeight;

		for (const [state, weight] of weightedStates) {
			if (random < weight) {
				[newField] = setTile(newField, {
					...tile,
					dirty: true,
					superState: [state],
				});

				break;
			}

			random -= weight;
		}

		if (newField === field) {
			return field;
		}

		return propagateState(newField, tile.position, tileset);
	}

	function computeWeight(
		field: WaveField,
		position: Coordinate,
		state: TileState
	): number {
		// Maybe some smarts can go in here later.
		return 1;
	}

	export function collapseOne(field: WaveField, tileset: TileSet) {
		if (Object.keys(field).length === 0) {
			[field] = makeTile(field, { x: 0, y: 0 }, tileset);
		}

		// Find the tiles with the least number of states more than 1
		const tilesToUpdate = Object.values(field).reduce((tiles, tile) => {
			if (tile.superState.length <= 1) {
				return tiles;
			}

			if (tiles.length === 0) {
				tiles.push(tile);
				return tiles;
			}

			const lastTile = tiles[tiles.length - 1];

			// Prefer dirty tiles
			if (tile.dirty) {
				if (!lastTile.dirty) {
					return [tile];
				}
			}

			if (!tile.dirty) {
				if (lastTile.dirty) {
					return tiles;
				}
			}

			// Prefer tiles with the least number of states
			if (tile.superState.length < lastTile.superState.length) {
				return [tile];
			}

			if (tile.superState.length === lastTile.superState.length) {
				tiles.push(tile);
			}

			return tiles;
		}, [] as Tile[]);

		if (tilesToUpdate.length === 0) {
			return field;
		}

		const tile =
			tilesToUpdate[Math.floor(Math.random() * tilesToUpdate.length)];

		return collapse(field, tile.position, tileset);
	}

	export function deleteTile(field: WaveField, position: Coordinate) {
		const tile = getTile(field, position);

		if (!tile) {
			return field;
		}

		let newField = {
			...field,
		};
		delete newField[getKey(position)];

		const connectedTiles: Record<TileKey, Tile> = {};

		for (const globalDirection of Side.sides) {
			const offset = Side.offset[globalDirection];
			const connectedTile = getTile(
				newField,
				addCoordinates(position, offset)
			);

			if (connectedTile) {
				connectedTiles[getKey(connectedTile)] = {
					...connectedTile,
					dirty: true,
				};
			}
		}

		return {
			...newField,
			...connectedTiles,
		};
	}
}

export default WaveFieldResolver;
