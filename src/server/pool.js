
const time = require('../util/time.js'),
	ENUM = require('../util/enum.js');

class Pool {

	constructor() {
		this._pool = {};
		this._last = {};
		this._tick = 1;
		this._think = setInterval(() => this.clean(), ENUM.POOL.THINK);
	}

	get length() {
		let c = 0;
		for (let i in this._pool) {
			c += this._pool[i].length;
		}
		return c;
	}


	clean() {
		let now = time.now(), o = {};
		for (let i in this._pool) {
			if (this._pool[i].length !== 0 && this._last[i] > now) {
				o[i] = this._pool[i];
			}
		}
		this._pool = o;
	}

	tick() {
		if (this._tick % ENUM.POOL.TICK === 0) {
			this._tick = 1;
			this.clean();
		} else {
			this._tick++;
		}
		return this;
	}

	pull(shard) {
		if (this._pool[shard] && this._pool[shard].length > 0) {
			this._last[shard] = time.now() + ENUM.POOL.LIFE;
			this.tick();
			return this._pool[shard].splice(0, 1)[0] || null;
		}
		return null;
	}

	push(shard, data) {
		if (!this._pool[shard]) {
			this._pool[shard] = [];
		}
		this._last[shard] = time.now() + ENUM.POOL.LIFE;
		this._pool[shard].push(data);
		return this.tick();
	}

	stop() {
		clearInterval(this._think);
	}

}

module.exports = Pool;
