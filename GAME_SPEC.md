# Retro Kungfu - Game Specification

## Overview

A side-scrolling beat-em-up in the spirit of Streets of Rage / Final Fight, built with
**Phaser 3** and playable in any modern browser (desktop keyboard/gamepad + mobile touch).

The player fights through waves of enemies across scrolling urban stages, defeating a boss
at the end of each stage.

### Technical Foundation

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| Engine             | Phaser 3 (latest)                                |
| Renderer           | WebGL (Canvas fallback)                           |
| Native resolution  | 480 x 270 (16:9, pixel-art friendly)             |
| Render scale       | Integer-scaled to fit viewport (nearest-neighbor) |
| Sprite base unit   | 96 x 63 px (player/enemy), displayed at 2x       |
| Target framerate   | 60 fps                                            |
| Input              | Keyboard, Gamepad API, Virtual touch controls     |
| Build tool         | Vite                                              |
| Language           | JavaScript (ES modules)                           |

### Project Structure

```
retro-kungfu/
  index.html
  package.json
  vite.config.js
  src/
    main.js              # Phaser game config, boot
    scenes/
      BootScene.js       # Asset preloading
      TitleScene.js      # Title / start screen
      GameScene.js       # Core gameplay
      GameOverScene.js   # Game over / continue
      StageIntroScene.js # "Stage X" splash
    entities/
      Player.js          # Player class (extends Phaser.GameObjects.Sprite)
      Enemy.js           # Base enemy class
      EnemyPunk.js       # Punk enemy
      OgreBoss.js        # Ogre boss
      KnightBoss.js      # Terrible Knight boss
    systems/
      InputManager.js    # Keyboard + Gamepad + Touch abstraction
      WaveManager.js     # Enemy wave spawning logic
      HUD.js             # Health bar, score, lives display
      TouchControls.js   # On-screen virtual D-pad + buttons
    utils/
      constants.js       # Game-wide constants
  assets/                # Copied/organized from Legacy Collection
    player/
    enemies/
    fx/
    backgrounds/
    ui/
```

---

## Milestone 1 — Core Combat Prototype

**Goal:** A single-screen playable prototype where the player can move, attack, and
defeat enemies. The basic game loop works: enemies spawn, player fights, player can
win or die.

### M1 Features

#### Player (Brawler Girl)

- **Movement:** 8-directional walk (left/right + up/down for depth, beat-em-up style)
- **Actions:**
  - Punch (3 frames, quick, short range)
  - Kick (5 frames, slower, longer range, more damage)
  - Jump (4 frames)
  - Hurt (2 frames, knockback on hit)
- **Idle** animation when stationary (4 frames)
- **Walk** animation when moving (4 frames)
- **Health:** 100 HP, displayed as a bar in the HUD
- **Hitboxes:** Separate body hitbox (receives damage) and attack hitbox (deals damage,
  active only during attack frames)
- Sprite faces direction of movement (flip-x for left)

#### Enemy — Punk

- **AI:** Simple state machine — Idle, Walk-toward-player, Attack, Hurt, Dead
- Walks toward player when in range, throws a punch when close
- **Animations:** Idle (4f), Walk (4f), Punch (3f), Hurt (4f)
- **Health:** 30 HP
- Knocked back on hit; dies after HP depleted
- 2-3 enemies on screen at once

#### Stage

- Static (non-scrolling) arena using the Streets of Fight stage background
- Ground plane with Y-sorting (characters closer to bottom render in front)

#### HUD

- Player health bar (top-left)
- Score counter (top-center)
- Enemy health bar shown above each enemy

#### Input

- **Keyboard:** Arrow keys = move, Z = punch, X = kick, Space = jump
- **Touch:** Virtual D-pad (left side), A/B buttons (right side)

#### Win/Lose

- All enemies defeated = "You Win" text, tap to restart
- Player HP reaches 0 = "Game Over" text, tap to restart

### M1 Assets

