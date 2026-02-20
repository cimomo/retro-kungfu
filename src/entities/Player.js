import Phaser from 'phaser';
import {
  PLAYER_SPEED, PLAYER_HP, PLAYER_LIVES,
  PUNCH_DAMAGE, KICK_DAMAGE, JAB_DAMAGE, COMBO_BONUS,
  PUNCH_RANGE, KICK_RANGE,
  TORNADO_DAMAGE, TORNADO_RANGE, TORNADO_COOLDOWN,
  PLAY_Y_MIN, PLAY_Y_MAX, DEPTH_BASE,
} from '../utils/constants.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.hp = PLAYER_HP;
    this.maxHp = PLAYER_HP;
    this.lives = PLAYER_LIVES;
    this.state = 'idle';
    this.facing = 1;
    this.isAttacking = false;
    this.attackHit = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.dead = false;

    // Tornado kick
    this.tornadoCooldown = 0;
    this.tornadoActive = false;
    this.tornadoHitRegistered = false;
    this.respawning = false;

    // Combo tracking
    this.comboHits = [];    // timestamps of recent hits
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastAttackType = null;
    this.comboSequence = []; // sequence of attack types for chain detection

    // Shadow
    this.shadow = scene.add.image(0, 0, 'shadow').setAlpha(0.5).setOrigin(0.5, 0.5);
    this.add(this.shadow);

    // Sprite
    this.sprite = scene.add.sprite(0, 0, 'player-idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    this.sprite.play('player-idle');

    this.sprite.on('animationcomplete', this.onAnimComplete, this);
    this.setSize(30, 10);
    this.setDepth(DEPTH_BASE + y);
  }

  onAnimComplete(anim) {
    const attacks = ['player-punch', 'player-kick', 'player-jab'];
    if (attacks.includes(anim.key)) {
      this.isAttacking = false;
      this.attackHit = false;
      this.state = 'idle';
    }
    if (anim.key === 'player-kick' && this.tornadoActive) {
      this.tornadoActive = false;
      this.invincible = false;
      this.invincibleTimer = 0;
      this.sprite.setAlpha(1);
    }
    if (anim.key === 'player-hurt') {
      if (this.hp <= 0) {
        this.onDeath();
      } else {
        this.invincible = true;
        this.invincibleTimer = 800;
        this.state = 'idle';
      }
    }
  }

  onDeath() {
    this.lives--;
    if (this.lives > 0) {
      this.respawn();
    } else {
      this.dead = true;
      this.sprite.setAlpha(0.4);
    }
  }

  respawn() {
    this.respawning = true;
    this.hp = this.maxHp;
    this.invincible = true;
    this.invincibleTimer = 2000;
    this.state = 'idle';
    this.isAttacking = false;
    this.tornadoActive = false;
    this.sprite.setPosition(0, 0);
    this.sprite.play('player-idle');
    this.respawning = false;
  }

  update(dt, input, camLeft, camRight) {
    if (this.dead) return;

    // Invincibility flicker
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1);
      } else {
        this.sprite.setAlpha(Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3);
      }
    }

    // Combo decay
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboSequence = [];
      }
    }

    // Tornado cooldown
    if (this.tornadoCooldown > 0) this.tornadoCooldown -= dt;

    if (this.state === 'hurt') return;

    // Ground attacks
    if (!this.isAttacking) {
      if (input.punch) {
        // Check combo: if last two were punches, use jab for speed
        if (this.comboSequence.length >= 2 &&
            this.comboSequence[this.comboSequence.length - 1] === 'punch' &&
            this.comboSequence[this.comboSequence.length - 2] === 'punch') {
          this.attack('jab');
        } else {
          this.attack('punch');
        }
        return;
      }
      if (input.kick) {
        this.attack('kick');
        return;
      }
      if (input.special && this.tornadoCooldown <= 0) {
        this.startTornado();
        return;
      }
    }

    if (this.isAttacking) return;

    // Movement
    const dx = input.dx;
    const dy = input.dy;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / len;
      const ny = dy / len;

      this.x += nx * PLAYER_SPEED * (dt / 1000);
      this.y += ny * PLAYER_SPEED * (dt / 1000);

      this.x = Phaser.Math.Clamp(this.x, camLeft + 30, camRight - 30);
      this.y = Phaser.Math.Clamp(this.y, PLAY_Y_MIN, PLAY_Y_MAX);
      this.groundY = this.y;

      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing === -1);

      if (this.state !== 'walk') {
        this.state = 'walk';
        this.sprite.play('player-walk');
      }
    } else {
      if (this.state !== 'idle') {
        this.state = 'idle';
        this.sprite.play('player-idle');
      }
    }

    this.setDepth(DEPTH_BASE + this.y);
  }

  attack(type) {
    this.isAttacking = true;
    this.attackHit = false;
    this.state = type;
    this.lastAttackType = type;
    this.sprite.play(`player-${type}`);

    // Track combo sequence
    this.comboSequence.push(type);
    if (this.comboSequence.length > 5) this.comboSequence.shift();
  }

  startTornado() {
    this.isAttacking = true;
    this.attackHit = false;
    this.tornadoActive = true;
    this.tornadoHitRegistered = false;
    this.tornadoCooldown = TORNADO_COOLDOWN;
    this.state = 'kick';
    this.invincible = true;
    this.invincibleTimer = 600;
    this.sprite.play('player-kick');
    this.lastAttackType = 'tornado';
    this.comboSequence.push('tornado');
    if (this.comboSequence.length > 5) this.comboSequence.shift();
  }

  registerHit() {
    this.comboCount++;
    this.comboTimer = 1500; // reset combo timeout
  }

  getAttackBox() {
    if (!this.isAttacking || this.attackHit) return null;

    const frame = this.sprite.anims.currentFrame;
    if (!frame) return null;
    const idx = frame.index;

    let range = 0;
    let damage = 0;
    let fxType = 'hit'; // which FX to spawn

    switch (this.state) {
      case 'punch':
        if (idx < 2) return null;
        range = PUNCH_RANGE;
        damage = PUNCH_DAMAGE;
        break;
      case 'jab':
        if (idx < 1) return null;
        range = PUNCH_RANGE - 5;
        damage = JAB_DAMAGE;
        break;
      case 'kick':
        if (idx < 2) return null;
        if (this.tornadoActive) {
          range = TORNADO_RANGE;
          damage = TORNADO_DAMAGE;
          fxType = 'tornado';
        } else {
          range = KICK_RANGE;
          damage = KICK_DAMAGE;
          fxType = 'slash';
        }
        break;
      default:
        return null;
    }

    // Combo bonus: every 3rd consecutive hit gets bonus damage
    if (this.comboCount > 0 && this.comboCount % 3 === 2) {
      damage += COMBO_BONUS;
    }

    return {
      x: fxType === 'tornado' ? this.x : this.x + this.facing * range * 0.5,
      y: this.y,
      width: range,
      height: fxType === 'tornado' ? 40 : 20,
      damage,
      fxType,
    };
  }

  takeHit(damage, fromX) {
    if (this.invincible || this.state === 'hurt' || this.dead) return;

    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;

    // Reset combo on taking damage
    this.comboCount = 0;
    this.comboSequence = [];

    this.state = 'hurt';
    this.isAttacking = false;
    this.tornadoActive = false;
    this.sprite.play('player-hurt');

    const dir = this.x < fromX ? -1 : 1;
    this.x += dir * 20;
  }

  get isDead() {
    return this.dead;
  }
}
