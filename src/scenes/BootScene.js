import Phaser from 'phaser';
import { FRAME_W, FRAME_H, OGRE_FRAME_W, OGRE_FRAME_H, KNIGHT_FRAME_W, KNIGHT_FRAME_H, DEMON_FRAME_W, DEMON_FRAME_H, DEMON_IDLE_W, DEMON_IDLE_H } from '../utils/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const fill = this.add.rectangle(w / 2 - 98, h / 2, 0, 12, 0xff4444).setOrigin(0, 0.5);
    this.add.rectangle(w / 2, h / 2, 200, 16, 0x222222);
    this.load.on('progress', (v) => { fill.width = 196 * v; });

    // --- Player ---
    this.load.spritesheet('player-idle', 'player/idle.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-walk', 'player/walk.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-punch', 'player/punch.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-kick', 'player/kick.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-jump', 'player/jump.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-hurt', 'player/hurt.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-jab', 'player/jab.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-jump_kick', 'player/jump_kick.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('player-dive_kick', 'player/dive_kick.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // --- Punk ---
    this.load.spritesheet('punk-idle', 'enemies/punk-idle.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('punk-walk', 'enemies/punk-walk.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('punk-punch', 'enemies/punk-punch.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('punk-hurt', 'enemies/punk-hurt.png', { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // --- Ogre ---
    this.load.spritesheet('ogre-idle', 'enemies/ogre/idle.png', { frameWidth: OGRE_FRAME_W, frameHeight: OGRE_FRAME_H });
    this.load.spritesheet('ogre-walk', 'enemies/ogre/walk.png', { frameWidth: OGRE_FRAME_W, frameHeight: OGRE_FRAME_H });
    this.load.spritesheet('ogre-attack', 'enemies/ogre/attack.png', { frameWidth: OGRE_FRAME_W, frameHeight: OGRE_FRAME_H });
    this.load.spritesheet('ogre-idle-unarmed', 'enemies/ogre/idle-unarmed.png', { frameWidth: OGRE_FRAME_W, frameHeight: OGRE_FRAME_H });
    this.load.spritesheet('ogre-walk-unarmed', 'enemies/ogre/walk-unarmed.png', { frameWidth: OGRE_FRAME_W, frameHeight: OGRE_FRAME_H });

    // --- Knight ---
    this.load.spritesheet('knight-idle', 'enemies/knight/idle.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-run', 'enemies/knight/run.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-sword', 'enemies/knight/sword-slash.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-airsword', 'enemies/knight/airswordslash.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-attackside', 'enemies/knight/attackside.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-hurt', 'enemies/knight/hurt.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-jump', 'enemies/knight/jump.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.spritesheet('knight-jumpattack', 'enemies/knight/jumpattack.png', { frameWidth: KNIGHT_FRAME_W, frameHeight: KNIGHT_FRAME_H });
    this.load.image('knight-dagger', 'enemies/knight/dagger.png');
    this.load.spritesheet('knight-dagger-hit', 'enemies/knight/dagger-hit.png', { frameWidth: 31, frameHeight: 32 });

    // --- Demon ---
    this.load.spritesheet('demon-idle', 'enemies/demon/idle.png', { frameWidth: DEMON_IDLE_W, frameHeight: DEMON_IDLE_H });
    this.load.spritesheet('demon-attack', 'enemies/demon/attack.png', { frameWidth: DEMON_FRAME_W, frameHeight: DEMON_FRAME_H });
    this.load.spritesheet('demon-breath', 'enemies/demon/breath.png', { frameWidth: DEMON_FRAME_W, frameHeight: DEMON_FRAME_H });

    // --- FX ---
    this.load.spritesheet('hit-fx', 'fx/hit.png', { frameWidth: 31, frameHeight: 32 });
    this.load.spritesheet('slash-fx', 'fx/slash-horizontal.png', { frameWidth: 65, frameHeight: 40 });
    this.load.spritesheet('smack-fx', 'fx/energy-smack.png', { frameWidth: 128, frameHeight: 96 });
    this.load.spritesheet('death-fx', 'fx/enemy-death.png', { frameWidth: 56, frameHeight: 64 });
    this.load.spritesheet('slash-up-fx', 'fx/slash-upward.png', { frameWidth: 52, frameHeight: 56 });
    this.load.spritesheet('slash-circ-fx', 'fx/slash-circular.png', { frameWidth: 52, frameHeight: 48 });
    this.load.spritesheet('fireball-fx', 'fx/fire-ball.png', { frameWidth: 52, frameHeight: 29 });
    this.load.spritesheet('shock-fx', 'fx/electro-shock.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('shield-fx', 'fx/energy-shield.png', { frameWidth: 51, frameHeight: 47 });

    // --- Stage backgrounds ---
    this.load.image('stage-back', 'backgrounds/stage-back.png');
    this.load.image('stage-tileset', 'backgrounds/stage-tileset.png');
    this.load.image('synth-back', 'backgrounds/synth-city/back.png');
    this.load.image('synth-far', 'backgrounds/synth-city/far.png');
    this.load.image('synth-fore', 'backgrounds/synth-city/fore.png');
    this.load.image('night-sky', 'backgrounds/night-town/sky.png');
    this.load.image('night-mountains', 'backgrounds/night-town/mountains.png');
    this.load.image('night-mt-lights', 'backgrounds/night-town/mountains-lights.png');
    this.load.image('night-forest', 'backgrounds/night-town/forest.png');
    this.load.image('night-town', 'backgrounds/night-town/town.png');
    this.load.image('night-clouds', 'backgrounds/night-town/clouds.png');
    this.load.image('night-far', 'backgrounds/night-town/far-buildings.png');

    // --- Props & misc ---
    this.load.image('shadow', 'player/shadow.png');
    this.load.image('barrel', 'props/barrel.png');
    this.load.image('hydrant', 'props/hydrant.png');
    this.load.image('car', 'props/car.png');
  }

  create() {
    this.createAnimations();
    this.scene.start('Title');
  }

  createAnimations() {
    // Player
    this.anims.create({ key: 'player-idle', frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'player-walk', frames: this.anims.generateFrameNumbers('player-walk', { start: 0, end: 9 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'player-punch', frames: this.anims.generateFrameNumbers('player-punch', { start: 0, end: 2 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'player-kick', frames: this.anims.generateFrameNumbers('player-kick', { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'player-jump', frames: this.anims.generateFrameNumbers('player-jump', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'player-hurt', frames: this.anims.generateFrameNumbers('player-hurt', { start: 0, end: 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'player-jab', frames: this.anims.generateFrameNumbers('player-jab', { start: 0, end: 2 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'player-jump_kick', frames: this.anims.generateFrameNumbers('player-jump_kick', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'player-dive_kick', frames: this.anims.generateFrameNumbers('player-dive_kick', { start: 0, end: 4 }), frameRate: 10, repeat: 0 });

    // Punk
    this.anims.create({ key: 'punk-idle', frames: this.anims.generateFrameNumbers('punk-idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'punk-walk', frames: this.anims.generateFrameNumbers('punk-walk', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'punk-punch', frames: this.anims.generateFrameNumbers('punk-punch', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'punk-hurt', frames: this.anims.generateFrameNumbers('punk-hurt', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });

    // Ogre
    this.anims.create({ key: 'ogre-idle', frames: this.anims.generateFrameNumbers('ogre-idle', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'ogre-walk', frames: this.anims.generateFrameNumbers('ogre-walk', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'ogre-attack', frames: this.anims.generateFrameNumbers('ogre-attack', { start: 0, end: 6 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'ogre-idle-unarmed', frames: this.anims.generateFrameNumbers('ogre-idle-unarmed', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'ogre-walk-unarmed', frames: this.anims.generateFrameNumbers('ogre-walk-unarmed', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });

    // Knight (128px wide frames)
    this.anims.create({ key: 'knight-idle', frames: this.anims.generateFrameNumbers('knight-idle', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'knight-run', frames: this.anims.generateFrameNumbers('knight-run', { start: 0, end: 11 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'knight-sword', frames: this.anims.generateFrameNumbers('knight-sword', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'knight-airsword', frames: this.anims.generateFrameNumbers('knight-airsword', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'knight-attackside', frames: this.anims.generateFrameNumbers('knight-attackside', { start: 0, end: 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'knight-hurt', frames: this.anims.generateFrameNumbers('knight-hurt', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'knight-jump', frames: this.anims.generateFrameNumbers('knight-jump', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'knight-jumpattack', frames: this.anims.generateFrameNumbers('knight-jumpattack', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'knight-dagger-hit', frames: this.anims.generateFrameNumbers('knight-dagger-hit', { start: 0, end: 2 }), frameRate: 16, repeat: 0 });

    // Demon
    this.anims.create({ key: 'demon-idle', frames: this.anims.generateFrameNumbers('demon-idle', { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'demon-attack', frames: this.anims.generateFrameNumbers('demon-attack', { start: 0, end: 17 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'demon-breath', frames: this.anims.generateFrameNumbers('demon-breath', { start: 0, end: 17 }), frameRate: 10, repeat: 0 });

    // FX
    this.anims.create({ key: 'hit-fx', frames: this.anims.generateFrameNumbers('hit-fx', { start: 0, end: 2 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'slash-fx', frames: this.anims.generateFrameNumbers('slash-fx', { start: 0, end: 4 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'smack-fx', frames: this.anims.generateFrameNumbers('smack-fx', { start: 0, end: 7 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'death-fx', frames: this.anims.generateFrameNumbers('death-fx', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'slash-up-fx', frames: this.anims.generateFrameNumbers('slash-up-fx', { start: 0, end: 4 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'slash-circ-fx', frames: this.anims.generateFrameNumbers('slash-circ-fx', { start: 0, end: 5 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'fireball-fx', frames: this.anims.generateFrameNumbers('fireball-fx', { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'shock-fx', frames: this.anims.generateFrameNumbers('shock-fx', { start: 0, end: 11 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'shield-fx', frames: this.anims.generateFrameNumbers('shield-fx', { start: 0, end: 7 }), frameRate: 14, repeat: 0 });
  }
}