| Asset | Source Path | Details |
|---|---|---|
| Player idle | `Packs/Streets of Fight/Spritesheets/Brawler Girl/idle.png` | 384x63, 4 frames of 96x63 |
| Player walk | `Packs/Streets of Fight/Spritesheets/Brawler Girl/walk.png` | 96x63 per frame |
| Player punch | `Packs/Streets of Fight/Spritesheets/Brawler Girl/punch.png` | 96x63 per frame |
| Player kick | `Packs/Streets of Fight/Spritesheets/Brawler Girl/kick.png` | 96x63 per frame |
| Player jump | `Packs/Streets of Fight/Spritesheets/Brawler Girl/jump.png` | 96x63 per frame |
| Player hurt | `Packs/Streets of Fight/Spritesheets/Brawler Girl/hurt.png` | 96x63 per frame |
| Player shadow | `Packs/Streets of Fight/Sprites/shadow.png` | Ground shadow |
| Enemy idle | `Packs/Streets of Fight/Spritesheets/Enemy Punk/idle.png` | 96x63 per frame |
| Enemy walk | `Packs/Streets of Fight/Spritesheets/Enemy Punk/walk.png` | 96x63 per frame |
| Enemy punch | `Packs/Streets of Fight/Spritesheets/Enemy Punk/punch.png` | 96x63 per frame |
| Enemy hurt | `Packs/Streets of Fight/Spritesheets/Enemy Punk/hurt.png` | 96x63 per frame |
| Hit FX | `Misc/Hit/hit.png` | 31x32 per frame, 3 frames |
| Stage background | `Packs/Streets of Fight/Stage Layers/back.png` | 96x80, tiled |
| Stage foreground | `Packs/Streets of Fight/Stage Layers/fore.png` | 192x144 |
| Stage tileset | `Packs/Streets of Fight/Stage Layers/tileset.png` | 544x384 |
| Stage props | `Packs/Streets of Fight/Stage Layers/props/barrel.png` | Decorative |
| Stage props | `Packs/Streets of Fight/Stage Layers/props/hydrant.png` | Decorative |

All paths are relative to `Legacy Collection/Assets/`.

---

## Milestone 2 — Full Scrolling Stage with Boss

**Goal:** A complete, scrollable stage with wave-based enemy spawning, a boss fight at
the end, combat VFX, and a lives system. This feels like a real, if short, game.

### M2 Features (builds on M1)

#### Scrolling & Camera

- Camera follows player horizontally
- Stage scrolls right; background layers scroll at different speeds (parallax)
- Invisible walls lock the camera during enemy waves; camera unlocks when wave is cleared
- Stage composed by tiling/repeating the Streets of Fight tileset to create a longer level

#### Player Additions

- **Jab** (3 frames) — fast but weak, different from punch
- **Jump Kick** (3 frames) — aerial attack, press kick during jump
- **Dive Kick** (5 frames) — press down + kick while airborne
- **Lives system:** 3 lives, death respawns with brief invincibility, 0 lives = game over
- **Knockdown recovery:** Player gets up after being knocked down (brief i-frames)
- **Basic combo:** Punch > Punch > Kick chains if timed correctly (no new animations,
  just hitbox/damage tuning on sequential hits)

#### Enemy Improvements

- **Wave system:** Camera locks, 3-6 enemies spawn in a wave, camera unlocks when cleared
- Enemies approach from both sides of the screen
- Stagger enemy attack timing so they don't all punch simultaneously
- Enemy variety: some punks are palette-shifted with more HP (1.5x)
- Enemies drop when killed (use enemy-death FX)

#### Boss — Ogre

- Appears at end of stage after all waves
- **Animations:** Idle (4f), Walk (6f), Attack (7f), also has unarmed variants
- **Size:** 144x80 per frame — noticeably larger than the player
- **AI:** Slow but hits hard; alternates between approaching and attacking;
  brief vulnerable window after attack combo
- **Health:** 200 HP, shown as a dedicated boss health bar at the top of the screen
- Defeating the boss triggers a victory screen

#### Combat VFX

- **Hit spark** on every landed blow (Hit FX, 3-frame flash)
- **Slash effect** on kicks (slash-horizontal spritesheet)
- **Energy smack** on heavy hits / boss attacks
- **Enemy death** poof animation when enemies are defeated
- **Screen shake** on heavy hits

#### HUD Improvements

- Player lives indicator (icons)
- Boss health bar (full-width, top of screen, appears during boss fight)
- "GO -->" arrow prompt when wave is cleared and player should advance
- Stage title flash at start ("Stage 1: The Streets")

#### Audio (placeholder)

- Placeholder sound effects using Web Audio API tone generation:
  - Punch hit, kick hit, enemy hurt, player hurt, enemy death, boss roar
- Background music: silent or a simple generated beat (can be replaced later)

### M2 Assets (new, in addition to M1)

