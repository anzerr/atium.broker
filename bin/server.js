
console.log('.'); // docker sanity check

const {Server} = require('../index.js');

new Server({
	socket: process.env.socket || '0.0.0.0:3000',
	api: process.env.api || '0.0.0.0:8080',
});
