
const core = require('../../index.js');

class TestTask extends core.Task {

	constructor(c, cd) {
		super({
			...c,
			type: 'default'
		});
		this.set = cd;
	}

	run(task) {
		this.set(task.stuff);
		return Promise.resolve({dave: task.stuff});
	}

}

module.exports = (config, set) => {
	return new TestTask(config, set);
};
