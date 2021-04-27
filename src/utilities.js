let i = 0;

function getUniqueId() {
	return Number(new Date()) + '-' + (i++) + '-' + Math.round(Math.random() * 99999999);
}

function getDistance(x1, y1, x2 = 0, y2 = 0) {
	return Math.sqrt( Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2) );
}

function rotate(x = 0, y = 0, theta = 0, originX = 0, originY = 0) {
	const x1 = x - originX;
	const y1 = y - originY;
	// Didn't work...?
	// const r = getDistance(x1, y1);
	// const x2 = r * Math.cos(theta);
	// const y2 = r * Math.sin(theta);
	// Attempt 2
	const cos = Math.cos(theta * -1);
	const sin = Math.sin(theta * -1);
	const x2 = x * cos + y * sin;
	const y2 = -1 * x * sin + y * cos;
	return {
		x: x2 + originX,
		y: y2 + originY,
	};
}

function shuffle(array) { // https://stackoverflow.com/a/2450976/1766230
	let currentIndex = array.length;
	let temporaryValue, randomIndex;

	while (currentIndex !== 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

function shuffleOne(array) {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}

export { getUniqueId, getDistance, shuffle, shuffleOne, rotate };
