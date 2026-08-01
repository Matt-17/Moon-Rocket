//	Types shared between the game client and the Devvit server.
//	The client talks to the server via plain fetch() calls against /api/* endpoints.

export type GameMode = 'daily' | 'random'

export type PlayerStats = {
	highscore: number
	attempts: number
	rank?: number | null
	//	Total diamonds ever collected (currency for skins).
	diamonds: number
	//	Best single-run diamond haul credited today (only the daily maximum
	//	counts towards the balance).
	diamondsToday: number
}

export interface LeaderboardEntry {
	username: string
	score: number
	rank: number
}

//	The daily challenge context of the current post. Regular game posts
//	always carry today's challenge; recap/archive posts carry the date they
//	were created for. Archived challenges can be replayed but score nothing.
export type ChallengeInfo = {
	//	ISO date (YYYY-MM-DD) identifying the challenge and seeding the RNG.
	date: string
	//	False on archived challenge posts: replay only, no scoring.
	isToday: boolean
	//	The GLOBAL board for this date, shared across all subreddits.
	leaderboard: LeaderboardEntry[]
	//	The current player's best score for this date (0 if none yet).
	myBest: number
}

//	Initial payload loaded by the Boot scene.
export type InitResponse = {
	stats: PlayerStats
	//	All-time Top 10 of this subreddit.
	leaderboard: LeaderboardEntry[]
	//	Top 10 by total diamonds collected in this subreddit.
	diamondLeaderboard: LeaderboardEntry[]
	challenge: ChallengeInfo
	//	Unique players who submitted at least one run in the period.
	playerCounts: {
		today: number
		week: number
		month: number
	}
}

export type SaveScoreRequest = {
	score: number
	//	Diamonds collected during this run.
	diamonds: number
	//	'daily' runs compete on the global daily board; 'random' runs only
	//	count towards the subreddit's all-time stats.
	mode: GameMode
}

export type SaveScoreResponse = {
	//	The new personal best, or null if the submitted score did not beat it.
	newBest: number | null
	//	Same, for today's global challenge; null for random-mode runs.
	dailyNewBest: number | null
	//	Diamonds actually added to the balance by this run (0 if the run did
	//	not beat today's best haul).
	diamondsCredited: number
	stats: PlayerStats
}
