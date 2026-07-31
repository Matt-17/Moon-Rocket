import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { UiResponse } from '@devvit/web/shared';
import { context, createServer, getServerPort, reddit, redis } from '@devvit/web/server';
import type {
	InitResponse,
	LeaderboardEntry,
	PlayerStats,
	SaveScoreRequest,
	SaveScoreResponse,
} from '../shared/api.js';

//	Redis keys are scoped per subreddit, so every community keeps its own leaderboard.
const highscoresKey = () => `${context.subredditId}:highscores`;
const attemptsKey = () => `${context.subredditId}:attempts`;
//	Leaderboard members are stored as `${userId}:${username}` (schema kept
//	from the previous app version so existing data stays valid).
const leaderboardKey = () => `${context.subredditId}:leaderboard`;

const STARTER_NAMES = [
	'RocketPioneer', 'MoonExplorer', 'StarSeeker', 'CosmicDreamer', 'SpaceVoyager',
	'GalaxyWanderer', 'AstroTrailblazer', 'NebulaDrifter', 'OrbitChaser', 'StellarRookie',
];

async function getLeaderboardMember(userId: string): Promise<string> {
	const username = (await reddit.getCurrentUsername()) ?? 'Anonymous';
	return `${userId}:${username}`;
}

async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
	try {
		const entries = await redis.zRange(leaderboardKey(), 0, limit - 1, { reverse: true, by: 'rank' });

		const leaderboard: LeaderboardEntry[] = [];
		for (const entry of entries) {
			const [, username] = entry.member.split(':');
			if (username) {
				leaderboard.push({ username, score: entry.score, rank: leaderboard.length + 1 });
			}
		}

		// Pad with starter entries so the board never looks empty
		for (let i = leaderboard.length; i < limit; i++) {
			leaderboard.push({ username: STARTER_NAMES[i] ?? `Starter${i + 1}`, score: limit - i, rank: i + 1 });
		}

		return leaderboard;
	} catch (error) {
		console.error('Error fetching leaderboard:', error);
		return STARTER_NAMES.slice(0, limit).map((username, i) => ({
			username,
			score: limit - i,
			rank: i + 1,
		}));
	}
}

async function getUserRank(userId: string): Promise<number | null> {
	try {
		const member = await getLeaderboardMember(userId);
		const normalRank = await redis.zRank(leaderboardKey(), member);
		if (normalRank === null || normalRank === undefined) {
			return null;
		}

		// zRank is ascending; convert to a 1-based descending rank
		const totalCount = await redis.zCard(leaderboardKey());
		return totalCount - normalRank;
	} catch (error) {
		console.error('Error fetching user rank:', error);
		return null;
	}
}

async function getPlayerStats(userId: string): Promise<PlayerStats> {
	const [highscore, attempts, rank] = await Promise.all([
		redis.zScore(highscoresKey(), userId),
		redis.hGet(attemptsKey(), userId),
		getUserRank(userId),
	]);

	return {
		highscore: Number(highscore ?? 0),
		attempts: Number(attempts ?? 0),
		rank,
	};
}

const api = new Hono();

//	Initial data for the game: player stats plus the Top 10 leaderboard.
//	Called by the Boot scene on startup and by GameOver before returning
//	to the menu.
api.get('/init', async (c) => {
	const { userId } = context;
	const [leaderboard, stats] = await Promise.all([
		getLeaderboard(10),
		userId ? getPlayerStats(userId) : Promise.resolve({ highscore: 0, attempts: 0, rank: null }),
	]);
	return c.json<InitResponse>({ stats, leaderboard });
});

//	Saves the score of a finished run. Called by the GameOver scene.
api.post('/score', async (c) => {
	const { userId } = context;
	const { score } = await c.req.json<SaveScoreRequest>();

	if (!userId || typeof score !== 'number' || !Number.isFinite(score)) {
		return c.json({ status: 'error', message: 'Invalid request' }, 400);
	}

	const currentHighscore = await redis.zScore(highscoresKey(), userId);
	const isNewBest = currentHighscore === undefined || currentHighscore === null || score > currentHighscore;

	await Promise.all([
		isNewBest ? redis.zAdd(highscoresKey(), { member: userId, score }) : Promise.resolve(),
		isNewBest
			? getLeaderboardMember(userId).then((member) => redis.zAdd(leaderboardKey(), { member, score }))
			: Promise.resolve(),
		redis.hIncrBy(attemptsKey(), userId, 1),
	]);

	return c.json<SaveScoreResponse>({
		newBest: isNewBest ? score : null,
		stats: await getPlayerStats(userId),
	});
});

const internal = new Hono();

//	Backs the "Create Moon Rocket Game Post" subreddit menu item defined in devvit.json.
internal.post('/menu/post-create', async (c) => {
	try {
		const post = await reddit.submitCustomPost({
			title: 'Moon Rocket',
		});

		return c.json<UiResponse>(
			{
				navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
			},
			200
		);
	} catch (error) {
		console.error(`Error creating post: ${error}`);
		return c.json<UiResponse>({ showToast: 'Oh no, failed to create post.' }, 400);
	}
});

const app = new Hono();
app.route('/api', api);
app.route('/internal', internal);

serve({
	fetch: app.fetch,
	createServer,
	port: getServerPort(),
});
