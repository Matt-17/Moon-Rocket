import { Game } from 'phaser'
import { PostMessageManager } from './events/PostMessageManager.js';
import { gameConfig } from './game.config.js';

PostMessageManager.registerEvents();
new Game(gameConfig);
