/**
 * spawner.js
 * ─────────────────────────────────────────────────────────────
 * Manages enemy spawn timing, type selection, and wave logic.
 * Completely decoupled from the game loop — just call tick().
 * ─────────────────────────────────────────────────────────────
 */

class Spawner {
  constructor(cfg) {
    this.cfg       = cfg;
    this.interval  = cfg.spawnInterval;
    this.timer     = 0;
    this.lastTime  = null;
  }

  /** Reset for a new game or new level. */
  reset(cfg) {
    this.cfg      = cfg;
    this.interval = cfg.spawnInterval;
    this.timer    = 0;
    this.lastTime = null;
  }

  /**
   * Call once per frame with the current timestamp.
   * Returns an enemy type key to spawn, or null.
   * @param {number} now    - performance.now()
   * @param {number} level  - current game level
   * @param {boolean} isBossLevel - force boss spawn
   */
  tick(now, level, isBossLevel) {
    if (this.lastTime === null) { this.lastTime = now; return null; }

    const elapsed = now - this.lastTime;
    this.timer += elapsed;
    this.lastTime = now;

    if (this.timer >= this.interval) {
      this.timer = 0;
      // Reduce interval as level increases (but never below min)
      this.interval = Math.max(
        this.cfg.spawnIntervalMin,
        this.cfg.spawnInterval - (level - 1) * this.cfg.spawnDecreaseRate
      );
      return this._chooseType(level, isBossLevel);
    }
    return null;
  }

  /**
   * Pick which object type to spawn based on current level.
   *
   * Types with  shootable: true  → can be destroyed by missiles
   * Types with  shootable: false → missiles pass through them
   *
   * Probability table:
   *   asteroid  — non-shootable rocky hazard, always present
   *   barrier   — non-shootable energy wall, always present
   *   speeder   — shootable, unlocked at level 2
   *   tank      — shootable, unlocked at level 3
   *   basic     — shootable, filler
   */
  _chooseType(level, isBossLevel) {
    if (isBossLevel) return 'boss';

    const roll = Math.random();

    // Non-shootable hazards — always in the mix (25% base chance)
    const nonShootChance = Math.min(0.35, 0.25 + (level - 1) * 0.01);
    if (roll < nonShootChance) {
      return Math.random() < 0.55 ? 'asteroid' : 'barrier';
    }

    // Shootable enemies — weighted by level
    const r2 = Math.random();
    if (level >= 3 && r2 < 0.18) return 'tank';
    if (level >= 2 && r2 < 0.35) return 'speeder';
    return 'basic';
  }
}

