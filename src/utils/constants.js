// Game dimensions
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const WORLD_WIDTH = 2400;

// Playable Y range
export const PLAY_Y_MIN = 140;
export const PLAY_Y_MAX = 210;

// Sprite frame sizes
export const FRAME_W = 96;
export const FRAME_H = 63;
export const OGRE_FRAME_W = 144;
export const OGRE_FRAME_H = 80;
export const KNIGHT_FRAME_W = 128;
export const KNIGHT_FRAME_H = 96;
export const DEMON_FRAME_W = 312;
export const DEMON_FRAME_H = 220;
export const DEMON_IDLE_W = 256;
export const DEMON_IDLE_H = 176;

// Player
export const PLAYER_SPEED = 120;
export const PLAYER_HP = 100;
export const PLAYER_LIVES = 3;
export const PLAYER_CREDITS = 3;
export const PUNCH_DAMAGE = 10;
export const KICK_DAMAGE = 15;
export const JAB_DAMAGE = 7;
export const JUMP_KICK_DAMAGE = 20;
export const DIVE_KICK_DAMAGE = 25;
export const COMBO_BONUS = 5;
export const PUNCH_RANGE = 40;
export const KICK_RANGE = 50;

// Enemy - Punk
export const PUNK_SPEED = 60;
export const PUNK_HP = 30;
export const PUNK_TOUGH_HP = 45;
export const PUNK_DAMAGE = 8;
export const PUNK_ATTACK_RANGE = 38;
export const PUNK_AGGRO_RANGE = 200;

// Boss - Ogre
export const OGRE_SPEED = 40;
export const OGRE_HP = 200;
export const OGRE_DAMAGE = 20;
export const OGRE_ATTACK_RANGE = 55;

// Boss - Knight
export const KNIGHT_SPEED = 80;
export const KNIGHT_HP = 150;
export const KNIGHT_DAMAGE = 15;
export const KNIGHT_ATTACK_RANGE = 50;

// Boss - Demon
export const DEMON_SPEED = 50;
export const DEMON_HP = 300;
export const DEMON_MELEE_DAMAGE = 25;
export const DEMON_BREATH_DAMAGE = 15;
export const DEMON_ATTACK_RANGE = 70;

// Stage configs
export const STAGES = [
  {
    name: 'Stage 1',
    subtitle: 'The Streets',
    bgType: 'streets',
    waves: [
      { punks: 3, toughPunks: 0, triggerX: 100 },
      { punks: 3, toughPunks: 1, triggerX: 600 },
      { punks: 3, toughPunks: 2, triggerX: 1100 },
      { punks: 2, toughPunks: 2, triggerX: 1600 },
      { punks: 0, toughPunks: 0, triggerX: 2100, boss: 'ogre' },
    ],
  },
  {
    name: 'Stage 2',
    subtitle: 'Neon District',
    bgType: 'synth-city',
    waves: [
      { punks: 4, toughPunks: 1, triggerX: 100 },
      { punks: 3, toughPunks: 2, triggerX: 600 },
      { punks: 2, toughPunks: 3, triggerX: 1100 },
      { punks: 3, toughPunks: 3, triggerX: 1600 },
      { punks: 0, toughPunks: 0, triggerX: 2100, boss: 'knight' },
    ],
  },
  {
    name: 'Stage 3',
    subtitle: 'Dark Outskirts',
    bgType: 'night-town',
    waves: [
      { punks: 4, toughPunks: 2, triggerX: 100 },
      { punks: 3, toughPunks: 3, triggerX: 600 },
      { punks: 4, toughPunks: 3, triggerX: 1100 },
      { punks: 3, toughPunks: 4, triggerX: 1600 },
      { punks: 0, toughPunks: 0, triggerX: 2100, boss: 'demon' },
    ],
  },
];

// Depth sorting base
export const DEPTH_BASE = 100;
