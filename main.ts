namespace WaveCollapse {
	interface TileSuperstate {
		x: number;
		y: number;
		state: TileState | null;
	}

	interface TileState {
		type: string;
	}

	interface Location {
		x: number;
		y: number;
	}

	const log = {
		infos: [] as any[][],
		info(...args: any[]) {
			this.infos.push(args);
		},
		flushInfos() {
			this.infos.forEach((args) => {
				console.info(...args);
			});
			this.infos = [];
		},
		clearInfos() {
			this.infos = [];
		},
	};

	class Board {
		constructor(public tiles: Readonly<TileSuperstate[]> = []) {}

		get(x: number, y: number): TileSuperstate {
			const tile = this.tiles.find(
				(tile) => tile.x === x && tile.y === y
			);
			if (tile) {
				return tile;
			}
			return {
				x,
				y,
				state: null,
			};
		}
		set(x: number, y: number, tile: TileSuperstate['state']): Board {
			const tiles = this.tiles.map((tile) => {
				return {
					...tile,
					state: tile.state && {
						...tile.state,
					},
				};
			});

			const existingTile = tiles.find(
				(tile) => tile.x === x && tile.y === y
			);
			if (existingTile) {
				existingTile.state = tile;
			}

			tiles.push({
				x,
				y,
				state: tile,
			});

			return new Board(tiles);
		}
	}

	let map: Board = new Board();

	map = map.set(0, 0, {
		type: 'ocean',
	});

	abstract class TileType {
		constructor(
			public readonly type: string,
			public readonly asciiChar: string
		) {}

		abstract chanceOfBeingAt(map: Board, location: Location): number;
	}

	const tileTypes: TileType[] = [];

	class AdjacencyTest extends TileType {
		constructor(
			type: string,
			asciiChar: string,
			private adjacencyWeights: Record<string, number>
		) {
			super(type, asciiChar);
		}

		chanceOfBeingAt(map: Board, { x, y }: Location): number {
			const neighbours = [
				map.get(x - 1, y),
				map.get(x + 1, y),
				map.get(x, y - 1),
				map.get(x, y + 1),
			];

			if (
				neighbours
					.filter(
						(
							neighbour
						): neighbour is TileSuperstate & { state: TileState } =>
							!!neighbour.state
					)
					.some((neighbour) => {
						const weight =
							this.adjacencyWeights[neighbour.state.type] ?? 0;
						if (weight === 0) {
							log.info(
								`${this.type} tile can't be next to ${neighbour.state?.type} tile`
							);
						}
						return weight === 0;
					})
			) {
				return 0;
			}

			return neighbours
				.map((neighbour) => {
					const weight =
						(neighbour.state &&
							this.adjacencyWeights[neighbour.state.type]) ??
						1;
					if (weight === 0) {
						log.info(
							`${this.type} tile can't be next to ${neighbour.state?.type} tile`
						);
					}
					return weight;
				})
				.reduce((total, weight) => {
					return total + weight;
				}, 0);
		}
	}
	class CoastType extends TileType {
		chanceOfBeingAt(map: Board, { x, y }: Location): number {
			const neighbours = [
				map.get(x - 1, y),
				map.get(x + 1, y),
				map.get(x, y - 1),
				map.get(x, y + 1),
			];

			const oceanNeighbours = neighbours.filter(
				(neighbour) => neighbour.state?.type === 'ocean'
			);
			const grassNeighbours = neighbours.filter(
				(neighbour) => neighbour.state?.type === 'grass'
			);
			const coastNeighbours = neighbours.filter(
				(neighbour) => neighbour.state?.type === 'coast'
			);
			const nullNeighbours = neighbours.filter(
				(neighbour) => !neighbour.state
			);

			// no more than 2 coast tiles
			if (coastNeighbours.length > 2) {
				log.info(
					`coast tile can't be next to ${coastNeighbours.length} coast tiles`
				);
				return 0;
			} else {
				if (coastNeighbours.length === 2) {
					const firstDeltaX = coastNeighbours[0].x - x;
					const firstDeltaY = coastNeighbours[0].y - y;
					const secondDeltaX = coastNeighbours[1].x - x;
					const secondDeltaY = coastNeighbours[1].y - y;

					// must share an axis
					if (firstDeltaX !== secondDeltaX) {
						if (firstDeltaY !== secondDeltaY) {
							log.info(
								`coast tile can't be next to 2 coast tiles that make an L shape`
							);
							return 0;
						}
					}
				}
			}

			// can't be all ocean
			if (oceanNeighbours.length === 4) {
				log.info(`coast tile can't be next to 4 ocean tiles`);
				return 0;
			}

			// cant be all land
			if (grassNeighbours.length === 4) {
				log.info(`coast tile can't be next to 4 grass tiles`);
				return 0;
			}

			if (
				(grassNeighbours.length === 0) !==
				(oceanNeighbours.length === 0)
			) {
				if (nullNeighbours.length === 0) {
					log.info(
						`coast tile must have space for at least one grass and one ocean tile`
					);
					return 0;
				}
			}

			return 5;
		}
	}

	tileTypes.push(
		new AdjacencyTest('ocean', '🟦', {
			ocean: 20,
			coast: 1,
			grass: 0,
		})
	);

	tileTypes.push(new CoastType('coast', '🟨'));

	tileTypes.push(
		new AdjacencyTest('grass', '🟩', {
			ocean: 0,
			coast: 1,
			grass: 20,
		})
	);

	function validate(map: Board, { x, y }: Location): boolean {
		const type = map.get(x, y).state?.type;
		if (!type) {
			return true;
		}

		const typeObject = tileTypes.find(
			(typeObject) => typeObject.type === type
		);

		if (!typeObject) {
			log.info(`no type object for ${type}`);
			return false;
		}

		return typeObject.chanceOfBeingAt(map, { x, y }) > 0;
	}

	function validateMap(map: Board): boolean {
		for (const { x, y } of map.tiles) {
			if (!validate(map, { x, y })) {
				log.info(`map is invalid at ${x}, ${y}`);
				return false;
			}
		}

		return true;
	}

	function collapseTile(
		map: Board,
		{ x, y }: Location,
		tries: string[]
	): { map: Board; tries: string[]; canTryOthers: boolean } {
		log.info();
		const possibilities = tileTypes
			.map((type) => {
				const tempMap = map.set(x, y, { type: type.type });
				log.info(
					`checking if we can place ${type.type} tile at ${x}, ${y}`
				);

				if (!validateMap(tempMap)) {
					log.info(
						`placing ${type.type} tile at ${x}, ${y} would make the map invalid`
					);
					return null;
				}

				return {
					type,
					weight: type.chanceOfBeingAt(tempMap, { x, y }),
				};
			})
			.filter(
				(
					possibility
				): possibility is { type: TileType; weight: number } =>
					!!possibility && possibility.weight > 0
			);

		log.info(`already tried [${tries.join(', ')}]`);
		const allowedPossibilities = possibilities.filter((type) => {
			if (tries.includes(type.type.type)) {
				log.info(`already tried ${type.type} tile at ${x}, ${y}`);
				return false;
			}
			return true;
		});

		if (allowedPossibilities.length === 0) {
			log.info(`no valid tile types for ${x}, ${y}`);
			return { map, tries, canTryOthers: false };
		}

		const totalWeight = allowedPossibilities.reduce((total, state) => {
			return total + state.weight;
		}, 0);

		if (totalWeight === 0) {
			log.info(`no valid tile types for ${x}, ${y}`);
			return { map, tries, canTryOthers: false };
		}

		const random = Math.random() * totalWeight;

		let weight = 0;
		for (const state of allowedPossibilities) {
			weight += state.weight;
			if (random < weight) {
				return {
					map: map.set(x, y, { type: state.type.type }),
					tries: [...tries, state.type.type],
					canTryOthers: true,
				};
			}
		}

		return { map, tries, canTryOthers: false };
	}

	function renderMap(map: Board) {
		const tiles = map.tiles;
		const minX = Math.min(...tiles.map((tile) => tile.x));
		const minY = Math.min(...tiles.map((tile) => tile.y));
		const maxX = Math.max(...tiles.map((tile) => tile.x));
		const maxY = Math.max(...tiles.map((tile) => tile.y));

		const grid: string[][] = [];

		for (let y = minY; y <= maxY; y++) {
			grid[y] = [];
			for (let x = minX; x <= maxX; x++) {
				grid[y][x] = '⬛';
			}
		}

		for (const tile of tiles) {
			if (tile.state) {
				const typeObject = tileTypes.find(
					(typeObject) => typeObject.type === tile.state!.type
				);
				grid[tile.y][tile.x] = typeObject?.asciiChar || '⬛';
			}
		}

		//with borders
		console.log(
			grid
				.map((row) => {
					return '|' + row.join('') + '|';
				})
				.join('\n')
		);
	}

	renderMap(map);

	interface HistoryNode {
		map: Board;
		x: number;
		y: number;
		tries: string[];
		previous: HistoryNode | null;
	}
	let history: HistoryNode = {
		map,
		tries: [],
		previous: null,
		x: 0,
		y: 0,
	};

	loops: for (let y = 0; y < 20; y++) {
		for (let x = 0; x < 70; x++) {
			if (!map.get(x, y).state) {
				if (history.x !== x || history.y !== y) {
					history = {
						map,
						tries: [],
						previous: history,
						x,
						y,
					};
				}

				const {
					map: newMap,
					tries,
					canTryOthers,
				} = collapseTile(map, { x, y }, history.tries);

				if (map === newMap) {
					log.info('map did not change');
					if (!history.previous) {
						log.info('no previous history');
						// const oldMap = map;
						map = map.set(x, y, { type: 'x' });
						// renderMap(map);
						// log.info('*****')
						// collapseTile(oldMap, {x, y}, history.tries);
						break loops;
					}
					history = history.previous;
					x = history.x - 1;
					y = history.y;
					map = history.map;
					log.info('*** going back to previous history ***');
					log.clearInfos();
					continue;
				}
				log.clearInfos();
				history.tries = tries;
				map = newMap;
				console.log();
				renderMap(map);
			}
		}
	}
}
