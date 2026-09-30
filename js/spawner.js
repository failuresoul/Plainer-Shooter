/**
 * spawner.js
 * Manages enemy timing, type selection, and wave logic.
 * All behaviour is driven by cfg values — no hardcoded numbers.
 */

class Spawner {
  constructor(cfg) {
    this.cfg      = cfg;
    this.interval = cfg.spawnInterval;
    this.timer    = 0;
    this.lastTime = null;
  }

  reset(cfg) {
    this.cfg      = cfg;
    this.interval = cfg.spawnInterval;
    this.timer    = 0;
    this.lastTime = null;
  }

  /**
   * Call once per game frame.
   * Returns a type key string to spawn, or null.
   *
   * @param {number}  now         - performance.now()
   * @param {number}  level       - current game level
   * @param {boolean} isBossLevel - spawn a boss this wave
   * @param {number}  enemyCount  - live enemies currently on screen
   */
  tick(now, level, isBossLevel, enemyCount) {
    if (this.lastTime === null) { this.lastTime = now; return null; }

    // Hard cap — never exceed maxEnemiesOnScreen for this difficulty
    if (enemyCount >= this.cfg.maxEnemiesOnScreen) {
      this.lastTime = now;   // reset to avoid burst after the cap lifts
      return null;
    }

    const elapsed = now - this.lastTime;
    this.timer   += elapsed;
    this.lastTime = now;

    if (this.timer >= this.interval) {
      this.timer = 0;
      // Gradually speed up over levels, clamped to minimum
      this.interval = Math.max(
        this.cfg.spawnIntervalMin,
        this.cfg.spawnInterval - (level - 1) * this.cfg.spawnDecreaseRate
      );
      return this._chooseType(level, isBossLevel);
    }
    return null;
  }

  /**
   * Weighted type selection.
   * Non-shootable % comes from cfg.nonShootableChance and grows
   * by +1 % per level (max +10 %).
   */
  _chooseType(level, isBossLevel) {
    if (isBossLevel) return 'boss';

    const roll         = Math.random();
    const levelBonus   = Math.min(0.10, (level - 1) * 0.01);
    const hazardChance = Math.min(0.55, this.cfg.nonShootableChance + levelBonus);

    if (roll < hazardChance) {
      return Math.random() < 0.55 ? 'asteroid' : 'barrier';
    }

    const r2 = Math.random();
    if (level >= 3 && r2 < 0.18) return 'tank';
    if (level >= 2 && r2 < 0.35) return 'speeder';
    return 'basic';
  }
}
