import Phaser from 'phaser';
import {
  OGRE_SPEED, OGRE_HP, OGRE_DAMAGE, OGRE_ATTACK_RANGE,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE,
} from '../utils/constants.js';

const STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  RECOVER: 'recover',
  DEAD: 'dead',
};

export class OgreBoss extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.hp = OGRE_HP;
    this.maxHp = OGRE_HP;
    this.state = STATE.IDLE;
    this.facing = -1;
    this.isAttacking = false;
    this.attackHit = false;
    this.stateTimer = 0;
    this.idlePause = 1000;
    this.recoverTimer = 0;
    this.attackCount = 0; // attacks before recovery pause
    this.isBoss = true;
    this.bossName = 'OGRE';
    this.phase2 = false; // below 50% HP

    // Shadow (bigger for boss)
    this.shadow = scene.add.image(0, 2, 'shadow').setAlpha(0.5).setOrigin(0.5, 0.5).setScale(2.5, 1.5);
    this.add(this.shadow);

    // Sprite
    this.sprite = scene.add.sprite(0, 0, 'ogre-idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    this.sprite.play('ogre-idle');

    this.sprite.on('animationcomplete', this.onAnimComplete, this);
    this.setSize(50, 15);
    this.setDepth(DEPTH_BASE + y);
  }

  onAnimComplete(anim) {
    if (anim.key === 'ogre-attack') {
      this.isAttacking = false;
      this.attackHit = false;
      this.attackCount++;

      // After 2 attacks, enter recovery (vulnerable window)
      if (this.attackCount >= 2) {
        this.state = STATE.RECOVER;
        this.recoverTimer = this.phase2 ? 800 : 1200;
        this.attackCount = 0;
        const idleAnim = this.phase2 ? 'ogre-idle-unarmed' : 'ogre-idle';
        this.sprite.play(idleAnim);
      } else {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = this.phase2 ? 400 : 700;
      }
    }
    if (anim.key === 'punk-hurt' || anim.key === 'ogre-idle' || anim.key === 'ogre-idle-unarmed') {
      // These loop or are handled elsewhere
    }
  }

  update(dt, playerX, playerY) {
    if (this.state === STATE.DEAD) return;

    // Phase 2 check
    if (!this.phase2 && this.hp <= this.maxHp * 0.5) {
      this.phase2 = true;
    }

    if (this.state === STATE.HURT) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = 300;
      }
      return;
    }

    if (this.state === STATE.RECOVER) {
      this.recoverTimer -= dt;
      if (this.recoverTimer <= 0) {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = 200;
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
        this.state = STATE.WALK;
      }
      const idleAnim = this.phase2 ? 'ogre-idle-unarmed' : 'ogre-idle';
      if (this.sprite.anims.currentAnim?.key !== idleAnim) {
        this.sprite.play(idleAnim);
      }
    }

    if (this.state === STATE.WALK) {
      const yDist = Math.abs(dy);
      if (dist < OGRE_ATTACK_RANGE && yDist < 20) {
        this.doAttack();
      } else {
        const speed = (this.phase2 ? OGRE_SPEED * 1.4 : OGRE_SPEED) * (dt / 1000);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

        this.x += nx * speed;
        this.y += ny * speed * 0.5;
        this.y = Phaser.Math.Clamp(this.y, PLAY_Y_MIN, PLAY_Y_MAX);

        const walkAnim = this.phase2 ? 'ogre-walk-unarmed' : 'ogre-walk';
        if (this.sprite.anims.currentAnim?.key !== walkAnim) {
          this.sprite.play(walkAnim);
        }
      }
    }

    this.setDepth(DEPTH_BASE + this.y);
  }

  doAttack() {
    this.isAttacking = true;
    this.attackHit = false;
    this.state = STATE.ATTACK;
    this.sprite.play('ogre-attack');
  }

  getAttackBox() {
    if (!this.isAttacking || this.attackHit) return null;
    const frame = this.sprite.anims.currentFrame;
    if (!frame) return null;
    // Hit on frames 4-5 of the 7-frame attack
    if (frame.index < 4 || frame.index > 5) return null;

    return {
      x: this.x + this.facing * OGRE_ATTACK_RANGE * 0.5,
      y: this.y,
      width: OGRE_ATTACK_RANGE,
      height: 30,
      damage: this.phase2 ? OGRE_DAMAGE * 1.3 : OGRE_DAMAGE,
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

    // Ogre only flinches during recovery, otherwise takes damage silently
    if (this.state === STATE.RECOVER) {
      this.state = STATE.HURT;
      this.stateTimer = 300;
      this.isAttacking = false;
      // Slight knockback
      const dir = this.x < fromX ? -1 : 1;
      this.x += dir * 8;
    }
  }

  get isDead() {
    return this.state === STATE.DEAD;
  }
}
