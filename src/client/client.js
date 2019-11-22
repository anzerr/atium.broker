
const net = require('net.socket'),
	packet = require('../util/packet.js');

class Client extends require('events') {

	constructor(config) {
		super();
		if (!config) {
			throw new Error('missing config can\'t start client.');
		}
		this.config = config;
		this.id = null;
	}

	reconnect() {
		this.connect();
		this.c.on('connect', () => {
			this.emit('log', ['connected']);
			this.bindMessage().who();
		}).on('close', () => {
			this.emit('close');
		});
	}

	connect() {
		if (this.c) {
			this.c.removeAllListeners(['connect', 'message', 'close']);
			this.c.close();
		}
		clearInterval(this.health);
		this.once('connect', () => {
			clearInterval(this.health);
			this.health = setInterval(() => {
				if (!this.isAlive) {
					this.emit('error', [new Error('server socket is dead')]);
					return this.close();
				}
				this.isAlive = false;
			}, 60 * 1000);
		});
		this.c = new net.Client(this.config.socket);
	}

	bindMessage() {
		this.c.on('message', (res) => {
			try {
				let payload = packet.parse(res);
				this.emit('log', ['payload recived', payload]);
				if (payload.action === '/ping') {
					this.isAlive = true;
					this.emit('ping');
					return this.send('/pong').catch((e) => this.emit('error', [e]));
				}
				if (payload.action === '/who') {
					this.id = payload.data;
					this.emit('connect', this.id);
					return this.send('/tasks', this.config.tasks || []).catch((e) => this.emit('error', [e]));
				}
				if (payload.action === '/run') {
					return this.emit('run', payload.data);
				}
				if (payload.action === '/event') {
					return this.emit('event', payload.data);
				}
				if (payload.action === '/kill') {
					return this.emit('kill', payload.data);
				}
				this.emit('error', [`action not supported "${payload.action}"`]);
			} catch(e) {
				this.emit('error', [e, res]);
			}
		});
		return this;
	}

	send(a, d = null) {
		try {
			return this.c.send(packet.stringify({action: a, data: d}));
		} catch(e) {
			return Promise.reject(e);
		}
	}

	sub(channel) {
		if (typeof channel === 'string') {
			return this.send('/sub', {channel: channel});
		}
		throw new Error('can\'t unsub event without a channel');
	}

	subscribe(...arg) {
		return this.sub(...arg);
	}

	unsub(channel) {
		if (typeof channel === 'string') {
			return this.send('/unsub', {channel: channel});
		}
		throw new Error('can\'t unsub event without a channel');
	}

	unsubscribe(...arg) {
		return this.unsub(...arg);
	}

	event(channel, message) {
		if (typeof channel === 'string') {
			return this.send('/event', {channel: channel, message: message || {}});
		}
		throw new Error('can\'t send event without a channel');
	}

	lock() {
		return this.send('/lock');
	}

	unlock() {
		return this.send('/unlock');
	}

	tasks(t) {
		return this.send('/tasks', t);
	}

	who() {
		return this.send('/who', {type: this.config.type});
	}

	close() {
		this.c.close();
		this.id = null;
		clearInterval(this.health);
	}

}

module.exports = Client;
