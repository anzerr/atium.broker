
const core = require('../../index.js'),
	assert = require('assert');

class TimeoutTask extends core.Task {

	constructor(c) {
		super({
			...c,
			type: 'timeout',
			tasks: ['timeout']
		});
		this.init();
	}

	handleRun(task) {
		console.log('pre run', task);
		setTimeout(() => this.unlock(), 1000);
	}

	run(task) {
		return Promise.resolve({dave: task.stuff});
	}

}

module.exports = (config, set) => {
	return new TimeoutTask(config, set);
};
