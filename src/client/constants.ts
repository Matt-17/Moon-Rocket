//	The game is designed in a 560x240 "retro pixel" coordinate system.
//	To make movement feel smooth (subpixel scrolling instead of jumping
//	one chunky pixel at a time) the canvas is rendered at RENDER_SCALE
//	times that resolution and every scene camera zooms in by the same
//	factor. All game logic keeps using the 560x240 design coordinates.
export const GAME_WIDTH = 560;
export const GAME_HEIGHT = 240;
export const RENDER_SCALE = 4;
