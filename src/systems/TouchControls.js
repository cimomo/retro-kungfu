import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

/**
 * Virtual D-pad (left) + A/B/C buttons (right) for mobile.
 * Rendered as Phaser game objects on a fixed-camera UI layer.
 */
export class TouchControls {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.input = inputManager;
    this.active = false;

    // Only show on touch-capable devices
    if (!scene.sys.game.device.input.touch) return;
    this.active = true;

    this.dpadCenter = { x: 70, y: GAME_HEIGHT - 60 };
    this.dpadRadius = 30;
    this.dpadPointerId = null;

    this.createDpad();
    this.createButtons();
    this.setupListeners();
  }

  createDpad() {
    const { x, y } = this.dpadCenter;
    // Outer ring
    this.dpadBg = this.scene.add.circle(x, y, this.dpadRadius + 8, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(1000);
    // Inner knob
    this.dpadKnob = this.scene.add.circle(x, y, 12, 0xffffff, 0.4)
      .setScrollFactor(0).setDepth(1001);
  }

  createButtons() {
    const btnY = GAME_HEIGHT - 55;
    const btnSize = 22;

    this.btnA = this.makeButton(GAME_WIDTH - 100, btnY, btnSize, 'A', 0xff4444); // punch
    this.btnB = this.makeButton(GAME_WIDTH - 55, btnY - 20, btnSize, 'B', 0x44aaff); // kick
    this.btnC = this.makeButton(GAME_WIDTH - 55, btnY + 20, btnSize, 'C', 0x44ff44); // jump
  }

  makeButton(x, y, r, label, color) {
    const bg = this.scene.add.circle(x, y, r, color, 0.3)
      .setScrollFactor(0).setDepth(1000);
    const txt = this.scene.add.text(x, y, label, {
      fontSize: '12px', fontFamily: 'monospace', color: '#fff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    return { bg, txt, x, y, r };
  }

  setupListeners() {
    this.scene.input.on('pointerdown', (p) => this.onDown(p));
    this.scene.input.on('pointermove', (p) => this.onMove(p));
    this.scene.input.on('pointerup', (p) => this.onUp(p));
  }

  onDown(pointer) {
    const px = pointer.x;
    const py = pointer.y;

    // Check buttons first (right side)
    if (this.hitBtn(this.btnA, px, py)) { this.input.touchPunch = true; return; }
    if (this.hitBtn(this.btnB, px, py)) { this.input.touchKick = true; return; }
    if (this.hitBtn(this.btnC, px, py)) { this.input.touchJump = true; return; }

    // D-pad (left side of screen)
    if (px < GAME_WIDTH / 2) {
      this.dpadPointerId = pointer.id;
      this.updateDpad(px, py);
    }
  }

  onMove(pointer) {
    if (pointer.id === this.dpadPointerId && pointer.isDown) {
      this.updateDpad(pointer.x, pointer.y);
    }
  }

  onUp(pointer) {
    if (pointer.id === this.dpadPointerId) {
      this.dpadPointerId = null;
      this.input.touchDir.x = 0;
      this.input.touchDir.y = 0;
      this.dpadKnob.setPosition(this.dpadCenter.x, this.dpadCenter.y);
    }
  }

  updateDpad(px, py) {
    const dx = px - this.dpadCenter.x;
    const dy = py - this.dpadCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.dpadRadius;

    if (dist > 5) { // dead zone
      const nx = dx / dist;
      const ny = dy / dist;
      this.input.touchDir.x = Math.abs(nx) > 0.3 ? Math.sign(nx) : 0;
      this.input.touchDir.y = Math.abs(ny) > 0.3 ? Math.sign(ny) : 0;

      const clampDist = Math.min(dist, maxDist);
      this.dpadKnob.setPosition(
        this.dpadCenter.x + nx * clampDist,
        this.dpadCenter.y + ny * clampDist
      );
    } else {
      this.input.touchDir.x = 0;
      this.input.touchDir.y = 0;
      this.dpadKnob.setPosition(this.dpadCenter.x, this.dpadCenter.y);
    }
  }

  hitBtn(btn, px, py) {
    const dx = px - btn.x;
    const dy = py - btn.y;
    return dx * dx + dy * dy <= btn.r * btn.r * 2.5; // generous hit area
  }
}
