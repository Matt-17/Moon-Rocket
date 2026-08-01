import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { UiResponse } from '@devvit/web/shared';
import { context, createServer, getServerPort, reddit, redis } from '@devvit/web/server';
import type {
	DailyInfo,
	InitResponse,
	LeaderboardEntry,
	PlayerStats,
	SaveScoreRequest,
	SaveScoreResponse,
} from '../shared/api.js';

//	Redis keys are scoped per subreddit, so every community keeps its own leaderboard.
const highscoresKey = () => `${context.subredditId}:highscores`;
const attemptsKey = () => `${context.subredditId}:attempts`;
const diamondsKey = () => `${context.subredditId}:diamonds`;
//	Leaderboard members are stored as `${userId}:${username}` (schema kept
//	from the previous app version so existing data stays valid).
const leaderboardKey = () => `${context.subredditId}:leaderboard`;
//	Daily challenge: maps a post to its challenge date, plus one
//	leaderboard zset per subreddit and day.
const dailyPostKey = (postId: string) => `daily:${postId}`;
const dailyLeaderboardKey = (date: string) => `${context.subredditId}:daily:${date}:leaderboard`;

//	Unique-player tracking: one zset per period, members are user ids.
const playersKey = (period: string) => `${context.subredditId}:players:${period}`;

