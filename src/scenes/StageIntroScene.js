import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, STAGES } from '../utils/constants.js';

export class StageIntroScene extends Phaser.Scene {
  constructor() {
    super('StageIntro');
  }

  create(data) {
    this.stageIndex = data.stageIndex || 0;
    this.passData = data;

    const stage = STAGES[this.stageIndex];

    this.cameras.main.setBackgroundColor('#000000');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, stage.name, {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5, stage.subtitle, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaa',
    }).setOrigin(0.5);

    const flavorTexts = [
      'The punks have taken over the streets...',
      'Neon lights hide dark dangers...',
      'The final battle awaits in the shadows...',
    ];

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35, flavorTexts[this.stageIndex] || '', {
      fontSize: '7px', fontFamily: 'monospace', color: '#666',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game', this.passData);
      });
    });
  }
}
