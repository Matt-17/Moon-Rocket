import type { PostMessage, LeaderboardData } from '../../shared/messages.js';
import eventEmitter from './EventEmitter.js';

export class PostMessageManager {
	static allowedMessageType = 'devvit-message'
	static targetOrigin = '*'

	//	We listen for messages from the Devvit App, by adding the listeners to the window object.
	//	https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
	static registerEvents() {
		PostMessageManager.registerListeners();
	}

	static registerListeners() {
		//	The Webview does not have direct access to the Devvit API.
		//	We use the PostMessage API to communicate between the Webview and the Devvit App.
		window.addEventListener('message', (event) => {
			const { type, data } = event.data;

			//	Devvit explicitly sets the type of the message to 'devvit-message'.
			//	We only want to handle messages with this type.
			if (type !== PostMessageManager.allowedMessageType) {
				return;
			}

			const { message } = data;

			switch (message.type) {
				case 'update:player:stats': {
					//	We emit a global event that the Phaser Game can listen to. This
					// 	is convenient as we can listen to the event in any scene.
					//	Note: Be carrful with global events. If you do not clean them up
					// 	they can cause memory leaks or unwanted side effects.
					eventEmitter.emit('update:player:stats', message.data);
					break;
				}
				case 'update:leaderboard': {
					eventEmitter.emit('update:leaderboard', message.data);
					break;
				}
			}
		})
	}

	//	With this function we can send messages to the Devvit App from the Webview.
	static send(message: PostMessage) {
		window.parent.postMessage(message, PostMessageManager.targetOrigin);
	}
}