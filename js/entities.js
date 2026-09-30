/**
 * entities.js
 * ─────────────────────────────────────────────────────────────
 * Entity classes: Player, Bullet, Enemy, Particle, Star.
 * Each entity holds its own state and draw logic.
 * ─────────────────────────────────────────────────────────────
 */

// ─── PLAYER ──────────────────────────────────────────────────
class Player {
  constructor(canvasW, canvasH) {
    this.w = 44;
    this.h = 52;
    this.x = canvasW / 2 - this.w / 2;
    this.y = canvasH - this.h - 20;
    this.canvasW = canvasW;
    this.invincibleFrames = 0; // frames of hit-protection
    this.thrustAnim = 0;       // for engine flame animation
  }

  /** Move the player. dx = -1 | 0 | 1. */
  move(dx, speed) {
    this.x = clamp(this.x + dx * speed, 0, this.canvasW - this.w);
  }

  /** Call every frame to tick down invincibility. */
  update() {
    if (this.invincibleFrames > 0) this.invincibleFrames--;
    this.thrustAnim++;
  }

  get isInvincible() { return this.invincibleFrames > 0; }

  /** Hitbox (slightly inset for forgiving gameplay). */
  get hitbox() {
    return { x: this.x + 8, y: this.y + 8, w: this.w - 16, h: this.h - 12 };
  }

