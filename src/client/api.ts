import type { PlayerStats, SaveScoreRequest, SaveScoreResponse } from '../shared/api.js';

//	The Webview talks to the Devvit server through plain fetch() calls.
//	This replaces the old postMessage bridge between Blocks and the Webview.
export async function fetchPlayerStats(): Promise<PlayerStats> {
	try {
		const res = await fetch('/api/stats');
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		//	Outside of Reddit (e.g. opening game.html directly) there is no server.
		return { highscore: 0, attempts: 0 };
	}
}

export async function saveScore(score: number): Promise<SaveScoreResponse | null> {
	try {
		const res = await fetch('/api/score', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ score } satisfies SaveScoreRequest),
		});
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		return null;
	}
}
