
class Channel {

	constructor() {
		this._shard = {};
	}

	sub(shard, client) {
		if (!this._shard[shard]) {
			this._shard[shard] = {};
		}
		this._shard[shard][client.key] = client;
		return this;
	}

	unsub(shard, client) {
		if (this._shard[shard][client.key]) {
			this._shard[shard][client.key] = null;
		}
		return this;
	}

	destroy(client) {
		let id = client.key;
		for (let i in this._shard) {
			if (this._shard[i][id]) {
				this._shard[i][id] = null;
			}
		}
		return this;
	}

	send(shard, message, client) {
		let id = (client) ? client.key : '', o = {}, wait = [];
		for (let i in this._shard[shard]) {
			if (this._shard[shard][i]) {
				o[i] = this._shard[shard][i];
				if (id !== i) {
					wait.push(o[i].send('/event', {channel: shard, message: message}));
				}
			}
		}
		this._shard[shard] = o;
		return Promise.all(wait);
	}

}

module.exports = Channel;
