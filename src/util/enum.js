
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
		'/run': 11
	}, code = {};

for (let i in str) {
	code[str[i]] = i;
}

module.exports = {
	ACTION: str,
	CODE: code
};
