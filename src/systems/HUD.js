import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TORNADO_COOLDOWN } from '../utils/constants.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;

    // Player health bar
    this.hpLabel = scene.add.text(8, 6, 'PLAYER', {
      fontSize: '7px', fontFamily: 'monospace', color: '#fff',
    }).setScrollFactor(0).setDepth(2000);

    this.hpBarBg = scene.add.rectangle(8, 16, 80, 6, 0x333333)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2000);
    this.hpBarFill = scene.add.rectangle(8, 16, 80, 6, 0x44ff44)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2001);

    // Lives display
    this.livesIcons = [];
    this.updateLives(3);

    // Tornado cooldown bar
    this.tornadoLabel = scene.add.text(8, 36, 'TORNADO', {
      fontSize: '6px', fontFamily: 'monospace', color: '#88ccff',
    }).setScrollFactor(0).setDepth(2000);
    this.tornadoBarBg = scene.add.rectangle(8, 44, 50, 4, 0x222233)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2000);
    this.tornadoBarFill = scene.add.rectangle(8, 44, 50, 4, 0x44aaff)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2001);
    this.tornadoReady = scene.add.text(60, 42, 'READY', {
      fontSize: '6px', fontFamily: 'monospace', color: '#44ffff',
    }).setScrollFactor(0).setDepth(2002).setVisible(false);
    this._tornadoWasReady = false;

    // Score
    this.scoreValue = 0;
    this.scoreText = scene.add.text(GAME_WIDTH / 2, 6, 'SCORE: 0', {
      fontSize: '8px', fontFamily: 'monospace', color: '#fff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2000);

    // Combo counter
    this.comboText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffee44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setVisible(false);

    // Boss health bar (hidden until boss fight)
    this.bossBarBg = scene.add.rectangle(GAME_WIDTH / 2, 26, GAME_WIDTH - 40, 6, 0x333333)
      .setScrollFactor(0).setDepth(2000).setVisible(false);
    this.bossBarFill = scene.add.rectangle(GAME_WIDTH / 2, 26, GAME_WIDTH - 40, 6, 0xff2222)
      .setScrollFactor(0).setDepth(2001).setVisible(false);
    this.bossLabel = scene.add.text(GAME_WIDTH / 2, 18, 'OGRE', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ff6666',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2000).setVisible(false);

    // "GO -->" prompt
    this.goText = scene.add.text(GAME_WIDTH - 40, GAME_HEIGHT / 2, 'GO >>>', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setVisible(false);
    this.goTween = null;

    // Stage title
    this.stageTitle = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#fff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2500).setVisible(false);
    this.stageSubtitle = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, '', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaa',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2500).setVisible(false);

    // Enemy HP bars
    this.enemyBars = new Map();
  }

  updatePlayerHP(hp, maxHp) {
    const ratio = Math.max(0, hp / maxHp);
    this.hpBarFill.width = 80 * ratio;
    if (ratio > 0.5) this.hpBarFill.setFillStyle(0x44ff44);
    else if (ratio > 0.25) this.hpBarFill.setFillStyle(0xffaa00);
    else this.hpBarFill.setFillStyle(0xff4444);
  }

  updateLives(lives) {
    this.livesIcons.forEach((i) => i.destroy());
    this.livesIcons = [];
    for (let i = 0; i < lives; i++) {
      const icon = this.scene.add.text(8 + i * 12, 24, '\u2665', {
        fontSize: '10px', color: '#ff4444',
      }).setScrollFactor(0).setDepth(2000);
      this.livesIcons.push(icon);
    }
  }

  updateTornadoCooldown(cooldown) {
    const ratio = Math.max(0, 1 - cooldown / TORNADO_COOLDOWN);
    this.tornadoBarFill.width = 50 * ratio;
    const ready = cooldown <= 0;
    if (ready) {
      this.tornadoBarFill.setFillStyle(0x44ffff);
      this.tornadoReady.setVisible(true);
      if (!this._tornadoWasReady) {
        this._tornadoWasReady = true;
        this.scene.tweens.add({
          targets: this.tornadoReady,
          alpha: { from: 0, to: 1 },
          duration: 300,
        });
      }
    } else {
      this.tornadoBarFill.setFillStyle(0x44aaff);
      this.tornadoReady.setVisible(false);
      this._tornadoWasReady = false;
    }
  }

  addScore(points) {
    this.scoreValue += points;
    this.scoreText.setText(`SCORE: ${this.scoreValue}`);
  }

  showCombo(count) {
    if (count < 2) {
      this.comboText.setVisible(false);
      return;
    }
    let label = `${count} HIT`;
    if (count >= 10) label += '!!!';
    else if (count >= 5) label += '!!';
    else label += '!';

    // Score multiplier indicator
    if (count >= 10) label += ' x3';
    else if (count >= 5) label += ' x2';

    this.comboText.setText(label).setVisible(true).setScale(1.2);
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1, scaleY: 1,
      duration: 200,
    });
  }

  hideCombo() {
    this.comboText.setVisible(false);
  }

  showBossBar(name) {
    if (name) this.bossLabel.setText(name);
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossLabel.setVisible(true);
  }

  updateBossHP(hp, maxHp) {
    const ratio = Math.max(0, hp / maxHp);
    this.bossBarFill.width = (GAME_WIDTH - 40) * ratio;
  }

  hideBossBar() {
    this.bossBarBg.setVisible(false);
    this.bossBarFill.setVisible(false);
    this.bossLabel.setVisible(false);
  }

  showGo() {
    this.goText.setVisible(true);
    if (this.goTween) this.goTween.destroy();
    this.goTween = this.scene.tweens.add({
      targets: this.goText,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  hideGo() {
    this.goText.setVisible(false);
    if (this.goTween) { this.goTween.destroy(); this.goTween = null; }
  }

  showStageTitle(title, subtitle) {
    this.stageTitle.setText(title).setVisible(true);
    this.stageSubtitle.setText(subtitle).setVisible(true);
    this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: [this.stageTitle, this.stageSubtitle],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.stageTitle.setVisible(false).setAlpha(1);
          this.stageSubtitle.setVisible(false).setAlpha(1);
        },
      });
    });
  }

  addEnemyBar(enemy) {
    const bg = this.scene.add.rectangle(0, 0, 30, 3, 0x333333).setOrigin(0.5, 0.5).setDepth(2000);
    const fill = this.scene.add.rectangle(0, 0, 30, 3, 0xff4444).setOrigin(0.5, 0.5).setDepth(2001);
    if (enemy.isBoss) { bg.setVisible(false); fill.setVisible(false); }
    this.enemyBars.set(enemy, { bg, fill });
  }

  updateEnemyBar(enemy) {
    const bar = this.enemyBars.get(enemy);
    if (!bar) return;
    if (enemy.isBoss) return;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    bar.fill.width = 30 * ratio;
    bar.bg.setPosition(enemy.x, enemy.y - 55);
    bar.fill.setPosition(enemy.x, enemy.y - 55);
  }

  removeEnemyBar(enemy) {
    const bar = this.enemyBars.get(enemy);
    if (bar) {
      bar.bg.destroy();
      bar.fill.destroy();
      this.enemyBars.delete(enemy);
    }
  }

  spawnScorePopup(x, y, points) {
    const txt = this.scene.add.text(x, y - 40, `+${points}`, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffee44',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(2100);
    this.scene.tweens.add({
      targets: txt,
      y: y - 70,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy(),
    });
  }
}
