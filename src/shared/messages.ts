//	It can be handy to share code between Devvit and the Game's Webview.
//	This file is a good place to put messages that are sent between the two.
//	For example, you could define a message that requests the player's stats from the Devvit side,
// 	and utilize these types to make your App more typesafe.

export type PostMessage = SaveHighscoreMessage | RequestPlayerStatsMessage

export type SaveHighscoreMessage = {
	type: 'save:score'
	data: HighscorePayload
}

export type RequestPlayerStatsMessage = {
	type: 'request:player:stats'
}

export type HighscorePayload = {
	score: number
}

export type PlayerStats = {
	highscore: number
	attempts: number
}
