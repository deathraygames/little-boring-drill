const itemTypes = Object.freeze({
	"copper-ore": { refineTo: "copper-bars", copper: true, metal: true, ore: true },
	"copper-bars": { printTo: "copper-parts", copper: true, metal: true, refined: true },
	"copper-parts": { copper: true, metal: true, printed: true },
	"iron-ore": { refineTo: "iron-bars", ore: true },
	"iron-bars": { printTo: "iron-beams" },
	"iron-beams": { metal: true, printed: true },
	"uranium-ore": { refineTo: "enriched-uranium", ore: true },
	"enriched-uranium": {},
	"quartz": { refinedTo: "glass", ore: true },
	"glass": { printTo: "windows" },
	"windows": {},
	"aluminum-ore": { refineTo: "aluminum-bars", ore: true },
	"aluminum-bars": { printTo: "aluminum-plates" },
	"aluminum-plates": { metal: true, printed: true },
	"titanium-ore": { refineTo: "titanium-bars", ore: true },
	"titanium-bars": { printTo: "titanium-parts" },
	"titanium-parts": { metal: true, printed: true },
	"obsidian-ore": { refineTo: "obsidian-shards", ore: true },
	"obsidian-shards": { printTo: "obsidian-parts" },
	"obsidian-parts": { printed: true },
});

export default itemTypes;
