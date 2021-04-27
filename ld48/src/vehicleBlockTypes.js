const vehicleBlockTypes = Object.freeze({
	"default": {
		category: 'miscellaneous',
		squareSize: 16,
		cost: {
			dirt: 999,
		},
		connections: [[0, -1], [1, 0], [0, 1], [-1, 0]],
		lifeSupport: 0,
		cargoSpace: 0,
		drilling: 0,
		powering: 0,
		refining: 0,
		printing: 0,
		pulling: 0,
		powerCapacity: 1,
	},
	// Assorted
	"copper-hull": { cost: { "copper-parts": 2 }, category: 'hull' },
	"iron-hull": { cost: { "iron-beams": 4 }, category: 'hull' },
	"aluminum-hull": { cost: { "aluminum-plates": 4 }, category: 'hull' },
	"mini-dome": {
		squareSize: 10,
		cost: { "aluminum-plates": 5 },
		connections: [[0, 1]],
		lifeSupport: 1,
	},
	"survival-core": {
		category: 'production',
		cost: {
			"enriched-uranium": 5,
			"titanium-parts": 10,
		},
		cargoSpace: 5,
		powering: 1,
		refining: 1,
		printing: 1,
		pulling: 1,
	},
	"copper-structure-h": {
		category: 'hull',
		cost: { "copper-parts": 2 }
	},
	"copper-structure-v": {
		category: 'hull',
		cost: { "copper-parts": 2 }
	},
	"iron-structure-h": { cost: { "iron-beams": 4 }, category: 'hull' },
	"iron-structure-v": { cost: { "iron-beams": 4 }, category: 'hull' },

	// Drills
	"small-copper-drill": {
		category: 'drills',
		squareSize: 8,
		cost: { "copper-parts": 10 },
		connections: [[0, -1]],
		cargoSpace: 1,
		drilling: 1,
	},
	"copper-drill": {
		category: 'drills',
		cost: { "copper-parts": 30 },
		connections: [[0, -1]],
		cargoSpace: 2,
		drilling: 2,
	},
	"iron-drill": {
		category: 'drills',
		cost: { "iron-beams": 30 },
		connections: [[0, -1]],
		cargoSpace: 3,
		drilling: 3,
	},
	"aluminum-drill": {
		category: 'drills',
		cost: { "aluminum-plates": 30, "iron-beams": 1 },
		connections: [[0, -1]],
		cargoSpace: 5,
		drilling: 4,
	},
	"titanium-drill": {
		category: "drills",
		cost: { "titanium-parts": 30 },
		connections: [[0, -1]],
		cargoSpace: 8,
		drilling: 5,	
	},
	"obsidian-drill": {
		category: "drills",
		cost: { "obsidian-parts": 30 },
		connections: [[0, -1]],
		cargoSpace: 10,
		drilling: 6,	
	},
	"aluminum-cargo-drill": {
		category: 'drills',
		squareSize: 8,
		cost: { "aluminum-plates": 10, "iron-beams": 1 },
		connections: [[0, -1]],
		cargoSpace: 10,
		drilling: 1,
	},

	// Cargo
	"copper-cargo": {
		category: "cargo",
		cost: { "copper-parts": 30 },
		cargoSpace: 10,
		pulling: 1,
	},
	"aluminum-cargo": {
		category: "cargo",
		cost: { "aluminum-plates": 30 },
		cargoSpace: 20,
		pulling: 2,
	},
	"titanium-cargo": {
		category: "cargo",
		cost: { "titanium-parts": 30 },
		cargoSpace: 30,
		pulling: 4,
	},
	"obsidian-cargo": {
		category: "cargo",
		cost: { "obsidian-parts": 30 },
		cargoSpace: 40,
		pulling: 5,
	},

	// Refineries
	"copper-refinery": {
		category: "production",
		cost: { "copper-parts": 40 },
		cargoSpace: 2,
		refining: 1,
		pulling: 1,
	},
	"iron-refinery": {
		category: "production",
		cost: { "iron-beams": 30 },
		cargoSpace: 3,
		refining: 4,
		pulling: 1,
	},
	"titanium-refinery": {
		category: "production",
		cost: { "titanium-parts": 40 },
		cargoSpace: 5,
		refining: 5,
		pulling: 2,
	},
	"obsidian-refinery": {
		category: "production",
		cost: { "obsidian-parts": 40 },
		cargoSpace: 6,
		refining: 7,
		pulling: 2,
	},

	// Printers
	"copper-printer": {
		category: "production",
		cost: { "copper-parts": 40 },
		cargoSpace: 2,
		printing: 1,
		pulling: 1,
	},
	"aluminum-printer": {
		category: "production",
		cost: { "aluminum-plates": 40 },
		cargoSpace: 4,
		printing: 3,
		pulling: 2,
	},
	"titanium-printer": {
		category: "production",
		cost: { "titanium-parts": 30 },
		cargoSpace: 6,
		printing: 4,
		pulling: 4,
	},
	"obsidian-printer": {
		category: "production",
		cost: { "obsidian-parts": 50 },
		cargoSpace: 7,
		printing: 5,
		pulling: 4,
	},

	// "rotation-test": {
	// 	connections: [[0, -1], [1, 0]]
	// },
	get(type) {
		function clone(obj) {
			if (!obj) return {};
			return JSON.parse(JSON.stringify(obj));
		}
		return Object.assign(
			{ type },
			clone(this.default),
			clone(this[type]),
		);
	},
	forEach(callback) {
		const excludes = ['get', 'default', 'forEach'];
		const keys = Object.keys(this).filter((key) => !excludes.includes(key));
		keys.forEach((key) => callback(this.get(key)));
	}
});

export default vehicleBlockTypes;
