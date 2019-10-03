
const Client = require('./client/client.js'),
	Event = require('./event.js');

class Task extends Event {

	constructor(config) {
		super(config);
	}

	init() {
		return new Promise((resolve) => {
			this._client = new Client(this.config);
			this._client.reconnect();
			this._map = [];
			this._lock = false;
			this.log(['config', this.config]);
			this._client.on('connect', (who) => {
				this.who = who;
				this.emit('connect');
				resolve();
			}).on('run', (task) => {
				this._client.send('/ok', {key: task.key});
				this.lock()
					.then(() => this.run(task.input))
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
			}).on('event', (data) => {
				return this.emit(`event:${data.channel}`, data.message);
			}).on('log', (l) => this.log(l)).on('error', (e) => this.log(['error', ...e]));
		});
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

}

module.exports = Task;
