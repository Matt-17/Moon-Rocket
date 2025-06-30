// Learn more at developers.reddit.com/docs
import { Devvit } from '@devvit/public-api';
import { GameComponent } from './components/Game.js';

Devvit.configure({
  redditAPI: true,
});

// Game constants
// ... deleted ...

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'Add Flappy Rockets Game',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast("🚀 Creating your Flappy Rockets game...");

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: '🚀 Flappy Rockets - Can you beat the high score?',
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center" gap="medium">
          <text size="xlarge">🚀 Flappy Rockets</text>
          <text size="large">Loading game...</text>
          <text size="medium" color="#a0a0a0">Get ready to fly!</text>
        </vstack>
      ),
    });
    ui.navigateTo(post);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Flappy Rockets Game',
  height: 'tall',
  render: (context) => {
    return <GameComponent context={context} />;
  },
});

export default Devvit;
