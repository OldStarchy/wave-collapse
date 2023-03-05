import { Cell, Grid2d } from './Grid2d';
import { Logger } from './Logger';

namespace WaveCollapse {
	class Superstate {
		constructor(public readonly states: CellType[]) {}

		public get none(): boolean {
			return this.states?.length === 0;
		}

		public is(state: CellType): boolean {
			return this.states?.length === 1 && this.states[0] === state;
		}

		public get one(): CellType | undefined {
			return this.states?.length === 1 ? this.states[0] : undefined;
		}
	}

	type CellType = keyof CellTypes;

	class Map extends Grid2d<Superstate, Superstate> {
		getNeighbours(location: Location): Cell<Superstate>[] {
			return [
				this.get(location.x - 1, location.y),
				this.get(location.x + 1, location.y),
				this.get(location.x, location.y - 1),
				this.get(location.x, location.y + 1),
			].filter((cell): cell is Cell<Superstate> => !!cell);
		}

		clone(
			defaultData: Readonly<Superstate>,
			cells: readonly Cell<Superstate>[]
		): Map {
			return new Map(defaultData, cells);
		}

		protected doSet(
			x: number,
			y: number,
			data: Readonly<Superstate>
		): Grid2d<Superstate, Superstate> {
			const old = this.get(x, y);
			// if (old.data.states.length < data.states.length || data.none) {
			// console.log('entropy increased');
			// }
			return super.doSet(x, y, data);
		}
	}

	interface Location {
		x: number;
		y: number;
	}

	class ValidationResult {
		readonly errors: { location: Location | null; message: string }[] = [];

		get valid() {
			return this.errors.length === 0;
		}

		addError(location: Location | null, message: string) {
			this.errors.push({ location, message });
			return this;
		}

		merge(other: ValidationResult): ValidationResult {
			this.errors.push(...other.errors);
			return this;
		}
	}

	abstract class Rule {
		errors: any;
		validateMap(map: Map): ValidationResult {
			return new ValidationResult();
		}
		validateLocation(map: Map, location: Location): ValidationResult {
			return new ValidationResult();
		}

		abstract propagateChange(map: Map, location: Location): Map;
	}

	const cellTypes = {
		grass: '🟩',
		coast: '🟨',
		ocean: '🟦',
		church: '⛪',
		x: '❌',
	} as const;
	const weights = {
		grass: 10,
		coast: 1,
		ocean: 10,
		church: 0.1,
		x: 0,
	};

	type CellTypes = typeof cellTypes;

	const rules: Rule[] = [];

	class OnlyOneChurch extends Rule {
		validateMap(map: Map) {
			const result = super.validateMap(map);

			const churches = map.cells.filter((cell) =>
				cell.data.is('church')
			).length;

			if (churches > 1) {
				return result.addError(null, 'There can only be one church');
			}

			return result;
		}

		validateLocation(map: Map, _location: Location) {
			return this.validateMap(map);
		}

		propagateChange(map: Map, location: Location): Map {
			if (map.get(location).data.is('church')) {
				return new Map(
					new Superstate(
						map.defaultData.states.filter(
							(state) => state !== 'church'
						)
					),
					map.cells.map((cell) =>
						!cell.data.is('church') &&
						cell.data.states.includes('church')
							? {
									...cell,
									data: new Superstate(
										cell.data.states.filter(
											(state) => state !== 'church'
										)
									),
							  }
							: cell
					)
				);
			}

			return map;
		}
	}

	class DisallowedNeighborsRule extends Rule {
		constructor(public readonly a: CellType, public readonly b: CellType) {
			super();
		}

		validateLocation(map: Map, location: Location) {
			const cell = map.get(location);
			const there = cell.data.is(this.b)
				? this.a
				: cell.data.is(this.a)
				? this.b
				: null;

			const result = super.validateLocation(map, location);
			if (there === null) {
				return result;
			}

			const neighbours = map.getNeighbours(location);

			if (
				neighbours.some((neighbour) => {
					if (!(neighbour.data instanceof Superstate)) {
						console.log('asflksj');
					}
					return neighbour.data.is(there);
				})
			) {
				return result.addError(
					location,
					`A ${this.a} can't be next to a ${this.b}`
				);
			}

			return result;
		}

