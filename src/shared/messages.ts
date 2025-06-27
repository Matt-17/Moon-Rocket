//	It can be handy to share code between Devvit and the Game's Webview.
//	This file is a good place to put messages that are sent between the two.
//	For example, you could define a message that requests the player's stats from the Devvit side,
// 	and utilize these types to make your App more typesafe.

export type PostMessage = SaveHighscoreMessage | RequestPlayerStatsMessage | RequestLeaderboardMessage

export type SaveHighscoreMessage = {
	type: 'save:score'
	data: HighscorePayload
}

export type RequestPlayerStatsMessage = {
	type: 'request:player:stats'
}

export type RequestLeaderboardMessage = {
	type: 'request:leaderboard'
}

export type HighscorePayload = {
	score: number
}

export type PlayerStats = {
	highscore: number
	attempts: number
	rank?: number
}

export interface LeaderboardEntry {
	username: string
	score: number
	rank: number
}

export type LeaderboardData = {
	leaderboard: LeaderboardEntry[]
	userStats: PlayerStats
}