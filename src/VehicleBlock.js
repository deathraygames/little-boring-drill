import vehicleBlockTypes from './vehicleBlockTypes.js';
import itemTypes from './itemTypes.js';
import { getUniqueId, shuffle, rotate } from './utilities.js';
import Vehicle from './Vehicle.js';
import Cargo from './Cargo.js';

let i = 0;

class VehicleBlockConnection {
	constructor(block, x = 0, y = 0, size = 4) {
		this.parentBlock = block;
		this.id = 'c-' + (i++) + '-' + block.id;
		this.relativePos = { x, y };
		this.pos = {
			x: block.pos.x + x,
			y: block.pos.y + y,
		};
		this.size = size;
		this.connection = null;
	}

	setRelativePos(x, y) {
		this.relativePos.x = x;
		this.relativePos.y = y;
		this.pos.x = this.parentBlock.pos.x + x;
		this.pos.y = this.parentBlock.pos.y + y;
	}
}

class VehicleBlock {
	constructor(type = 'hull', x = 0, y = 0) {
		this.type = type;
		this.typeObject = vehicleBlockTypes.get(type);
		this.pos = { x, y };
		this.size = { x: this.typeObject.squareSize, y: this.typeObject.squareSize };
		this.id = 'vb-' + getUniqueId();
		this.cost = this.typeObject.cost;
		this.costLeft = { ...this.cost };
		this.cargo = new Cargo(this.typeObject.cargoSpace);
		this.power = 0;
		this.rotation = 0;
		this.on = false;
		this.connections = this.typeObject.connections.map((arr) => {
			return new VehicleBlockConnection(this, arr[0] * (this.size.x/2), arr[1] * (this.size.y/2));
		});
		this.updateConnectionPositions();
	}

	reId() {
		this.id = 'vb-' + getUniqueId();
	}

	updateConnectionPositions() {
		this.connections.forEach((c) => {
			c.pos.x = this.pos.x + c.relativePos.x;
			c.pos.y = this.pos.y + c.relativePos.y;
		});
	}

	setPosition(x, y) {
		this.pos.x = x;
		this.pos.y = y;
		this.updateConnectionPositions();
	}

	setRotation(deg = 0) {
		this.rotate(-1 * this.rotation); // Rotate back to zero
		this.rotate(deg);
	}

	rotate(deg = 90) {
		this.rotation += deg;
		this.connections.forEach((c) => {
			const radians = deg * Math.PI / 180;
			const newPos = rotate(c.relativePos.x, c.relativePos.y, radians);
			c.setRelativePos(newPos.x, newPos.y);
		});
	}

	isOperational() {
		return (!this.costLeft && this.on); // && this.power); // TODO: has power
	}

	// Cargo pass-through methods
	addCargo(item) { return this.cargo.addInput(item); }
	emptyCargo() { return this.cargo.empty(); }
	removeCargoByProperty(propName) { return this.cargo.removeByProperty(propName); }
	removeCargoByItemKey(key) { return this.cargo.removeByItemKey(key); }
	processCargoInput() { return this.cargo.processInput(); }
	// getCargoKeys() { return this.cargo.getKeys(); }
	getCargoSpace() { return this.cargo.size; }
	getCargoSpaceUsed() { return this.cargo.getSpaceUsed(); }
	getFreeSpace() { return this.cargo.getFreeSpace(); }
	mapCargo(fn) {
		return this.cargo.getKeys().map((key, i) => fn(key, this.cargo.get(key), i))
	}

	getNeighbors() {
		const connectedConnections = this.connections.filter((c) => c.connection);
		const connectedBlocks = connectedConnections.map((c) => c.connection.parentBlock);
		return connectedBlocks;
	}

	// getBlockCenter() {
	// 	return {
	// 		x: this.pos.x - (this.size.x / 2),
	// 		y: this.pos.y - (this.size.y / 2),
	// 	};
	// }

	getFreeConnections() {
		return this.connections.filter((c) => !c.block);
	}

	hasCapability(name) {
		return this.typeObject[name] > 0;
	}

	construct(itemKey, num = 1) {
		if (!this.costLeft[itemKey]) return false;
		this.costLeft[itemKey] -= num;
		const leftCount = Object.keys(this.costLeft).reduce((sum, key) => sum + this.costLeft[key], 0);
		if (leftCount <= 0) this.costLeft = 0;
	}

	pullFromNeighborsByProperty(propName, takeHowMany = Infinity) {
		const taken = [];
		this.getNeighbors().forEach((n) => {
			if (taken.length >= takeHowMany) return taken;
			// TODO: Handle ability to take multiple items from neighbors (i.e., more than 4 total)
			const removedItem = n.removeCargoByProperty(propName);
			if (removedItem) {
				// console.log('Refinery', this.type, 'removing', removedItem, 'from', n.type);
				this.cargo.addInput(removedItem);
				taken.push(removedItem);
			}
		});
		return taken;
	}

	refine(t) {
		if (!this.hasCapability('refining') || this.getCargoSpaceUsed() <= 0 || !this.isOperational()) return;
		const item = this.removeCargoByProperty('refineTo');
		if (!item) return;
		this.usePower(1);
		const newItem = { key: itemTypes[item.key].refineTo };
		// console.log('Refining to', newItem.key, 'in', this.type);
		this.cargo.addInput(newItem);
	}

	print(t) {
		if (!this.hasCapability('printing') || this.getCargoSpaceUsed() <= 0 || !this.isOperational()) return;
		const item = this.removeCargoByProperty('printTo');
		if (!item) return;
		this.usePower(1);
		const newItem = { key: itemTypes[item.key].printTo };
		// console.log('Printing to', newItem.key, 'in', this.type);
		this.cargo.addInput(newItem);
	}

	usePower(n) {
		this.power = Math.max(0, this.power - n);
	}

	generatePower(t) {
		if (!this.costLeft) return;
		// TODO: Use time
		this.power = Math.min(this.typeObject.powerCapacity, this.power + this.typeObject.powering);
	}
}

export default VehicleBlock;
