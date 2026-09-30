/**
 * config.js
 * ─────────────────────────────────────────────────────────────
 * Central configuration for all difficulty levels and gameplay
 * constants. Modify this file to tune Easy / Medium / Hard.
 * ─────────────────────────────────────────────────────────────
 */

const CANVAS_W = 480;
const CANVAS_H = 640;

// ── DIFFICULTY PROFILES ───────────────────────────────────────
// Add more properties here without touching the core game logic.
const DIFFICULTY = {
  easy: {
    label: 'Easy',
    lives: 5,
    playerSpeed: 5,
    bulletSpeed: 10,
    shootCooldown: 250,         // ms between shots
    spawnInterval: 1600,        // ms between enemy spawns
    spawnIntervalMin: 700,      // fastest possible spawn rate
    spawnDecreaseRate: 30,      // ms to reduce per level
    enemySpeedBase: 2.0,
    enemySpeedGrowth: 0.25,     // speed added per level
    enemySpeedMax: 6.0,
    scorePerKill: 10,
    levelUpScore: 100,          // score to advance a level
    bossEveryNLevels: 5,
  },
  medium: {
    label: 'Medium',
    lives: 3,
    playerSpeed: 5,
    bulletSpeed: 11,
    shootCooldown: 300,
    spawnInterval: 1200,
    spawnIntervalMin: 500,
    spawnDecreaseRate: 40,
    enemySpeedBase: 2.8,
    enemySpeedGrowth: 0.35,
    enemySpeedMax: 8.0,
    scorePerKill: 15,
    levelUpScore: 120,
    bossEveryNLevels: 4,
  },
  hard: {
    label: 'Hard',
    lives: 2,
    playerSpeed: 5,
    bulletSpeed: 12,
    shootCooldown: 350,
    spawnInterval: 900,
    spawnIntervalMin: 350,
    spawnDecreaseRate: 50,
    enemySpeedBase: 3.8,
    enemySpeedGrowth: 0.5,
    enemySpeedMax: 11.0,
    scorePerKill: 20,
    levelUpScore: 150,
    bossEveryNLevels: 3,
  },
};

// ── VISUAL / PARTICLE CONSTANTS ───────────────────────────────
const STAR_COUNT       = 80;
const PARTICLE_LIFE    = 45;   // frames
const INVINCIBLE_FRAMES = 120; // frames of invincibility after hit
