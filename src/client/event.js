
const Client = require('./client.js');

class Event extends Client {

	constructor(config) {
		super(config);
	}

	reconnect() {
		this.connect();
		this.c.on('connect', () => {
			this.emit('log', ['connected']);
			this.bindMessage();
			this.emit('connect', null);
		}).on('close', () => {
			this.emit('close');
		});
	}

}

module.exports = Event;
