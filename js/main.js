/**
 * main.js
 * ─────────────────────────────────────────────────────────────
 * Entry point. Wires up the Game instance with all UI buttons.
 *
 * Screen flow:
 *   title-screen  ──► difficulty-screen  ──► [game starts]
 *                                            ──► pause-screen
 *                                            ──► gameover-screen
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const game   = new Game(canvas);

  // ── Helper: show a single overlay ────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
  }

  // ── SCREEN 1: Title ──────────────────────────────────────────
  document.getElementById('btn-pick-difficulty').addEventListener('click', () => {
    showScreen('difficulty-screen');
  });

  // ── SCREEN 2: Difficulty cards ───────────────────────────────
  document.querySelectorAll('.diff-card').forEach(card => {
    card.addEventListener('click', () => {
      const diff = card.dataset.diff;
      showScreen(null);                 // hide all overlays
      _startGame(diff);
    });
  });

  document.getElementById('btn-back-title').addEventListener('click', () => {
    showScreen('title-screen');
  });

  // ── SCREEN 3: Pause ──────────────────────────────────────────
  document.getElementById('btn-resume').addEventListener('click', () => {
    game.resume();
  });

  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    _startGame(game.diffKey || 'easy');
  });

  document.getElementById('btn-menu-pause').addEventListener('click', () => {
    cancelAnimationFrame(game._rafId);
    showScreen('title-screen');
  });

  // ── SCREEN 4: Game Over ───────────────────────────────────────
  document.getElementById('btn-restart').addEventListener('click', () => {
    _startGame(game.diffKey || 'easy');
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    cancelAnimationFrame(game._rafId);
    showScreen('title-screen');
  });

  // ── Start game helper ─────────────────────────────────────────
  function _startGame(diffKey) {
    const cfg = DIFFICULTY[diffKey];
    // Populate pause & game-over difficulty labels
    const label = cfg ? cfg.emoji + ' ' + cfg.label : '';
    document.getElementById('pause-diff-label').textContent = label;
    document.getElementById('final-diff').textContent       = label;

    game.start(diffKey);
  }

  // ── Canvas resize on window change ───────────────────────────
  window.addEventListener('resize', () => {
    game.renderer.resize();
  });
})();
