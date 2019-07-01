
### `Intro`
Light weight in memory message broker. There are no stat logging for task. Tasks are run
in the order they arrive/complete. There is still work that can be done at the moment it handles around 1k tasks a sec.

#### `How does it work?`
- A worker connects to the broker.
- He tells the broker he can work.
- The server pushes a task to the worker it sends a acknowledge back.
- Runs the task and sends back the output if there's a next/chained task.

#### `Install`
```
npm install --save git+https://git@github.com/anzerr/hive.socket.git
```

Example of a task
``` javascript

const {Task, Server} = require('hive.socket'),
	Request = require('request.libary');

class TestTask extends Task {

	constructor(c) {
		super({
			...c,
			type: 'default'
		});
	}

	run(task) {
		console.log(task);
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
	let t = new TestTask(config); // task client

	let out = [];
	for (let x = 0; x < 100; x++) {
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
	Promise.all([
		new Promise((resolve) => t.on('connect', () => resolve())), // wait for client to connect
		send(out) // send out task creation
	]).then(() => {
		console.log('setup done');
		setTimeout(() => { // dirty close
			t.close();
			s.close();
		}, 1000);
	});
})();


````