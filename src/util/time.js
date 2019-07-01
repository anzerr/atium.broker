
const NS_PER_SEC = 1e9;

class Time {

	constructor() {
		this._ref = {
			epoch: Date.now(),
			start: process.hrtime()
		};
		this._start = Date.now();
	}

	hrtime() {
		let diff = process.hrtime(this._ref.start);
		return this.diff(diff);
	}

	diff(diff) {
		return diff[0] * NS_PER_SEC + diff[1];
	}

	now() {
		let dif = process.hrtime(this._ref.start);
		return this._ref.epoch + (dif[0] * 1e3) + (dif[1] / 1e6);
	}

}

module.exports = new Time();