| Asset | Source Path | Details |
|---|---|---|
| Player jab | `Packs/Streets of Fight/Spritesheets/Brawler Girl/jab.png` | 96x63 per frame, 3 frames |
| Player jump kick | `Packs/Streets of Fight/Spritesheets/Brawler Girl/jump_kick.png` | 96x63 per frame, 3 frames |
| Player dive kick | `Packs/Streets of Fight/Spritesheets/Brawler Girl/dive_kick.png` | 96x63 per frame, 5 frames |
| Ogre idle | `Characters/Ogre/Spritesheets/ogre-idle.png` | 144x80 per frame, 4 frames |
| Ogre walk | `Characters/Ogre/Spritesheets/ogre-walk.png` | 144x80 per frame, 6 frames |
| Ogre attack | `Characters/Ogre/Spritesheets/ogre-attack.png` | 144x80 per frame, 7 frames |
| Ogre idle unarmed | `Characters/Ogre/Spritesheets/ogre-idle-unarmed.png` | Phase 2 variant |
| Ogre walk unarmed | `Characters/Ogre/Spritesheets/ogre-walk-unarmed.png` | Phase 2 variant |
| Slash FX | `Misc/Grotto-escape-2-FX/spritesheets/slash-horizontal.png` | 325x40, 5 frames |
| Energy smack FX | `Misc/Grotto-escape-2-FX/spritesheets/energy-smack.png` | 1024x96, 8 frames |
| Enemy death FX | `Misc/Grotto-escape-2-FX/spritesheets/enemy-death.png` | 448x64, ~7 frames |
| Stage props: car | `Packs/Streets of Fight/Stage Layers/props/car.png` | Background prop |
| Stage props: banners | `Packs/Streets of Fight/Stage Layers/props/banner-hor/banner-hor1.png` | Hanging decoration |
| Stage props: sushi | `Packs/Streets of Fight/Stage Layers/props/Sushi/sushi-1.png` | Shop sign |

---

## Milestone 3 — Multi-Stage Complete Game

**Goal:** A polished, complete game with 3 stages, each with a unique background and boss,
a title screen, stage transitions, combo system, and high-score persistence. Ready to
share.

### M3 Features (builds on M2)

#### Title Screen

- Game logo / title text ("RETRO KUNGFU")
- "Press Start" / tap to begin
- Animated background using Synth City parallax layers (slow auto-scroll)
- High score display

#### Three Stages

| Stage | Background | Boss | Theme |
|---|---|---|---|
| Stage 1: The Streets | Streets of Fight tileset + props | Ogre | Gritty urban alley |
| Stage 2: Neon District | Synth City V1 (cyberpunk-street) with parallax layers | Terrible Knight | Cyberpunk neon city |
| Stage 3: Dark Outskirts | Night Town background with 7 parallax layers | Demon | Mountain town at night |

#### Stage Transitions

- Victory screen after each boss with score tally
- "Stage X" intro splash before each new stage
- Short text intro per stage ("The punks have taken over the streets...")

#### New Enemy — Terrible Knight (Stage 2-3 mid-boss / Stage 2 boss)

- **Sprites:** 128x96 per frame (larger than punks, slightly smaller than ogre)
- **Animations:** Idle (4f), Run (varies), Sword Slash, Air Sword Slash, Crouch Slash,
  Attack Side, Attack Up, Jump Attack, Hurt, Crouch, Jump, Climb Ledge
- **AI:** Aggressive melee fighter — rushes in, combos sword attacks, can jump-attack
- **Health:** 150 HP
- **Projectile:** Throws daggers (uses `Terrible Knight/Projectiles/dagger.png`)
  with hit effect on impact

#### New Boss — Demon (Stage 3 final boss)

- **Sprites:** Demon Attack (18 frames), Demon Breath Attack (varies), Idle
- **AI:** Two attack patterns — melee swipe and ranged breath attack;
  enrages (speeds up) below 50% HP
- **Health:** 300 HP

#### Combo System

- Tracks consecutive hits without getting hit
- Combo counter displayed on screen ("3 HIT!", "5 HIT!", etc.)
- Higher combos = score multiplier (2x at 5 hits, 3x at 10 hits)
- Combo resets when player takes damage

#### Additional VFX

- **Slash upward** effect for uppercut-type moves
- **Slash circular** effect for spin attacks
- **Fire ball** effect for demon breath
- **Electro shock** effect for special hits
- **Energy shield** brief flash on player when recovering with i-frames

#### Additional Polish

- Screen flash on boss defeat
- Parallax scrolling on all stage backgrounds
- Particle dust when characters land from jumps
- Camera zoom-in on final boss hit
- Score popup numbers floating up from enemies on hit (+100, +500, etc.)
- Persistent high score saved to localStorage

#### Mobile Touch Controls (polished)

