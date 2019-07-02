
let str = {
		'/who': 1,

		'/ping': 2,
		'/pong': 3,

		'/lock': 4,
		'/unlock': 5,

		'/tasks': 6,
		'/relay': 8,
		'/cancel': 9,
		'/add': 10,
		'/run': 11,
		'/event': 12,
		'/next': 13,
		'/ok': 14,
		'/sub': 15,
		'/unsub': 16
	}, code = {};

for (let i in str) {
	code[str[i]] = i;
}

module.exports = {
	ACTION: str,
	CODE: code,

	POOL: {
		LIFE: 1000 * 60 * 10,
		TICK: 1000 * 20,
		THINK: 1000 * 60 * 30
	},
	TIMEOUT: 1000 * 60 * 1,
};
