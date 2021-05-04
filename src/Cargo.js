import itemTypes from './itemTypes.js';
import { shuffle } from './utilities.js';

const CONTENTS = 'contents';
const INPUT = 'input';

class Cargo {
	constructor(size) {
		this.contents = {};
		this.input = {}; // Temporary storage
		this.size = size;
		this.reserved = 0;
	}

	get(key) {
		return (this.contents[key] || 0) + (this.input[key] || 0);
	}

	getKeys() {
		return Object.keys(this.contents)
			.filter((key) => this.contents[key] > 0 || this.input[key] > 0);
	}

	getSpaceUsed() {
		const space = this.getKeys().reduce((sum, key) => sum + this.get(key), 0);
		return space;
	}

	getFreeSpace() {
		return this.size - this.getSpaceUsed() - this.reserved;
	}

	reserveSpace(n = 1) {
		this.reserved = Math.min(this.size, this.reserved + n);
	}

	freeReservedSpace(n = 1) {
		this.reserved = Math.max(0, this.reserved - n);
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
		this.switch(INPUT, CONTENTS);
	}

	switch(fromName = INPUT, toName = CONTENTS) {
		const fromArea = this[fromName];
		for (const key in fromArea) {
			const num = fromArea[key] || 0;
			delete fromArea[key];
			// Don't have to check free space because we assume a check was done when adding to input
			this[toName][key] = (this[toName][key] || 0) + num;
		}
	}

	removeByItemKey(key, fromName = CONTENTS) {
		const fromArea = this[fromName];
		if (!fromArea[key]) return null;
		fromArea[key] -= 1;
		return { key };
	}

	empty(fromName = CONTENTS) {
		const fromArea = this[fromName];
		for (let key in fromArea) delete fromArea[key];
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
