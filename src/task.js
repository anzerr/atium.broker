
const Client = require('./client.js');

class Task extends require('events') {

	constructor(config) {
		super();
		this.config = config;
		this._client = new Client(config);
		this._map = [];
		this._lock = false;
		this.log(['config', this.config]);
		this._client.on('connect', (who) => {
			this.who = who;
			this.emit('connect');
		}).on('run', (task) => {
			this.lock()
				.then(() => this.run(task))
				.then((res) => {
					let wait = [this.unlock()];
					if (task.next) {
						wait.push(this._client.send('/next', {next: task.next, input: res}));
					}
					return Promise.all(wait);
				});
		}).on('close', () => {
			if (!this.closed) {
				this._client.reconnect();
			}
		}).on('log', (l) => this.log(l)).on('error', (e) => this.log(['error', e]));
	}

	unlock() {
		this.log(['unlock']);
		this._lock = false;
		return this._client.unlock();
	}

	lock() {
		this.log(['lock']);
		this._lock = true;
		return this._client.lock();
	}

	log(l) {
		if (this.config.log) {
			return console.log(`TASK - ${Date.now()} :`, ...l);
		}
	}

	run() {
		throw new Error('run needs to overloaded');
	}

	close() {
		this.closed = true;
		this._client.close();
		this.id = null;
	}

}

module.exports = Task;
