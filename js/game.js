/**
 * game.js
 * ─────────────────────────────────────────────────────────────
 * Core game state machine.
 *
 * States:  idle → running ↔ paused → gameover → idle
 *
 * Guarantees:
 *  • Non-shootable objects can NEVER be destroyed by bullets
 *  • Enemies always spawn above SPAWN_SAFE_Y (never on the player)
 *  • Collision is AABB with inset hitboxes (fair, not pixel-perfect)
 *  • Screen shake is CSS-class-based with proper cleanup
 *  • No rAF leak when restarting
 * ─────────────────────────────────────────────────────────────
 */

class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    this.spawner  = new Spawner(DIFFICULTY.easy);

    this._rafId = null;
    this.state  = 'idle';
    this.keys   = {};

    this._bindInput();
    this._initStars();
  }

  // ── PUBLIC API ─────────────────────────────────────────────

  start(diffKey = 'easy') {
    // Cancel any existing loop before resetting
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    this.diffKey = diffKey;
    this.cfg     = DIFFICULTY[diffKey];
    this.spawner.reset(this.cfg);

    this.score       = 0;
    this.lives       = this.cfg.lives;
    this.level       = 1;
    this.frame       = 0;
    this._levelScore = 0;
    this._lastShot   = 0;
    this._bossSpawned= false;
    this._shakeTimer = 0;     // frames of shake remaining

    this.player    = new Player(CANVAS_W, CANVAS_H);
    this.bullets   = [];
    this.flashes   = [];      // muzzle flash effects
    this.enemies   = [];
    this.particles = [];
    this.scorePops = [];
    this.keys      = {};      // clear held keys from previous game

    this.state = 'running';
    this._updateHUD();
    this._showScreen(null);
    this._loop(performance.now());
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
    // Show current difficulty in pause screen
    const cfg = this.cfg;
    document.getElementById('pause-diff-label').textContent =
      cfg ? cfg.emoji + ' ' + cfg.label : '';
    this._showScreen('pause-screen');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this._showScreen(null);
    this._loop(performance.now());
  }

  // ── MAIN LOOP ─────────────────────────────────────────────

  _loop(now) {
    this._rafId = requestAnimationFrame(t => this._loop(t));
    this._update(now);
    this._draw();
  }

  // ── UPDATE ─────────────────────────────────────────────────

  _update(now) {
    if (this.state !== 'running') return;
    this.frame++;

    // Player movement  (arrow keys + WASD)
    const dx = ((this.keys['ArrowLeft']  || this.keys['a']) ? -1 : 0)
             + ((this.keys['ArrowRight'] || this.keys['d']) ?  1 : 0);
    this.player.move(dx, this.cfg.playerSpeed);
    this.player.update();

    // Shooting
    if ((this.keys[' '] || this.keys['z']) &&
        now - this._lastShot > this.cfg.shootCooldown) {
      this._lastShot = now;
      const mx = this.player.x + this.player.w / 2;
      const my = this.player.y + 6;
      this.bullets.push(new Bullet(mx, my));
      this.flashes.push(new MuzzleFlash(mx, my - 6));
    }

    // Bullets
    this.bullets.forEach(b => b.update(this.cfg.bulletSpeed));
    this.bullets = this.bullets.filter(b => b.active);

    // Muzzle flashes
    this.flashes.forEach(f => f.update());
    this.flashes = this.flashes.filter(f => f.active);

    // Spawn enemies — respects maxEnemiesOnScreen cap
    const isBossLevel = (this.level % this.cfg.bossEveryNLevels === 0)
                        && !this._bossSpawned;
    const spawnType = this.spawner.tick(
      now, this.level, isBossLevel, this.enemies.length
    );
    if (spawnType) {
      this._spawnEnemy(spawnType);
      if (spawnType === 'boss') this._bossSpawned = true;
    }

    // Update + cull enemies that left the screen
    this.enemies.forEach(e => e.update(this.frame));
    this.enemies = this.enemies.filter(e => e.active);

    // ── COLLISION: Bullet vs Objects ───────────────────────────
    //  • Shootable   → bullet consumed + damage/destroy
    //  • Non-shootable → bullet consumed + teal spark, object UNTOUCHED
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.active) continue;
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (!e.active) continue;
        if (!rectCollides(b.hitbox, e.hitbox)) continue;

        b.active = false;   // bullet always vanishes on contact

        if (e.shootable) {
          // ── Shootable: deal damage ──────────────────────────
          const destroyed = e.hit();
          if (destroyed) {
            const pts = e.scoreValue * this.cfg.scorePerKill;
            this._addScore(pts, e.x + e.w / 2, e.y + e.h / 2);
            this._explode(e.x + e.w / 2, e.y + e.h / 2, e.color);
          }
        } else {
          // ── Non-shootable: absorb spark only ────────────────
          this._absorbSpark(b.x + b.w / 2, b.y);
          // e is NOT touched — guaranteed indestructible
        }
        break; // one bullet hits one object per frame
      }
    }

    // ── COLLISION: Object vs Player ────────────────────────────
    if (!this.player.isInvincible) {
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (!e.active) continue;
        if (rectCollides(e.hitbox, this.player.hitbox)) {
          e.active = false;
          this._crash();
          break;  // handle one collision per frame
        }
      }
    }

    // Particles + score pops
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.active);

    this.scorePops.forEach(p => { p.y -= 0.8; p.life--; });
    this.scorePops = this.scorePops.filter(p => p.life > 0);

    // Shake timer
    if (this._shakeTimer > 0) this._shakeTimer--;

    // Level progression
    this._checkLevelUp();
  }

  // ── DRAW ───────────────────────────────────────────────────

  _draw() {
    const { renderer } = this;
    const ctx = renderer.ctx;

    renderer.clear();
    renderer.drawBackground();

    // Stars (scrolling background)
    this.stars.forEach(s => { s.update(); s.draw(ctx); });

    // Muzzle flashes (behind bullets)
    this.flashes.forEach(f => f.draw(ctx));

    // Bullets
    this.bullets.forEach(b => b.draw(ctx));

    // Enemies
    this.enemies.forEach(e => e.draw(ctx, this.frame));

    // Player
    this.player.draw(ctx);

    // Particles (on top)
    this.particles.forEach(p => p.draw(ctx));

    // Score pop-ups
    renderer.drawScorePops(this.scorePops);
  }

  // ── HELPERS ────────────────────────────────────────────────

  /** Spawn an enemy safely — never overlapping the player spawn zone. */
  _spawnEnemy(type) {
    const def = ENEMY_TYPES[type];
    if (!def) return;
    // x: random horizontal, fully within canvas
    const ex = randInt(8, CANVAS_W - def.w - 8);
    // y: always starts off-screen above (negative), so this is fine
    // SPAWN_SAFE_Y ensures enemies that warp-start mid-screen don't appear below it
    const speed = Math.min(
      this.cfg.enemySpeedBase + (this.level - 1) * this.cfg.enemySpeedGrowth,
      this.cfg.enemySpeedMax
    );
    this.enemies.push(new Enemy(type, ex, speed));
  }

  _addScore(pts, x, y) {
    this.score       += pts;
    this._levelScore += pts;
    this.scorePops.push({ x, y, value: pts, life: 55, max: 55 });
    this._updateHUD();
    // Pulse the score display in the HUD
    const el = document.getElementById('score-display');
    if (el) {
      el.style.transform = 'scale(1.35)';
      setTimeout(() => { el.style.transform = ''; }, 130);
    }
  }

  /** Player crash — loses a life, triggers effects. */
  _crash() {
    this.lives--;
    this.player.invincibleFrames = INVINCIBLE_FRAMES;

    // Blue explosion at player position
    this._explode(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      '#00d4ff', 22
    );

    // Screen shake — CSS animation, properly reset each time
    const canvas = this.canvas;
    canvas.classList.remove('shake');
    void canvas.offsetWidth;        // force reflow so animation restarts
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 450);

    this._updateHUD();

    if (this.lives <= 0) {
      // Stop the loop after the current frame so the explosion is drawn
      setTimeout(() => {
        if (this._rafId !== null) {
          cancelAnimationFrame(this._rafId);
          this._rafId = null;
        }
        this.state = 'gameover';
        this._showGameOver();
      }, 350);
    }
  }

  /** Explosion — coloured particle burst. */
  _explode(x, y, color, count = 14) {
    const palette = [color, '#ff9900', '#ffffff', '#ffdd00'];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, palette[i % palette.length]));
    }
  }

  /** Teal sparks when a bullet hits a non-shootable object. */
  _absorbSpark(x, y) {
    const palette = ['#00ffaa', '#00ccff', '#ffffff'];
    for (let i = 0; i < 7; i++) {
      const p = new Particle(x, y, palette[i % palette.length]);
      p.vx  *= 0.4;
      p.vy   = randFloat(-3, -0.5);
      p.size = randFloat(1.5, 3.5);
      this.particles.push(p);
    }
  }

  _checkLevelUp() {
    if (this._levelScore >= this.cfg.levelUpScore) {
      this._levelScore -= this.cfg.levelUpScore;
      this.level++;
      this._bossSpawned = false;
      this._updateHUD();
      this._showLevelBanner();
    }
  }

  _showLevelBanner() {
    const el = document.getElementById('level-banner');
    if (!el) return;
    el.textContent = 'LEVEL ' + this.level;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  _updateHUD() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('score-display', this.score);
    set('level-display', this.level);

    // Lives: show hearts up to 3, then "xN" for more
    const livesEl = document.getElementById('lives-display');
    if (livesEl) {
      const n = Math.max(0, this.lives);
      livesEl.textContent = n <= 5 ? '❤️'.repeat(n) : '❤️ ×' + n;
    }

    // Difficulty badge
    const diffEl = document.getElementById('diff-display');
    if (diffEl && this.cfg) {
      diffEl.textContent    = this.cfg.emoji + ' ' + this.cfg.label;
      diffEl.dataset.diff   = this.diffKey;
    }
  }

  _showScreen(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  }

  _showGameOver() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('final-score', this.score);
    set('final-level', this.level);
    const cfg = this.cfg;
    set('final-diff', cfg ? cfg.emoji + ' ' + cfg.label : '');
    this._showScreen('gameover-screen');
  }

  // ── INPUT ─────────────────────────────────────────────────

  _bindInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if      (this.state === 'running') this.pause();
        else if (this.state === 'paused')  this.resume();
      }

      // Prevent scroll
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  }

  _initStars() {
    this.stars = Array.from({ length: STAR_COUNT }, () => new Star(CANVAS_W, CANVAS_H));
  }
}
