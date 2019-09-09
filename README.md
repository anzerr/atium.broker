
### `Intro`
![GitHub Actions status | linter](https://github.com/anzerr/atium.broker/workflows/linter/badge.svg)
![GitHub Actions status | publish](https://github.com/anzerr/atium.broker/workflows/publish/badge.svg)
![GitHub Actions status | test](https://github.com/anzerr/atium.broker/workflows/test/badge.svg)

Light weight in memory message broker. There are no stat logging for task. Tasks are run
in the order they arrive/complete. There is still work that can be done at the moment it handles around 10k tasks a sec.

#### `Features`
- atomic task execution
- guarantee task being pooled
- sub/unsub event message system
- light weight in memory storage
- task chaining
- zero dependencies

#### `How does it work?`
- A worker connects to the broker.
- He tells the broker he can work.
- The server pushes a task to the worker it sends a acknowledge back.
- Runs the task and sends back the output if there's a next/chained task.

#### `Install`
```
npm install --save git+https://git@github.com/anzerr/atium.broker.git
```

Example of a task
``` javascript

const {Task, Server} = require('atium.broker'),
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
			console.log('subscribe to "done"');
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

````