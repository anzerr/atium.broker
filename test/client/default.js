
const core = require('../../index.js'),
	assert = require('assert');

class TestTask extends core.Task {

	constructor(c, cd) {
		super({
			...c,
			type: 'default'
		});
		this.set = cd;
		this.init().then(() => {
			this.subscribe('task_done');
		});

		/* this._client.on('log', (e) => console.log('log', e));
		this._client.on('error', (e) => console.log('error', e, e[1].toString()));
		this._client.on('ping', (e) => console.log('ping', e));
		this._client.on('connect', (e) => console.log('connect', e));
		this._client.on('event', (e) => console.log('event', e));*/
	}

	run(task) {
		this.set(task.stuff);
		if (!this.config.fast) {
			this.event('task_done', {task: task}).catch((err) => console.log(err));
			// this.event('task_done');
			try {
				// this.event();
			} catch (e) {
				assert.equal(e.message, 'can\'t send event without a channel');
			}
		}

		return Promise.resolve({dave: task.stuff});
	}

}

module.exports = (config, set) => {
	return new TestTask(config, set);
};