  /** Draw the player plane using canvas 2D API. */
  draw(ctx) {
    const { x, y, w, h, invincibleFrames, thrustAnim } = this;

    // Blink when invincible
    if (invincibleFrames > 0 && Math.floor(invincibleFrames / 5) % 2 === 0) return;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    // Engine flame (animated)
    const flameH = 14 + Math.sin(thrustAnim * 0.4) * 6;
    const flameGrad = ctx.createLinearGradient(0, 18, 0, 18 + flameH);
    flameGrad.addColorStop(0, '#fff5a0');
    flameGrad.addColorStop(0.4, '#ff9900');
    flameGrad.addColorStop(1, 'rgba(255,60,0,0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(0, 18 + flameH);
    ctx.lineTo(7, 18);
    ctx.closePath();
    ctx.fill();

    // Fuselage body
    const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyGrad.addColorStop(0, '#1565c0');
    bodyGrad.addColorStop(0.5, '#42a5f5');
    bodyGrad.addColorStop(1, '#1565c0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);          // nose tip
    ctx.bezierCurveTo(8, -h / 4, 10, 0, 8, h / 4);   // right
    ctx.lineTo(5, h / 2 - 4);
    ctx.lineTo(-5, h / 2 - 4);
    ctx.lineTo(-8, h / 4);
    ctx.bezierCurveTo(-10, 0, -8, -h / 4, 0, -h / 2); // left
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

    // Wing accent stripe (light)
    ctx.strokeStyle = 'rgba(100,180,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, 14);
    ctx.lineTo(-10, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, 14);
    ctx.lineTo(10, 6);
    ctx.stroke();

    // Cockpit
    const cpGrad = ctx.createRadialGradient(-1, -8, 1, 0, -6, 10);
    cpGrad.addColorStop(0, '#a0d4ff');
    cpGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = cpGrad;
    ctx.beginPath();
    ctx.ellipse(0, -8, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose tip highlight
    ctx.fillStyle = 'rgba(200,230,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-1.5, -h / 2 + 4, 1.5, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ─── BULLET ──────────────────────────────────────────────────
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
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#00eeff');
    grad.addColorStop(1, 'rgba(0,200,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 2);
    ctx.fill();

    // Glow
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(0,212,255,0.4)';
    ctx.beginPath();
    ctx.roundRect(this.x - 1, this.y, this.w + 2, this.h, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── ENEMY TYPES ──────────────────────────────────────────────
const ENEMY_TYPES = {
  basic: {
    key: 'basic',
    label: 'Scout',
    w: 36, h: 32,
    hp: 1,
    scoreValue: 1, // multiplied by difficulty scorePerKill
    color: '#ff4444',
    accentColor: '#ff8888',
    shape: 'diamond',
  },
  tank: {
    key: 'tank',
    label: 'Tank',
    w: 48, h: 40,
    hp: 3,
    scoreValue: 3,
    color: '#ff8800',
    accentColor: '#ffcc44',
    shape: 'hexagon',
  },
  speeder: {
    key: 'speeder',
    label: 'Speeder',
    w: 28, h: 44,
    hp: 1,
    scoreValue: 2,
    color: '#cc44ff',
    accentColor: '#ee88ff',
    shape: 'arrow',
    speedMult: 1.8,
  },
  boss: {
    key: 'boss',
    label: 'BOSS',
    w: 80, h: 64,
    hp: 15,
    scoreValue: 15,
    color: '#ff0055',
    accentColor: '#ff5599',
    shape: 'boss',
    speedMult: 0.5,
  },
};

class Enemy {
  constructor(type, x, speed) {
    const def = ENEMY_TYPES[type] || ENEMY_TYPES.basic;
    Object.assign(this, def);
    this.x = x;
    this.y = -def.h;
    this.speed = speed * (def.speedMult || 1);
    this.active = true;
    this.maxHp = def.hp;
    this.flashFrames = 0;    // brief white flash on hit
    this.wobble = randFloat(0, Math.PI * 2); // offset for sine wobble
  }

  update(frame) {
    this.y += this.speed;
    if (this.flashFrames > 0) this.flashFrames--;
    // Speeder wobbles side-to-side
    if (this.shape === 'arrow') {
      this.x += Math.sin(frame * 0.08 + this.wobble) * 1.2;
    }
    if (this.y > CANVAS_H + this.h) this.active = false;
  }

  hit(dmg = 1) {
    this.hp -= dmg;
    this.flashFrames = 6;
    if (this.hp <= 0) {
      this.active = false;
      return true; // destroyed
    }
    return false;
  }

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
      case 'diamond':  this._drawDiamond(ctx, fill, acc); break;
      case 'hexagon':  this._drawHexagon(ctx, fill, acc); break;
      case 'arrow':    this._drawArrow(ctx, fill, acc); break;
      case 'boss':     this._drawBoss(ctx, fill, acc, frame); break;
      default:         this._drawDiamond(ctx, fill, acc);
    }

    // HP bar for multi-hp enemies
    if (this.maxHp > 1) {
      const bw = this.w - 4;
      const bh = 4;
      const bx = -bw / 2;
      const by = this.h / 2 - 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#00e58a' : '#ff3c5f';
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }

    ctx.restore();
  }

  _drawDiamond(ctx, fill, acc) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
    ctx.fill();
    // inner accent
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(0, -hh + 6);
    ctx.lineTo(hw - 6, 0);
    ctx.lineTo(0, hh - 6);
    ctx.lineTo(-hw + 6, 0);
    ctx.closePath();
    ctx.fill();
    // center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHexagon(ctx, fill, acc) {
    const r = Math.min(this.w, this.h) / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = acc;
    const r2 = r - 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      i === 0 ? ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2)
              : ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    }
    ctx.closePath();
    ctx.fill();
    // bolts
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawArrow(ctx, fill, acc) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, hh);              // bottom tip (coming down)
    ctx.lineTo(hw, -hh + 10);
    ctx.lineTo(hw - 8, -hh + 10);
    ctx.lineTo(0, -hh + 20);
    ctx.lineTo(-hw + 8, -hh + 10);
    ctx.lineTo(-hw, -hh + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(0, hh - 6);
    ctx.lineTo(6, -hh + 14);
    ctx.lineTo(-6, -hh + 14);
    ctx.closePath();
    ctx.fill();
  }

  _drawBoss(ctx, fill, acc, frame) {
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;

    // Body
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.bezierCurveTo(hw * 0.6, hh * 0.8, hw, hh * 0.3, hw, 0);
    ctx.bezierCurveTo(hw, -hh * 0.5, hw * 0.4, -hh, 0, -hh);
    ctx.bezierCurveTo(-hw * 0.4, -hh, -hw, -hh * 0.5, -hw, 0);
    ctx.bezierCurveTo(-hw, hh * 0.3, -hw * 0.6, hh * 0.8, 0, hh);
    ctx.fill();

    // Side fins
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(hw - 4, -hh * 0.3);
    ctx.lineTo(hw + 14, 4);
    ctx.lineTo(hw - 4, hh * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-hw + 4, -hh * 0.3);
    ctx.lineTo(-hw - 14, 4);
    ctx.lineTo(-hw + 4, hh * 0.3);
    ctx.closePath();
    ctx.fill();

    // Pulsing center eye
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.1);
    const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 * pulse);
    eyeGrad.addColorStop(0, '#ffffff');
    eyeGrad.addColorStop(0.4, '#ff8800');
    eyeGrad.addColorStop(1, 'rgba(255,0,80,0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Cannons
    [-20, 0, 20].forEach(ox => {
      ctx.fillStyle = '#330011';
      ctx.fillRect(ox - 3, hh - 8, 6, 12);
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(ox, hh + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// ─── PARTICLE ─────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = randFloat(-3, 3);
    this.vy = randFloat(-4, 1);
    this.life = PARTICLE_LIFE;
    this.maxLife = PARTICLE_LIFE;
    this.size = randFloat(2, 6);
    this.color = color || '#ff9900';
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12; // gravity
    this.vx *= 0.96;
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ─── STAR (background) ───────────────────────────────────────
class Star {
  constructor(canvasW, canvasH) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.reset(true);
  }

  reset(init = false) {
    this.x = randFloat(0, this.canvasW);
    this.y = init ? randFloat(0, this.canvasH) : 0;
    this.speed = randFloat(0.5, 2.5);
    this.radius = randFloat(0.5, 2);
    this.alpha = randFloat(0.3, 1);
  }

  update() {
    this.y += this.speed;
    if (this.y > this.canvasH) this.reset();
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
