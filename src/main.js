import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { StageIntroScene } from './scenes/StageIntroScene.js';
import { GameScene } from './scenes/GameScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { NameEntryScene } from './scenes/NameEntryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, StageIntroScene, GameScene, VictoryScene, NameEntryScene],
};

new Phaser.Game(config);