- Semi-transparent virtual D-pad and action buttons
- Buttons: A (punch/jab), B (kick), C (jump)
- Auto-hide on desktop, auto-show on touch devices
- Responsive layout — controls scale with screen size

#### Game Over & Continue

- "Continue?" countdown (10 seconds) with option to use a credit (3 total)
- If no credits left or timer expires, final Game Over screen with score
- "New High Score!" celebration if applicable

### M3 Assets (new, in addition to M1 + M2)

| Asset | Source Path | Details |
|---|---|---|
| Knight idle | `Characters/Terrible Knight/Spritesheets/player-Idle.png` | 128x96 per frame |
| Knight run | `Characters/Terrible Knight/Spritesheets/player-Run.png` | 128x96 per frame |
| Knight sword slash | `Characters/Terrible Knight/Spritesheets/player-Sword Slash.png` | 128x96 per frame |
| Knight air slash | `Characters/Terrible Knight/Spritesheets/player-AirSwordSlash.png` | 128x96 per frame |
| Knight attack side | `Characters/Terrible Knight/Spritesheets/player-AttackSide.png` | 128x96 per frame |
| Knight attack up | `Characters/Terrible Knight/Spritesheets/player-Attack Up.png` | 128x96 per frame |
| Knight hurt | `Characters/Terrible Knight/Spritesheets/player-Hurt.png` | 128x96 per frame |
| Knight jump | `Characters/Terrible Knight/Spritesheets/player-Jump.png` | 128x96 per frame |
| Knight jump attack | `Characters/Terrible Knight/Spritesheets/player-JumpAttack.png` | 128x96 per frame |
| Knight dagger | `Characters/Terrible Knight/Projectiles/dagger.png` | Thrown projectile |
| Knight dagger hit | `Characters/Terrible Knight/Projectiles/Hit/Spritesheet.png` | Impact FX |
| Demon idle | `Characters/demon-Files/Sprites/Idle/` | Individual frames |
| Demon attack | `Characters/demon-Files/Sprites/DemonAttack/` | 18 individual frames |
| Demon breath | `Characters/demon-Files/Sprites/DemonAttackBreath/` | Individual frames |
| Synth City composite | `Environments/Synth City/Version 1/PNG/cyberpunk-street.png` | 608x192, Stage 2 bg |
| Synth City back | `Environments/Synth City/Version 1/PNG/layers/back-buildings.png` | 256x192, parallax |
| Synth City far | `Environments/Synth City/Version 1/PNG/layers/far-buildings.png` | 256x192, parallax |
| Synth City fore | `Environments/Synth City/Version 1/PNG/layers/foreground.png` | 352x192, parallax |
| Night Town sky | `Environments/night-town-background-files/layers/night-town-background-sky.png` | Parallax layer |
| Night Town mountains | `Environments/night-town-background-files/layers/night-town-background-mountains.png` | Parallax layer |
| Night Town mt. lights | `Environments/night-town-background-files/layers/night-town-background-mountains-lights.png` | Parallax layer |
| Night Town forest | `Environments/night-town-background-files/layers/night-town-background-forest.png` | Parallax layer |
| Night Town town | `Environments/night-town-background-files/layers/night-town-background-town.png` | 512x99, parallax |
| Night Town clouds | `Environments/night-town-background-files/layers/night-town-background-clouds.png` | Parallax layer |
| Night Town far bldgs | `Environments/night-town-background-files/layers/night-town-background-far-buildings.png` | Parallax layer |
| Slash upward FX | `Misc/Grotto-escape-2-FX/spritesheets/slash-upward.png` | Upward slash effect |
| Slash circular FX | `Misc/Grotto-escape-2-FX/spritesheets/slash-circular.png` | Circular slash effect |
| Fire ball FX | `Misc/Grotto-escape-2-FX/spritesheets/fire-ball.png` | Demon breath projectile |
| Electro shock FX | `Misc/Grotto-escape-2-FX/spritesheets/electro-shock.png` | Special hit effect |
| Energy shield FX | `Misc/Grotto-escape-2-FX/spritesheets/energy-shield.png` | i-frame shield flash |
| Portraits | `Misc/Warped Portraits Files/Portraits with transparent bg/portraits1.png` | HUD player portrait |

---

## Milestone 4 — User Feedback & Polish

**Goal:** Address player feedback — replace the underused jump with a flashy special attack,
improve UI readability, fix boss behavior issues, and add quality-of-life improvements.

### M4 Features (builds on M3)

#### Tornado Kick (replaces Jump)

