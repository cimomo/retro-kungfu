import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';
import { getLeaderboard, getHighScore } from '../systems/Leaderboard.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // Animated synth city parallax background
    const layers = [
      { key: 'synth-back', speed: 0.1, y: GAME_HEIGHT - 192 },
      { key: 'synth-far', speed: 0.2, y: GAME_HEIGHT - 192 },
      { key: 'synth-fore', speed: 0.4, y: GAME_HEIGHT - 192 },
    ];

    this.bgLayers = [];
    for (const layer of layers) {
      const imgs = [];
      const texW = this.textures.get(layer.key).getSourceImage().width;
      for (let x = 0; x < GAME_WIDTH + texW; x += texW) {
        const img = this.add.image(x, layer.y, layer.key).setOrigin(0, 0).setDepth(this.bgLayers.length);
        imgs.push(img);
      }
      this.bgLayers.push({ imgs, speed: layer.speed, texW });
    }

    // Darken overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.4)
      .setDepth(10);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'RETRO', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(GAME_WIDTH / 2, 58, 'KUNGFU', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    // Leaderboard
    const board = getLeaderboard();
    if (board.length > 0) {
      this.add.text(GAME_WIDTH / 2, 88, 'TOP SCORES', {
        fontSize: '8px', fontFamily: 'monospace', color: '#ff8844',
      }).setOrigin(0.5).setDepth(20);

      const maxShow = Math.min(board.length, 5);
      for (let i = 0; i < maxShow; i++) {
        const entry = board[i];
        const rank = `${i + 1}.`;
        const name = entry.name.padEnd(14, ' ');
        const score = String(entry.score).padStart(7, ' ');
        const color = i === 0 ? '#ffcc00' : '#aaa';
        this.add.text(GAME_WIDTH / 2, 102 + i * 12, `${rank} ${name} ${score}`, {
          fontSize: '7px', fontFamily: 'monospace', color,
        }).setOrigin(0.5, 0).setDepth(20);
      }
    } else {
      const highScore = getHighScore();
      this.add.text(GAME_WIDTH / 2, 95, `HIGH SCORE: ${highScore}`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aaa',
      }).setOrigin(0.5).setDepth(20);
    }

    // Press start (blinking)
    const startText = this.add.text(GAME_WIDTH / 2, 185, 'PRESS START', {
      fontSize: '12px', fontFamily: 'monospace', color: '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 210, 'ARROWS Move  Z Punch  X Kick  SPACE Special', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(GAME_WIDTH / 2, 228, 'ANY KEY / TAP to start', {
      fontSize: '7px', fontFamily: 'monospace', color: '#cccccc',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    // Start on any key / tap
    this.input.keyboard.on('keydown', () => this.startGame());
    this.input.on('pointerdown', () => this.startGame());
    this.started = false;

    this.scrollX = 0;
  }

  update(time, delta) {
    // Auto-scroll background
    this.scrollX += delta * 0.02;
    for (const layer of this.bgLayers) {
      for (const img of layer.imgs) {
        img.x -= layer.speed * delta * 0.03;
        if (img.x < -layer.texW) {
          img.x += layer.texW * layer.imgs.length;
        }
      }
    }
  }

  startGame() {
    if (this.started) return;
    this.started = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StageIntro', { stageIndex: 0, score: 0, lives: 3, credits: 3 });
    });
  }
}
