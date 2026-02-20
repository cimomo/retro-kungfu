import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { InputManager } from '../systems/InputManager.js';
import { TouchControls } from '../systems/TouchControls.js';
import { HUD } from '../systems/HUD.js';
import { WaveManager } from '../systems/WaveManager.js';
import { Audio } from '../systems/Audio.js';
import {
  GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE, STAGES,
} from '../utils/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(data) {
    this.stageIndex = data.stageIndex || 0;
    this.carryScore = data.score || 0;
    this.carryLives = data.lives || 3;
    this.carryCredits = data.credits || 3;
    const stageConfig = STAGES[this.stageIndex];

    // Audio
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.init();
    }
    this.input.once('pointerdown', () => this.audio.resume());

    // Build stage background
    this.buildStage(stageConfig.bgType);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setDeadzone(40, GAME_HEIGHT);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Input
    this.inputManager = new InputManager(this);
    this.touchControls = new TouchControls(this, this.inputManager);

    // Player
    this.player = new Player(this, 100, (PLAY_Y_MIN + PLAY_Y_MAX) / 2);
    this.player.lives = this.carryLives;
    this.cameras.main.startFollow(this.player, true, 0.1, 0);

    // Camera lock state
    this.cameraLocked = false;

    // Wave manager with stage-specific waves
    this.waveManager = new WaveManager(this, stageConfig.waves);

    // HUD
    this.hud = new HUD(this);
    this.hud.scoreValue = this.carryScore;
    this.hud.scoreText.setText(`SCORE: ${this.carryScore}`);
    this.hud.showStageTitle(stageConfig.name, stageConfig.subtitle);

    // Game state
    this.gameOver = false;
    this.gameWon = false;
    this.restartReady = false;
    this.continueActive = false;

    // Restart / continue keys
    this.restartKeyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.restartKeyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.on('pointerdown', () => {
      if (this.restartReady) this.onRestartInput();
    });

    // End-game text
    this.endText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#fff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);

    this.subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5, '', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaa',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);

    this.continueText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);

    this.continueCountdown = 10;
    this.continueTimer = null;
  }

  update(time, delta) {
    const dt = delta;

    if (this.continueActive) {
      this.handleContinue();
      this.inputManager.clearTouch();
      return;
    }

    if (this.gameOver || this.gameWon) {
      this.handleEndState();
      this.inputManager.clearTouch();
      return;
    }

    const cam = this.cameras.main;
    let camLeft = cam.scrollX;
    let camRight = cam.scrollX + GAME_WIDTH;

    // Wave manager
    this.waveManager.update(this.player.x);

    // Register new enemy HUD bars
    if (this.waveManager.newEnemies && this.waveManager.newEnemies.length > 0) {
      for (const enemy of this.waveManager.newEnemies) {
        this.hud.addEnemyBar(enemy);
      }
      this.waveManager.newEnemies = [];
    }

    // Camera locking
    const lockBounds = this.waveManager.getCameraLockBounds();
    if (lockBounds) {
      if (!this.cameraLocked) {
        this.cameraLocked = true;
        cam.stopFollow();
        cam.scrollX = Phaser.Math.Clamp(cam.scrollX, Math.max(0, lockBounds.left - 30), Math.min(WORLD_WIDTH, lockBounds.right + 30) - GAME_WIDTH);
      }
      camLeft = cam.scrollX;
      camRight = cam.scrollX + GAME_WIDTH;
    } else {
      if (this.cameraLocked) {
        this.cameraLocked = false;
        cam.startFollow(this.player, true, 0.1, 0);
      }
    }

    // GO arrow
    if (this.waveManager.showingGo && !this.cameraLocked) {
      this.hud.showGo();
    } else {
      this.hud.hideGo();
    }

    // Update player
    this.player.update(dt, this.inputManager, camLeft, camRight);
    this.hud.updatePlayerHP(this.player.hp, this.player.maxHp);
    this.hud.updateLives(this.player.lives);
    this.hud.updateTornadoCooldown(this.player.tornadoCooldown);

    // Combo display
    if (this.player.comboCount >= 2) {
      this.hud.showCombo(this.player.comboCount);
    } else {
      this.hud.hideCombo();
    }

    // Update enemies
    const enemies = this.waveManager.allEnemiesInWave;
    for (const enemy of enemies) {
      if (enemy.isDead || enemy.cleaned) continue;
      enemy.update(dt, this.player.x, this.player.y);
      this.hud.updateEnemyBar(enemy);
    }

    // Boss health bar
    if (this.waveManager.bossSpawned && this.waveManager.boss) {
      const boss = this.waveManager.boss;
      this.hud.showBossBar(boss.bossName || 'BOSS');
      this.hud.updateBossHP(boss.hp, boss.maxHp);
    }

    // Combat
    this.resolvePlayerAttacks(enemies);
    this.resolveEnemyAttacks(enemies);
    this.cleanupDead(enemies);

    // Check player death → continue or game over
    if (this.player.isDead && !this.gameOver) {
      if (this.carryCredits > 0) {
        this.showContinue();
      } else {
        this.showGameOver();
      }
    }

    // Check stage clear
    if (this.waveManager.allWavesComplete && !this.gameWon) {
      this.gameWon = true;
      this.hud.hideBossBar();
      this.screenFlash();
      this.showStageClear();
    }

    this.inputManager.clearTouch();
  }

  // --- Combat ---
  resolvePlayerAttacks(enemies) {
    const atkBox = this.player.getAttackBox();
    if (!atkBox) return;

    const isTornado = atkBox.fxType === 'tornado';

    // Spawn tornado FX once on the player
    if (isTornado && !this.player.tornadoHitRegistered) {
      this.spawnFx('shield-fx', this.player.x, this.player.y - 25);
      this.spawnFx('shock-fx', this.player.x, this.player.y - 30);
      this.audio.play('tornado');
      this.screenShake(5);
      this.cameras.main.flash(150, 100, 220, 255, true);
    }

    let hitAny = false;
    for (const enemy of enemies) {
      if (enemy.isDead || enemy.cleaned) continue;
      if (enemy.state === 'hurt' && !enemy.isBoss) continue;

      const tolerance = isTornado ? 35 : (enemy.isBoss ? 25 : 15);
      if (this.boxOverlap(atkBox, enemy, tolerance)) {
        enemy.takeHit(atkBox.damage, this.player.x);
        hitAny = true;
        this.player.registerHit();

        const basePoints = enemy.isBoss ? 50 : 100;
        let multiplier = 1;
        if (this.player.comboCount >= 10) multiplier = 3;
        else if (this.player.comboCount >= 5) multiplier = 2;
        const points = basePoints * multiplier;
        this.hud.addScore(enemy.hp <= 0 && enemy.isBoss ? 1000 : points);
        this.hud.spawnScorePopup(enemy.x, enemy.y, points);

        const fxX = enemy.x - (enemy.facing || 0) * 10;
        const fxY = enemy.y - (enemy.isBoss ? 45 : 30);
        if (!isTornado) {
          this.spawnFx(atkBox.fxType === 'slash' ? 'slash-fx' : 'hit-fx', fxX, fxY);
        } else {
          this.spawnFx('slash-circ-fx', fxX, fxY);
        }
        this.audio.play(enemy.isBoss ? 'boss-hit' : 'hit');
        if (atkBox.damage >= 15 || enemy.isBoss) this.screenShake(enemy.isBoss ? 3 : 2);

        // Normal attacks hit one enemy; tornado hits all
        if (!isTornado) break;
      }
    }

    if (hitAny) {
      this.player.attackHit = true;
      if (isTornado) this.player.tornadoHitRegistered = true;
    }
  }

  resolveEnemyAttacks(enemies) {
    for (const enemy of enemies) {
      if (enemy.isDead || enemy.cleaned) continue;
      const atkBox = enemy.getAttackBox();
      if (!atkBox) continue;

      if (this.boxOverlapPlayer(atkBox, this.player)) {
        this.player.takeHit(atkBox.damage, enemy.x);
        enemy.attackHit = true;
        const fxX = this.player.x - this.player.facing * 10;
        const fxY = this.player.y - 30;
        if (atkBox.heavy) {
          this.spawnFx('smack-fx', fxX, fxY);
          this.screenShake(4);
        } else {
          this.spawnFx('hit-fx', fxX, fxY);
        }
        this.audio.play('hurt');
      }
    }
  }

  boxOverlap(atkBox, enemy, tolerance) {
    return Math.abs(atkBox.x - enemy.x) < atkBox.width / 2 + tolerance && Math.abs(atkBox.y - enemy.y) < 20;
  }

  boxOverlapPlayer(atkBox, player) {
    if (player.invincible || player.isDead) return false;
    return Math.abs(atkBox.x - player.x) < atkBox.width / 2 + 15 && Math.abs(atkBox.y - player.y) < 20;
  }

  spawnFx(key, x, y) {
    const fx = this.add.sprite(x, y, key).setDepth(DEPTH_BASE + 500);
    fx.play(key);
    fx.once('animationcomplete', () => fx.destroy());
  }

  cleanupDead(enemies) {
    for (const enemy of enemies) {
      if (enemy.cleaned) continue;
      if (enemy.isDead) {
        enemy.cleaned = true;
        const deathFx = this.add.sprite(enemy.x, enemy.y - 20, 'death-fx').setDepth(DEPTH_BASE + 500);
        deathFx.play('death-fx');
        deathFx.once('animationcomplete', () => deathFx.destroy());
        this.audio.play(enemy.isBoss ? 'boss-roar' : 'death');
        this.hud.removeEnemyBar(enemy);
        this.tweens.add({ targets: enemy, alpha: 0, duration: 400, onComplete: () => enemy.destroy() });
      }
    }
  }

  screenShake(i) { this.cameras.main.shake(150, i * 0.001); }
  screenFlash() { this.cameras.main.flash(500, 255, 255, 255); }

  // --- Continue system ---
  showContinue() {
    this.continueActive = true;
    this.continueCountdown = 10;
    this.endText.setText('CONTINUE?').setVisible(true);
    this.subText.setText(`Credits: ${this.carryCredits}`).setVisible(true);
    this.continueText.setText(`${this.continueCountdown}`).setVisible(true);

    this.continueTimer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        this.continueCountdown--;
        this.continueText.setText(`${this.continueCountdown}`);
        if (this.continueCountdown <= 0) {
          this.showGameOver();
        }
      },
    });

    this.time.delayedCall(300, () => { this.restartReady = true; });
  }

  handleContinue() {
    if (!this.restartReady) return;
    if (Phaser.Input.Keyboard.JustDown(this.restartKeyZ) ||
        Phaser.Input.Keyboard.JustDown(this.restartKeyEnter) ||
        this.inputManager.touchPunch || this.inputManager.touchKick) {
      // Use a credit and restart this stage
      if (this.continueTimer) this.continueTimer.destroy();
      this.carryCredits--;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart({
          stageIndex: this.stageIndex,
          score: this.hud.scoreValue,
          lives: 3,
          credits: this.carryCredits,
        });
      });
    }
  }

  showGameOver() {
    this.continueActive = false;
    this.gameOver = true;
    if (this.continueTimer) this.continueTimer.destroy();
    this.endText.setText('GAME OVER').setVisible(true);
    this.continueText.setVisible(false);
    this.subText.setText(`Score: ${this.hud.scoreValue}`).setVisible(true);

    this.time.delayedCall(500, () => { this.restartReady = true; });
  }

  showStageClear() {
    this.endText.setText('STAGE CLEAR!').setVisible(true);
    this.subText.setText(`Score: ${this.hud.scoreValue}`).setVisible(true);
    this.time.delayedCall(500, () => { this.restartReady = true; });
  }

  handleEndState() {
    if (!this.restartReady) return;
    if (Phaser.Input.Keyboard.JustDown(this.restartKeyZ) ||
        Phaser.Input.Keyboard.JustDown(this.restartKeyEnter) ||
        this.inputManager.touchPunch || this.inputManager.touchKick) {
      this.onRestartInput();
    }
  }

  onRestartInput() {
    if (!this.restartReady) return;
    this.restartReady = false;

    if (this.gameWon) {
      const nextStage = this.stageIndex + 1;
      if (nextStage < STAGES.length) {
        // Advance to next stage
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('StageIntro', {
            stageIndex: nextStage,
            score: this.hud.scoreValue,
            lives: this.player.lives,
            credits: this.carryCredits,
          });
        });
      } else {
        // Game complete!
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Victory', { score: this.hud.scoreValue });
        });
      }
    } else if (this.gameOver) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('NameEntry', { score: this.hud.scoreValue, nextScene: 'Title' });
      });
    }
  }

  // --- Stage background builders ---
  buildStage(bgType) {
    switch (bgType) {
      case 'streets': this.buildStreets(); break;
      case 'synth-city': this.buildSynthCity(); break;
      case 'night-town': this.buildNightTown(); break;
    }
  }

  buildStreets() {
    const d = 0;
    const skyH = 80;
    for (let x = 0; x < WORLD_WIDTH + 96; x += 96)
      this.add.image(x, 0, 'stage-back').setOrigin(0, 0).setDepth(d).setScrollFactor(0.3, 1);

    const wallTop = skyH;
    const wallH = PLAY_Y_MIN - wallTop - 20;
    for (let x = 0; x < WORLD_WIDTH; x += 544)
      this.add.image(x, wallTop, 'stage-tileset').setOrigin(0, 0).setDepth(d + 0.1).setCrop(0, 128, 544, Math.min(128, wallH));
    for (let x = 0; x < WORLD_WIDTH; x += GAME_WIDTH)
      this.add.rectangle(x + GAME_WIDTH / 2, wallTop + wallH / 2, GAME_WIDTH, wallH, 0x2a2035).setDepth(d);

    this.buildGround(0x3d5c5e, 0x4a7a7d, 0x345255, 0x1a1a2e, 0x556666, 0xd4a030);
    this.scatterProps();
  }

  buildSynthCity() {
    const d = 0;
    // Parallax layers
    for (let x = 0; x < WORLD_WIDTH + 256; x += 256)
      this.add.image(x, GAME_HEIGHT - 192, 'synth-back').setOrigin(0, 0).setDepth(d).setScrollFactor(0.15, 1);
    for (let x = 0; x < WORLD_WIDTH + 256; x += 256)
      this.add.image(x, GAME_HEIGHT - 192, 'synth-far').setOrigin(0, 0).setDepth(d + 0.1).setScrollFactor(0.3, 1);
    for (let x = 0; x < WORLD_WIDTH + 352; x += 352)
      this.add.image(x, GAME_HEIGHT - 192, 'synth-fore').setOrigin(0, 0).setDepth(d + 0.2).setScrollFactor(0.5, 1);

    this.buildGround(0x2a1a3a, 0x4a2a5a, 0x251535, 0x120a20, 0x3a2a4a, 0xe040a0);
    this.scatterProps();
  }

  buildNightTown() {
    const d = 0;
    // 7-layer parallax
    for (let x = 0; x < WORLD_WIDTH + 96; x += 96)
      this.add.image(x, 0, 'night-sky').setOrigin(0, 0).setDepth(d).setScrollFactor(0.05, 1);
    for (let x = 0; x < WORLD_WIDTH + 288; x += 288)
      this.add.image(x, 0, 'night-clouds').setOrigin(0, 0).setDepth(d + 0.01).setScrollFactor(0.1, 1);
    for (let x = 0; x < WORLD_WIDTH + 96; x += 96)
      this.add.image(x, 0, 'night-mountains').setOrigin(0, 0).setDepth(d + 0.02).setScrollFactor(0.15, 1);
    for (let x = 0; x < WORLD_WIDTH + 96; x += 96)
      this.add.image(x, 0, 'night-mt-lights').setOrigin(0, 0).setDepth(d + 0.03).setScrollFactor(0.18, 1);
    for (let x = 0; x < WORLD_WIDTH + 320; x += 320)
      this.add.image(x, GAME_HEIGHT - 80, 'night-far').setOrigin(0, 0).setDepth(d + 0.04).setScrollFactor(0.3, 1);
    for (let x = 0; x < WORLD_WIDTH + 64; x += 64)
      this.add.image(x, GAME_HEIGHT - 96, 'night-forest').setOrigin(0, 0).setDepth(d + 0.05).setScrollFactor(0.4, 1);
    for (let x = 0; x < WORLD_WIDTH + 512; x += 512)
      this.add.image(x, PLAY_Y_MIN - 60, 'night-town').setOrigin(0, 0).setDepth(d + 0.06).setScrollFactor(0.6, 1);

    this.buildGround(0x1a2a1a, 0x2a3a2a, 0x152015, 0x0a150a, 0x2a3a2a, 0x888844);
  }

  buildGround(swColor, swEdge, swLine, roadColor, curbColor, lineColor) {
    const d = 0;
    const swTop = PLAY_Y_MIN - 20;
    const swH = PLAY_Y_MAX - swTop + 20;
    const roadTop = swTop + swH;
    const roadH = GAME_HEIGHT - roadTop;

    for (let x = 0; x < WORLD_WIDTH; x += GAME_WIDTH) {
      this.add.rectangle(x + GAME_WIDTH / 2, swTop + swH / 2, GAME_WIDTH, swH, swColor).setDepth(d + 0.5);
      this.add.rectangle(x + GAME_WIDTH / 2, swTop, GAME_WIDTH, 2, swEdge).setDepth(d + 0.6);
      this.add.rectangle(x + GAME_WIDTH / 2, roadTop + roadH / 2, GAME_WIDTH, roadH, roadColor).setDepth(d + 0.5);
      this.add.rectangle(x + GAME_WIDTH / 2, roadTop, GAME_WIDTH, 3, curbColor).setDepth(d + 0.6);
      this.add.rectangle(x + GAME_WIDTH / 2, GAME_HEIGHT - 12, GAME_WIDTH, 2, lineColor).setDepth(d + 0.6);
    }
    for (let y = swTop + 12; y < swTop + swH; y += 16) {
      for (let x = 0; x < WORLD_WIDTH; x += GAME_WIDTH) {
        this.add.rectangle(x + GAME_WIDTH / 2, y, GAME_WIDTH, 1, swLine).setDepth(d + 0.6).setAlpha(0.5);
      }
    }
  }

  scatterProps() {
    const propPositions = [200, 500, 750, 1000, 1300, 1550, 1800, 2050];
    const propKeys = ['barrel', 'hydrant', 'car'];
    propPositions.forEach((px, i) => {
      const key = propKeys[i % propKeys.length];
      const py = key === 'car' ? GAME_HEIGHT - 25 : PLAY_Y_MIN - 15;
      this.add.image(px, py, key).setOrigin(0.5, 1).setDepth(0.5);
    });
  }
}
