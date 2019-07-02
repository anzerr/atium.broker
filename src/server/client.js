
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
		this.polled = {
			data: {},
			tick: 1
		};
		this.taskMap = {};
		this.channel = {};
		this.isAlive = true;
		this.tasks = []; // task it handles
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
		try {
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
				let map = {};
				for (let i in this.tasks) {
					map[this.tasks[i]] = true;
				}
				this.taskMap = map;
				return this.pull();
			}
			if (payload.action === '/next') {
				return this.next(payload.data.next, payload.data.input);
			}
			if (payload.action === '/ok') {
				if (this.polled.data[payload.data.key]) {
					clearTimeout(this.polled.data[payload.data.key][1]);
					this.polled.data[payload.data.key] = null;
				}

				if (this.polled.tick % 1000 === 0) {
					let c = {};
					for (let i in this.polled.data) {
						if (this.polled.data[i]) {
							c[i] = this.polled.data[i];
						}
					}
					this.polled.data = c;
					this.polled.tick = 1;
				} else {
					this.polled.tick += 1;
				}
				return;
			}
			if (payload.action === '/event' && payload.data.channel && payload.data.message) {
				return this.core.channel.send(payload.data.channel, payload.data.message, this);
			}
			if (payload.action === '/sub') {
				this.channel[payload.data.channel] = true;
				return this.core.channel.sub(payload.data.channel, this);
			}
			if (payload.action === '/unsub') {
				if (this.channel[payload.data.channel]) {
					this.channel[payload.data.channel] = false;
				}
				return this.core.channel.unsub(payload.data.channel, this);
			}
		} catch(e) {
			console.log('action failed', e);
		}
		return this.destory('invalid action');
	}

	sendAll(action, data) {
		for (let i in this.core.client) {
			if (this.core.client[i]) {
				this.core.client[i].send(action, data);
			}
		}
	}

	send(a, d) {
		return this.socket.send(packet.stringify({action: a, data: d}));
	}

	cancel(d) {
		return this.send('/cancel', d);
	}

	getTask() {
		for (let x in this.tasks) {
			let t = this.pool.live.pull(this.tasks[x]);
			if (t) {
				return t;
			}
		}
		return null;
	}

	valid(task) {
		return this.isAlive && !this.isLocked && this.taskMap[task];
	}

	next(id, input) {
		let t = this.pool.next.pull(id);
		if (t) {
			t.input = {...t.input, ...input};
			this.core.addTask(t);
		}
	}

	runTask(task) {
		this.polled.data[task.key] = [
			task,
			setTimeout(() => {
				task.key = this.core.id();
				this.core.addTask(task);
			}, task.timeout)
		];
		let payload = {key: task.key, input: task.input};
		if (task.next) {
			payload.next = task.next;
		}
		return this.send('/run', payload);
	}

	pull() {
		if (!this.isLocked) {
			let task = this.getTask();
			if (task) {
				return this.runTask(task);
			}
		}
	}

	async destory(e) {
		if (e) {
			await this.send('error', e);
		}
		console.log('close', this.key);
		if (!this.dead) {
			this.type.free(this.id);
			for (let i in this.polled.data) {
				let task = this.polled.data[i][0];
				task.key = this.core.id();
				this.core.addTask(task);
				clearTimeout(this.polled[i][1]);
			}
		}
		for (let i in this.channel) {
			if (this.channel[i]) {
				this.core.channel.unsub(i, this);
			}
		}
		this.dead = true;
		this.core.client[this.key] = null;
		this.socket.close();
		clearInterval(this.health);
	}

}

module.exports = Client;
