
const client = require('./client.js'),
	core = require('../index.js'),
	assert = require('assert'),
	time = require('../src/util/time.js'),
	Request = require('request.libary');

const config = {
	socket: 'localhost:3001',
	api: 'localhost:3002',
	tasks: ['task_10001'],
	log: false
};

let done = {task: false, worker: false, set: {}, max: 10, runs: 10, part: 1000};

const send = (task) => {
	return new Request(`http://${config.api}`).json(task).post('/add').then((res) => {
		assert.equal(res.status(), 200);
		assert.equal(res.body().toString(), `pushed task "${done.part}" in the pool.`);
	}).catch((e) => {
		console.log(e);
		process.exit(1);
	});
};

console.log('started server');
new core.Server(config);

let wait = [];
for (let i = 0; i < done.runs; i++) {
	if (!wait[i % 10]) {
		wait[i % 10] = Promise.resolve();
	}
	((n) => {
		wait[i % 10] = wait[i % 10].then(() => {
			let out = [];
			for (let x = 0; x < done.part; x++) {
				out.push({
					name: config.tasks[0],
					payload: {
						stuff: n + x
					}
				});
			}
			return send(out);
		});
	})((i * done.part) + 1);
}

let start = process.hrtime();
setInterval(() => {
	let missing = 0, max = done.runs * done.part;
	for (let i = 0; i < max; i++) {
		if (!done.set[i + 1]) {
			missing++;
		}
	}
	if (missing !== 0) {
		return console.log('missing tasks', missing);
	}
	if (done.task && done.worker) {
		let t = time(process.hrtime(start));
		console.log('done all works', (t / 1e9), 'sec', (max / (t / 1e9)).toFixed(3));
		process.exit(0);
	} else {
		throw new Error('something is wrong');
	}
}, 100);

let worker = [];
for (let i = 0; i < done.max; i++) {
	worker.push(new Promise((resolve) => client(config, (n) => done.set[n] = true).on('connect', () => resolve())));
}
Promise.all(worker).then(() => {
	done.worker = true;
	console.log('workers done');
});

console.log('sending tasks');
Promise.all(wait).then(() => {
	done.task = true;
	console.log('sent tasks');
}).then(() => {
	console.log('setup done');
}).catch((e) => console.log('e2', e));
