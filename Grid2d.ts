export type Cell<TData> = { x: number; y: number; data: TData };

/**
 * immutable 2d unbound grid
 */
export class Grid2d<TData, TDefaultData extends TData | null = null> {
	constructor(
		public readonly defaultData: Readonly<TDefaultData>,
		public readonly cells: Readonly<Cell<TData>[]> = []
	) {}

	get(x: number, y: number): Readonly<Cell<TData | TDefaultData>>;
	get({
		x,
		y,
	}: {
		x: number;
		y: number;
	}): Readonly<Cell<TData | TDefaultData>>;
	get(
		xOrXy: number | { x: number; y: number },
		maybeY?: number
	): Readonly<Cell<TData | TDefaultData>> {
		const x = typeof xOrXy === 'number' ? xOrXy : xOrXy.x;
		const y = typeof xOrXy === 'number' ? maybeY! : xOrXy.y;

		return this.doGet(x, y);
	}

	protected doGet(
		x: number,
		y: number
	): Readonly<Cell<TData | TDefaultData>> {
		const cell = this.cells.find((cell) => cell.x === x && cell.y === y);
		if (cell) {
			return cell;
		}
		return {
			x,
			y,
			data: this.defaultData,
		};
	}

	set(x: number, y: number, data: Readonly<TData>): this;
	set(
		{
			x,
			y,
		}: {
			x: number;
			y: number;
		},
		data: Readonly<TData>
	): this;
	set(
		xOrXy: number | { x: number; y: number },
		yOrData: Readonly<TData> | number,
		maybeData?: Readonly<TData>
	): Grid2d<TData, TDefaultData> {
		const x = typeof xOrXy === 'number' ? xOrXy : xOrXy.x;
		const y = typeof xOrXy === 'number' ? (yOrData as number) : xOrXy.y;
		const data =
			typeof xOrXy === 'number'
				? maybeData!
				: (yOrData as Readonly<TData>);

		return this.doSet(x, y, data);
	}

	protected doSet(
		x: number,
		y: number,
		data: Readonly<TData>
	): Grid2d<TData, TDefaultData> {
		const cells = this.cells.map((cell) => {
			return {
				...cell,
			};
		});

		const existingCell = cells.find((cell) => cell.x === x && cell.y === y);
		if (existingCell) {
			existingCell.data = data;
		}

		cells.push({
			x,
			y,
			data,
		});

		return this.clone(this.defaultData, cells);
	}

	clone(
		defaultData: Readonly<TDefaultData>,
		cells: Readonly<Cell<TData>[]>
	): Grid2d<TData, TDefaultData> {
		return new Grid2d<TData, TDefaultData>(defaultData, cells);
	}
}
