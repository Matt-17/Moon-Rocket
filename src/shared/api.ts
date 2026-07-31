//	Types shared between the game client and the Devvit server.
//	The client talks to the server via plain fetch() calls against /api/* endpoints.

export type PlayerStats = {
	highscore: number
	attempts: number
	rank?: number | null
}

export interface LeaderboardEntry {
	username: string
	score: number
	rank: number
}

//	Initial payload loaded by the Boot scene: the player's own stats plus
//	the subreddit's Top 10 leaderboard.
export type InitResponse = {
	stats: PlayerStats
	leaderboard: LeaderboardEntry[]
}

export type SaveScoreRequest = {
	score: number
}

export type SaveScoreResponse = {
	//	The new personal best, or null if the submitted score did not beat it.
	newBest: number | null
	stats: PlayerStats
}
