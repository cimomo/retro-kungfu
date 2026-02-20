import Phaser from 'phaser';

/**
 * Unified input abstraction for keyboard + touch.
 * Reads direction (dx, dy normalized) and action buttons (punch, kick, jump).
 */
export class InputManager {
  constructor(scene) {
    this.scene = scene;

    // Keyboard cursors + action keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyZ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch state (set by TouchControls)
    this.touchDir = { x: 0, y: 0 };
    this.touchPunch = false;
    this.touchKick = false;
    this.touchJump = false;
  }

  get dx() {
    let d = 0;
    if (this.cursors.left.isDown) d -= 1;
    if (this.cursors.right.isDown) d += 1;
    if (d === 0) d = this.touchDir.x;
    return d;
  }

  get dy() {
    let d = 0;
    if (this.cursors.up.isDown) d -= 1;
    if (this.cursors.down.isDown) d += 1;
    if (d === 0) d = this.touchDir.y;
    return d;
  }

  get punch() {
    return Phaser.Input.Keyboard.JustDown(this.keyZ) || this.touchPunch;
  }

  get kick() {
    return Phaser.Input.Keyboard.JustDown(this.keyX) || this.touchKick;
  }

  get jump() {
    return Phaser.Input.Keyboard.JustDown(this.keySpace) || this.touchJump;
  }

  clearTouch() {
    this.touchPunch = false;
    this.touchKick = false;
    this.touchJump = false;
  }
}
