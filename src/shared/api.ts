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

//	Present when the current post is a daily challenge: everyone plays the
//	same seeded candle sequence and competes on a per-day leaderboard.
export type DailyInfo = {
	//	ISO date (YYYY-MM-DD) identifying the challenge and seeding the RNG.
	date: string
	leaderboard: LeaderboardEntry[]
	//	The current player's best score for this day (0 if none yet).
	myBest: number
}

//	Initial payload loaded by the Boot scene: the player's own stats plus
//	the subreddit's Top 10 leaderboard (and daily info on daily posts).
export type InitResponse = {
	stats: PlayerStats
	leaderboard: LeaderboardEntry[]
	daily: DailyInfo | null
}

export type SaveScoreRequest = {
	score: number
}

export type SaveScoreResponse = {
	//	The new personal best, or null if the submitted score did not beat it.
	newBest: number | null
	//	Same, for today's challenge; null also when this is not a daily post.
	dailyNewBest: number | null
	stats: PlayerStats
}
