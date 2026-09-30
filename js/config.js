/**
 * config.js
 * ─────────────────────────────────────────────────────────────
 * Central configuration for all difficulty levels and gameplay
 * constants. Edit values here — no other file needs changing.
 * ─────────────────────────────────────────────────────────────
 */

const CANVAS_W = 480;
const CANVAS_H = 640;

// ── DIFFICULTY PROFILES ───────────────────────────────────────
const DIFFICULTY = {

  // ── EASY ─────────────────────────────────────────────────────
  easy: {
    label: 'Easy',
    emoji: '🟢',
    lives: 3,                       // always 3 as per spec
    playerSpeed: 5,
    bulletSpeed: 10,
    shootCooldown: 200,             // ms between shots (fast firing)
    spawnInterval: 2200,            // ms between spawns
    spawnIntervalMin: 1200,         // never faster than this
    spawnDecreaseRate: 20,          // ms shaved off per level
    enemySpeedBase: 1.5,
    enemySpeedGrowth: 0.15,
    enemySpeedMax: 4.0,
    scorePerKill: 10,
    levelUpScore: 80,
    bossEveryNLevels: 6,
    nonShootableChance: 0.10,       // 10% non-shootable
    maxEnemiesOnScreen: 4,
  },

  // ── MEDIUM ───────────────────────────────────────────────────
  medium: {
    label: 'Medium',
    emoji: '🟡',
    lives: 3,
    playerSpeed: 5,
    bulletSpeed: 11,
    shootCooldown: 280,
    spawnInterval: 1300,
    spawnIntervalMin: 650,
    spawnDecreaseRate: 35,
    enemySpeedBase: 2.5,
    enemySpeedGrowth: 0.28,
    enemySpeedMax: 7.0,
    scorePerKill: 15,
    levelUpScore: 110,
    bossEveryNLevels: 4,
    nonShootableChance: 0.28,       // 28% non-shootable
    maxEnemiesOnScreen: 7,
  },

  // ── HARD ─────────────────────────────────────────────────────
  hard: {
    label: 'Hard',
    emoji: '🔴',
    lives: 3,
    playerSpeed: 5,
    bulletSpeed: 12,
    shootCooldown: 320,
    spawnInterval: 850,
    spawnIntervalMin: 380,
    spawnDecreaseRate: 48,
    enemySpeedBase: 3.4,
    enemySpeedGrowth: 0.45,
    enemySpeedMax: 10.0,
    scorePerKill: 20,
    levelUpScore: 140,
    bossEveryNLevels: 3,
    nonShootableChance: 0.40,       // 40% non-shootable
    maxEnemiesOnScreen: 10,
  },
};

// ── VISUAL CONSTANTS ─────────────────────────────────────────
const STAR_COUNT        = 80;
const PARTICLE_LIFE     = 45;   // frames
const INVINCIBLE_FRAMES = 120;  // frames after a hit (≈2 seconds at 60fps)

// Bottom safe zone: enemies spawn above this y, so they never
// appear on top of the player at the bottom of the screen.
const SPAWN_SAFE_Y = CANVAS_H - 140;
