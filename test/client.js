
const core = require('../index.js');

class TestTask extends core.Task {

	constructor(c, cd) {
		super({
			...c,
			type: 'default'
		});
		this.set = cd;
		this.on('report', (report) => {
			console.log(report);
		});
	}

	register(r) {
		return r
			.input({
				cat: '',
				counts: 0,
				test: {
					name: '',
					age: 0
				}
			})
			.output('dead');
	}

	run(task) {
		this.set(task.stuff);
		return Promise.resolve();
	}

}

module.exports = (config, set) => {
	return new TestTask(config, set);
};
