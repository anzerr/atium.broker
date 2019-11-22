
const net = require('net.socket'),
	Client = require('./server/client.js'),
	Type = require('./server/type.js'),
	packet = require('./util/packet.js'),
	logger = require('./util/logger.js'),
	is = require('type.util'),
	Pool = require('./server/pool.js'),
	ENUM = require('./util/enum.js'),
	Api = require('./server/api.js'),
	Channel = require('./server/channel.js');

class Core {

	constructor(config) {
		logger.log('creating server', config);
		this.socket = new net.Server(config.socket);
		this.type = new Type();

		this.api = new Api({
			host: config.api,
			core: this
		});
		this.api.create().then(() => {
			logger.log('started http server');
		});

		this.channel = new Channel();

		this.pool = {
			live: new Pool(),
			next: new Pool()
		};
		this.client = {};
		this.socket.on('open', () => {
			logger.log('tcp server started with config', config);
		}).on('connect', (client) => {
			let k = client.id();
			if (!this.client[k]) {
				this.client[k] = new Client(this, client);
			} else {
				client.close();
			}
		}).on('message', (res) => {
			try {
				let k = res.client.id();
				if (this.client[k]) {
					this.client[k].action(packet.parse(res.payload));
				}
			} catch(e) {
				logger.log(e);
			}
		});
		this._id = 0;
	}

	logger(n) {
		logger.level = n;
		return this;
	}

	id() {
		// return `${Math.random().toString(36).substr(2)}:${this._id++}`;
		return this._id++;
	}

	add(workload) {
		if (!workload || !is.array(workload.tasks)) {
			logger.log('failed missing something', workload);
			return false;
		}
		for (let i in workload.tasks) {
			let t = workload.tasks[i];
			if (t.task && t.input) {
				t.key = this.id();
				t.timeout = (t.timeout || ENUM.TIMEOUT);
			} else {
				logger.log('failed missing something', t);
				return false;
			}
		}
		for (let i = 0; i < workload.tasks.length; i++) {
			if (workload.tasks[i + 1]) {
				workload.tasks[i].next = workload.tasks[i + 1].key;
			} else {
				workload.tasks[i].next = null;
			}
			if (i !== 0) {
				this.pool.next.push(workload.tasks[i].key, workload.tasks[i]);
			}
		}
		this.addTask(workload.tasks[0]);
		return true;
	}

	addTask(task) {
		for (let i in this.client) {
			if (this.client[i] && this.client[i].valid(task.task)) {
				this.client[i].isLocked = true;
				return this.client[i].runTask(task);
			}
		}
		this.pool.live.push(task.task, task);
	}

	close() {
		for (let i in this.client) {
			this.client[i].dead = true;
		}
		this.api.close();
		this.socket.close();
		for (let i in this.pool) {
			this.pool[i].close();
		}
	}

}

module.exports = Core;
