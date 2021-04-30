const RADIUS = 2500;

class Planet {
	constructor(multiplier = 1) {
		this.radius = RADIUS * multiplier;
		this.diameter = this.radius * 2;
		this.pos = { x: 0, y: 0 };
		this.holes = [];
	}

	getLevelData(r) {
		const HARDNESS_EXP = 3;
		if (r > this.radius) { // Above planet (0% depth)
			return {
				level: 0,
				hardness: 0,
			};
		} else if (r > this.radius * 0.7) { // Copper level (30%)
			return {
				level: 1,
				hardness: Math.pow(1 + 1, HARDNESS_EXP),
				dropItemKey: 'copper-ore',
			};
		} else if (r > this.radius * 0.5) { // Iron level (20%)
			return {
				level: 2,
				hardness: Math.pow(2 + 1, HARDNESS_EXP),
				dropItemKey: 'iron-ore',
			};
		} else if (r > this.radius * 0.25) { // Aluminum level (25%)
			return {
				level: 3,
				hardness: Math.pow(3 + 1, HARDNESS_EXP),
				dropItemKey: 'aluminum-ore',
			};
		} else if (r > this.radius * 0.10) { // Titanium level (15%)
			return {
				level: 4,
				hardness: Math.pow(4 + 1, HARDNESS_EXP),
				dropItemKey: 'titanium-ore',
			};
		} else { // obsidian level (10%)
			return {
				level: 5,
				hardness: Math.pow(5 + 1, HARDNESS_EXP),
				dropItemKey: 'obsidian-ore',
			};
		}
	}
}

export default Planet;
