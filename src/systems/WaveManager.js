import { PLAY_Y_MIN, PLAY_Y_MAX, GAME_WIDTH } from '../utils/constants.js';
import { EnemyPunk } from '../entities/EnemyPunk.js';
import { OgreBoss } from '../entities/OgreBoss.js';
import { KnightBoss } from '../entities/KnightBoss.js';
import { DemonBoss } from '../entities/DemonBoss.js';

export class WaveManager {
  constructor(scene, waves) {
    this.scene = scene;
    this.waves = waves;
    this.currentWave = 0;
    this.waveActive = false;
    this.waveEnemies = [];
    this.newEnemies = [];
    this.allWavesComplete = false;
    this.bossSpawned = false;
    this.boss = null;
    this.showingGo = false;
    this.lockCenterX = 0;
  }

  update(playerX) {
    if (this.allWavesComplete) return;

    if (this.waveActive) {
      const allDead = this.waveEnemies.every((e) => e.isDead);
      if (allDead) {
        this.waveActive = false;
        this.waveEnemies = [];
        this.currentWave++;
        if (this.currentWave >= this.waves.length) {
          this.allWavesComplete = true;
        } else {
          this.showingGo = true;
        }
      }
      return;
    }

    if (this.currentWave < this.waves.length) {
      const wave = this.waves[this.currentWave];
      if (playerX >= wave.triggerX) {
        this.lockCenterX = playerX;
        this.spawnWave(wave);
        this.showingGo = false;
      }
    }
  }

  spawnWave(wave) {
    this.waveActive = true;
    this.waveEnemies = [];
    this.newEnemies = [];

    if (wave.boss) {
      this.spawnBoss(wave.boss);
      return;
    }

    const camCenter = this.scene.cameras.main.scrollX + GAME_WIDTH / 2;

    for (let i = 0; i < wave.punks; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = camCenter + side * (GAME_WIDTH / 2 + 30 + i * 20);
      const y = PLAY_Y_MIN + Math.random() * (PLAY_Y_MAX - PLAY_Y_MIN);
      const enemy = new EnemyPunk(this.scene, x, y, false);
      enemy.idlePause += i * 400;
      this.waveEnemies.push(enemy);
      this.newEnemies.push(enemy);
    }

    for (let i = 0; i < wave.toughPunks; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = camCenter + side * (GAME_WIDTH / 2 + 50 + i * 20);
      const y = PLAY_Y_MIN + Math.random() * (PLAY_Y_MAX - PLAY_Y_MIN);
      const enemy = new EnemyPunk(this.scene, x, y, true);
      enemy.idlePause += (wave.punks + i) * 400;
      this.waveEnemies.push(enemy);
      this.newEnemies.push(enemy);
    }
  }

  spawnBoss(type) {
    const camCenter = this.scene.cameras.main.scrollX + GAME_WIDTH / 2;
    const x = Math.min(camCenter + GAME_WIDTH / 2 - 40, 2350);
    const y = (PLAY_Y_MIN + PLAY_Y_MAX) / 2;

    switch (type) {
      case 'ogre': this.boss = new OgreBoss(this.scene, x, y); break;
      case 'knight': this.boss = new KnightBoss(this.scene, x, y); break;
      case 'demon': this.boss = new DemonBoss(this.scene, x, y); break;
    }

    this.waveEnemies.push(this.boss);
    this.newEnemies = [this.boss];
    this.bossSpawned = true;
  }

  getCameraLockBounds() {
    if (!this.waveActive) return null;
    return {
      left: this.lockCenterX - GAME_WIDTH / 2 + 30,
      right: this.lockCenterX + GAME_WIDTH / 2 - 30,
    };
  }

  get allEnemiesInWave() {
    return this.waveEnemies;
  }
}
