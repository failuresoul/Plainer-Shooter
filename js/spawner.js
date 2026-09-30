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
   * Pick which enemy type to spawn based on current level.
   * Easily extendable — add new types to ENEMY_TYPES and
   * adjust the probability table here.
   */
  _chooseType(level, isBossLevel) {
    if (isBossLevel) return 'boss';

    // Weighted random selection based on level
    const roll = Math.random();
    if (level >= 3 && roll < 0.15) return 'tank';
    if (level >= 2 && roll < 0.30) return 'speeder';
    return 'basic';
  }
}
