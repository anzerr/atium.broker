
const ENUM = require('../enum.js'),
	ok = require('./ok.js');

const a = (b) => ENUM.ACTION[b];

module.exports = {
	parse: {
		[a('/ok')]: (...arg) => ok.parse(...arg),
	},
	stringify: {
		[a('/ok')]: (...arg) => ok.stringify(...arg),
	}
};
