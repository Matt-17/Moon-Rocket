import type { GameMode, InitResponse, SaveScoreRequest, SaveScoreResponse } from '../shared/api.js';

//	The Webview talks to the Devvit server through plain fetch() calls.
//	This replaces the old postMessage bridge between Blocks and the Webview.
export async function fetchInitData(): Promise<InitResponse> {
	try {
		const res = await fetch('/api/init');
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		//	Outside of Reddit (e.g. opening game.html directly) there is no server.
		return {
			stats: { highscore: 0, attempts: 0, rank: null, diamonds: 0, diamondsToday: 0 },
			leaderboard: [],
			diamondLeaderboard: [],
			challenge: {
				date: new Date().toISOString().slice(0, 10),
				isToday: true,
				leaderboard: [],
				myBest: 0,
			},
			playerCounts: { today: 0, week: 0, month: 0 },
		};
	}
}

export async function saveScore(score: number, diamonds: number, mode: GameMode): Promise<SaveScoreResponse | null> {
	try {
		const res = await fetch('/api/score', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ score, diamonds, mode } satisfies SaveScoreRequest),
		});
		if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
		return await res.json();
	} catch {
		return null;
	}
}
