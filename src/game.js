import Vehicle from './Vehicle.js';
import VehicleBlock from './VehicleBlock.js';
import DomRenderer from './DomRenderer.js';
import Zoomer from './Zoomer.js';
import { getUniqueId, getDistance, shuffleOne } from './utilities.js';
import Planet from './Planet.js';

console.log('game');

const MAX_SPEED = 15;
const CORE_ACHIEVEMENT = 'reached the core';
const TICK_TIME = 100; // ms
const MAX_HOLES = 200;
const focusPosition = { x: 0, y: 0 };
const zoomer = new Zoomer();
const renderer = new DomRenderer();
const vehicles = new Set();
const achievements = {};
const drill = new Vehicle();

let planetMultiplier = 1;
let planet = new Planet();
vehicles.add(drill);
drill.pos.y = (planet.radius * -1) - 14;
drill.addBlock('mini-dome', 0, -13);
drill.addBlock('survival-core', 0, 0);
drill.addBlock('aluminum-cargo-drill', 0, 12);
drill.magicBuild();
// drill.addBlock('hull', -10, 0);
// drill.addBlock('hull', 10, 0);

let showIntro = true;
let blockInHand = null; // new VehicleBlock(0, 0);
let mouseCoordinates = [];
let looping = true;
let tick = 0;
let tickTimerId = 0;

function restart() {
	stopLoops();
	if (!confirm('Fly to a new planet?')) {
		startLoops();
		return;
	}
	achievements[CORE_ACHIEVEMENT] = false;
	planetMultiplier += 1;
	planet = new Planet(planetMultiplier);
	drill.pos.y = (planet.radius * -1) - 14;
	startLoops();
}

function addHole() {
	const drills = drill.getOperationalDrills();
	if (drills.length <= 0) return;
	const holeDrill = shuffleOne(drills);
	planet.holes.push({
		id: `hole-${getUniqueId()}`,
		size: drill.getDrillSize(),
		rotation: Math.round(Math.random() * 360),
		pos: {
			x: drill.pos.x + holeDrill.pos.x,
			y: drill.pos.y + holeDrill.pos.y
		},
	});
	if (planet.holes.length > MAX_HOLES) planet.holes.shift();
}

function setBlockInHandPosition() {
	if (!blockInHand) return;
	blockInHand.setPosition(
		100 * (mouseCoordinates[0] / window.innerWidth),
		100 * (mouseCoordinates[1] / window.innerHeight),
	);
}

// function findBlock(id) {
// 	vehicles.forEach((v) => {
// 		const foundBlock = v.getBlocksArray().find((b) => (b.id === id));
// 		if (foundBlock) return foundBlock;
// 	}
// }

function findConnections() {
	if (!blockInHand) return [];
	// const blockHandElt = document.getElementById(blockInHand.id);
	let minDistance = 200;
	let connections = [null, null];
	// TODO: Refactor to use `pos` rather than DOM coordinates?
	blockInHand.connections.forEach((handConnection) => {
		const handConnectionElt = document.getElementById(handConnection.id);
		if (!handConnectionElt) return;
		const handRect = handConnectionElt.getBoundingClientRect();
		vehicles.forEach((v) => v.blockSet.forEach((b) => b.connections.forEach((c) => {
			if (c.connection) return;
			const connectionElt = document.getElementById(c.id);
			if (!connectionElt) return;
			const cRect = connectionElt.getBoundingClientRect();
			const d = getDistance(handRect.left, handRect.top, cRect.left, cRect.top);
			if (d < minDistance) {
				minDistance = d;
				connections[0] = handConnection;
				connections[1] = c;
			}
		})));
	});
	return connections;
}

function getSpeed(hardness) {
	const power = drill.getDrillPower();
	const speed = (hardness === 0) ? power * 2 : power / hardness;
	if (tick % 10 === 0) { console.log('power', power, 'hardness', hardness, 'speed', speed); }
	return Math.min(speed, MAX_SPEED);
}

function getTickDistance(level) {
	// TODO: incorporate TICK_TIME
	return Math.random() * getSpeed(level.hardness);
}

function achieve(name) {
	if (achievements[name]) return true;
	achievements[name] = true;
	alert(`You achieved '${name}'!`);
}

function didAchieve(name) {
	return Boolean(achievements[name]);
}

function handleFrame(now) {
	if (!looping) return;
	setBlockInHandPosition();
	const connections = findConnections();
	const distToCore = getDistance(0, 0, drill.pos.x, drill.pos.y);
	focusPosition.y += .05; // TODO: Move towards drill pos at a speed that makes sense
	renderer.render({
		vehicles, blockInHand, connections, planet, distToCore, focusPosition,
		zoom: zoomer.getZoom(),
	});
	if (Math.random() < 0.02 && drill.getDrillCount()) {
		// TODO: Move to doTick if this isn't purely cosmetic
		addHole();
		drill.rotation += (Math.random() * 3) - (Math.random() * 3);
	}
	window.requestAnimationFrame(handleFrame);
}

