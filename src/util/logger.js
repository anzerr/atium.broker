
const color = require('console.color');

class Log {

	constructor() {
		this.id = 0;
	}

	log(...arg) {
		console.log(`${color.green('Atiume')}:${color.white(this.id++)}:${color.white((new Date()).toUTCString())} -`, ...arg);
	}
	warn(...arg) {
		return this.log(...arg.map((a) => color.yellow(a)));
	}

	error(...arg) {
		return this.log(...arg.map((a) => color.red(a)));
	}

}

module.exports = new Log();
