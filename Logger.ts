export class Logger {
	infos: any[][] = [];

	info(...args: any[]) {
		this.infos.push(args);
	}

	flushInfos() {
		this.infos.forEach((args) => {
			console.info(...args);
		});
		this.infos = [];
	}

	clearInfos() {
		this.infos = [];
	}
}