The jump mechanic (Space / C button) was removed and replaced with a **Tornado Kick** — a
dramatic area-of-effect special attack.

- **Damage:** 30, **Range:** 120px radius centered on the player
- **Hits all** nearby enemies simultaneously (normal attacks hit only one)
- **Player is invincible** during the spin
- **4-second cooldown** (`TORNADO_COOLDOWN`) — cannot be spammed
- **200ms wind-up** before the hitbox activates
- **Tween-driven visuals** (no dedicated animation):
  - Sprite freezes in kick pose, tinted cyan
  - Rapid horizontal spin via `scaleX` flips (left-right-left-right, 4 full spins)
  - Player rises 15px then floats back down
  - Vertical scale pulse (1.3x) for impact feel
- **Layered FX on impact:**
  - `shield-fx` + `shock-fx` on the player
  - `slash-circ-fx` on each hit enemy
  - Blue screen flash, strong screen shake
  - Custom procedural sound (rising sweep + noise burst)
- **HUD cooldown bar:** 50px bar below lives display labeled "TORNADO", fills as cooldown
  recharges, turns cyan with "READY" text when available
- All tweens cleaned up on interrupt (player hit or death) via `killTweensOf`

#### Title Screen Instructions

- Control hints displayed below the "Press Start" prompt:
  `ARROWS Move  Z Punch  X Kick  SPACE Special`
- White text with dark stroke outline for contrast against parallax background
- "ANY KEY / TAP to start" in light grey below

#### Leaderboard on Title Screen

- Top 5 scores shown on the title screen (from localStorage)
- Gold color for #1, grey for the rest
- Falls back to "HIGH SCORE: X" if no leaderboard entries exist

#### Boss HP Bar Repositioned

- Moved from full-width center-top to **top-right corner** (80px wide)
- Mirrors the player HP bar layout on the left — label above, bar below
- Right-aligned boss name label

#### Knight Boss Fix

- Knight sprite faces **right** by default (opposite of other enemies)
- Flip logic inverted: `setFlipX(this.facing === -1)` so it correctly faces the player

#### Demon Boss Overhaul

The demon boss was getting stuck off-screen. Multiple fixes applied:

- **Starts in WALK state** — immediately approaches the player, no initial idle delay
- **Breath attack only at medium range** (100-250px) — no longer wastes time breathing from
  off-screen; always walks in when far away
- **Double movement speed when far** (>200px) — closes the gap quickly after spawning
- **Base speed increased** from 50 to 90 (`DEMON_SPEED`)
- **Interruptible during idle/walk/recover** — was previously only interruptible during
  recover, making the demon feel unresponsive to player hits
- **`onAnimComplete` guards DEAD state** — prevents the demon from reviving if killed
  mid-attack animation
- **Boss spawn position** moved from 60px off-screen to 40px inside the visible screen edge,
  capped at x=2350 to avoid world boundary issues

### M4 Control Changes

Jump-related moves (jump kick, dive kick) were removed. The C / Space button now triggers
the Tornado Kick special.

---

## Controls Reference

### Keyboard

| Key        | Action          |
| ---------- | --------------- |
| Arrow keys | Move (8-dir)    |
| Z          | Punch / Jab     |
| X          | Kick            |
| Space      | Tornado Kick    |
| Enter      | Start / Confirm |

### Touch

| Control              | Position     |
| -------------------- | ------------ |
| Virtual D-pad        | Bottom-left  |
| A button (Punch)     | Bottom-right |
| B button (Kick)      | Bottom-right |
| C button (Tornado)   | Bottom-right |

---

## Difficulty Tuning (constants)

```
PLAYER_SPEED        = 120   # pixels/sec
PLAYER_HP           = 100
PLAYER_LIVES        = 3
PUNCH_DAMAGE        = 10
KICK_DAMAGE         = 15
JAB_DAMAGE          = 7
TORNADO_DAMAGE      = 30
TORNADO_RANGE       = 120
TORNADO_COOLDOWN    = 4000  # ms

PUNK_SPEED          = 60
PUNK_HP             = 30
PUNK_DAMAGE         = 8
PUNK_ATTACK_RANGE   = 40

OGRE_SPEED          = 40
OGRE_HP             = 200
OGRE_DAMAGE         = 20

KNIGHT_SPEED        = 80
KNIGHT_HP           = 150
KNIGHT_DAMAGE       = 15

DEMON_SPEED         = 90
DEMON_HP            = 300
DEMON_MELEE_DAMAGE  = 25
DEMON_BREATH_DAMAGE = 15
```
