import type { InitResponse, SaveScoreRequest, SaveScoreResponse } from '../shared/api.js';

//	The Webview talks to the Devvit server through plain fetch() calls.
//	This replaces the old postMessage bridge between Blocks and the Webview.
export async function fetchInitData(): Promise<InitResponse> {
	try {
		const res = await fetch('/api/init');
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		//	Outside of Reddit (e.g. opening game.html directly) there is no server.
		return { stats: { highscore: 0, attempts: 0, rank: null, diamonds: 0 }, leaderboard: [], daily: null };
	}
}

export async function saveScore(score: number, diamonds: number): Promise<SaveScoreResponse | null> {
	try {
		const res = await fetch('/api/score', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ score, diamonds } satisfies SaveScoreRequest),
		});
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		return null;
	}
}
