# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

No test framework is configured. No linter is configured.

## Architecture

Phaser 3 side-scrolling beat-em-up game. Native resolution 480x270, pixel art scaled with `Phaser.Scale.FIT`. World is 2400px wide, scrolling horizontally. Playable Y range is 140-210.

### Scene Flow

```
BootScene → TitleScene → StageIntroScene → GameScene → VictoryScene
                ↑                              │            │
                │                              ↓            ↓
                └──────────── NameEntryScene ←──────────────┘
```

- **BootScene**: Loads all assets, creates all animations, transitions to Title
- **TitleScene**: Animated parallax background, leaderboard display
- **StageIntroScene**: Stage name splash (2.5s), passes through `{ stageIndex, score, lives, credits }`
- **GameScene**: Core gameplay — accepts stage config via `data`, builds background per stage type, runs combat/waves/HUD
- **VictoryScene/NameEntryScene**: End-game flow, leaderboard entry

Data flows between scenes via Phaser's `scene.start(key, data)` carrying `{ stageIndex, score, lives, credits }`.

### Entity Pattern

All game entities (Player, EnemyPunk, OgreBoss, KnightBoss, DemonBoss) extend `Phaser.GameObjects.Container` with:
- Shadow image + animated sprite as children
- State machine (idle/walk/attack/hurt/dead) driving behavior in `update(dt, playerX, playerY)`
- `getAttackBox()` returns `{ x, y, width, height, damage }` or null — hitbox is only active on specific animation frames
- `takeHit(damage, fromX)` handles damage and knockback
- Depth sorting via `DEPTH_BASE + this.y` for Y-axis ordering
- Enemy sprites face **left** by default; `setFlipX(this.facing === 1)` flips them to face right

### Systems

- **WaveManager**: Spawns enemy waves based on `triggerX` positions from stage config. Camera locks during active waves. Tracks `waveEnemies[]` and `newEnemies[]` for HUD registration.
- **HUD**: Fixed UI layer (`scrollFactor: 0`, depth 2000+). Player HP bar, lives, score, combo counter, boss bar, enemy HP bars, GO prompt, score popups.
- **InputManager/TouchControls**: Unified input — keyboard (arrows + Z/X/Space) and virtual touch D-pad + A/B/C buttons. Touch state cleared each frame via `clearTouch()`.
- **Audio**: Procedural sounds via Web Audio API (no audio files). Methods: `tone()`, `noise()`, `sweep()`.
- **Leaderboard**: localStorage-backed top-10 scores with procedural default name generation.

### Stage Configuration

Three stages defined in `STAGES` array in `constants.js`, each with:
- `bgType`: 'streets' | 'synth-city' | 'night-town' — selects background builder in GameScene
- `waves[]`: each wave has `{ punks, toughPunks, triggerX, boss? }` — boss is final wave only

### Key Constants

All game tuning values (damage, speed, HP, frame sizes) are centralized in `src/utils/constants.js`. Sprite frame dimensions are defined per entity type (FRAME_W/H for player/punk, OGRE_FRAME_W/H, KNIGHT_FRAME_W/H, DEMON_FRAME_W/H).

### Asset Organization

Assets live in `public/` and are referenced by path relative to that root (e.g., `'player/idle.png'`). Spritesheets are loaded in BootScene with explicit `frameWidth`/`frameHeight` from constants.
