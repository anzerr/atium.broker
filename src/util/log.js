
class Log {

	constructor() {
		this.id = 0;
	}

	log(...arg) {
		return console.log(`Server:${this.id++}:${Date.now()}`, ...arg);
	}

}

const l = new Log();
module.exports = {
	log: (...arg) => {
		return l.log(...arg);
	}
};