		propagateChange(map: Map, location: Location): Map {
			const cell = map.get(location);
			const there = cell.data.is(this.b)
				? this.a
				: cell.data.is(this.a)
				? this.b
				: null;

			if (there === null) {
				return map;
			}

			const neighbours = map.getNeighbours(location);

			return neighbours
				.filter((neighbour) => neighbour.data.states.includes(there))
				.reduce(
					(map, neighbour) =>
						map.set(
							neighbour.x,
							neighbour.y,
							new Superstate(
								neighbour.data.states.filter(
									(state) => state !== there
								)
							)
						),
					map
				);
		}
	}

	class LinearCoastRule extends Rule {
		validateMap(map: Map) {
			return map.cells
				.filter((cell) => cell.data.is('coast'))
				.reduce(
					(acc, cell) => acc.merge(this.validateLocation(map, cell)),
					super.validateMap(map)
				);
		}

		validateLocation(
			map: Map,
			location: Location,
			depth = 2
		): ValidationResult {
			if (depth === 0) {
				return new ValidationResult();
			}
			const neighbours = map.getNeighbours(location);

			const result = super.validateLocation(map, location);

			// if this location is not a coast, make sure all coast neighbours are valid
			neighbours
				.filter((n) => n.data.is('coast'))
				.reduce(
					(acc, n) =>
						acc.merge(this.validateLocation(map, n, depth - 1)),
					result
				);

			if (!map.get(location).data.is('coast')) {
				return result;
			}

			const oceanNeighbours = neighbours.filter((neighbour) =>
				neighbour.data.is('ocean')
			);
			const grassNeighbours = neighbours.filter((neighbour) =>
				neighbour.data.is('grass')
			);
			const coastNeighbours = neighbours.filter((neighbour) =>
				neighbour.data.is('coast')
			);

			if (oceanNeighbours.length === 4) {
				return result.addError(
					location,
					'A coast can not be surrounded by ocean'
				);
			}

			if (grassNeighbours.length === 4) {
				return result.addError(
					location,
					'A coast can not be surrounded by grass'
				);
			}

			if (coastNeighbours.length > 2) {
				return result.addError(
					location,
					'A coast can only have 2 coast neighbours'
				);
			} else if (coastNeighbours.length == 2) {
				const n1 = coastNeighbours[0];
				const n2 = coastNeighbours[1];

				const firstDeltaX = n1.x - location.x;
				const firstDeltaY = n1.y - location.y;
				const secondDeltaX = n2.x - location.x;
				const secondDeltaY = n2.y - location.y;

				if (firstDeltaX !== secondDeltaX) {
					if (firstDeltaY !== secondDeltaY) {
						return result.addError(
							location,
							'A coast can only have 2 coast neighbours that share an axis'
						);
					}
				}
			}

			const possibleGrassNeighbours = neighbours.filter((neighbour) =>
				neighbour.data.states.includes('grass')
			);
			const possibleOceanNeighbours = neighbours.filter((neighbour) =>
				neighbour.data.states.includes('ocean')
			);

			if (
				possibleGrassNeighbours.length === 0 ||
				possibleOceanNeighbours.length === 0
			) {
				return result.addError(
					location,
					'A coast must have room for both grass and ocean neighbours'
				);
			}

			return result;
		}

		propagateChange(map: Map, location: Location): Map {
			return map
				.getNeighbours(location)
				.concat(map.get(location))
				.filter((neighbour) => neighbour.data.is('coast'))
				.reduce(
					(map, neighbour) =>
						this.validateLocation(map, neighbour)
							? map
							: map.set(
									neighbour,
									new Superstate(
										neighbour.data.states.filter(
											(c) => c !== 'coast'
										)
									)
							  ),
					map
				);
		}
	}

	class NoUnresolvableTilesRule extends Rule {
		validateMap(map: Map): ValidationResult {
			const result = super.validateMap(map);
			return map.cells
				.filter((cell) => cell.data.none)
				.reduce(
					(acc, cell) => acc.addError(cell, 'Unresolvable tile'),
					result
				);
		}
		validateLocation(map: Map, _location: Location): ValidationResult {
			return this.validateMap(map);
		}
		propagateChange(map: Map, _location: Location): Map {
			return map;
		}
	}

	rules.push(
		new NoUnresolvableTilesRule(),
		new DisallowedNeighborsRule('grass', 'ocean'),
		new DisallowedNeighborsRule('church', 'ocean'),
		new OnlyOneChurch(),
		new LinearCoastRule()
	);

	let map = new Map(new Superstate(['grass', 'coast', 'ocean', 'church']));

	function validate(map: Map, location: Location): ValidationResult {
		return rules.reduce(
			(acc, rule) => acc.merge(rule.validateLocation(map, location)),
			new ValidationResult()
		);
	}

