import { requestExpandedMode } from '@devvit/web/client';

//	The splash screen is rendered inline in the reddit.com feed. Pressing play
//	opens the "game" entrypoint (game.html) in expanded mode - the equivalent
//	of the old useWebView mount() call.
const playButton = document.getElementById('play-button') as HTMLButtonElement;

playButton.addEventListener('click', (e) => {
	requestExpandedMode(e, 'game');
});
