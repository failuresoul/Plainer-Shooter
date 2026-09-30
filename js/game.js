/**
 * game.js
 * ─────────────────────────────────────────────────────────────
 * Core game state machine.  Owns all entities, the main loop,
 * input handling, collision detection and HUD updates.
 * ─────────────────────────────────────────────────────────────
 */

class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    this.spawner  = new Spawner(DIFFICULTY.easy); // default

    this._bindInput();
    this._initStars();
    this._rafId = null;
    this.state  = 'idle'; // 'idle' | 'running' | 'paused' | 'gameover'
  }

  // ── PUBLIC API ────────────────────────────────────────────

  /** Start or restart the game with the given difficulty key. */
  start(diffKey = 'easy') {
    this.diffKey = diffKey;
    this.cfg     = DIFFICULTY[diffKey];
    this.spawner.reset(this.cfg);

    this.score    = 0;
    this.lives    = this.cfg.lives;
    this.level    = 1;
    this.frame    = 0;

    this.player   = new Player(CANVAS_W, CANVAS_H);
    this.bullets  = [];
    this.enemies  = [];
    this.particles= [];
    this.scorePops= [];
    this.keys     = {};

    this._lastShot = 0;
    this._bossSpawned = false;
    this._levelScore  = 0;   // score accumulated toward next level

    this.state = 'running';
    this._updateHUD();
    this._showScreen(null);

    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._loop(performance.now());
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this._showScreen('pause-screen');
    cancelAnimationFrame(this._rafId);
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

  _update(now) {
    if (this.state !== 'running') return;
    this.frame++;

    // ── Player movement ──
    const dx = (this.keys['ArrowLeft']  || this.keys['a'] ? -1 : 0)
             + (this.keys['ArrowRight'] || this.keys['d'] ?  1 : 0);
    this.player.move(dx, this.cfg.playerSpeed);
    this.player.update();

    // ── Shooting ──
    if ((this.keys[' '] || this.keys['z']) && now - this._lastShot > this.cfg.shootCooldown) {
      this._lastShot = now;
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y;
      this.bullets.push(new Bullet(px, py));
    }

    // ── Bullets ──
    this.bullets.forEach(b => b.update(this.cfg.bulletSpeed));
    this.bullets = this.bullets.filter(b => b.active);

    // ── Spawn enemies ──
    const isBossLevel = (this.level % this.cfg.bossEveryNLevels === 0) && !this._bossSpawned;
    const spawnType   = this.spawner.tick(now, this.level, isBossLevel);
    if (spawnType) {
      if (spawnType === 'boss') this._bossSpawned = true;
      const def = ENEMY_TYPES[spawnType];
      const ex  = randInt(10, CANVAS_W - def.w - 10);
      const spd = Math.min(
        this.cfg.enemySpeedBase + (this.level - 1) * this.cfg.enemySpeedGrowth,
        this.cfg.enemySpeedMax
      );
      this.enemies.push(new Enemy(spawnType, ex, spd));
    }

    // ── Update enemies ──
    this.enemies.forEach(e => e.update(this.frame));
    this.enemies = this.enemies.filter(e => e.active);

    // ── Bullet–enemy collisions ──
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (rectCollides(b.hitbox, e.hitbox)) {
          b.active = false;
          const destroyed = e.hit();
          if (destroyed) {
            const pts = e.scoreValue * this.cfg.scorePerKill;
            this._addScore(pts, e.x + e.w / 2, e.y + e.h / 2);
            this._explode(e.x + e.w / 2, e.y + e.h / 2, e.color);
          }
          break;
        }
      }
    }

    // ── Enemy–player collisions ──
    if (!this.player.isInvincible) {
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (rectCollides(e.hitbox, this.player.hitbox)) {
          e.active = false;
          this._loseLife();
          break;
        }
      }
    }

    // ── Particles & score pops ──
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.active);

    this.scorePops.forEach(p => { p.y -= 0.8; p.life--; });
    this.scorePops = this.scorePops.filter(p => p.life > 0);

    // ── Level progression ──
    this._checkLevelUp();
  }

  _draw() {
    const { renderer, ctx } = this;
    const ctx2 = this.renderer.ctx;

    renderer.clear();
    renderer.drawBackground(this.frame);

    // Stars
    this.stars.forEach(s => { s.update(); s.draw(ctx2); });

    // Bullets
    this.bullets.forEach(b => b.draw(ctx2));

    // Enemies
    this.enemies.forEach(e => e.draw(ctx2, this.frame));

    // Player
    this.player.draw(ctx2);

    // Particles
    this.particles.forEach(p => p.draw(ctx2));

    // Score pops
    renderer.drawScorePop(this.scorePops);
  }

  // ── HELPERS ──────────────────────────────────────────────

  _addScore(pts, x, y) {
    this.score      += pts;
    this._levelScore+= pts;
    this.scorePops.push({ x, y, value: pts, life: 55, maxLife: 55 });
    this._updateHUD();
    // Pulse score display
    const el = document.getElementById('score-display');
    el.style.transform = 'scale(1.3)';
    setTimeout(() => el.style.transform = '', 120);
  }

  _loseLife() {
    this.lives--;
    this.player.invincibleFrames = INVINCIBLE_FRAMES;
    this._explode(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      '#00d4ff', 20
    );
    this._updateHUD();
    // Screen shake via CSS
    this.canvas.classList.add('shake');
    setTimeout(() => this.canvas.classList.remove('shake'), 400);

    if (this.lives <= 0) {
      this.state = 'gameover';
      cancelAnimationFrame(this._rafId);
      this._showGameOver();
    }
  }

  _explode(x, y, color, count = 14) {
    const colors = [color, '#ff9900', '#ffffff', '#ffdd00'];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, colors[i % colors.length]));
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
    el.textContent = `LEVEL ${this.level}`;
    el.classList.remove('show');
    void el.offsetWidth; // reflow trick to restart animation
    el.classList.add('show');
  }

  _updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    document.getElementById('level-display').textContent = this.level;
    document.getElementById('lives-display').textContent =
      '❤️'.repeat(Math.max(0, this.lives));
  }

  _showScreen(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
  }

  _showGameOver() {
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-level').textContent = this.level;
    this._showScreen('gameover-screen');
  }

  // ── INPUT ─────────────────────────────────────────────────

  _bindInput() {
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'running') this.pause();
        else if (this.state === 'paused') this.resume();
      }
      // Prevent page scroll on arrow/space
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
