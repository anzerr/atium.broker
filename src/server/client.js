
const packet = require('../util/packet.js'),
	{log} = require('../util/log.js');

class Client {

	get type() {
		return this.core.type;
	}

	get pool() {
		return this.core.pool;
	}

	constructor(core, socket) {
		this.core = core;
		this.socket = socket;
		this.key = socket.id();
		this.isAlive = true;
		this.tasks = [];
		this.socket.on('close', () => {
			this.destory();
		}).on('error', (err) => console.log(err));
		this.health = setInterval(() => {
			if (!this.isAlive) {
				log('client socket is dead');
				return this.destory();
			}
			this.send('/ping');
			this.isAlive = false;
			if (!this.isLocked) {
				this.pull();
			}
		}, 30 * 1000);
	}

	action(payload) {
		if (payload.action === '/who' && !this.id) {
			this.id = this.type.get(payload.data.type, this.key);
			return this.send('/who', this.id);
		}
		if (payload.action === '/pong') {
			this.isAlive = true;
			return;
		}
		if (payload.action === '/lock') {
			this.isLocked = true;
			return;
		}
		if (payload.action === '/unlock') {
			if (this.isLocked) {
				this.isLocked = false;
				this.pull();
			} else {
				this.isLocked = false;
			}
			return;
		}
		if (payload.action === '/add') {
			return this.core.add(payload.data);
		}
		if (payload.action === '/tasks') {
			this.tasks = (Array.isArray(payload.data) ? payload.data : []).sort();
			return this.pull();
		}
		if (payload.action === '/relay') {
			for (let i in this.core.client) {
				if (this.core.client[i]) {
					this.core.client[i].send(payload.data.action, payload.data.data);
				}
			}
			return;
		}
		return this.destory('invalid action');
	}

	send(a, d) {
		return this.socket.send(packet.stringify({action: a, data: d}));
	}

	cancel(d) {
		return this.send('/cancel', d);
	}

	getTask() {
		for (let x in this.tasks) {
			let t = this.tasks[x];
			if (this.pool[t] && this.pool[t].length > 0) {
				return this.pool[t].splice(0, 1)[0] || null;
			}
		}
		return null;
	}

	valid() {
		return this.isAlive && !this.isLocked;
	}

	pull() {
		if (!this.isLocked) {
			let task = this.getTask();
			if (task) {
				this.send('/run', task.payload);
			}
		}
	}

	async destory(e) {
		if (e) {
			await this.send('error', e);
		}
		console.log('close', this.key);
		this.dead = true;
		this.type.free(this.id);
		this.core.client[this.key] = null;
		this.socket.close();
		clearInterval(this.health);
	}

}

module.exports = Client;
