
const ENUM = require('./enum.js');

class Packet {

	constructor() {}

	parse(a) {
		if (Buffer.isBuffer(a)) {
			let json = null;
			if (!ENUM.CODE[a[0]]) {
				throw new Error('not a valid code are we using the same protocol?');
			}
			if (a.length > 1) {
				json = JSON.parse(a.slice(1, a.length).toString());
			}
			let action = ENUM.CODE[a[0]] || a[0];
			return json ? {
				action: action,
				data: json
			} : {action: action};
		}
		throw new Error('not recived a buffer to be parsed');
	}

	stringify(a) {
		if (a.action) {
			if (a.data) {
				let json = JSON.stringify(a.data), buf = Buffer.alloc(json.length + 1);
				buf[0] = ENUM.ACTION[a.action] || 0;
				buf.write(json, 1);
				return buf;
			}
			return Buffer.from([ENUM.ACTION[a.action] || 0]);
		}
		throw new Error('missing elements for the packet to be built');
	}

}

module.exports = new Packet();
