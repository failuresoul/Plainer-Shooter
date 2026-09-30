/**
 * renderer.js
 * ─────────────────────────────────────────────────────────────
 * Handles canvas sizing and the scrolling background gradient.
 * All entity drawing is delegated to the entities themselves.
 * ─────────────────────────────────────────────────────────────
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.resize();
  }

  /** Set canvas to fixed logical size. */
  resize() {
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    // 74px = HUD (52px) + legend bar (22px)
    const scale  = Math.min(window.innerWidth / CANVAS_W, (window.innerHeight - 74) / CANVAS_H);
    this.canvas.style.width  = (CANVAS_W * scale) + 'px';
    this.canvas.style.height = (CANVAS_H * scale) + 'px';
  }

  /** Draw the scrolling deep-space background. */
  drawBackground(frame) {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0,   '#000814');
    grad.addColorStop(0.5, '#001a33');
    grad.addColorStop(1,   '#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle horizontal scan-line overlay
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < CANVAS_H; y += 4) {
      ctx.fillRect(0, y, CANVAS_W, 2);
    }
  }

  /** Draw a score pop-up when an enemy is destroyed. */
  drawScorePop(pops) {
    const { ctx } = this;
    pops.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.font = 'bold 14px Orbitron, monospace';
      ctx.fillStyle = '#00e58a';
      ctx.textAlign = 'center';
      ctx.fillText('+' + p.value, p.x, p.y);
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'left';
  }

  /** Clear everything (call at start of each frame). */
  clear() {
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }
}
