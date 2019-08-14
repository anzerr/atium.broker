
const {Server} = require('http.server'),
	is = require('type.util');

class Api extends require('events') {

	constructor(config) {
		super();
		this.core = config.core;
		this.api = new Server(config.host);
	}

	create() {
		return this.api.create((req, res) => {
			return this.request(req, res);
		}).then(() => {
			this.emit('log', 'started server');
		});
	}

	request(req, res) {
		if (req.url() === '/add' && req.method() === 'POST') {
			return req.data().then((json) => {
				let r = is.array(json) ? json : [json], add = 0;
				for (let i in r) {
					if (r[i] && is.array(r[i].tasks) && this.core.add(r[i])) {
						add += r[i].tasks.length;
					}
				}
				return res.status(200).send(String(add));
			}).catch((err) => {
				this.emit('log', err);
				res.status(500).send(err.toString());
			});
		}
		if (req.url() === '/metric' && req.method() === 'GET') {
			let m = {}, client = {};
			for (let i in this.core.pool) {
				if (this.core.pool[i]) {
					m[i] = this.core.pool[i].length;
				}
			}
			for (let i in this.core.client) {
				let c = this.core.client[i];
				if (c) {
					client[c.key] = {
						isAlive: c.isAlive,
						dead: c.dead,
						tasks: c.tasks,
						polled: {
							tick: c.polled.tick,
							count: 0
						}
					};
					for (let x in c.polled.data) {
						if (c.polled.data[x]) {
							client[c.key].polled.count += 1;
						}
					}
				}
			}
			return res.status(200).json({pool: m, client: client}, true);
		}
		return res.status(200).send('Ok');
	}

	close() {
		return this.api.close();
	}

}

module.exports = Api;
