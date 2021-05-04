import vehicleBlockTypes from './vehicleBlockTypes.js';

class DomRenderer {
	constructor() {
		this.elements = {}; // Look-up object
		this.showConnections = true;
		this.highlightConnectionIds = [];
		this.zoom = 1;
	}

	static convertSnakeCaseToPlainText(text) {
		return text.split('-').join(' ');
	}

	static getVehicleCargoHtml(veh) {
		const cargoContents = veh.getCargoContents();
		const itemKeys = Object.keys(cargoContents).sort((a, b) => cargoContents[a] - cargoContents[b]);
		return (
			`<ol>${itemKeys.map((key) => `<li>${cargoContents[key]} ${key}</li>`).join('')}</ol>`
		);
	}

	static getBlockCargoHtml(block) {
		const space = block.getCargoSpace();
		if (space <= 0) return '';
		return (
			`<div>
				<dt>Cargo: (max ${space})</dt>
				<div class="cargo-list">
					${block.mapCargo((key, value) => `<dd>${value} ${key}</dd>`).join('')}
				</div>
			</div>`
		);
	}

	static getMilliSecondsForDisplay(n) {
		if (n <= 0) return '--';
		return (n >= 10000) ? `${Math.floor(n / 1000)}s` : `${Math.floor(n / 100) / 10}s`;
	}

	static getWorkingHtml(block) {
		return (
			`<div>
				<div>Working: ${block.workType || ''}
					${DomRenderer.getMilliSecondsForDisplay(block.workCooldown)}</div>
				<div>Cooldown: ${DomRenderer.getMilliSecondsForDisplay(block.generalCooldown)}</div>
			</div>`
		);
	}

	static getBlockInfoHtml(block) {
		const o = block.typeObject;
		const exclude = ['type', 'category', 'squareSize', 'cost', 'connections', 'powerCapacity', 'cargoSpace'];
		const keys = Object.keys(o).filter((key) => !exclude.includes(key) && o[key] !== 0);
		const costHtml = (!block.costLeft) ? '' : (
			`<div>
				<dt>Build Requirements:</dt>
				${Object.keys(block.costLeft).map((key) => `<dd>${block.costLeft[key]} ${key}</dd>`).join('')}
			</div>`
		);
		return (
			`<dl>
				${costHtml}
				<div>
					<dt>Power:</dt>
					<!-- <dd>${block.power} / ${o.powerCapacity}</dd> -->
					<dd class="${block.on ? 'on' : 'off'}">${block.on ? 'ON' : 'OFF'}</dd>
				</div>
				${keys.map((key) => `<div><dt>${key}</dt><dd>${o[key]}</dd></div>`).join('')}
				${DomRenderer.getWorkingHtml(block)}
				${DomRenderer.getBlockCargoHtml(block)}
			</dl>`
		);
	}

	static setElementSizeAndPosition(elt, width, height, top, left, rotation = 0, zoom = 1) {
		const { style } = elt;
		const w = width * zoom;
		const h = height * zoom;
		style.width = `${width * zoom}vmin`;
		style.height = `${height * zoom}vmin`;
		style.transform = `translate(${left * zoom}vmin, ${top * zoom}vmin) rotate(${rotation}deg)`;
		style.top = `${h/-2}vmin`;
		style.left = `${w/-2}vmin`;
		// style.top = `${top * zoom - (h/2)}vmin`;
		// style.left = `${left * zoom - (w/2)}vmin`;
	}

	addElement(id, container, className = '', tagName = 'div', html = '') {
		if (this.elements[id]) return this.elements[id];
		const eltInDoc = document.querySelector(`#${id}`);
		if (eltInDoc) return eltInDoc;
		const elt = document.createElement(tagName);
		elt.id = id;
		if (className) elt.classList.add(className);
		if (html) elt.innerHTML = html;
		container.appendChild(elt);
		this.elements[id] = elt;
		return elt;
	}

	renderConnection(connection, container, insideBlock, blockSize) {
		const cElt = this.addElement(connection.id, container, 'connection');
		const cStyle = cElt.style;
		let top, left;
		if (insideBlock) {
			top = blockSize.y / 2 +  (connection.relativePos.y); // - (connection.size / 2);
			left = blockSize.x / 2 + (connection.relativePos.x); // - (connection.size / 2);
		} else {
			top = connection.pos.y; // - (connection.size / 2));
			left = connection.pos.x; // - (connection.size / 2));
		}
		DomRenderer.setElementSizeAndPosition(cElt, connection.size, connection.size, top, left, 0, this.zoom);
		// cElt.innerHTML = connection.id;
		cStyle.display = (this.showConnections && !connection.connection) ? 'block' : 'none';
		const highlight = this.highlightConnectionIds.includes(connection.id);
		cElt.classList.toggle('highlight', highlight);
	}