function getMinedItems(level, planetRadius, distToCore) {
	if (!level.dropItemKey) return [];
	if (Math.random() > 0.05) return; // TODO: Base this on radius?
	let dropLevel = level; // Usually give the basic drop item for the level
	if (Math.random() < 0.3) { // Sometimes (30%?) give an item from a random previous level
		const randRadius = distToCore + ((planetRadius - distToCore) * Math.random());
		dropLevel = planet.getLevelData(randRadius);
	}
	return [{ key: dropLevel.dropItemKey }];
}

function doTick() {
	if (!looping) return;
	tick++;
	const distToCore = getDistance(0, 0, drill.pos.x, drill.pos.y);
	const level = planet.getLevelData(distToCore);
	// Make sure the focus catches up to last position
	focusPosition.x = drill.pos.x;
	focusPosition.y = drill.pos.y;
	// Update drill position
	drill.pos.y += getTickDistance(level);
	// Check achievements
	if (drill.pos.y < 2 && drill.pos.y > -2) achieve(CORE_ACHIEVEMENT);
	if (distToCore > planet.radius && didAchieve(CORE_ACHIEVEMENT)) restart();
	// Drilling uncovers items
	const freeItems = getMinedItems(level, planet.radius, distToCore);
	drill.run(TICK_TIME, freeItems);
	// addHole();
	tickTimerId = window.setTimeout(doTick, TICK_TIME);
}

function getMousePosition(e) { // fix for Chrome
	const eFixed = (e.type.startsWith('touch')) ? e.targetTouches[0] : e;
	return [eFixed.pageX, eFixed.pageY];
}

function toggleBuildMenu() {
	document.querySelector('.build-category-list').classList.toggle('open');
}

function addBlockInHand() {
	const connections = findConnections();
	if (connections.length < 2 || !connections[0] || !connections[1]) {
		blockInHand = null;
		return;
	}
	const newBlock = drill.addBlock(blockInHand.type, 0, 0, findConnections());
	newBlock.setRotation(blockInHand.rotation);
	blockInHand = null;
}

function dismissIntroduction() {
	if (!showIntro) return;
	showIntro = false;
	document.querySelectorAll('.intro').forEach((elt) => elt.classList.add('dismiss'));
}

function onMouseUp(e) {
	dismissIntroduction();
	if (!blockInHand || e.which === 3) return;
	console.log('mouse up', e.target);
	// if (e.target.closest('.rotate-build') && blockInHand) {
	// 	blockInHand.rotate(90);
	// 	return;
	// } else if (e.target.closest('.cancel-build')) {
	// 	blockInHand = null;
	// 	return;
	// }
	// Add new part?
	addBlockInHand();
}

function setupInput() {
	document.querySelector('.build-ui').addEventListener('click', (e) => {
		console.log(e.target.classList);
		const { classList } = e.target;
		if (classList.contains('toggle-build-menu')) {
			toggleBuildMenu();
		} else if (classList.contains('build-block')) {
			blockInHand = new VehicleBlock(e.target.dataset.type);
			// blockInHand.rotate(90);
			blockInHand.costLeft = 0;
			toggleBuildMenu();
		}
	});
	document.querySelector('.vehicles').addEventListener('click', (e) => {
		const { classList } = e.target;
		if (classList.contains('block')) {
			e.target.classList.toggle('show-info');
		}
	});
	document.querySelector('.block-info-windows').addEventListener('click', (e) => {
		const { classList } = e.target;
		const blockInfo = e.target.closest('.block-info');
		const blockId = blockInfo?.dataset.blockid;
		const isDemolish = classList.contains('demolish');
		if (classList.contains('close') || isDemolish) {
			blockInfo.classList.remove('show');
			document.getElementById(blockId).classList.remove('show-info');
		}
		if (isDemolish) {
			drill.demolish(blockId);
		} else if (classList.contains('power-switch')) {
			const block = drill.findBlockById(blockId);
			if (block) block.on = !block.on;
		} else if (classList.contains('empty')) {
			const block = drill.findBlockById(blockId);
			if (block) block.emptyCargo();
		}
	});
	document.addEventListener('mousemove', (e) => mouseCoordinates = getMousePosition(e));
	document.addEventListener('touchmove', (e) => mouseCoordinates = getMousePosition(e));
	window.oncontextmenu = (e) => {
		console.log('context menu', e);
		if (blockInHand) {
			blockInHand = null;
			e.preventDefault();
		}
	};
	document.addEventListener('mouseup', onMouseUp);
	document.addEventListener('touchend', onMouseUp);
	window.addEventListener('keypress', (e) => {
		switch (e.key.toUpperCase()) {
			case 'R': { if (blockInHand) blockInHand.rotate(90); } break;
		}
		console.log(e.key);
	});
	zoomer.setup();
}

function startLoops() {
	looping = true;
	handleFrame();
	doTick();
}

function stopLoops() {
	looping = false;
	window.clearTimeout(tickTimerId);
}

const init = async () => {
	renderer.init();
	setupInput();
	startLoops();
};

document.addEventListener('DOMContentLoaded', init);

window.g = {
	renderer,
	startLoops,
	stopLoops,
	drill,
	planet,
};
