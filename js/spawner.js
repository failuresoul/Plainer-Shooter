/**
 * spawner.js
 * ─────────────────────────────────────────────────────────────
 * Manages enemy spawn timing, type selection, and wave logic.
 * Completely decoupled from the game loop — just call tick().
 *
 * Difficulty-driven params read from cfg:
 *   nonShootableChance  – base % of non-shootable spawns
 *   maxEnemiesOnScreen  – hard cap; tick() returns null if reached
 * ─────────────────────────────────────────────────────────────
 */

class Spawner {
  constructor(cfg) {
    this.cfg       = cfg;
    this.interval  = cfg.spawnInterval;
    this.timer     = 0;
    this.lastTime  = null;
  }

  /** Reset for a new game or difficulty change. */
  reset(cfg) {
    this.cfg      = cfg;
    this.interval = cfg.spawnInterval;
    this.timer    = 0;
    this.lastTime = null;
  }

  /**
   * Call once per frame with the current timestamp.
   * Returns an enemy type key to spawn, or null.
   *
   * @param {number}  now          - performance.now()
   * @param {number}  level        - current game level
   * @param {boolean} isBossLevel  - force boss spawn this tick
   * @param {number}  enemyCount   - current live enemy count (for cap check)
   */
  tick(now, level, isBossLevel, enemyCount) {
    if (this.lastTime === null) { this.lastTime = now; return null; }

    // Enforce per-difficulty concurrent enemy cap
    if (enemyCount >= this.cfg.maxEnemiesOnScreen) {
      this.lastTime = now; // keep timer from stacking up
      return null;
    }

    const elapsed = now - this.lastTime;
    this.timer += elapsed;
    this.lastTime = now;

    if (this.timer >= this.interval) {
      this.timer = 0;
      // Speed up spawns as level rises (never below minimum)
      this.interval = Math.max(
        this.cfg.spawnIntervalMin,
        this.cfg.spawnInterval - (level - 1) * this.cfg.spawnDecreaseRate
      );
      return this._chooseType(level, isBossLevel);
    }
    return null;
  }

  /**
   * Pick which object type to spawn.
   *
   * Non-shootable chance is driven by cfg.nonShootableChance:
   *   Easy   → 12 %   (mostly shootable targets)
   *   Medium → 28 %   (balanced mix)
   *   Hard   → 42 %   (many hazards — force player to dodge)
   *
   * Chance grows slightly with level (+1 % per level, capped at +10 %).
   */
  _chooseType(level, isBossLevel) {
    if (isBossLevel) return 'boss';

    const roll = Math.random();

    // Non-shootable hazards — scales with difficulty + level
    const baseChance   = this.cfg.nonShootableChance;
    const levelBonus   = Math.min(0.10, (level - 1) * 0.01);
    const hazardChance = Math.min(0.55, baseChance + levelBonus);

    if (roll < hazardChance) {
      // Roughly equal asteroid / barrier split
      return Math.random() < 0.55 ? 'asteroid' : 'barrier';
    }

    // Shootable enemies — richer variety at higher levels
    const r2 = Math.random();
    if (level >= 3 && r2 < 0.18) return 'tank';
    if (level >= 2 && r2 < 0.35) return 'speeder';
    return 'basic';
  }
}
