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

  // ── EASY ─────────────────────────────────────────────────────
  // Slow spawns, mostly shootable, forgiving lives pool.
  easy: {
    label: 'Easy',
    emoji: '🟢',
    description: 'Slow objects · Mostly shootable · Perfect for beginners',
    lives: 5,
    playerSpeed: 5,
    bulletSpeed: 10,
    shootCooldown: 220,         // ms between shots
    spawnInterval: 2000,        // ms between spawns (starts slow)
    spawnIntervalMin: 1100,     // never faster than this
    spawnDecreaseRate: 25,      // ms shaved off per level
    enemySpeedBase: 1.6,
    enemySpeedGrowth: 0.18,
    enemySpeedMax: 4.5,
    scorePerKill: 10,
    levelUpScore: 80,
    bossEveryNLevels: 6,
    nonShootableChance: 0.12,   // 12 % of spawns are non-shootable
    maxEnemiesOnScreen: 4,      // hard cap on simultaneous objects
  },

  // ── MEDIUM ───────────────────────────────────────────────────
  // Moderate pace, balanced mix, requires decisions.
  medium: {
    label: 'Medium',
    emoji: '🟡',
    description: 'Mixed objects · Medium speed · Decision-making required',
    lives: 3,
    playerSpeed: 5,
    bulletSpeed: 11,
    shootCooldown: 280,
    spawnInterval: 1300,
    spawnIntervalMin: 650,
    spawnDecreaseRate: 38,
    enemySpeedBase: 2.6,
    enemySpeedGrowth: 0.30,
    enemySpeedMax: 7.0,
    scorePerKill: 15,
    levelUpScore: 110,
    bossEveryNLevels: 4,
    nonShootableChance: 0.28,   // 28 % non-shootable
    maxEnemiesOnScreen: 7,
  },

  // ── HARD ─────────────────────────────────────────────────────
  // Frequent fast spawns, many hazards, tight reaction window.
  hard: {
    label: 'Hard',
    emoji: '🔴',
    description: 'Fast & frequent · Heavy hazards · Maximum challenge',
    lives: 2,
    playerSpeed: 5,
    bulletSpeed: 12,
    shootCooldown: 340,
    spawnInterval: 800,
    spawnIntervalMin: 350,
    spawnDecreaseRate: 52,
    enemySpeedBase: 3.6,
    enemySpeedGrowth: 0.48,
    enemySpeedMax: 11.0,
    scorePerKill: 20,
    levelUpScore: 140,
    bossEveryNLevels: 3,
    nonShootableChance: 0.42,   // 42 % non-shootable
    maxEnemiesOnScreen: 12,
  },
};


// ── VISUAL / PARTICLE CONSTANTS ───────────────────────────────
const STAR_COUNT       = 80;
const PARTICLE_LIFE    = 45;   // frames
const INVINCIBLE_FRAMES = 120; // frames of invincibility after hit
