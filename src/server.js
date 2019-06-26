
const net = require('net.socket'),
	Client = require('./server/client.js'),
	Type = require('./server/type.js'),
	packet = require('./util/packet.js'),
	{log} = require('./util/log.js'),
	is = require('type.util'),
	key = require('unique.util'),
	Api = require('./server/api.js');

class Core {

	constructor(config) {
		console.log('creating server', config);
		this.socket = new net.Server(config.socket);
		this.type = new Type();
		this.api = new Api({
			host: config.api,
			core: this
		});
		this.api.create().then(() => {
			console.log('started http server');
		});

		this.nextPool = {};
		this.pool = {};
		this.client = {};
		this.socket.on('open', () => {
			console.log('tcp server started with config', config);
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
				log(e);
			}
		});
		this._id = 0;
	}

	id() {
		return this._id++;
	}

	add(workload) {
		if (!workload || !is.array(workload.tasks)) {
			console.log('failed missing something', workload);
			return false;
		}
		for (let i in workload.tasks) {
			let t = workload.tasks[i];
			if (t.task && t.input) {
				t.key = this.id();
				t.timeout = Date.now() + (t.timeout || (1000 * 60 * 5));
			} else {
				console.log('failed missing something', t);
				return false;
			}
			if (!this.pool[t.task]) {
				this.pool[t.task] = [];
			}
		}
		for (let i = 0; i < workload.tasks.length; i++) {
			if (workload.tasks[i + 1]) {
				workload.tasks[i].next = workload.tasks[i + 1].key;
			} else {
				workload.tasks[i].next = null;
			}
			if (i !== 0) {
				this.nextPool[workload.tasks[i].key] = workload.tasks[i];
			}
		}
		this.addTask(workload.tasks[0]);
		return true;
	}

	addTask(task) {
		for (let i in this.client) {
			if (this.client[i].valid()) {
				this.client[i].isLocked = true;
				return this.client[i].send('/run', task.input);
			}
		}
		this.pool[task.task].push(task);
	}

	close() {
		this.api.close();
		this.socket.close();
	}

}

module.exports = Core;
