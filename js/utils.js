/**
 * utils.js
 * ─────────────────────────────────────────────────────────────
 * Pure utility / math helpers used across the game.
 * ─────────────────────────────────────────────────────────────
 */

/** Clamp a value between min and max. */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Linear interpolation. */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Random integer between lo and hi (inclusive). */
function randInt(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Random float between lo and hi. */
function randFloat(lo, hi) {
  return Math.random() * (hi - lo) + lo;
}

/** AABB (axis-aligned bounding box) collision check. */
function rectCollides(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Simple easing: ease-out cubic. */
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
