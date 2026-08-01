import { requestExpandedMode } from '@devvit/web/client';
import type { InitResponse } from '../shared/api.js';

//	The splash screen is rendered inline in the reddit.com feed. Pressing play
//	opens the "game" entrypoint (game.html) in expanded mode - the equivalent
//	of the old useWebView mount() call.
const playButton = document.getElementById('play-button') as HTMLButtonElement;

playButton.addEventListener('click', (e) => {
	requestExpandedMode(e, 'game');
});

//	Tease the current top score right in the feed. Kept best-effort: on any
//	error the line simply stays empty.
const topScore = document.getElementById('top-score') as HTMLDivElement;

fetch('/api/init')
	.then((res) => (res.ok ? (res.json() as Promise<InitResponse>) : null))
	.then((data) => {
		if (!data) return;

		const top = data.challenge.leaderboard[0];
		if (data.challenge.isToday) {
			topScore.textContent = top
				? `Today's best: ${top.score} by u/${top.username}`
				: 'No scores yet today — be the first!';
		} else {
			topScore.textContent = top
				? `Final result: ${top.score} by u/${top.username}`
				: `Archive — ${data.challenge.date}`;
		}
	})
	.catch(() => {});
