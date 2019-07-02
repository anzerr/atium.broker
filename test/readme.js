
const {Task, Server} = require('../index.js'),
	Request = require('request.libary');

class TestTask extends Task {

	constructor(c) {
		super({
			...c,
			type: 'default'
		});
		this.store = {};
		this.on('event:done', (msg) => { // sub to done event
			this.store[msg.n] = false;
		});
	}

	run(task) {
		console.log('t', this.who, task);
		this.event('done', {n: task.stuff}); // send event to everyone execpt me
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

	let t = null;
	let s = new Server(config); // server
	let e = new TestTask({ // client to receive events no tasks
		socket: config.socket,
		api: config.api,
		tasks: []
	});

	let out = [];
	for (let x = 0; x < 10; x++) {
		e.store[x] = true;
		e.store[x + 100] = true;
		out.push({
			tasks: [ // chain tasks
				{
					task: config.tasks[0], // run this task first
					input: {
						stuff: x
					}
				},
				{
					task: config.tasks[0], // run this task second
					input: {
						stuff: x + 100
					}
				}
			]
		});
	}
	e.on('connect', () => {
		e.subscribe('done').then(() => {
			console.log('here');
			t = new TestTask(config); // task client
			Promise.all([
				new Promise((resolve) => t.on('connect', () => resolve())), // wait for client to connect
				send(out) // send out task creation
			]).then(() => {
				console.log('setup done');
				setTimeout(() => { // dirty close
					for (let i in e.store) {
						if (e.store[i]) {
							console.log('missing', i, 'did not recive event');
						}
					}
					console.log('done task', JSON.stringify(e.store));
					t.close();
					e.close();
					s.close();
				}, 1000);
			});
		});
	});
})();
