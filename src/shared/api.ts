//	Types shared between the game client and the Devvit server.
//	The client talks to the server via plain fetch() calls against /api/* endpoints.

export type PlayerStats = {
	highscore: number
	attempts: number
}

export type StatsResponse = PlayerStats

export type SaveScoreRequest = {
	score: number
}

export type SaveScoreResponse = {
	//	The new personal best, or null if the submitted score did not beat it.
	newBest: number | null
	stats: PlayerStats
}