function playerPeriods(now = new Date()): { day: string; week: string; month: string } {
	const day = now.toISOString().slice(0, 10);
	const month = day.slice(0, 7);

	// ISO 8601 week number
	const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const weekNo = Math.ceil((((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7);
	const week = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

	return { day: `day:${day}`, week: `week:${week}`, month: `month:${month}` };
}

const STARTER_NAMES = [
	'RocketPioneer', 'MoonExplorer', 'StarSeeker', 'CosmicDreamer', 'SpaceVoyager',
	'GalaxyWanderer', 'AstroTrailblazer', 'NebulaDrifter', 'OrbitChaser', 'StellarRookie',
];

async function getLeaderboardMember(userId: string): Promise<string> {
	const username = (await reddit.getCurrentUsername()) ?? 'Anonymous';
	return `${userId}:${username}`;
}

async function readLeaderboard(key: string, limit = 10): Promise<LeaderboardEntry[]> {
	const entries = await redis.zRange(key, 0, limit - 1, { reverse: true, by: 'rank' });

	const leaderboard: LeaderboardEntry[] = [];
	for (const entry of entries) {
		const [, username] = entry.member.split(':');
		if (username) {
			leaderboard.push({ username, score: entry.score, rank: leaderboard.length + 1 });
		}
	}
	return leaderboard;
}

async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
	try {
		const leaderboard = await readLeaderboard(leaderboardKey(), limit);

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
	const [highscore, attempts, rank, diamonds] = await Promise.all([
		redis.zScore(highscoresKey(), userId),
		redis.hGet(attemptsKey(), userId),
		getUserRank(userId),
		redis.hGet(diamondsKey(), userId),
	]);

	return {
		highscore: Number(highscore ?? 0),
		attempts: Number(attempts ?? 0),
		rank,
		diamonds: Number(diamonds ?? 0),
	};
}

//	Returns the daily challenge info if the current post is a daily post.
async function getDailyInfo(): Promise<DailyInfo | null> {
	const { postId, userId } = context;
	if (!postId) return null;

	const date = await redis.get(dailyPostKey(postId));
	if (!date) return null;

	try {
		const [leaderboard, myBest] = await Promise.all([
			readLeaderboard(dailyLeaderboardKey(date)),
			userId
				? getLeaderboardMember(userId).then((member) => redis.zScore(dailyLeaderboardKey(date), member))
				: Promise.resolve(undefined),
		]);
		return { date, leaderboard, myBest: Number(myBest ?? 0) };
	} catch (error) {
		console.error('Error fetching daily leaderboard:', error);
		return { date, leaderboard: [], myBest: 0 };
	}
}

//	Creates today's daily challenge post. Used by the scheduler task and
//	the moderator menu item.
async function createDailyPost() {
	const date = new Date().toISOString().slice(0, 10);
	const prettyDate = new Date().toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	const post = await reddit.submitCustomPost({
		title: `Moon Rocket Daily Challenge — ${prettyDate}`,
		entry: 'default',
		postData: { daily: date },
	});

	await redis.set(dailyPostKey(post.id), date);
	return post;
}

const api = new Hono();

//	Initial data for the game: player stats plus the Top 10 leaderboard.
//	Called by the Boot scene on startup and by GameOver before returning
//	to the menu. On daily posts it also carries the daily challenge info.
api.get('/init', async (c) => {
	const { userId } = context;
	const periods = playerPeriods();
	const [leaderboard, stats, daily, today, week, month] = await Promise.all([
		getLeaderboard(10),
		userId ? getPlayerStats(userId) : Promise.resolve({ highscore: 0, attempts: 0, rank: null, diamonds: 0 }),
		getDailyInfo(),
		redis.zCard(playersKey(periods.day)),
		redis.zCard(playersKey(periods.week)),
		redis.zCard(playersKey(periods.month)),
	]);
	return c.json<InitResponse>({
		stats,
		leaderboard,
		daily,
		playerCounts: { today: today ?? 0, week: week ?? 0, month: month ?? 0 },
	});
});

//	Achievement flairs, highest tier first. Reaching a new tier with a new
//	personal best sets the user's subreddit flair.
const FLAIR_TIERS: ReadonlyArray<readonly [number, string]> = [
	[1000, '💎🙌 Diamond Hands'],
	[500, '🚀 Mooning'],
	[100, 'Floor 100 Club'],
];

function flairForScore(score: number): string | null {
	for (const [threshold, text] of FLAIR_TIERS) {
		if (score >= threshold) return text;
	}
	return null;
}

async function updateAchievementFlair(member: string, previousBest: number, score: number) {
	const { subredditName } = context;
	if (!subredditName) return;

	const newTier = flairForScore(score);
	if (!newTier || newTier === flairForScore(previousBest)) return;

	try {
		const [, username] = member.split(':');
		if (!username) return;
		await reddit.setUserFlair({ subredditName, username, text: newTier });
	} catch (error) {
		console.error('Error setting achievement flair:', error);
	}
}

//	Announces a run that entered the Top 10 with a comment under the post.
async function announceTopTenEntry(member: string, score: number, rank: number) {
	const { postId } = context;
	if (!postId) return;

	try {
		const [, username] = member.split(':');
		await reddit.submitComment({
			id: postId,
			text: `🚀 u/${username} just reached floor ${score} — #${rank} on the leaderboard!`,
		});
	} catch (error) {
		console.error('Error posting top ten comment:', error);
	}
}

//	Saves the score of a finished run. Called by the GameOver scene.
api.post('/score', async (c) => {
	const { userId } = context;
	const { score, diamonds } = await c.req.json<SaveScoreRequest>();

	if (!userId || typeof score !== 'number' || !Number.isFinite(score)) {
		return c.json({ status: 'error', message: 'Invalid request' }, 400);
	}

	//	Sanity-capped: a run can hardly yield more than a few hundred diamonds.
	const collectedDiamonds = Math.min(500, Math.max(0, Math.floor(Number(diamonds) || 0)));

	const [currentHighscore, dailyDate, member, rankBefore] = await Promise.all([
		redis.zScore(highscoresKey(), userId),
		context.postId ? redis.get(dailyPostKey(context.postId)) : Promise.resolve(undefined),
		getLeaderboardMember(userId),
		getUserRank(userId),
	]);

	const isNewBest = currentHighscore === undefined || currentHighscore === null || score > currentHighscore;

	//	On daily posts the run also counts for today's board.
	let dailyNewBest: number | null = null;
	if (dailyDate) {
		const currentDailyBest = await redis.zScore(dailyLeaderboardKey(dailyDate), member);
		if (currentDailyBest === undefined || currentDailyBest === null || score > currentDailyBest) {
			await redis.zAdd(dailyLeaderboardKey(dailyDate), { member, score });
			dailyNewBest = score;
		}
	}

	const periods = playerPeriods();
	await Promise.all([
		isNewBest ? redis.zAdd(highscoresKey(), { member: userId, score }) : Promise.resolve(),
		isNewBest ? redis.zAdd(leaderboardKey(), { member, score }) : Promise.resolve(),
		redis.hIncrBy(attemptsKey(), userId, 1),
		collectedDiamonds > 0 ? redis.hIncrBy(diamondsKey(), userId, collectedDiamonds) : Promise.resolve(),
		redis.zAdd(playersKey(periods.day), { member: userId, score: 1 }),
		redis.zAdd(playersKey(periods.week), { member: userId, score: 1 }),
		redis.zAdd(playersKey(periods.month), { member: userId, score: 1 }),
	]);

	//	Celebrate runs that climb into the Top 10 with a comment on the post,
	//	and unlock achievement flairs on new milestone tiers.
	if (isNewBest) {
		await updateAchievementFlair(member, Number(currentHighscore ?? 0), score);

		const rankAfter = await getUserRank(userId);
		if (rankAfter !== null && rankAfter <= 10 && (rankBefore === null || rankAfter < rankBefore)) {
			await announceTopTenEntry(member, score, rankAfter);
		}
	}

	return c.json<SaveScoreResponse>({
		newBest: isNewBest ? score : null,
		dailyNewBest,
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
				navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id.replace(/^t3_/, '')}`,
			},
			200
		);
	} catch (error) {
		console.error(`Error creating post: ${error}`);
		return c.json<UiResponse>({ showToast: 'Oh no, failed to create post.' }, 400);
	}
});

//	Backs the "Create Daily Challenge Post" subreddit menu item.
internal.post('/menu/daily-post-create', async (c) => {
	try {
		const post = await createDailyPost();
		return c.json<UiResponse>(
			{
				navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id.replace(/^t3_/, '')}`,
			},
			200
		);
	} catch (error) {
		console.error(`Error creating daily post: ${error}`);
		return c.json<UiResponse>({ showToast: 'Oh no, failed to create the daily post.' }, 400);
	}
});

//	Scheduler task (see devvit.json): creates the daily challenge post.
internal.post('/scheduler/daily-post', async (c) => {
	try {
		const post = await createDailyPost();
		console.log(`Created daily challenge post ${post.id}`);
		return c.json({ status: 'ok' }, 200);
	} catch (error) {
		console.error(`Error in daily-post scheduler task: ${error}`);
		return c.json({ status: 'error' }, 500);
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
