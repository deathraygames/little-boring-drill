const DEFAULT_MAX_ZOOM_DELTA = 600;
const DEFAULT_MIN_ZOOM = 0.1;
const DEFAULT_MAX_ZOOM = 5000;
const DEFAULT_ZOOM_MULTIPLIER = .001;
const DEFAULT_START_ZOOM = 1.;

class Zoomer {
	constructor() {
		this.MAX_ZOOM_DELTA = DEFAULT_MAX_ZOOM_DELTA;
		this.MIN_ZOOM = DEFAULT_MIN_ZOOM;
		this.MAX_ZOOM = DEFAULT_MAX_ZOOM;
		this.ZOOM_MULTIPLIER = DEFAULT_ZOOM_MULTIPLIER;
		this.zoom = DEFAULT_START_ZOOM;
	}

	getZoom() {
		return this.zoom;
	}

	setup() {
		window.addEventListener('wheel', (e) => {
			// control speed based on current zoom, throttle the speed
			const zoomSpeed = Math.min(this.MAX_ZOOM_DELTA, Math.abs(e.deltaY)) * this.ZOOM_MULTIPLIER * this.zoom;
			const zoomDir = (e.deltaY < 0 ? -1 : 1);
			// cap the zoom
			this.zoom = Math.max(
				this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoom + zoomDir * zoomSpeed)
			);
			console.log('zoom', this.zoom);
		});
	}

	// TODO: Add clean-up
}

export default Zoomer;

