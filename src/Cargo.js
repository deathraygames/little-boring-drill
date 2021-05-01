import itemTypes from './itemTypes.js';
import { shuffle } from './utilities.js';

const CONTENTS = 'contents';
const INPUT = 'input';

class Cargo {
	constructor(size) {
		this.contents = {};
		this.input = {}; // Temporary storage
		this.size = size;
	}

	get(key) {
		return (this.contents[key] || 0) + (this.input[key] || 0);
	}

	getKeys() {
		return Object.keys(this.contents)
			.filter((key) => this.contents[key] > 0 || this.input[key] > 0);
	}

	getSpaceUsed() {
		return this.getKeys().reduce((sum, key) => sum + this.get(key), 0);
	}

	getFreeSpace() {
		return this.size - this.getSpaceUsed();
	}

	static add(cargo, itemKey, num = 1, where = CONTENTS) {
		let left = num;
		while (left > 0) {
			if (cargo.getFreeSpace() <= 0) return left;
			// console.log('Adding cargo', item.key, 'to', this.type);
			cargo[where][itemKey] = (cargo[where][itemKey] || 0) + 1;
			left -= 1;
		}
		return left;
	}

	add(item, num = 1) {
		return Cargo.add(this, item.key, num, CONTENTS);
	}

	addInput(item, num = 1) {
		if (!this.contents[item.key]) this.contents[item.key] = 0; // Make sure the cargo object has this key
		return Cargo.add(this, item.key, num, INPUT);
	}

	processInput() {
		for (const key in this.input) {
			const num = this.input[key] || 0;
			delete this.input[key];
			// Don't have to check free space because we assume a check was done when adding to input
			this.contents[key] = (this.contents[key] || 0) + num;
		}
	}

	removeByItemKey(key) {
		if (!this.contents[key]) return null;
		this.contents[key] -= 1;
		return { key };
	}

	empty() {
		for (let key in this.contents) delete this.contents[key];
	}

	removeByProperty(propName) {
		const itemKeys = this.getKeys().filter((key) => {
			return itemTypes[key] && itemTypes[key][propName];
		});
		if (itemKeys.length <= 0) return null;
		shuffle(itemKeys); // TODO: could make this more efficient since we're just picking one item
		return this.removeByItemKey(itemKeys[0]);
	}
}

export default Cargo;
