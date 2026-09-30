/**
 * main.js — entry point.
 *
 * Screen flow:
 *   title-screen  →  difficulty-screen  →  [game running]
 *                                       →  pause-screen  →  [resume / restart / menu]
 *                                       →  gameover-screen  →  [play again / menu]
 */
(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const game   = new Game(canvas);

  // ── Utility ───────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
  }

  function startGame(diffKey) {
    const cfg = DIFFICULTY[diffKey];
    if (!cfg) { console.error('Unknown difficulty:', diffKey); return; }
    // Pre-fill pause + gameover difficulty labels
    const label = cfg.emoji + ' ' + cfg.label;
    document.getElementById('pause-diff-label').textContent = label;
    document.getElementById('final-diff').textContent       = label;
    showScreen(null);   // hide all overlays before game starts
    game.start(diffKey);
  }

  // ── Title screen ──────────────────────────────────────────
  document.getElementById('btn-pick-difficulty')
    .addEventListener('click', () => showScreen('difficulty-screen'));

  // ── Difficulty cards ──────────────────────────────────────
  document.querySelectorAll('.diff-card').forEach(card => {
    card.addEventListener('click', () => startGame(card.dataset.diff));
  });

  document.getElementById('btn-back-title')
    .addEventListener('click', () => showScreen('title-screen'));

  // ── Pause screen ──────────────────────────────────────────
  document.getElementById('btn-resume')
    .addEventListener('click', () => game.resume());

  document.getElementById('btn-restart-pause')
    .addEventListener('click', () => startGame(game.diffKey || 'easy'));

  document.getElementById('btn-menu-pause')
    .addEventListener('click', () => {
      if (game._rafId !== null) cancelAnimationFrame(game._rafId);
      game._rafId = null;
      game.state  = 'idle';
      showScreen('title-screen');
    });

  // ── Game-over screen ──────────────────────────────────────
  document.getElementById('btn-restart')
    .addEventListener('click', () => startGame(game.diffKey || 'easy'));

  document.getElementById('btn-menu')
    .addEventListener('click', () => {
      if (game._rafId !== null) cancelAnimationFrame(game._rafId);
      game._rafId = null;
      game.state  = 'idle';
      showScreen('title-screen');
    });

  // ── Responsive resize ─────────────────────────────────────
  window.addEventListener('resize', () => game.renderer.resize());

})();
