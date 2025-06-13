import { Devvit, type MenuItem, type MenuItemOnPressEvent } from '@devvit/public-api'

export const createPost: MenuItem = {
	label: 'Create Flappy Rockets Post',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: async (_: MenuItemOnPressEvent, context: Devvit.Context) => {
		const { reddit, ui } = context
		const subreddit = await reddit.getCurrentSubreddit()

		try {
			const post = await reddit.submitPost({
				//	This is the name that will appear above your Reddit Post.
				title: `Flappy Rockets`,
				subredditName: subreddit.name,

				//	This is what the user will see when start loading the Post.
				preview: (
					<vstack height="100%" width="100%" alignment="middle center">
						<text size="large">Loading ...</text>
					</vstack>
				),
			})
			ui.navigateTo(post.url)
		} catch {
			ui.showToast('Oh no, failed to create post.')
		}
	},
}