	renderBlockInfo(b, show) {
		const title = `<div class="block-info-title">${DomRenderer.convertSnakeCaseToPlainText(b.type)}</div>`;
		const infoElt = this.addElement(`info-${b.id}`, this.elements.blockInfoWindows, 'block-info', 'aside', title);
		const content = this.addElement(`info-${b.id}-content`, infoElt);
		const uiHtml = (
			`<button type="button" class="demolish" data-blockid="${b.id}">Demolish</button>
			<button type="button" class="power-switch">On/Off</button>
			<button type="button" class="empty">Empty</button>
			<button type="button" class="close">Close</button>`
		);
		const ui = this.addElement(`info-${b.id}-ui`, infoElt, 'block-info-ui', 'div', uiHtml);
		infoElt.classList.add(`b-${b.type}`);
		infoElt.classList.toggle('show', show);
		infoElt.dataset.blockid = b.id;
		if (show) {
			content.innerHTML = DomRenderer.getBlockInfoHtml(b);
		}
	}

	renderBlock(b, vehElt, container) {
		const blockElt = this.addElement(b.id, vehElt, 'block');
		blockElt.tabIndex = 0;
		DomRenderer.setElementSizeAndPosition(blockElt, b.size.x, b.size.y, b.pos.y, b.pos.x, 0, this.zoom);
		blockElt.classList.add(`b-${b.type}`);
		blockElt.classList.toggle('construction', Boolean(b.costLeft));
		blockElt.classList.toggle('off', !b.on);
		// blockElt.style.transform = `rotate(${b.rotation}deg)`;
		const showInfo = blockElt.classList.contains('show-info');
		this.renderBlockInfo(b, showInfo);
		const insideBlock = !container;
		const connectionContainer = container || blockElt;
		b.connections.forEach((connection) => {
			this.renderConnection(connection, connectionContainer, insideBlock, b.size);
		});
		return blockElt;
	}

	renderPilot(container) {
		const pilotElt = this.addElement('pilot', container, 'pilot');
		DomRenderer.setElementSizeAndPosition(pilotElt, 8, 8, -12, 0, 0, this.zoom);
	}
	
	renderVehicle(veh) {
		const vehElt = this.addElement(veh.id, this.elements.vehicles, 'vehicle');
		const { style } = vehElt;
		style.transform = `translate(${veh.pos.x * this.zoom}vmin, ${veh.pos.y * this.zoom}vmin) rotate(${veh.rotation}deg)`;
		this.renderPilot(vehElt);
		const blockIds = [];
		veh.blockSet.forEach((b) => {
			this.renderBlock(b, vehElt, this.elements.connections);
			blockIds.push(b.id);
		});
		this.elements.connections.style.transform = `translate(${veh.pos.x * this.zoom}vmin, ${veh.pos.y * this.zoom}vmin) rotate(${veh.rotation}deg)`;
		// Loop through all block elements, and remove the ones we no longer are tracking
		const blocksCollection = vehElt.querySelectorAll('.block');
		for (let i = 0; i < blocksCollection.length; i++) {
			if (!blockIds.includes(blocksCollection[i].id)) {
				delete this.elements[blocksCollection[i].id];
				blocksCollection[i].remove();
			}
		}
	}

	renderHand(blockInHand) {
		if (!blockInHand) {
			this.elements.hand.innerHTML = '';
			return;
		}
		const blockElt = this.renderBlock(blockInHand, this.elements.hand);
		// Fix because the block in hand should use the full view screen sizes (vw, vh), not vmin
		blockElt.style.top = `calc(${blockInHand.pos.y}vh - ${blockInHand.size.y / 2}vmin)`;
		blockElt.style.left = `calc(${blockInHand.pos.x}vw - ${blockInHand.size.x / 2}vmin)`;
		blockElt.style.transform = '';
		// const blockElt = this.addElement('blockInHand', this.elements.hand, 'block');
		// blockElt.style.top = mouseCoordinates[1] + 'px';
		// blockElt.style.left = mouseCoordinates[0] + 'px';
	}