	function validateMap(map: Map): ValidationResult {
		return rules.reduce(
			(acc, rule) => acc.merge(rule.validateMap(map)),
			new ValidationResult()
		);
	}

	const log = new Logger();

	function collapseTile(
		map: Map,
		location: Location,
		tries: string[]
	): { map: Map; tries: string[] } {
		log.info();
		const cell = map.get(location);

		log.info(`already tried [${tries.join(', ')}]`);

		const untriedTiles = cell.data.states.filter((type) => {
			if (tries.includes(type)) {
				log.info(
					`already tried ${type} tile at ${location.x}, ${location.y}`
				);
				return false;
			}
			return true;
		});

		const options = untriedTiles
			.map((type) => {
				const tempMap = rules.reduce(
					(map, rule) => rule.propagateChange(map, location),
					map.set(location, new Superstate([type]))
				);
				log.info(
					`checking if we can place ${type} tile at ${location.x}, ${location.y}`
				);

				const validation = validate(tempMap, location);
				if (!validation.valid) {
					log.info(
						`placing ${type} tile at ${location.x}, ${
							location.y
						} would make the map invalid\n ${validation.errors
							.map(
								({ location, message }) =>
									`${
										location &&
										`${location.x}, ${location.y}: `
									}${message}`
							)
							.join('\n ')}`
					);
					return null;
				}

				return {
					type,
					weight: weights[type],
					map: tempMap,
				};
			})
			.filter(
				(
					possibility
				): possibility is {
					type: CellType;
					weight: number;
					map: Map;
				} => !!possibility && possibility.weight > 0
			);

		if (options.length === 0) {
			log.info(`no valid tile types for ${location.x}, ${location.y}`);
			return { map, tries };
		}

		const totalWeight = options.reduce((total, state) => {
			return total + state.weight;
		}, 0);

		if (totalWeight === 0) {
			log.info(`no valid tile types for ${location.x}, ${location.y}`);
			return { map, tries };
		}

		const random = Math.random() * totalWeight;

		let weight = 0;
		for (const state of options) {
			weight += state.weight;
			if (random < weight) {
				return {
					map: state.map,
					tries: [...tries, state.type],
				};
			}
		}

		return { map, tries };
	}

	function renderMap(map: Map) {
		const tiles = map.cells;
		const minX = Math.min(...tiles.map((tile) => tile.x));
		const minY = Math.min(...tiles.map((tile) => tile.y));
		const maxX = Math.max(...tiles.map((tile) => tile.x));
		const maxY = Math.max(...tiles.map((tile) => tile.y));

		const grid: string[][] = [];

		for (let y = minY; y <= maxY; y++) {
			const row: string[] = (grid[grid.length] = []);
			for (let x = minX; x <= maxX; x++) {
				const tile = map.get(x, y);

				const asciiChar =
					tile.data === map.defaultData
						? '⬛'
						: tile.data.one
						? cellTypes[tile.data.one] || '⬛'
						: '❎';
				row[row.length] = asciiChar;
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
		map: Map;
		i: number;
		tries: string[];
		previous: HistoryNode | null;
	}
	let history: HistoryNode = {
		map,
		tries: [],
		previous: null,
		i: 0,
	};

	const locations: Location[] = [];
	for (let y = 0; y < 50; y++) {
		const row: Location[] = [];
		for (let x = 0; x < 70; x++) {
			row.push({ x, y });
		}
		if (y % 2 === 0) row.reverse();
		locations.push(...row);
	}

	// shuffle(locations);

	loops: for (let i = 0; i < locations.length; i++) {
		const { x, y } = locations[i];
		if (!map.get(x, y).data.one) {
			if (history.i !== i) {
				history = {
					map,
					tries: [],
					previous: history,
					i,
				};
			}

			const { map: newMap, tries } = collapseTile(
				map,
				{ x, y },
				history.tries
			);

			if (map === newMap) {
				log.info('map did not change');
				if (!history.previous) {
					log.info('no previous history');
					// const oldMap = map;
					map = map.set(x, y, new Superstate(['x']));
					// renderMap(map);
					// log.info('*****')
					// collapseTile(oldMap, {x, y}, history.tries);
					break loops;
				}
				history = history.previous;
				i = history.i - 1;
				map = history.map;
				log.info('*** going back to previous history ***');
				log.flushInfos();
				continue;
			}
			log.clearInfos();
			history.tries = tries;
			map = newMap;

			renderMap(map);
			console.log();
		}
	}

	function shuffle<T>(array: T[]) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}

		return array;
	}
}
