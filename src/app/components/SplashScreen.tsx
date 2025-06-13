import { Devvit, type Context } from '@devvit/public-api'

//	The Splashscren is a Devvit Blocks component the Post has successfully loaded.
//	This is NOT the Webview game, but the initial UI redditors see when they have the Post loaded.
//	You can use this to show a loading screen, or a start menu for users open your Webview game.
export const SplashScreen = (props: { onPress: () => void; context: Context }) => {
	const { onPress, context } = props

	return (
		<zstack grow height="100%" width="100%" alignment="middle center">
			<zstack>
				<image
					url="splash.png"
					height="100%"
					width="100%"
					imageWidth={`${context.dimensions?.width ?? 6100570}px`}
					imageHeight={`${context.dimensions?.height ?? 600}px`}
					resizeMode="cover"
				/>
			</zstack>
			<zstack>
				<button icon="play-fill" appearance="secondary" size="large" onPress={onPress}>
					PLAY GAME
				</button>
			</zstack>
		</zstack>
	)
}
