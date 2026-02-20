import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(data) {
    this.score = data.score || 0;

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.add.text(GAME_WIDTH / 2, 50, 'CONGRATULATIONS!', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, 'You have defeated all the enemies\nand restored peace to the streets!', {
      fontSize: '8px', fontFamily: 'monospace', color: '#fff',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, `FINAL SCORE: ${this.score}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#44ff44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 175, 'RETRO KUNGFU', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff6644',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'Thanks for playing!', {
      fontSize: '7px', fontFamily: 'monospace', color: '#888',
    }).setOrigin(0.5);

    // Blinking prompt
    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'PRESS ANY KEY', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffcc00',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.readyToLeave = false;
    this.time.delayedCall(1500, () => { this.readyToLeave = true; });

    this.input.keyboard.on('keydown', () => {
      if (this.readyToLeave) this.goToNameEntry();
    });
    this.input.on('pointerdown', () => {
      if (this.readyToLeave) this.goToNameEntry();
    });
  }

  goToNameEntry() {
    this.readyToLeave = false;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('NameEntry', { score: this.score, nextScene: 'Title' });
    });
  }
}
