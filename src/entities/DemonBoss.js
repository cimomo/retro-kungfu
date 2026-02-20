import Phaser from 'phaser';
import {
  DEMON_SPEED, DEMON_HP, DEMON_MELEE_DAMAGE, DEMON_BREATH_DAMAGE, DEMON_ATTACK_RANGE,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE,
} from '../utils/constants.js';

const STATE = { IDLE: 'idle', WALK: 'walk', ATTACK: 'attack', BREATH: 'breath', HURT: 'hurt', RECOVER: 'recover', DEAD: 'dead' };

export class DemonBoss extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.hp = DEMON_HP;
    this.maxHp = DEMON_HP;
    this.state = STATE.WALK;
    this.facing = -1;
    this.isAttacking = false;
    this.attackHit = false;
    this.stateTimer = 0;
    this.idlePause = 400;
    this.recoverTimer = 0;
    this.attackCount = 0;
    this.isBoss = true;
    this.bossName = 'DEMON';
    this.enraged = false;
    this.breathProjectiles = [];

    this.shadow = scene.add.image(0, 2, 'shadow').setAlpha(0.5).setOrigin(0.5, 0.5).setScale(3, 2);
    this.add(this.shadow);

    // Demon is large — scale down to fit the game
    this.sprite = scene.add.sprite(0, 0, 'demon-idle').setOrigin(0.5, 1).setScale(0.55);
    this.add(this.sprite);
    this.sprite.play('demon-idle');
    this.sprite.on('animationcomplete', this.onAnimComplete, this);
    this.setSize(50, 15);
    this.setDepth(DEPTH_BASE + y);
  }

  onAnimComplete(anim) {
    if (this.state === STATE.DEAD) return;
    if (anim.key === 'demon-attack') {
      this.isAttacking = false;
      this.attackHit = false;
      this.attackCount++;
      if (this.attackCount >= 2) {
        this.state = STATE.RECOVER;
        this.recoverTimer = this.enraged ? 600 : 1000;
        this.attackCount = 0;
        this.sprite.play('demon-idle');
      } else {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = this.enraged ? 300 : 600;
      }
    }
    if (anim.key === 'demon-breath') {
      this.isAttacking = false;
      this.state = STATE.RECOVER;
      this.recoverTimer = this.enraged ? 800 : 1200;
      this.sprite.play('demon-idle');
    }
  }

  update(dt, playerX, playerY) {
    if (this.state === STATE.DEAD) return;

    // Enrage check
    if (!this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.sprite.setTint(0xff6666);
    }

    if (this.state === STATE.HURT) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = 200;
      }
      return;
    }

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
        // Breath only at medium range; always walk in from far away
        if (dist > 100 && dist < 250 && Phaser.Math.Between(0, 2) === 0) {
          this.doBreath(playerX, playerY);
        } else {
          this.state = STATE.WALK;
        }
      }
      if (this.sprite.anims.currentAnim?.key !== 'demon-idle') this.sprite.play('demon-idle');
    }

    if (this.state === STATE.WALK) {
      if (dist < DEMON_ATTACK_RANGE && Math.abs(dy) < 25) {
        this.doMelee();
      } else {
        // Move faster when far away to close the gap
        let speedMul = this.enraged ? 1.5 : 1;
        if (dist > 200) speedMul *= 2;
        const speed = DEMON_SPEED * speedMul * (dt / 1000);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        this.x += nx * speed;
        this.y += ny * speed * 0.4;
        this.y = Phaser.Math.Clamp(this.y, PLAY_Y_MIN, PLAY_Y_MAX);

        // Demon uses idle anim for walking (no walk spritesheet)
        if (this.sprite.anims.currentAnim?.key !== 'demon-idle') this.sprite.play('demon-idle');
      }
    }

    this.setDepth(DEPTH_BASE + this.y);
  }

  doMelee() {
    this.isAttacking = true;
    this.attackHit = false;
    this.state = STATE.ATTACK;
    this.sprite.play('demon-attack');
  }

  doBreath(playerX, playerY) {
    this.isAttacking = true;
    this.state = STATE.BREATH;
    this.sprite.play('demon-breath');

    // Spawn fireball projectile midway through animation
    this.scene.time.delayedCall(800, () => {
      if (this.state !== STATE.BREATH) return;
      const scene = this.scene;
      const fb = scene.add.sprite(this.x + this.facing * 40, this.y - 50, 'fireball-fx').setDepth(DEPTH_BASE + 400);
      fb.play('fireball-fx');
      fb.setFlipX(this.facing === -1);

      const speed = 120;
      const vx = this.facing * speed;
      const timer = scene.time.addEvent({
        delay: 16,
        repeat: 150,
        callback: () => {
          if (!fb.active) return;
          fb.x += vx * 0.016;

          const p = scene.player;
          if (p && !p.invincible && !p.isDead && Math.abs(fb.x - p.x) < 25 && Math.abs(fb.y - (p.y - 20)) < 30) {
            p.takeHit(this.enraged ? DEMON_BREATH_DAMAGE * 1.5 : DEMON_BREATH_DAMAGE, fb.x);
            const shock = scene.add.sprite(fb.x, fb.y, 'shock-fx').setDepth(DEPTH_BASE + 500);
            shock.play('shock-fx');
            shock.once('animationcomplete', () => shock.destroy());
            fb.destroy();
            timer.destroy();
          }
        },
      });
      scene.time.delayedCall(2500, () => { if (fb.active) fb.destroy(); });
    });
  }

  getAttackBox() {
    if (!this.isAttacking || this.attackHit || this.state !== STATE.ATTACK) return null;
    const frame = this.sprite.anims.currentFrame;
    if (!frame) return null;
    if (frame.index < 8 || frame.index > 12) return null;

    return {
      x: this.x + this.facing * DEMON_ATTACK_RANGE * 0.5,
      y: this.y,
      width: DEMON_ATTACK_RANGE,
      height: 35,
      damage: this.enraged ? DEMON_MELEE_DAMAGE * 1.3 : DEMON_MELEE_DAMAGE,
      heavy: true,
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
    // React to hits during idle, walk, or recover (not during attack/breath)
    if (!this.isAttacking) {
      this.state = STATE.HURT;
      this.stateTimer = 400;
      this.sprite.play('demon-idle');
      const dir = this.x < fromX ? -1 : 1;
      this.x += dir * 6;
    }
  }

  get isDead() { return this.state === STATE.DEAD; }
}
