/**
 * entities.js
 * ─────────────────────────────────────────────────────────────
 * All game entities:  Player · Bullet · Enemy · Particle · Star
 * Each class owns its own drawing code — no external images needed.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════════════════════════════
class Player {
  constructor(canvasW, canvasH) {
    this.w = 44;
    this.h = 52;
    this.x = canvasW / 2 - this.w / 2;
    this.y = canvasH - this.h - 20;
    this.canvasW = canvasW;
    this.invincibleFrames = 0;
    this.thrustAnim = 0;
  }

  move(dx, speed) {
    this.x = clamp(this.x + dx * speed, 0, this.canvasW - this.w);
  }

  update() {
    if (this.invincibleFrames > 0) this.invincibleFrames--;
    this.thrustAnim++;
  }

  get isInvincible() { return this.invincibleFrames > 0; }

  // Hitbox is inset so small grazes don't feel unfair
  get hitbox() {
    return { x: this.x + 8, y: this.y + 8, w: this.w - 16, h: this.h - 14 };
  }

  draw(ctx) {
    // Blink during invincibility
    if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 5) % 2 === 0) return;

    const { x, y, w, h, thrustAnim } = this;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    // Engine flame
    const flameH  = 14 + Math.sin(thrustAnim * 0.4) * 6;
    const flameG  = ctx.createLinearGradient(0, 18, 0, 18 + flameH);
    flameG.addColorStop(0,   '#fff5a0');
    flameG.addColorStop(0.4, '#ff9900');
    flameG.addColorStop(1,   'rgba(255,60,0,0)');
    ctx.fillStyle = flameG;
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(0,  18 + flameH);
    ctx.lineTo(7,  18);
    ctx.closePath();
    ctx.fill();

    // Fuselage
    const bodyG = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyG.addColorStop(0,   '#1565c0');
    bodyG.addColorStop(0.5, '#42a5f5');
    bodyG.addColorStop(1,   '#1565c0');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.bezierCurveTo( 8, -h / 4,  10, 0,  8, h / 4);
    ctx.lineTo( 5, h / 2 - 4);
    ctx.lineTo(-5, h / 2 - 4);
    ctx.lineTo(-8, h / 4);
    ctx.bezierCurveTo(-10, 0, -8, -h / 4, 0, -h / 2);
    ctx.closePath();
    ctx.fill();

    // Left wing
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-w / 2 + 2, 12);
    ctx.lineTo(-w / 2 + 6, 18);
    ctx.lineTo(-6, 14);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(w / 2 - 2, 12);
    ctx.lineTo(w / 2 - 6, 18);
    ctx.lineTo(6, 14);
    ctx.closePath();
    ctx.fill();

    // Wing highlight stripes
    ctx.strokeStyle = 'rgba(100,180,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 4, 14); ctx.lineTo(-10, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( w / 2 - 4, 14); ctx.lineTo( 10, 6); ctx.stroke();

    // Cockpit
    const cpG = ctx.createRadialGradient(-1, -8, 1, 0, -6, 10);
    cpG.addColorStop(0, '#a0d4ff');
    cpG.addColorStop(1, '#0d47a1');
    ctx.fillStyle = cpG;
    ctx.beginPath();
    ctx.ellipse(0, -8, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose highlight
    ctx.fillStyle = 'rgba(200,230,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-1.5, -h / 2 + 4, 1.5, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════
// BULLET
// ═══════════════════════════════════════════════════════════════
class Bullet {
  constructor(x, y) {
    this.w = 4;
    this.h = 14;
    this.x = x - this.w / 2;
    this.y = y;
    this.active = true;
  }

  update(speed) {
    this.y -= speed;
    if (this.y + this.h < 0) this.active = false;
  }

  get hitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx) {
    // Glowing missile trail
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0,   '#ffffff');
    grad.addColorStop(0.3, '#00eeff');
    grad.addColorStop(1,   'rgba(0,200,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 2);
    ctx.fill();

    // Outer glow
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = 'rgba(0,212,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(this.x - 1, this.y, this.w + 2, this.h, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// MUZZLE FLASH  (spawned by Game on each shot, lives ~8 frames)
// ═══════════════════════════════════════════════════════════════
class MuzzleFlash {
  constructor(x, y) {
    this.x    = x;
    this.y    = y;
    this.life = 8;
    this.max  = 8;
    this.active = true;
  }

  update() {
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const t = this.life / this.max;
    ctx.save();
    ctx.globalAlpha = t;
    // Bright cyan star-burst
    const r = 10 * t;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#00eeff');
    g.addColorStop(1, 'rgba(0,180,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════
// ENEMY TYPE DEFINITIONS
// shootable: true  → missiles destroy it, score increases
// shootable: false → missiles vanish on contact, object lives on
// ═══════════════════════════════════════════════════════════════
const ENEMY_TYPES = {

  // ── Shootable ────────────────────────────────────────────────
  basic: {
    key: 'basic', label: 'Scout',
    shootable: true,
    w: 36, h: 32, hp: 1, scoreValue: 1,
    color: '#ff4444', accentColor: '#ff8888',
    shape: 'diamond',
  },
  tank: {
    key: 'tank', label: 'Tank',
    shootable: true,
    w: 48, h: 40, hp: 3, scoreValue: 3,
    color: '#ff8800', accentColor: '#ffcc44',
    shape: 'hexagon',
  },
  speeder: {
    key: 'speeder', label: 'Speeder',
    shootable: true,
    w: 28, h: 44, hp: 1, scoreValue: 2,
    color: '#cc44ff', accentColor: '#ee88ff',
    shape: 'arrow', speedMult: 1.8,
  },
  boss: {
    key: 'boss', label: 'BOSS',
    shootable: true,
    w: 80, h: 64, hp: 15, scoreValue: 15,
    color: '#ff0055', accentColor: '#ff5599',
    shape: 'boss', speedMult: 0.5,
  },

  // ── Non-shootable hazards ─────────────────────────────────────
  asteroid: {
    key: 'asteroid', label: 'Asteroid',
    shootable: false,
    w: 44, h: 44, hp: 999, scoreValue: 0,
    color: '#c8a040', accentColor: '#e8c060',
    shape: 'asteroid', speedMult: 0.9,
  },
  barrier: {
    key: 'barrier', label: 'Energy Wall',
    shootable: false,
    w: 64, h: 20, hp: 999, scoreValue: 0,
    color: '#00ffaa', accentColor: '#00cc88',
    shape: 'barrier', speedMult: 0.7,
  },
};

// ═══════════════════════════════════════════════════════════════
// ENEMY
// ═══════════════════════════════════════════════════════════════
class Enemy {
  constructor(type, x, speed) {
    const def = ENEMY_TYPES[type] || ENEMY_TYPES.basic;
    Object.assign(this, def);
    this.x = x;
    this.y = -def.h;          // start just above the canvas
    this.speed = speed * (def.speedMult || 1);
    this.active = true;
    this.maxHp = def.hp;
    this.flashFrames = 0;
    this.wobble = randFloat(0, Math.PI * 2);
  }

  update(frame) {
    this.y += this.speed;
    if (this.flashFrames > 0) this.flashFrames--;
    // Speeder weaves side-to-side
    if (this.shape === 'arrow') {
      this.x += Math.sin(frame * 0.08 + this.wobble) * 1.2;
      this.x  = clamp(this.x, 0, CANVAS_W - this.w);
    }
    if (this.y > CANVAS_H + this.h) this.active = false;
  }

  /**
   * Apply damage.  Only ever called when shootable === true.
   * Returns true if the object is destroyed.
   */
  hit(dmg = 1) {
    if (!this.shootable) return false;   // safety guard — should never reach here
    this.hp -= dmg;
    this.flashFrames = 6;
    if (this.hp <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  // Hitbox inset a few px on each side for fair collision
  get hitbox() {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
  }

  draw(ctx, frame) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

    const flash = this.flashFrames > 0;
    const fill  = flash ? '#ffffff' : this.color;
    const acc   = flash ? '#ffffff' : this.accentColor;

    switch (this.shape) {
      case 'diamond':  this._drawDiamond (ctx, fill, acc);        break;
      case 'hexagon':  this._drawHexagon (ctx, fill, acc);        break;
      case 'arrow':    this._drawArrow   (ctx, fill, acc);        break;
      case 'boss':     this._drawBoss    (ctx, fill, acc, frame); break;
      case 'asteroid': this._drawAsteroid(ctx, fill, acc, frame); break;
      case 'barrier':  this._drawBarrier (ctx, fill, acc, frame); break;
      default:         this._drawDiamond (ctx, fill, acc);
    }

    // HP bar — only for shootable multi-hp enemies
    if (this.shootable && this.maxHp > 1 && this.maxHp < 50) {
      const bw = this.w - 4, bh = 4;
      const bx = -bw / 2, by = this.h / 2 - 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#00e58a' : '#ff3c5f';
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }

    // Shield badge on non-shootable objects
    if (!this.shootable) this._drawShieldBadge(ctx, frame);

    ctx.restore();
  }

  // ── Individual shape renderers ──────────────────────────────

  _drawDiamond(ctx, fill, acc) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(0, -hh + 6); ctx.lineTo(hw - 6, 0); ctx.lineTo(0, hh - 6); ctx.lineTo(-hw + 6, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  }

  _drawHexagon(ctx, fill, acc) {
    const r  = Math.min(this.w, this.h) / 2 - 2;
    const r2 = r - 6;
    [r, r2].forEach((radius, i) => {
      ctx.fillStyle = i === 0 ? fill : acc;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (Math.PI / 3) * j - Math.PI / 6;
        j === 0 ? ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius)
                : ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.beginPath(); ctx.arc(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3), 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawArrow(ctx, fill, acc) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.lineTo( hw,      -hh + 10); ctx.lineTo( hw - 8, -hh + 10);
    ctx.lineTo(0,        -hh + 20);
    ctx.lineTo(-hw + 8,  -hh + 10); ctx.lineTo(-hw,     -hh + 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(0, hh - 6); ctx.lineTo(6, -hh + 14); ctx.lineTo(-6, -hh + 14);
    ctx.closePath(); ctx.fill();
  }

  _drawBoss(ctx, fill, acc, frame) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.bezierCurveTo( hw * 0.6,  hh * 0.8,  hw, hh * 0.3,  hw, 0);
    ctx.bezierCurveTo( hw,       -hh * 0.5,  hw * 0.4, -hh, 0, -hh);
    ctx.bezierCurveTo(-hw * 0.4, -hh,       -hw, -hh * 0.5, -hw, 0);
    ctx.bezierCurveTo(-hw,        hh * 0.3, -hw * 0.6, hh * 0.8, 0, hh);
    ctx.fill();
    // Side fins
    ctx.fillStyle = acc;
    [[hw - 4, hw + 14], [-hw + 4, -hw - 14]].forEach(([ax, bx]) => {
      ctx.beginPath();
      ctx.moveTo(ax, -hh * 0.3); ctx.lineTo(bx, 4); ctx.lineTo(ax, hh * 0.3);
      ctx.closePath(); ctx.fill();
    });
    // Pulsing eye
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.1);
    const eyeG  = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 * pulse);
    eyeG.addColorStop(0, '#ffffff'); eyeG.addColorStop(0.4, '#ff8800'); eyeG.addColorStop(1, 'rgba(255,0,80,0)');
    ctx.fillStyle = eyeG;
    ctx.beginPath(); ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2); ctx.fill();
    // Cannons
    [-20, 0, 20].forEach(ox => {
      ctx.fillStyle = '#330011'; ctx.fillRect(ox - 3, hh - 8, 6, 12);
      ctx.fillStyle = '#ff0055'; ctx.beginPath(); ctx.arc(ox, hh + 4, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  _drawAsteroid(ctx, fill, acc, frame) {
    const r      = this.w / 2 - 2;
    const bumps  = [1.0, 0.75, 0.95, 0.65, 0.85, 0.70, 1.0, 0.80, 0.90];
    ctx.rotate(frame * 0.015);
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r);
    g.addColorStop(0, acc); g.addColorStop(0.5, fill); g.addColorStop(1, '#5a3800');
    ctx.fillStyle = g;
    ctx.beginPath();
    bumps.forEach((b, i) => {
      const angle = (Math.PI * 2 * i) / bumps.length - Math.PI / 2;
      const px = Math.cos(angle) * r * b, py = Math.sin(angle) * r * b;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath(); ctx.fill();
    // Craters
    ctx.strokeStyle = 'rgba(80,40,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.2, r * 0.28, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc( r * 0.30,  r * 0.25, r * 0.18, 0, Math.PI * 2); ctx.stroke();
    // Highlight
    ctx.fillStyle = 'rgba(255,220,100,0.3)';
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
  }

  _drawBarrier(ctx, fill, acc, frame) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12);
    // Outer glow
    const gG = ctx.createLinearGradient(-hw, 0, hw, 0);
    gG.addColorStop(0,   'rgba(0,255,170,0)');
    gG.addColorStop(0.2, `rgba(0,255,170,${0.3 * pulse})`);
    gG.addColorStop(0.5, `rgba(0,255,170,${0.5 * pulse})`);
    gG.addColorStop(0.8, `rgba(0,255,170,${0.3 * pulse})`);
    gG.addColorStop(1,   'rgba(0,255,170,0)');
    ctx.fillStyle = gG;
    ctx.fillRect(-hw - 4, -hh - 6, (hw + 4) * 2, (hh + 6) * 2);
    // Core bar
    const cG = ctx.createLinearGradient(0, -hh, 0, hh);
    cG.addColorStop(0, acc); cG.addColorStop(0.5, '#ffffff'); cG.addColorStop(1, acc);
    ctx.fillStyle = cG;
    ctx.beginPath(); ctx.roundRect(-hw, -hh, hw * 2, hh * 2, hh); ctx.fill();
    // Scan line
    const scanX = -hw + ((frame * 3) % (hw * 2));
    ctx.fillStyle = `rgba(255,255,255,${0.6 * pulse})`;
    ctx.fillRect(scanX, -hh + 1, 4, hh * 2 - 2);
    // End nodes
    [-hw, hw].forEach(cx => {
      ctx.fillStyle = '#003322'; ctx.beginPath(); ctx.arc(cx, 0, hh + 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = acc;       ctx.beginPath(); ctx.arc(cx, 0, hh - 1, 0, Math.PI * 2); ctx.fill();
    });
  }

  // Pulsing shield icon in corner — tells player "cannot shoot this"
  _drawShieldBadge(ctx, frame) {
    const pulse = 0.8 + 0.2 * Math.sin(frame * 0.18);
    const bx = this.w / 2 - 10, by = -this.h / 2 + 2;
    ctx.fillStyle = `rgba(0,0,0,${0.75 * pulse})`;
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(0,255,170,${pulse})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.stroke();
    // Mini shield path
    ctx.fillStyle = `rgba(0,255,170,${pulse})`;
    ctx.beginPath();
    ctx.moveTo(bx, by - 5);
    ctx.lineTo(bx + 4, by - 3); ctx.lineTo(bx + 4, by + 1);
    ctx.quadraticCurveTo(bx + 4, by + 5, bx, by + 6);
    ctx.quadraticCurveTo(bx - 4, by + 5, bx - 4, by + 1);
    ctx.lineTo(bx - 4, by - 3);
    ctx.closePath(); ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE  (explosion debris and absorb sparks)
// ═══════════════════════════════════════════════════════════════
class Particle {
  constructor(x, y, color) {
    this.x    = x;
    this.y    = y;
    this.vx   = randFloat(-3, 3);
    this.vy   = randFloat(-4, 1);
    this.life = PARTICLE_LIFE;
    this.max  = PARTICLE_LIFE;
    this.size = randFloat(2, 6);
    this.color= color || '#ff9900';
    this.active = true;
  }

  update() {
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += 0.12;   // gravity
    this.vx *= 0.96;
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const a = this.life / this.max;
    ctx.globalAlpha = a;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ═══════════════════════════════════════════════════════════════
// STAR  (scrolling background decoration)
// ═══════════════════════════════════════════════════════════════
class Star {
  constructor(cw, ch) {
    this.cw = cw; this.ch = ch;
    this._reset(true);
  }

  _reset(init = false) {
    this.x     = randFloat(0, this.cw);
    this.y     = init ? randFloat(0, this.ch) : 0;
    this.speed = randFloat(0.5, 2.5);
    this.r     = randFloat(0.5, 2);
    this.alpha = randFloat(0.3, 1);
  }

  update() {
    this.y += this.speed;
    if (this.y > this.ch) this._reset();
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
