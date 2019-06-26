
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
		// log('http', req.url(), req.method());
		if (req.url() === '/add' && req.method() === 'POST') {
			return req.data().then((json) => {
				let r = is.array(json) ? json : [json], add = 0;
				// console.log(r);
				for (let i in r) {
					if (r[i] && is.array(r[i].tasks) && this.core.add(r[i])) {
						add += r[i].tasks.length;
					}
				}
				return res.status(200).send(String(add));
			}).catch((err) => {
				console.log(err); // maybe should be a event?
				res.status(500).send(err.toString());
			});
		}
		if (req.url() === '/metric' && this.method() === 'GET') {
			let m = {};
			for (let i in this.core.pool) {
				if (this.core.pool[i]) {
					m[i] = this.core.pool[i].length || 0;
				}
			}
			res.status(200).json(m);
		}
		return res.status(200).send('Ok');
	}

	close() {
		return this.api.close();
	}

}

module.exports = Api;
