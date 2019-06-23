
const net = require('net.socket'),
	Client = require('./server/client.js'),
	Type = require('./server/type.js'),
	packet = require('./util/packet.js'),
	{log} = require('./util/log.js'),
	{Server} = require('http.server');

class Core {

	constructor(config) {
		console.log('creating server', config);
		this.socket = new net.Server(config.socket);
		this.type = new Type();

		this.api = new Server(config.api);
		this.api.create((req, res) => {
			// log('http', req.url(), req.method());
			if (req.url() === '/add' && req.method() === 'POST') {
				return req.data().then((json) => {
					let r = Array.isArray(json) ? json : [json];
					for (let i in r) {
						if (r[i] && r[i].name && r[i].payload) {
							this.add(r[i]);
						}
					}
					return res.status(200).send(String(r.length));
				}).catch((err) => {
					res.status(500).send(err.toString());
				});
			}
			if (req.url() === '/metric' && this.method() === 'GET') {
				let m = {};
				for (let i in this.pool) {
					if (this.pool[i]) {
						m[i] = this.pool[i].length || 0;
					}
				}
				res.status(200).json(m);
			}
			return res.status(200).send('Ok');
		}).then(() => {
			log('started server');
		});

		this.pool = {};
		this.client = {};
		this.socket.on('open', () => {
			console.log('tcp server started with config', config);
		}).on('connect', (client) => {
			let key = client.id();
			if (!this.client[key]) {
				this.client[key] = new Client(this, client);
			} else {
				client.close();
			}
		}).on('message', (res) => {
			try {
				let key = res.client.id();
				if (this.client[key]) {
					this.client[key].action(packet.parse(res.payload));
				}
			} catch(e) {
				log(e);
			}
		});
	}

	add(task) {
		if (!task || !task.name || !task.payload) {
			return;
		}
		if (!this.pool[task.name]) {
			this.pool[task.name] = [];
		}

		for (let i in this.client) {
			if (this.client[i].valid()) {
				this.client[i].isLocked = true;
				return this.client[i].send('/run', task.payload);
			}
		}
		this.pool[task.name].push(task);
	}

	close() {
		this.api.close();
		this.socket.close();
	}

}

module.exports = Core;
