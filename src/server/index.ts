import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { UiResponse } from '@devvit/web/shared';
import { context, createServer, getServerPort, reddit, redis } from '@devvit/web/server';
import type { SaveScoreRequest, SaveScoreResponse, StatsResponse } from '../shared/api.js';

//	Redis keys are scoped per subreddit, so every community keeps its own leaderboard.
const highscoresKey = () => `${context.subredditId}:highscores`;
const attemptsKey = () => `${context.subredditId}:attempts`;

async function getPlayerStats(userId: string): Promise<StatsResponse> {
	const [highscore, attempts] = await Promise.all([
		redis.zScore(highscoresKey(), userId),
		redis.hGet(attemptsKey(), userId),
	]);

	return {
		highscore: Number(highscore ?? 0),
		attempts: Number(attempts ?? 0),
	};
}

const api = new Hono();

//	Returns the stats of the current player. Called by the Boot scene on startup.
api.get('/stats', async (c) => {
	const { userId } = context;
	if (!userId) {
		return c.json<StatsResponse>({ highscore: 0, attempts: 0 });
	}
	return c.json<StatsResponse>(await getPlayerStats(userId));
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
