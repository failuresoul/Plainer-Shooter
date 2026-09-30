# ✈️ Plainer Shooter

> A fast-paced 2D aerial shooter built entirely with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies, no build tools required.

![Game Screenshot](https://img.shields.io/badge/Status-Playable-brightgreen?style=flat-square)
![Language](https://img.shields.io/badge/Language-JavaScript-f7df1e?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 🎮 Play

Just open `index.html` in any modern browser. No installation needed.

```
double-click  →  index.html
```

Or via a local server (recommended for full font support):

```bash
npx serve .
# then open http://localhost:3000
```

---

## 📸 Screenshots

| Title Screen | Difficulty Selection | Gameplay |
|:---:|:---:|:---:|
| Select difficulty to begin | Choose Easy · Medium · Hard | Shoot enemies, dodge hazards |

---

## 🕹️ How to Play

### Controls

| Key | Action |
|-----|--------|
| `←` `→`  or  `A` `D` | Move airplane left / right |
| `SPACE` or `Z` | Fire missile |
| `P` or `Esc` | Pause / Resume |

### Objective

- **Shoot** the incoming angular enemies to score points.
- **Dodge** indestructible hazards — your missiles have no effect on them.
- Survive as long as possible. Lose all 3 lives and it's game over.

---

## 🔴 Object Types

There are **two distinct object types** — visually designed so you always know which is which at a glance.

### ◇ Shootable Enemies  *(red / orange / purple — angular shapes)*

| Enemy | Shape | HP | Points | Notes |
|-------|-------|----|--------|-------|
| **Scout** | Red diamond | 1 | 10 | Basic, moves straight down |
| **Speeder** | Purple arrow | 1 | 20 | Fast, weaves side-to-side |
| **Tank** | Orange hexagon | 3 | 30 | Slow, requires 3 hits (HP bar shown) |
| **BOSS** | Large red shape | 15 | 150+ | Appears every N levels, pulsing eye |

> ✅ Missiles **destroy** these. Score increases on kill.

### ○ Indestructible Hazards  *(green / gold — rounded shapes + 🛡️ badge)*

| Hazard | Shape | Notes |
|--------|-------|-------|
| **Asteroid** | Gold bumpy rock | Rotates slowly as it falls |
| **Energy Barrier** | Teal glowing bar | Animated scan-line, wide hitbox |

> ❌ Missiles **cannot destroy** these. The bullet vanishes with a teal spark; the hazard keeps moving. **Evade them.**

---

## ⚙️ Difficulty Levels

| | 🟢 Easy | 🟡 Medium | 🔴 Hard |
|---|---|---|---|
| **Lives** | 3 | 3 | 3 |
| **Spawn rate** | Slow (2.2s) | Moderate (1.3s) | Fast (0.85s) |
| **Object speed** | 1.5 → max 4.0 | 2.5 → max 7.0 | 3.4 → max 10.0 |
| **Non-shootable %** | ~10 % | ~28 % | ~40 % |
| **Max on screen** | 4 | 7 | 10 |
| **Speed ramp-up** | Gentle (+0.15/level) | Moderate (+0.28/level) | Aggressive (+0.45/level) |
| **Best for** | Beginners | Most players | Experienced players |

Both object speed and spawn frequency increase with each level, regardless of difficulty.

---

## 💥 Visual Effects

| Effect | Trigger | Visual |
|--------|---------|--------|
| **Muzzle flash** | Firing a missile | Cyan burst at gun barrel |
| **Explosion** | Shootable enemy destroyed | Orange + white particle burst |
| **Absorb spark** | Missile hits indestructible | Small teal sparks (bullet vanishes) |
| **Plane crash** | Any object touches the plane | Blue particle burst |
| **Screen shake** | Plane crash | Canvas shake animation (~0.45s) |
| **Score pop-up** | Enemy destroyed | Green `+N` floats upward |
| **Level banner** | Level up | Large text pulse animation |
| **Invincibility blink** | After being hit | Plane blinks for ~2 seconds |

---

## 📁 Project Structure

```
Plainer Shooter/
│
├── index.html          ← Game shell — HUD, overlays, canvas, script tags
├── style.css           ← All styling — dark theme, animations, screens
│
└── js/
    ├── config.js       ← ⭐ All difficulty values in one place
    ├── utils.js        ← Pure math helpers (clamp, randInt, AABB)
    ├── entities.js     ← All game objects (Player, Bullet, Enemy, Particle…)
    ├── renderer.js     ← Canvas management, background, score pop rendering
    ├── spawner.js      ← Enemy timing, type selection, difficulty-aware cap
    ├── game.js         ← Game loop, state machine, collision, HUD updates
    └── main.js         ← UI wiring — buttons, screen transitions
```

### Module Responsibilities

```
config.js   ──► spawner.js  ──► game.js  ──► renderer.js
                                  │
                                  ├──► entities.js  (Player, Enemy, Bullet…)
                                  └──► main.js      (UI / button wiring)
```

---

## 🔧 Customisation Guide

All tunable values live in [`js/config.js`](js/config.js). No other file needs changing.

### Adjust difficulty feel

```js
// js/config.js
easy: {
  spawnInterval:    2200,   // ms — lower = faster spawns
  enemySpeedBase:   1.5,    // starting speed of enemies
  nonShootableChance: 0.10, // 0.0–1.0 → % of hazards vs enemies
  maxEnemiesOnScreen: 4,    // hard cap on simultaneous objects
  lives:            3,
  // …
}
```

### Add a new enemy type

1. Add a definition to `ENEMY_TYPES` in `js/entities.js`:

```js
myEnemy: {
  key: 'myEnemy', label: 'My Enemy',
  shootable: true,          // true = destructible
  w: 40, h: 40,
  hp: 2, scoreValue: 3,
  color: '#ff00ff', accentColor: '#ff88ff',
  shape: 'myShape',
  speedMult: 1.2,           // optional speed multiplier
},
```

2. Add a `_drawMyShape(ctx, fill, acc)` method to the `Enemy` class.
3. Add `'myEnemy'` to the probability table in `js/spawner.js → _chooseType()`.

### Add a new difficulty

```js
// js/config.js
insane: {
  label: 'Insane', emoji: '💀',
  lives: 1,
  spawnInterval: 600,
  nonShootableChance: 0.55,
  maxEnemiesOnScreen: 15,
  // …fill in remaining fields…
},
```

Then add a difficulty card in `index.html` with `data-diff="insane"`.

---

## 🏗️ Architecture Notes

- **No external dependencies** — zero `npm install`, zero build step.
- **Pure Canvas 2D API** — all graphics are procedurally drawn; no image files.
- **State machine** — `game.state` is one of `idle | running | paused | gameover`. Every subsystem checks this before acting.
- **Collision** — AABB (axis-aligned bounding box) with inset hitboxes for fairness. Non-shootable objects have a hard `if (!this.shootable) return false` guard in `Enemy.hit()`.
- **Spawn safety** — enemies always start above the visible canvas (`y = -def.h`), and the maximum-on-screen cap prevents instant crowding.
- **rAF leak prevention** — `cancelAnimationFrame` is called before every new `game.start()` and on menu return.

---

## 🐛 Known Limitations

- No audio (browsers require user interaction to unlock audio context — intentionally omitted to keep the game self-contained).
- No persistent high score (browser `localStorage` would be a small addition).
- Mobile / touch controls not yet implemented.

---

## 🗺️ Roadmap Ideas

- [ ] Sound effects and background music
- [ ] High-score leaderboard (localStorage)
- [ ] Touch / mobile controls
- [ ] Power-ups (shield, rapid fire, multi-shot)
- [ ] More enemy types and boss phases
- [ ] Parallax background layers
- [ ] Animated intro / cutscene

---

## 📜 License

MIT © 2026 — free to use, modify, and distribute.

---

<p align="center">Made with ❤️ and vanilla JavaScript · No frameworks harmed in the making of this game.</p>
