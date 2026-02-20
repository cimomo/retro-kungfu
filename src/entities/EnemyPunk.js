import Phaser from 'phaser';
import {
  PUNK_SPEED, PUNK_HP, PUNK_TOUGH_HP, PUNK_DAMAGE, PUNK_ATTACK_RANGE, PUNK_AGGRO_RANGE,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE,
} from '../utils/constants.js';

const STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEAD: 'dead',
};

export class EnemyPunk extends Phaser.GameObjects.Container {
  constructor(scene, x, y, tough = false) {
    super(scene, x, y);
    scene.add.existing(this);

    this.tough = tough;
    this.hp = tough ? PUNK_TOUGH_HP : PUNK_HP;
    this.maxHp = this.hp;
    this.state = STATE.IDLE;
    this.facing = -1;
    this.isAttacking = false;
    this.attackHit = false;
    this.stateTimer = 0;
    this.idlePause = Phaser.Math.Between(500, 1500);

    // Shadow
    this.shadow = scene.add.image(0, 0, 'shadow').setAlpha(0.5).setOrigin(0.5, 0.5);
    this.add(this.shadow);

    // Sprite
    this.sprite = scene.add.sprite(0, 0, 'punk-idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    this.sprite.play('punk-idle');

    // Palette tint for tough punks
    if (tough) {
      this.sprite.setTint(0xff8888);
    }

    this.sprite.on('animationcomplete', this.onAnimComplete, this);
    this.setSize(30, 10);
    this.setDepth(DEPTH_BASE + y);
  }

  onAnimComplete(anim) {
    if (anim.key === 'punk-punch') {
      this.isAttacking = false;
      this.attackHit = false;
      this.state = STATE.IDLE;
      this.stateTimer = 0;
      this.idlePause = Phaser.Math.Between(800, 1800);
    }
    if (anim.key === 'punk-hurt') {
      if (this.hp <= 0) {
        this.state = STATE.DEAD;
      } else {
        this.state = STATE.IDLE;
        this.stateTimer = 0;
        this.idlePause = Phaser.Math.Between(300, 800);
      }
    }
  }

  update(dt, playerX, playerY) {
    if (this.state === STATE.DEAD) return;
    if (this.state === STATE.HURT) return;
    if (this.isAttacking) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
    this.sprite.setFlipX(this.facing === 1);

    if (this.state === STATE.IDLE) {
      this.stateTimer += dt;
      if (this.stateTimer >= this.idlePause && dist < PUNK_AGGRO_RANGE) {
        this.state = STATE.WALK;
      }
      if (this.sprite.anims.currentAnim?.key !== 'punk-idle') {
        this.sprite.play('punk-idle');
      }
    }

    if (this.state === STATE.WALK) {
      const yDist = Math.abs(dy);
      if (dist < PUNK_ATTACK_RANGE && yDist < 15) {
        this.doAttack();
      } else {
        const speed = (this.tough ? PUNK_SPEED * 1.2 : PUNK_SPEED) * (dt / 1000);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

        this.x += nx * speed;
        this.y += ny * speed * 0.6;
        this.y = Phaser.Math.Clamp(this.y, PLAY_Y_MIN, PLAY_Y_MAX);

        if (this.sprite.anims.currentAnim?.key !== 'punk-walk') {
          this.sprite.play('punk-walk');
        }
      }
    }

    this.setDepth(DEPTH_BASE + this.y);
  }

  doAttack() {
    this.isAttacking = true;
    this.attackHit = false;
    this.state = STATE.ATTACK;
    this.sprite.play('punk-punch');
  }

  getAttackBox() {
    if (!this.isAttacking || this.attackHit) return null;
    const frame = this.sprite.anims.currentFrame;
    if (!frame) return null;
    if (frame.index !== 2) return null;

    return {
      x: this.x + this.facing * PUNK_ATTACK_RANGE * 0.5,
      y: this.y,
      width: PUNK_ATTACK_RANGE,
      height: 20,
      damage: this.tough ? PUNK_DAMAGE * 1.5 : PUNK_DAMAGE,
    };
  }

  takeHit(damage, fromX) {
    if (this.state === STATE.DEAD || this.state === STATE.HURT) return;
    this.hp -= damage;
    this.state = STATE.HURT;
    this.isAttacking = false;
    this.sprite.play('punk-hurt');

    const dir = this.x < fromX ? -1 : 1;
    this.x += dir * 25;
  }

  get isDead() {
    return this.state === STATE.DEAD;
  }
}
