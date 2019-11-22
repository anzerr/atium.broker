
const Client = require('./client/event.js'),
	is = require('type.util'),
	logger = require('./util/logger.js');

class Event extends require('events') {

	constructor(config) {
		super();
		this.config = config;
		if (this.config.log && is.function(this.config.log)) {
			this.log = (l) => this.config.log(...l);
		}
	}

	init() {
		return new Promise((resolve) => {
			this._client = new Client(this.config);
			this._client.reconnect();
			this.log(['config', this.config]);
			this._client.on('connect', () => {
				this.emit('connect');
				resolve();
			}).on('close', () => {
				if (!this.closed) {
					this._client.reconnect();
				}
			}).on('event', (data) => {
				return this.emit(`event:${data.channel}`, data.message);
			}).on('log', (l) => this.log(l)).on('error', (e) => this.log(['error', ...e]));
		});
	}

	sub(...arg) {
		return this._client.sub(...arg);
	}

	subscribe(...arg) {
		return this._client.subscribe(...arg);
	}

	unsub(...arg) {
		return this._client.unsub(...arg);
	}

	unsubscribe(...arg) {
		return this._client.unsubscribe(...arg);
	}

	event(...arg) {
		return this._client.event(...arg);
	}

	log(l) {
		if (this.config.log) {
			return logger.log(...l);
		}
	}

	close() {
		this.closed = true;
		this._client.close();
		this.id = null;
	}

}

module.exports = Event;
