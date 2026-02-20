import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';
import { generateDefaultName, addLeaderboardEntry } from '../systems/Leaderboard.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';
const COLS = 13;

export class NameEntryScene extends Phaser.Scene {
  constructor() {
    super('NameEntry');
  }

  create(data) {
    this.score = data.score || 0;
    this.nextScene = data.nextScene || 'Title';

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'ENTER YOUR NAME', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 42, `SCORE: ${this.score}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#44ff44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Name display
    this.defaultName = generateDefaultName();
    this.nameChars = [...this.defaultName];
    this.cursorPos = this.nameChars.length; // cursor at end

    this.nameText = this.add.text(GAME_WIDTH / 2, 68, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.updateNameDisplay();

    // Blinking cursor
    this.cursorBlink = true;
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.cursorBlink = !this.cursorBlink;
        this.updateNameDisplay();
      },
    });

    // Character grid
    this.gridX = 0;
    this.gridY = 0;
    this.charTexts = [];
    this.selectedHighlight = null;

    const gridStartX = GAME_WIDTH / 2 - (COLS * 18) / 2 + 9;
    const gridStartY = 100;
    const rows = Math.ceil(CHARS.length / COLS);

    for (let i = 0; i < CHARS.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = gridStartX + col * 18;
      const y = gridStartY + row * 18;
      const txt = this.add.text(x, y, CHARS[i] === ' ' ? '_' : CHARS[i], {
        fontSize: '10px', fontFamily: 'monospace', color: '#888',
      }).setOrigin(0.5);
      this.charTexts.push(txt);
    }

    // Action buttons below grid
    const btnY = gridStartY + rows * 18 + 8;
    this.buttons = [];
    const btnLabels = ['DEL', 'CLR', 'OK'];
    const btnColors = ['#ff6666', '#ffaa44', '#44ff44'];
    for (let i = 0; i < btnLabels.length; i++) {
      const x = GAME_WIDTH / 2 + (i - 1) * 60;
      const txt = this.add.text(x, btnY, btnLabels[i], {
        fontSize: '10px', fontFamily: 'monospace', color: btnColors[i],
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.buttons.push(txt);
    }
    this.btnIndex = -1; // -1 means on character grid, 0-2 means on buttons
    this.totalRows = rows;

    this.updateGridHighlight();

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Also allow typing directly
    this.input.keyboard.on('keydown', (event) => {
      const key = event.key.toUpperCase();
      if (key.length === 1 && CHARS.includes(key)) {
        this.addChar(key);
      } else if (event.key === 'Backspace') {
        this.deleteChar();
      }
    });

    // Hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Arrows=Select  Z=Pick  Enter=Done  Type to enter name', {
      fontSize: '6px', fontFamily: 'monospace', color: '#555',
    }).setOrigin(0.5);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.moveGrid(-1, 0);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.moveGrid(1, 0);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.moveGrid(0, -1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.moveGrid(0, 1);

    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.confirmSelection();
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.deleteChar();
    if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) this.submitName();
  }

  moveGrid(dx, dy) {
    if (this.btnIndex >= 0) {
      // On button row
      if (dy < 0) {
        // Move up to grid
        this.btnIndex = -1;
        this.gridY = this.totalRows - 1;
        this.gridX = Math.min(this.gridX, COLS - 1);
      } else {
        this.btnIndex = Phaser.Math.Clamp(this.btnIndex + dx, 0, 2);
      }
    } else {
      // On character grid
      this.gridX += dx;
      this.gridY += dy;

      if (this.gridY >= this.totalRows) {
        // Move to button row
        this.btnIndex = 1; // default to CLR
        this.updateGridHighlight();
        return;
      }

      this.gridY = Math.max(0, this.gridY);
      const maxCol = this.gridY === this.totalRows - 1
        ? (CHARS.length % COLS || COLS) - 1
        : COLS - 1;
      if (this.gridX < 0) this.gridX = maxCol;
      if (this.gridX > maxCol) this.gridX = 0;
    }
    this.updateGridHighlight();
  }

  updateGridHighlight() {
    // Reset all
    for (const txt of this.charTexts) txt.setColor('#888');
    for (const btn of this.buttons) btn.setScale(1);

    if (this.btnIndex >= 0) {
      this.buttons[this.btnIndex].setScale(1.4);
    } else {
      const idx = this.gridY * COLS + this.gridX;
      if (idx < this.charTexts.length) {
        this.charTexts[idx].setColor('#ffcc00');
      }
    }
  }

  confirmSelection() {
    if (this.btnIndex >= 0) {
      if (this.btnIndex === 0) this.deleteChar();
      else if (this.btnIndex === 1) this.clearName();
      else if (this.btnIndex === 2) this.submitName();
      return;
    }
    const idx = this.gridY * COLS + this.gridX;
    if (idx < CHARS.length) {
      this.addChar(CHARS[idx]);
    }
  }

  addChar(ch) {
    if (this.nameChars.length < 14) {
      this.nameChars.push(ch);
      this.updateNameDisplay();
    }
  }

  deleteChar() {
    if (this.nameChars.length > 0) {
      this.nameChars.pop();
      this.updateNameDisplay();
    }
  }

  clearName() {
    this.nameChars = [];
    this.updateNameDisplay();
  }

  updateNameDisplay() {
    const name = this.nameChars.join('');
    const cursor = this.cursorBlink && this.nameChars.length < 14 ? '_' : '';
    this.nameText.setText(name + cursor);
  }

  submitName() {
    let name = this.nameChars.join('').trim();
    if (name.length === 0) {
      name = this.defaultName;
    }

    addLeaderboardEntry(name, this.score);

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.nextScene);
    });
  }
}
