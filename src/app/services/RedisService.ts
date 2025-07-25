import type { Devvit, RedisClient } from '@devvit/public-api'

export interface LeaderboardEntry {
	username: string
	score: number
	rank: number
}

//	This is a helper service to interact with the Redis database.
//	You can use it to store and retrieve the player stats.
export class RedisService {
	private context: Devvit.Context
	redis: RedisClient;

	subredditId: string;
	userId!: string;

	constructor(context: Devvit.Context) {
		this.context = context;
		this.redis = context.redis;

		this.subredditId = context.subredditId;
		this.userId = context.userId!;
	}

	async savePlayerHighscore(score: number) {
		const currentHighscore = await this.getCurrentUserHighscore();
		if (!currentHighscore || score > currentHighscore) {
			// Get username for leaderboard
			const user = await this.context.reddit.getUserById(this.userId);
			const username = user?.username || 'Anonymous';
			
			// Save to both old format (for compatibility) and new leaderboard format
			await Promise.all([
				this.redis.zAdd(`${this.subredditId}:highscores`, { member: this.userId, score }),
				this.redis.zAdd(`${this.subredditId}:leaderboard`, { member: `${this.userId}:${username}`, score })
			]);
			
			return score;
		}
		return false;
	}

	async incPlayerGamesCount() {
		return this.redis.hIncrBy(`${this.subredditId}:attempts`, this.userId, 1);
	}

	async saveScore(score: number) {
		//	If you perform multiple asyncronous actions that do not depend on each other
		//	it is better to use Promise.all to run them in parallel.
		return Promise.all([this.savePlayerHighscore(score), this.incPlayerGamesCount()]);
	}

	async getCurrentUserHighscore() {
		return this.redis.zScore(`${this.subredditId}:highscores`, this.userId);
	}

	async getCurrentUserAttempts() {
		return this.redis.hGet(`${this.subredditId}:attempts`, this.userId);
	}

	async getCurrentUserStats() {
		const [highscore, attempts] = await Promise.all([this.getCurrentUserHighscore(), this.getCurrentUserAttempts()]);	

		return {
			highscore: Number(highscore ?? 0),
			attempts: Number(attempts ?? 0),
		};
	}

	async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
		try {
			// Get top scores from leaderboard (highest to lowest)
			const leaderboardData = await this.redis.zRange(`${this.subredditId}:leaderboard`, 0, limit - 1, { reverse: true, by: 'rank' });
			
			const leaderboard: LeaderboardEntry[] = [];
			
			for (let i = 0; i < leaderboardData.length; i++) {
				const entry = leaderboardData[i];
				if (entry && typeof entry.member === 'string' && typeof entry.score === 'number') {
					// Parse the member string to extract userId and username
					const [userId, username] = entry.member.split(':');
					if (username) {
						leaderboard.push({
							username,
							score: entry.score,
							rank: i + 1
						});
					}
				}
			}
			
			// If we have fewer than the requested limit, pad with starter entries
			if (leaderboard.length < limit) {
				const starterNames = [
					'RocketPioneer', 'MoonExplorer', 'StarSeeker', 'CosmicDreamer', 'SpaceVoyager',
					'GalaxyWanderer', 'AstroTrailblazer', 'NebulaDrifter', 'OrbitChaser', 'StellarRookie'
				];
				
				for (let i = leaderboard.length; i < limit; i++) {
					const starterScore = limit - i; // 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
					leaderboard.push({
						username: starterNames[i] || `Starter${i + 1}`,
						score: starterScore,
						rank: i + 1
					});
				}
			}
			
			return leaderboard;
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			// Return starter leaderboard even on error
			const starterNames = [
				'RocketPioneer', 'MoonExplorer', 'StarSeeker', 'CosmicDreamer', 'SpaceVoyager',
				'GalaxyWanderer', 'AstroTrailblazer', 'NebulaDrifter', 'OrbitChaser', 'StellarRookie'
			];
			
			return Array.from({ length: limit }, (_, i) => ({
				username: starterNames[i] || `Starter${i + 1}`,
				score: limit - i,
				rank: i + 1
			}));
		}
	}

	async getUserRank(): Promise<number | null> {
		try {
			const user = await this.context.reddit.getUserById(this.userId);
			const username = user?.username || 'Anonymous';
			const memberKey = `${this.userId}:${username}`;
			
			// Get the normal rank (0-based, low to high scores)
			const normalRank = await this.redis.zRank(`${this.subredditId}:leaderboard`, memberKey);
			
			if (normalRank === null || normalRank === undefined) {
				return null; // User not found in leaderboard
			}
			
			// Get total count of members to calculate reverse rank
			const totalCount = await this.redis.zCard(`${this.subredditId}:leaderboard`);
			
			// Calculate reverse rank (high to low scores) and convert to 1-based
			const reverseRank = totalCount - normalRank - 1;
			return reverseRank + 1; // Convert 0-based to 1-based ranking
		} catch (error) {
			console.error('Error fetching user rank:', error);
			return null;
		}
	}
}