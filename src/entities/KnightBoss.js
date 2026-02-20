import Phaser from 'phaser';
import {
  KNIGHT_SPEED, KNIGHT_HP, KNIGHT_DAMAGE, KNIGHT_ATTACK_RANGE,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE, GAME_WIDTH,
} from '../utils/constants.js';

const STATE = { IDLE: 'idle', WALK: 'walk', ATTACK: 'attack', HURT: 'hurt', RECOVER: 'recover', DEAD: 'dead', JUMP: 'jump' };

export class KnightBoss extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.hp = KNIGHT_HP;
    this.maxHp = KNIGHT_HP;
    this.state = STATE.IDLE;
    this.facing = -1;
    this.isAttacking = false;
    this.attackHit = false;
    this.stateTimer = 0;
    this.idlePause = 800;
    this.recoverTimer = 0;
    this.attackCount = 0;
    this.isBoss = true;
    this.bossName = 'KNIGHT';
    this.daggerCooldown = 0;

    this.shadow = scene.add.image(0, 2, 'shadow').setAlpha(0.5).setOrigin(0.5, 0.5).setScale(2, 1.2);
    this.add(this.shadow);

    this.sprite = scene.add.sprite(0, 0, 'knight-idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    this.sprite.play('knight-idle');
    this.sprite.on('animationcomplete', this.onAnimComplete, this);
    this.setSize(40, 12);
    this.setDepth(DEPTH_BASE + y);
  }

  onAnimComplete(anim) {
    if (['knight-sword', 'knight-airsword', 'knight-attackside', 'knight-jumpattack'].includes(anim.key)) {
      this.isAttacking = false;
      this.attackHit = false;
      this.attackCount++;
      if (this.attackCount >= 3) {
        this.state = STATE.RECOVER;
        this.recoverTimer = 1000;
        this.attackCount = 0;
        this.sprite.play('knight-idle');
      } else {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = Phaser.Math.Between(300, 700);
      }
    }
    if (anim.key === 'knight-hurt') {
      this.state = STATE.IDLE;
      this.stateTimer = 0;
      this.idlePause = 200;
    }
  }

  update(dt, playerX, playerY) {
    if (this.state === STATE.DEAD) return;

    this.daggerCooldown -= dt;

    if (this.state === STATE.HURT) return;

    if (this.state === STATE.RECOVER) {
      this.recoverTimer -= dt;
      if (this.recoverTimer <= 0) {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
      }
      return;
    }

    if (this.isAttacking) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
    this.sprite.setFlipX(this.facing === 1);

    if (this.state === STATE.IDLE) {
      this.stateTimer += dt;
      if (this.stateTimer >= this.idlePause) {
        // Throw dagger if far, rush in if medium, attack if close
        if (dist > 200 && this.daggerCooldown <= 0) {
          this.throwDagger(playerX, playerY);
        } else {
          this.state = STATE.WALK;
        }
      }
      if (this.sprite.anims.currentAnim?.key !== 'knight-idle') this.sprite.play('knight-idle');
    }

    if (this.state === STATE.WALK) {
      if (dist < KNIGHT_ATTACK_RANGE && Math.abs(dy) < 18) {
        this.doAttack(dist);
      } else {
        const speed = KNIGHT_SPEED * (dt / 1000);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        this.x += nx * speed;
        this.y += ny * speed * 0.5;
        this.y = Phaser.Math.Clamp(this.y, PLAY_Y_MIN, PLAY_Y_MAX);

        if (this.sprite.anims.currentAnim?.key !== 'knight-run') this.sprite.play('knight-run');
      }
    }

    this.setDepth(DEPTH_BASE + this.y);
  }

  doAttack() {
    this.isAttacking = true;
    this.attackHit = false;
    this.state = STATE.ATTACK;
    // Randomly choose attack type
    const attacks = ['knight-sword', 'knight-airsword', 'knight-attackside'];
    const choice = attacks[Phaser.Math.Between(0, attacks.length - 1)];
    this.sprite.play(choice);
    this.currentAttack = choice;
  }

  throwDagger(playerX, playerY) {
    this.daggerCooldown = 3000;
    const scene = this.scene;
    const dagger = scene.add.image(this.x + this.facing * 20, this.y - 30, 'knight-dagger').setDepth(DEPTH_BASE + 400);
    const speed = 150;
    const dx = playerX - dagger.x;
    const dy = playerY - 30 - dagger.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    dagger.setFlipX(this.facing === -1);

    const timer = scene.time.addEvent({
      delay: 16,
      repeat: 120,
      callback: () => {
        dagger.x += vx * 0.016;
        dagger.y += vy * 0.016;

        // Check hit with player
        const p = scene.player;
        if (p && !p.invincible && !p.isDead && Math.abs(dagger.x - p.x) < 20 && Math.abs(dagger.y - (p.y - 20)) < 25) {
          p.takeHit(KNIGHT_DAMAGE * 0.7, dagger.x);
          const fx = scene.add.sprite(dagger.x, dagger.y, 'knight-dagger-hit').setDepth(DEPTH_BASE + 500);
          fx.play('knight-dagger-hit');
          fx.once('animationcomplete', () => fx.destroy());
          dagger.destroy();
          timer.destroy();
        }
      },
    });

    // Auto-destroy after timeout
    scene.time.delayedCall(2000, () => {
      if (dagger.active) dagger.destroy();
    });
  }

  getAttackBox() {
    if (!this.isAttacking || this.attackHit) return null;
    const frame = this.sprite.anims.currentFrame;
    if (!frame) return null;

    let activeFrame = 3;
    if (this.currentAttack === 'knight-attackside') activeFrame = 1;

    if (frame.index < activeFrame) return null;

    return {
      x: this.x + this.facing * KNIGHT_ATTACK_RANGE * 0.5,
      y: this.y,
      width: KNIGHT_ATTACK_RANGE,
      height: 25,
      damage: KNIGHT_DAMAGE,
      heavy: false,
    };
  }

  takeHit(damage, fromX) {
    if (this.state === STATE.DEAD) return;
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = STATE.DEAD;
      this.isAttacking = false;
      return;
    }
    if (this.state === STATE.RECOVER || !this.isAttacking) {
      this.state = STATE.HURT;
      this.isAttacking = false;
      this.sprite.play('knight-hurt');
      const dir = this.x < fromX ? -1 : 1;
      this.x += dir * 12;
    }
  }

  get isDead() { return this.state === STATE.DEAD; }
}
