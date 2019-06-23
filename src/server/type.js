
class Type {

	constructor() {
		this.map = {};
	}

	get(name, key) {
		if (!this.map[name]) {
			this.map[name] = {};
		}
		let i = 0;
		while (this.map[name][`${name}:${i}`]){
			i++;
		}
		this.map[name][`${name}:${i}`] = key;
		return `${name}:${i}`;
	}

	free(id) {
		let i = id.split(':');
		if (this.map[i[0]][id]) {
			this.map[i[0]][id] = null;
			return true;
		}
		return false;
	}

}

module.exports = Type;
