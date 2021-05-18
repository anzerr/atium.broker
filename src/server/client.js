
const packet = require('../util/packet.js');

class Client {

	get type() {
		return this.core.type;
	}

	get pool() {
		return this.core.pool;
	}

	get logger() {
		return this.core.logger;
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
		}).on('error', (err) => this.logger.error('socket error', err));
		this.health = setInterval(() => {
			if (!this.isAlive) {
				this.logger.warn('client socket is dead');
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
			if (payload.action === '/event' && payload.data.channel) {
				return this.core.channel.send(payload.data.channel, payload.data.message || {}, this);
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
			this.logger.error('invalid action', payload);
		} catch(e) {
			this.logger.error('action failed', e);
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

	send(action, data) {
		if (this.dead) {
			this.logger.warn(new Error('tryed to send packet when dead'));
			return
		}
		return this.socket.send(packet.stringify({action, data})).catch((err) => {
			this.logger.error('Error sending packet', err);
		});
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

	valid(taskName, force) {
		return !this.dead && (!this.isLocked || force) && this.taskMap[taskName];
	}

	next(id, input) {
		let t = this.pool.next.pull(id);
		if (t) {
			t.input = {...t.input, ...input};
			this.core.addTask(t);
		}
	}

	runTask(task, force) {
		if (this.valid(task.task, force)) {
			const key = task.key;
			this.polled.data[key] = [
				task,
				setTimeout(() => {
					this.polled.data[key] = null;
					task.key = this.core.id();
					this.logger.warn(`task "${key}" acknowledgement has timeouted after ${task.timeout}ms task is being re-pooled`);
					this.core.addTask(task);
				}, task.timeout)
			];
			let payload = {key: key, input: task.input};
			if (task.next) {
				payload.next = task.next;
			}
			return this.send('/run', payload);
		}
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
			try {
				await this.send('error', e);
			} catch(err) {
				// fuck it
			}
		}
		this.logger.log('close', this.key);
		if (!this.dead) {
			if (!this.type.free(this.id)) {
				this.logger.warn(`failed to free "${this.id}" for client "${this.key}"`);
			}

			for (let i in this.polled.data) {
				if (this.polled.data[i]) {
					let task = this.polled.data[i][0];
					task.key = this.core.id();
					this.core.addTask(task);
					clearTimeout(this.polled.data[i][1]);
				}
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
