
### `Intro`
In memory message broker without result tracking. Useful in dead end tasks.

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
			name: config.tasks[0],
			payload: { // task payload that will be sent to worker
				stuff: x
			}
		});
	}
	Promise.all([
		new Promise((resolve) => t.on('connect', () => resolve())), // wait for client to connect
		send(out) // send out task creation
	]).then(() => {
		console.log('setup done');
		setTimeout(() => {
			t.close();
			s.close();
		}, 1000);
	});
})();


````