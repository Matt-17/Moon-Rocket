import type { Devvit, RedisClient } from '@devvit/public-api'

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
	}

	async savePlayerHighscore(score: number) {
		const currentHighscore = await this.getCurrentUserHighscore();
		if (!currentHighscore || score > currentHighscore) {
			await this.redis.zAdd(`${this.subredditId}:highscores`, { member: this.userId, score });
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
}
