import VehicleBlock from './VehicleBlock.js';
import { getUniqueId, shuffle, shuffleOne } from './utilities.js';

class Vehicle {
	constructor() {
		this.blockSet = new Set();
		this.id = `veh-${getUniqueId()}`;
		this.pos = {
			x: 0,
			y: 0,
		};
		this.rotation = 0;
	}

	getBlocks() {
		return this.blockSet.values();
	}

	getBlocksArray() {
		return Array.from(this.blockSet);
	}

	getShuffledBlocksArray() {
		return shuffle(this.getBlocksArray());
	}

	findBlockById(id) {
		return this.getBlocksArray().find((b) => b.id === id);
	}

	reconnectAll() {
		this.blockSet.forEach((b) => b.connections.forEach((c) => {
			c.connection = null;
			this.blockSet.forEach((innerBlock) => innerBlock.connections.forEach((innerC) => {
				if (innerC === c) return; // Don't check self
				// If connections are on top of each other, then they're connected
				if (innerC.pos.x === c.pos.x && innerC.pos.y === c.pos.y) {
					c.connection = innerC;
					innerC.connection = c;
				}
			}));
		}));
	}

	addBlock(type, x, y, [newConnection = null, existingConnection = null] = []) {
		// console.log(newConnection, existingConnection);
		if (newConnection && existingConnection) {
			const connectPos = existingConnection.pos;
			x = connectPos.x - newConnection.relativePos.x;
			y = connectPos.y - newConnection.relativePos.y;
			console.log('Add block based on connections', newConnection, existingConnection, '\n', x, y);
		}
		const newBlock = new VehicleBlock(type, x, y);
		console.log('Adding block', newBlock);
		// TODO: Check for overlap of x/y/size
		this.blockSet.add(newBlock);
		this.reconnectAll();
		return newBlock;
	}

	magicBuild() {
		this.blockSet.forEach((b) => b.costLeft = 0);
	}

	getCargoSpace() {
		let freeSpace = 0;
		let spaceUsed = 0;
		let totalSpace = 0;
		this.getBlocksArray().forEach((b) => {
			const blockSpaceUsed = b.getCargoSpaceUsed();
			const blockCargoSize = b.getCargoSpace();
			freeSpace += (blockCargoSize - blockSpaceUsed);
			spaceUsed += blockSpaceUsed;
			totalSpace += blockCargoSize;
		});
		return { freeSpace, spaceUsed, totalSpace };
	}

	getCargoContents() {
		const contents = {};
		this.getBlocksArray().forEach((b) => {
			b.cargo.getKeys().forEach((itemKey) => {
				contents[itemKey] = (contents[itemKey] || 0) + b.cargo.get(itemKey);
			});
		});
		return contents;
	}

	getOperationalDrills() {
		return this.getBlocksArray().filter((b) => b.hasCapability('drilling') && b.isOperational());
	}

	getDrillCount() {
		return this.getOperationalDrills().length;
	}

	getDrillPower() {
		return this.getOperationalDrills().reduce((sum, b) => Math.pow(b.typeObject.drilling, 2) + sum, 0);
	}

	getDrillMaxTier() {
		return this.getOperationalDrills().reduce((max, b) => Math.max(max, b.typeObject.drilling), 0);
	}

	getDrillSize() {
		return 12 + (4 * this.getDrillCount()); // 16 is Good size for starter drill
	}

	removeCargoByItemKey(key) {
		const blocks = this.getShuffledBlocksArray();
		for(let i = 0; i < blocks.length; i++) {
			const item = blocks[i].removeCargoByItemKey(key);
			if (item) return item;
		}
		return null;
	}

	construct(t) {
		const unconstructed = this.getShuffledBlocksArray().filter((b) => b.costLeft);
		if (unconstructed.length <= 0) return;
		let i = 0;
		const costLeftKeys = Object.keys(unconstructed[i].costLeft).filter((key) => unconstructed[i].costLeft[key] > 0);
		const itemKey = shuffleOne(costLeftKeys);
		const item = this.removeCargoByItemKey(itemKey);
		if (!item) {
			// console.log('Could not find', itemKey, 'so aborting construct');
			return;
		}
		unconstructed[i].construct(itemKey, 1);
	}

	demolish(blockId) {
		const block = this.findBlockById(blockId);
		if (!block) return false;
		this.blockSet.delete(block);
		this.reconnectAll();
		return true;
	}

	collectOre(freeItems) {
		if (freeItems.length <= 0) return;
		const drills = this.getShuffledBlocksArray().filter((b) => b.hasCapability('drilling') && b.getFreeSpace() > 0 && b.isOperational());
		if (drills.length <= 0) return;
		shuffle(freeItems);
		let i = 0;
		freeItems.forEach((item) => {
			// TODO: Cycle between drills
			// TODO: Use power
			const drill = drills[i];
			const left = drill.addCargo(item);
			if (left === 0) {
				item.collectedBy = drill.id;
			}
		});
	}

	collect(t, freeItems = []) {
		this.collectOre(freeItems);
		// TODO: Collect refined items into cargo spaces
	}

	print(t) {
		// const refineries = this.getShuffledBlocksArray().filter((b) => b.hasCapability('refining') && b.getCargoSpaceUsed() > 0);
		this.blockSet.forEach((b) => b.print(t));
	}

	refine(t) {
		// const refineries = this.getShuffledBlocksArray().filter((b) => b.hasCapability('refining') && b.getCargoSpaceUsed() > 0);
		this.blockSet.forEach((b) => b.refine(t));
	}

	supportLife(t) {
		// TODO
	}

	convey(t) {
		const shuffledBlocks = this.getShuffledBlocksArray();
		const getFreeOperationalPullingBlocksByCapability = (capability) => {
			return shuffledBlocks.filter((b) => {
				return b.hasCapability(capability)
					&& b.hasCapability('pulling')
					&& b.getFreeSpace() > 0
					&& b.isOperational()
					&& b.isReadyForWork();
			});
		};
		// Refineries pull first
		const refineries = getFreeOperationalPullingBlocksByCapability('refining');
		refineries.forEach((b) => b.pullFromNeighborsByProperty('refineTo', b.typeObject.pulling));
		// Then printers pull
		const printers = getFreeOperationalPullingBlocksByCapability('printing');
		printers.forEach((b) => b.pullFromNeighborsByProperty('printTo', b.typeObject.pulling));
		// Anything that can pull will pull a `pulls` type of item
		const pullers = getFreeOperationalPullingBlocksByCapability('pulling');
		pullers.forEach((b) => {
			const { pulls, pulling } = b.typeObject;
			if (pulls) b.pullFromNeighborsByProperty(pulls, pulling);
		});
		// TODO: Then conveyer belts pull and push
		// Finish the move by processing cargo coming in
		this.blockSet.forEach((b) => b.processCargoInput());
	}

	run(t, freeItems) {
		this.construct(t);
		this.collect(t, freeItems);
		this.print(t);
		this.refine(t);
		this.supportLife(t);
		this.convey(t);
		this.blockSet.forEach((b) => {
			b.cool(t);
			b.generatePower(t);
		});
	}
}

export default Vehicle;
