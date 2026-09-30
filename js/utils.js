/**
 * utils.js — pure math helpers, no game logic.
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function randInt(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randFloat(lo, hi) {
  return Math.random() * (hi - lo) + lo;
}

/**
 * AABB collision.  Returns true if rectangles a and b overlap.
 * Both must have { x, y, w, h }.
 */
function rectCollides(a, b) {
  return (
    a.x          < b.x + b.w &&
    a.x + a.w    > b.x       &&
    a.y          < b.y + b.h &&
    a.y + a.h    > b.y
  );
}
