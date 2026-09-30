/**
 * main.js
 * ─────────────────────────────────────────────────────────────
 * Entry point. Wires up the Game instance with all UI buttons
 * and difficulty selection.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const game   = new Game(canvas);

  // ── Difficulty selection ──────────────────────────────────
  let selectedDiff = 'easy';

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  // ── Button wiring ─────────────────────────────────────────
  document.getElementById('btn-start').addEventListener('click', () => {
    game.start(selectedDiff);
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    game.resume();
  });

  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    game.start(game.diffKey || selectedDiff);
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    game.start(game.diffKey || selectedDiff);
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    cancelAnimationFrame(game._rafId);
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    document.getElementById('start-screen').classList.add('active');
  });

  // ── Canvas resize on window change ───────────────────────
  window.addEventListener('resize', () => {
    game.renderer.resize();
  });
})();
