
const color = require('console.color');

class Log {

	constructor() {
		this.id = 0;
		this.level = 1;
	}

	log(...arg) {
		if (this.level >= 1) {
			console.log(`${color.green('Atium')}:${color.white(this.id++)}:${color.white((new Date()).toUTCString())} -`, ...arg);
		}
	}

	trace(...arg) {
		return (this.level >= 7) ? this.log(...arg) : null;
	}

	debug(...arg) {
		return (this.level >= 6) ? this.log(...arg.map((a) => color.cyan(a))) : null;
	}

	info(...arg) {
		return (this.level >= 5) ? this.log(...arg) : null;
	}

	warn(...arg) {
		return (this.level >= 4) ? this.log(...arg.map((a) => color.yellow(a))) : null;
	}

	error(...arg) {
		return (this.level >= 3) ? this.log(...arg.map((a) => color.red(a))) : null;
	}

	fatal(...arg) {
		return (this.level >= 2) ? this.log(...arg.map((a) => color.red(a))) : null;
	}

}

module.exports = Log;
