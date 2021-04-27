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
		const cargoList = (o.cargoSpace <= 0) ? '' : (
			`<div>
				<dt>Cargo: (max ${o.cargoSpace})</dt>
				<div class="cargo-list">
					${block.getCargoKeys().map((key) => `<dd>${block.cargo[key]} ${key}</dd>`).join('')}
				</div>
			</div>`
		);
		return (
			`<dl>
				${costHtml}
				<div><dt>Power:</dt><dd>${block.power} / ${o.powerCapacity}</dd><dd>${block.on ? 'ON' : 'OFF'}</dd></div>
				${keys.map((key) => `<div><dt>${key}</dt><dd>${o[key]}</dd></div>`).join('')}
				${cargoList}
			</dl>`
		);
	}

	static setElementSizeAndPosition(elt, width, height, top, left, zoom = this.zoom) {
		const { style } = elt;
		style.width = `${width}vmin`;
		style.height = `${height}vmin`;
		style.top = `${top}vmin`;
		style.left = `${left}vmin`;
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
			top = blockSize.y / 2 +  (connection.relativePos.y - (connection.size / 2));
			left = blockSize.x / 2 + (connection.relativePos.x - (connection.size / 2));
		} else {
			top = (connection.pos.y - (connection.size / 2));
			left = (connection.pos.x - (connection.size / 2));
		}
		DomRenderer.setElementSizeAndPosition(cElt, connection.size, connection.size, top, left);
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
		const blockCenter = b.getBlockCenter();
		DomRenderer.setElementSizeAndPosition(blockElt, b.size.x, b.size.y, blockCenter.y, blockCenter.x);
		blockElt.classList.add(`b-${b.type}`);
		blockElt.classList.toggle('construction', Boolean(b.costLeft));
		blockElt.classList.toggle('off', !b.on);
		blockElt.style.transform = `rotate(${b.rotation}deg)`;
		const showInfo = blockElt.classList.contains('show-info');
		this.renderBlockInfo(b, showInfo);
		b.connections.forEach((connection) => {
			const insideBlock = !container;
			this.renderConnection(connection, container || blockElt, insideBlock, b.size);
		});
		return blockElt;
	}

	renderPilot(container) {
		const pilotElt = this.addElement('pilot', container, 'pilot');
		DomRenderer.setElementSizeAndPosition(pilotElt, 8, 8, -16, -4);
	}
	
	renderVehicle(veh) {
		const vehElt = this.addElement(veh.id, this.elements.vehicles, 'vehicle');
		const { style } = vehElt;
		style.transform = `rotate(${veh.rotation}deg)`;
		this.renderPilot(vehElt);
		const blockIds = [];
		veh.blockSet.forEach((b) => {
			this.renderBlock(b, vehElt, this.elements.connections);
			blockIds.push(b.id);
		});
		this.elements.connections.style.transform = `rotate(${veh.rotation}deg)`;
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
		// const blockElt = this.addElement('blockInHand', this.elements.hand, 'block');
		// blockElt.style.top = mouseCoordinates[1] + 'px';
		// blockElt.style.left = mouseCoordinates[0] + 'px';
	}

	renderHole(hole, focusPosition, planetRadius) {
		const elt = this.addElement(hole.id, this.elements.holes, 'hole');
		const halfHoleSize = hole.size / 2;
		DomRenderer.setElementSizeAndPosition(elt, hole.size, hole.size, hole.pos.y + planetRadius, planetRadius - halfHoleSize);
		const style = elt.style;
		style.transform = `rotate(${hole.rotation}deg)`;
	}

	renderPlanet(planet, focusPosition) {
		const planetElt = this.elements.planet;
		const planetStyle = planetElt.style;
		const { diameter } = planet;
		const radius = diameter / 2;
		const offsetX = -1 * radius - focusPosition.x;
		const offsetY = -1 * radius - focusPosition.y;
		DomRenderer.setElementSizeAndPosition(planetElt, diameter, diameter, offsetY, offsetX);
		planetStyle.top = `calc(50vh + ${offsetY}vmin)`;
		planetStyle.left = `calc(50vw + ${offsetX}vmin)`;
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
	
	render({ vehicles, blockInHand, connections, planet, focusPosition, distToCore }) {
		this.showConnections = Boolean(blockInHand);
		this.highlightConnectionIds = connections.map((c) => c?.id);
		vehicles.forEach((v) => this.renderVehicle(v));
		this.renderBuildUI();
		this.renderHand(blockInHand);
		this.renderPlanet(planet, focusPosition);
		const level = planet.getLevelData(distToCore).level;
		const depth = planet.radius - distToCore;
		this.elements.depthNumber.innerText = Math.round(Math.max(0, depth)).toLocaleString() + ` Level: ${level}`;
	}

	init() {
		this.elements.vehicles = document.querySelector('.vehicles');
		this.elements.connections = document.querySelector('.connections');
		this.elements.planet = document.querySelector('.planet');
		this.elements.hand = document.querySelector('.hand');
		this.elements.buildBlockList = document.querySelector('.build-block-list');
		this.elements.holes = document.querySelector('.holes');
		this.elements.depthNumber = document.querySelector('.depth-number');
		this.elements.blockInfoWindows = document.querySelector('.block-info-windows');
	}
}

export default DomRenderer;
