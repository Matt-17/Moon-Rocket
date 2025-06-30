import { Devvit, useState, useWebView } from '@devvit/public-api';
import './app/actions/createPost.js';
import { createPost } from './app/actions/createPost.js';
import { SplashScreen } from './app/components/SplashScreen.js';
import { RedisService } from './app/services/RedisService.js';
import type { PostMessage } from './shared/messages.js';

//	Devvit.configure is a function that allows you to configure which
//	Devvit features you want to enable.
//	In this template we enable the Reddit API and use Redis to store highscores.
//	You can disable Redis by commenting out the redis property line below.
Devvit.configure({
	redditAPI: true,
	//	redis: false,
});

//	You create a Post triggering the action from the Subreddits menu.
Devvit.addMenuItem(createPost);

Devvit.addCustomPostType({
	name: 'Moon Rocket',
	height: 'regular',
	render: (context: Devvit.Context) => {
		const redisService = new RedisService(context);

		//	We use the useWebView hook to mount the Phase game within a WebView.
		//	This will also allow us to start the game in focus mode that is required by the Devvit
		//	guidelanes to be approved in the future. https://developers.reddit.com/docs/webviews
		const { mount, postMessage } = useWebView({
			//	The url property is the path to the index.html file that is located in the webroot/ folder.
			url: `index.html`,

			//	The onMessage function is a callback that is called when the WebView sends a message.
			//	For example, the Players score is sent to the WebView when the game is over.
			//	We can then save the score to Redis and show a toast message to the player.
			onMessage: async (ev: PostMessage) => {
				switch (ev.type) {
					case 'save:score': {
						const [savedScore] = await redisService.saveScore(ev.data.score)
						if (typeof savedScore === 'number') {
							context.ui.showToast(`Hooray, new personal best: ${savedScore}!`)
						}
						break;
					}
					case 'request:player:stats': {
						const playerStats = await redisService.getCurrentUserStats()
						postMessage({
							type: 'update:player:stats',
							data: playerStats,
						})
						break;
					}
					default: {
						console.warn(`Unknown message type "${(ev as unknown as any).type}" !`)
					}
				}
			},

			//	If you need to do cleanups when the WebView is unmounted, you can use the onUnmount callback.
			// 	For example, you could show a toast message to the player when they leave the focus mode.
			onUnmount: () => context.ui.showToast('Thanks for playing! See you soon!'),
		});

		return <SplashScreen onPress={mount} context={context} />;
	},
});

export default Devvit;
