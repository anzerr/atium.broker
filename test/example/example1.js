
const {Task, Server} = require('../../index.js'),
	Request = require('request.libary');

class TestTask extends Task {

	constructor(c) {
		super({
			...c,
			type: 'default'
		});
		this._ran = 0;
		this.on('event:task_done', (msg) => console.log('task done', this.who, msg));
		this.on('event:task_other', (msg) => console.log('task_other', this.who, msg));
		this.init();
	}

	run(task) {
		this._ran++;
		console.log(this._ran, this.who, task);
		this.event('task_done', {task: task});
		this.event('task_other', {task: task});
		return Promise.resolve();
	}

}

(() => {
	const config = {
		socket: 'localhost:3001',
		api: 'localhost:3002',
		tasks: ['task_10001']
	};

	const send = (task) => {
		return new Request(`http://${config.api}`).json(task).post('/add');
	};

	let s = new Server(config); // server
	let t = new TestTask(config);
	let e = new TestTask({
		socket: config.socket,
		api: config.api,
		tasks: []
	});
	e.on('connect', () => {
		e.subscribe('task_done');
	});
	let e1 = new TestTask({
		socket: config.socket,
		api: config.api,
		tasks: []
	});
	e1.on('connect', () => {
		e1.subscribe('task_other');
	});

	let out = [];
	for (let x = 0; x < 100; x++) {
		out.push({
			tasks: [
				{
					task: config.tasks[0],
					input: {
						stuff: x
					}
				},
				{
					task: config.tasks[0],
					input: {
						stuff: x + 100
					}
				}
			]
		});
	}
	Promise.all([
		new Promise((resolve) => t.on('connect', () => resolve())),
		send(out)
	]).then(() => {
		console.log('setup done');
		setTimeout(() => {
			t.close();
			e.close();
			e1.close();
			s.close();
		}, 1000);
	});
})();
