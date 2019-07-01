
const ENUM = require('../enum.js');

class Packet {

	constructor() {
		this.size = {
			1: 1,
			2: 2,
			3: 4,
			4: 4
		};
	}

	parse(a) {
		let out = {
			action: '/ok',
			data: {key: null}
		};
		let length = a.length;
		if (length === 2) {
			out.data.key = a.readUInt8(1);
			return out;
		}
		if (length === 3) {
			out.data.key = a.readUInt16LE(1);
			return out;
		}
		if (length === 5) {
			out.data.key = a.readUInt32LE(1);
			return out;
		}
		throw new Error('wrong packet size');
	}

	stringify(data) {
		let size = Math.ceil(Math.log2((data.key || 1) + 1) / 8);
		let buf = Buffer.alloc(this.size[size] + 1);
		buf[0] = ENUM.ACTION['/ok'];
		if (size === 1) {
			buf.writeUInt8(data.key, 1);
		} else if (size === 2) {
			buf.writeUInt16LE(data.key, 1);
		} else if (size === 4) {
			buf.writeUInt32LE(data.key, 1);
		}
		return buf;
	}

}

module.exports = new Packet();
