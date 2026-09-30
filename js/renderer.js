/**
 * renderer.js
 * Handles canvas sizing and all non-entity drawing.
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.resize();
  }

  resize() {
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    // 74px = HUD (52px) + legend bar (22px)
    const scale = Math.min(
      window.innerWidth / CANVAS_W,
      (window.innerHeight - 74) / CANVAS_H
    );
    this.canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }

  clear() {
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }

  drawBackground() {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0,   '#000814');
    grad.addColorStop(0.5, '#001a33');
    grad.addColorStop(1,   '#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Scanline overlay
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < CANVAS_H; y += 4) {
      ctx.fillRect(0, y, CANVAS_W, 2);
    }
  }

  /** Floating "+N" score pop-ups. */
  drawScorePops(pops) {
    const { ctx } = this;
    ctx.textAlign  = 'center';
    ctx.font       = 'bold 13px "Orbitron", monospace';
    pops.forEach(p => {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle   = '#00e58a';
      ctx.fillText('+' + p.value, p.x, p.y);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign   = 'left';
  }
}
