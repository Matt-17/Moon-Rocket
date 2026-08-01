//	Player skins, unlocked by total diamonds collected. The selection is a
//	client-side preference; the balance comes from the server stats.
export type SkinDefinition = {
	key: string
	cost: number
	//	Scale that renders the skin at roughly the rocket's size.
	scale: number
}

export const SKINS: readonly SkinDefinition[] = [
	{ key: 'rocket', cost: 0, scale: 1 },
	{ key: 'cat', cost: 100, scale: 0.6 },
	{ key: 'cat_bandana', cost: 300, scale: 0.6 },
];

const STORAGE_KEY = 'moonrocket-skin';

export function getSelectedSkin(totalDiamonds: number): SkinDefinition {
	let key = 'rocket';
	try {
		key = localStorage.getItem(STORAGE_KEY) ?? 'rocket';
	} catch {
		// localStorage may be unavailable in some embedded contexts
	}

	const skin = SKINS.find((s) => s.key === key);
	//	Fall back to the rocket if the stored skin is unknown or not unlocked.
	if (!skin || skin.cost > totalDiamonds) return SKINS[0]!;
	return skin;
}

export function setSelectedSkin(key: string) {
	try {
		localStorage.setItem(STORAGE_KEY, key);
	} catch {
		// localStorage may be unavailable in some embedded contexts
	}
}
