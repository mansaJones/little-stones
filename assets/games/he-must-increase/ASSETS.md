# He Must Increase — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §12.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 11.
Code: `src/games/HeMustIncreaseGame.js`.

All four plates arrived as one labelled contact sheet and were split out of it.

| File | Panel on the sheet | Notes |
|---|---|---|
| `bg.jpg` | BACKDROP PLATE | 1334×750. The river Jordan bank. Cropped — see below. |
| `john.png` | JOHN THE BAPTIST | One pose, hand raised and open, pointing away from himself. Displays at 152px. |
| `tile-god.png` | LARGE TILE (GOLD) | **Blank by design.** 176×218. |
| `tile-me.png` | SMALL TILE (PERIWINKLE) | **Blank by design.** 124×153. |

The tiles ship blank because GOD and ME are runtime text that rescales with the tile. Bake the
words into the art and they stretch into garbage the first time the tile resizes. The art doc says
the same thing in bold; this is the one plate where the art does very little work.

## The backdrop crop

This sheet came in at **1024×572**, well under the earlier deliveries, and its backdrop panel is
**507×522 — very nearly square** against a 16:9 stage. It cannot be used whole, and stretching it
would stretch John's river with it.

It is cropped to 16:9 keeping the **bottom**, less a **45px lift**:

- Keeping the bottom keeps the bank, the stones and the water. The sky is the part that can be lost.
- The 45px lift trades the bottom-corner rocks for a ~100px band of flat peach sky. That band is
  where the timer, the tier target and the prompt go, and this game has more HUD than any other in
  the roster — flush-bottom left only 48px and the timer sat on open water.

The result is upscaled 2.6× to 1334×750, so it is **softer than the other backdrops**. That is the
source resolution, not the pipeline. If this scene is ever regenerated, ask for a 16:9 backdrop
panel at the resolution the other sheets came in at.

## Layout, measured off `bg.jpg`

| What | Value | Why |
|---|---|---|
| John | `x 135, feet y 338, height 152` | The sand bank's top edge runs along y≈205 between x=90 and x=350. |
| Tile baseline | `y 258` | Both tiles stand on one waterline. |
| GOD / ME centres | `x 360` / `x 505` | |
| Tile height range | `46 … 164` | |

The height ceiling is set by the plate, not by taste. At 164 the taller tile's top edge lands on
the horizon at y=94, and the ME tile at its widest reaches x=572, just short of the reeds at
x=590. Raising either number puts a tile into the foliage. **If the backdrop is ever redrawn,
re-measure rather than nudging these by eye.**

Both tiles share a baseline because the art calls them "river stones standing on end", and a shared
baseline is what makes one tile towering over the other legible at a glance. Centre-anchored, they
read as two things drifting apart rather than one gaining on the other.

## Processing

- **Keyed by flood fill from the border**, not a colour threshold, plus a strict magenta pass for
  pockets enclosed by a silhouette. A global magenta key eats the blush on John's cheeks.
- **Resized with premultiplied alpha**, or the magenta in the transparent pixels averages into the
  edges and the outlines come back as dotted pink lines.
- **The two tiles are exported at SOURCE size, with no resize.** The usual "export at ~2.2× display
  size" rule would mean upscaling a 218px plate to 360px, which is interpolated mush. At source
  they are still a minification at the tile's largest on-screen size.
- Sprites are found as the three largest opaque blobs on the sprite panel, because the panel's own
  caption text is opaque too. John is the leftmost; of the remaining pair, gold is the upper.

## Balance, as built

A competent player wins **every tier in under half a second** — travel plus the 0.35s dwell. The
5 / 4 / 3-second timers are not the constraint and were never meant to be. What separates the tiers
is **precision**, and it falls straight out of the band widths in `gameConfig.js`:

| Tier | Band | Tolerance | Thumb travel | In-page bot, aim error ±12% / ±4% / ±2% |
|---|---|---|---|---|
| EASY | GOD 70–100% | ±15% | ±48px | wins / wins / wins |
| MEDIUM | GOD 80–90% | ±5% | ±16px | misses / wins / wins |
| HARD | GOD 90–95% | ±2.5% | ±8px | misses / misses / wins |

Measured with a proportional controller capped at a human 1200 game px/s, 6–10 rounds per cell.
The ladder is clean and the config numbers were left exactly as they were.

Two things a tester should know before filing a bug:

- **Running out of time is the only way to lose.** §12 lists "overshoot or undershoot" under Lose
  Conditions, which read literally would end the round the instant a thumb slips past 90 on MEDIUM.
  On a 4-second clock, for a six-year-old, that is a trap rather than a difficulty setting, and it
  contradicts the line above it — "fail to reach target proportions *before the timer expires*".
  Overshooting costs the clean-approach bonus and burns clock. It does not end the round.
- **The mechanic is a swipe, not a pinch.** §12's header says "Pinch/spread", but its own
  Implementation Notes say "pinch gesture detection (or swipe if pinch unavailable)", and the art
  doc, `gameConfig.js` and the instruction text all say swipe. Swipe it is.

§12 also asks for haptic feedback when the target zone is reached. There is no audio or haptic
layer anywhere in the build yet, so that signal is carried visually: the band turns green and the
GOD tile lightens.
