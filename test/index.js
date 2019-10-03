
const client = require('./example/client.js'),
	core = require('../index.js'),
	assert = require('assert'),
	time = require('../src/util/time.js'),
	Request = require('request.libary');

const config = {
	socket: 'localhost:3001',
	api: 'localhost:3002',
	tasks: ['task_10001'],
	log: false,
	fast: process.argv[2] === 'fast'
};

let done = {task: false, worker: false, set: {}, max: 10, runs: 10, part: 100, tasks: 10};

process.on('unhandledRejection', (error) => {
	console.log(error);
	process.exit(1);
});

const metric = () => {
	return new Request(`http://${config.api}`).get('/metric').then((res) => {
		return res.parse();
	}).catch((e) => {
		console.log(e);
	});
};

const send = (task) => {
	let last = '';
	return new Request(`http://${config.api}`).json(task).post('/add').then((res) => {
		last = res.body().toString();
		assert.equal(res.status(), 200);
		assert.equal(last, `${done.part * done.tasks}`);
	}).catch((e) => {
		console.log(e, last);
		process.exit(1);
	});
};

console.log('started server');
new core.Server(config);

const eventClient = new core.Event(config);
eventClient.init().then(() => {
	eventClient.subscribe('task_done');

	const eventDone = {};
	eventClient.on('event:task_done', (msg) => {
		eventDone[msg.task.stuff] = true;
	});

	let wait = [];
	for (let i = 0; i < done.runs; i++) {
		if (!wait[i % 10]) {
			wait[i % 10] = Promise.resolve();
		}
		((n) => {
			wait[i % 10] = wait[i % 10].then(() => {
				let out = [];
				for (let x = 0; x < done.part; x++) {
					let tasks = [];
					for (let v = 0; v < done.tasks; v++) {
						tasks.push({
							task: config.tasks[0],
							input: {
								stuff: n + (x * done.tasks) + v
							}
						});
					}
					out.push({tasks: tasks});
				}
				// console.log(n, out);
				return send(out);
			});
		})((i * done.part * done.tasks) + 1);
	}

	let start = process.hrtime();
	setInterval(() => {
		let missing = 0, max = done.runs * done.part * done.tasks;
		for (let i = 0; i < max; i++) {
			if (!done.set[i + 1]) {
				missing++;
			}
		}

		if (missing !== 0) {
			return console.log('missing tasks', missing);
		}

		return metric().then((res) => {
			assert.equal(res.pool.live, 0);
			assert.equal(res.pool.next, 0);
			assert.equal(Object.keys(res.client).length, done.tasks + 1);
			for (let i in res.client) {
				assert.equal(res.client[i].isAlive, true);
				if (res.client[i].tasks.length === 0) {
					assert.equal(res.client[i].polled.tick < 1000, true);
				}
			}
			if (!config.fast) {
				for (let i in done.set) {
					assert.equal(done.set[i], eventDone[i]);
				}
				assert.equal(Object.keys(done.set).length, Object.keys(eventDone).length);
			}
			if (done.task && done.worker) {
				let t = time.diff(process.hrtime(start));
				console.log('done all works', (t / 1e9), 'sec', (max / (t / 1e9)).toFixed(3));
				process.exit(0);
			} else {
				throw new Error('something is wrong');
			}
		}).catch((err) => {
			console.log(err);
			process.exit(1);
		});
	}, 100);

	console.log('sending tasks');
	Promise.all(wait).then(() => {
		done.task = true;
		console.log('sent tasks');
	}).then(() => {
		let worker = [];
		for (let i = 0; i < done.max; i++) {
			worker.push(new Promise((resolve) => {
				client(config, (n) => done.set[n] = true)
					.on('event:task_done', (msg) => {
						assert.equal((Object.keys(msg).length === 0 || typeof msg.task.stuff === 'number'), true);
					})
					.on('connect', () => resolve());
			}));
		}
		return Promise.all(worker);
	}).then(() => {
		done.worker = true;
		console.log('workers done');
		start = process.hrtime();
	}).then(() => {
		console.log('setup done');
	}).catch((e) => console.log('e2', e));
});