	renderHole(hole, focusPosition, planetRadius) {
		const elt = this.addElement(hole.id, this.elements.holes, 'hole');
		DomRenderer.setElementSizeAndPosition(elt, hole.size, hole.size, hole.pos.y + planetRadius, planetRadius, hole.rotation, this.zoom);
	}

	renderPlanet(planet, focusPosition) {
		const planetElt = this.elements.planet;
		const planetStyle = planetElt.style;
		const { diameter } = planet;
		const radius = diameter / 2;
		const { x, y } = planet.pos;
		const offsetX = -1 * radius; // - focusPosition.x;
		const offsetY = -1 * radius; // - focusPosition.y;
		DomRenderer.setElementSizeAndPosition(planetElt, diameter, diameter, y, x, 0, this.zoom);
		// planetStyle.top = `${offsetY}vmin`;
		// planetStyle.left = `${offsetX}vmin`;
		// planetStyle.top = 0;
		// planetStyle.left = 0;
		// planetStyle.transform = `translate(${offsetX * this.zoom}vmin, ${offsetY * this.zoom}vmin)`;
		
		const holeIds = [];
		planet.holes.forEach((h) => {
			this.renderHole(h, focusPosition, radius);
			holeIds.push(h.id);
		});
		// Loop through all hole elements, and remove the ones we no longer are tracking
		const holesCollection = this.elements.holes.children;
		for (let i = 0; i < holesCollection.length; i++) {
			if (holeIds.includes(holesCollection[i].id)) { // Got to the list, so stop
				return;
			}
			delete this.elements[holesCollection[i].id];
			holesCollection[i].remove();
		}
	}

	renderBuildUI() {
		vehicleBlockTypes.forEach((vt) => {
			const liElt = this.addElement(vt.type, this.elements.buildBlockList, '', 'li');
			const buttonElt = this.addElement(vt.type + 'button', liElt, '', 'button');
			buttonElt.type = 'button';
			buttonElt.classList.add('build-block');
			buttonElt.classList.add(`b-${vt.type}`);
			buttonElt.innerText = DomRenderer.convertSnakeCaseToPlainText(vt.type);
			buttonElt.dataset.type = vt.type;
		});
	}

	renderFocus(focusPosition) {
		// console.log(this.elements.world.style);
		this.elements.world.style.transform = `translate(${focusPosition.x * this.zoom}vmin, ${-1 * focusPosition.y * this.zoom}vmin)`;
	}

	renderCargo(veh) {
		const { freeSpace, spaceUsed, totalSpace } = veh.getCargoSpace();
		this.elements.totalCargoUsedNumber.innerText = spaceUsed;
		this.elements.totalCargoCapacityNumber.innerText = totalSpace;
		this.elements.totalCargoDetails.innerHTML = DomRenderer.getVehicleCargoHtml(veh);
	}

	renderNumbers({ planet, distToCore, vehicles }) {
		const level = planet.getLevelData(distToCore).level;
		const depth = planet.radius - distToCore;
		this.elements.depthNumber.innerText = Math.round(Math.max(0, depth)).toLocaleString() + ` Level: ${level}`;
	}
	
	render({ vehicles, blockInHand, connections, planet, focusPosition, distToCore, zoom }) {
		this.zoom = 1 / zoom;
		this.showConnections = Boolean(blockInHand);
		this.highlightConnectionIds = connections.map((c) => c?.id);
		vehicles.forEach((v) => this.renderVehicle(v));
		this.renderBuildUI();
		this.renderHand(blockInHand);
		this.renderPlanet(planet, focusPosition);
		this.renderFocus(focusPosition);
		this.renderNumbers({ planet, distToCore, vehicles });
		this.renderCargo(vehicles[0]);
	}

	init() {
		const eltSelectors = {
			vehicles: '.vehicles',
			connections: '.connections',
			planet: '.planet',
			hand: '.hand',
			buildBlockList: '.build-block-list',
			holes: '.holes',
			depthNumber: '.depth-number',
			totalCargoToggle: '#total-cargo-toggle',
			totalCargoUsedNumber: '.total-cargo-used-number',
			totalCargoCapacityNumber: '.total-cargo-capacity-number',
			totalCargoDetails: '.total-cargo-details',
			blockInfoWindows: '.block-info-windows',
			world: '.world',
		};
		for (const key in eltSelectors) {
			this.elements[key] = document.querySelector(eltSelectors[key]);
		}
	}
}

export default DomRenderer;
