# Baby Moses in the Basket — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §15.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 15.
Code: `src/games/BabyMosesGame.js`.
Build script: `key_moses.py` (run it again if any plate is redrawn — do not nudge the numbers by eye).

Six separate plates, so no contact sheet to cut.

| File | Source | Notes |
|---|---|---|
| `bg.jpg` | the river plate, resized | 1334×750. The STILL river. Used only by the story / instruction / result pages and by the off-stage bleed — the game itself never draws it. |
| `river-tile.jpg` | a 1150px band from the middle of the same plate | 1200×750. The SCROLLING water. See below. |
| `basket-moses.png` | 96×96 | The player. Displays at 42px. |
| `reed-clump.png` | 128×121 | Obstacle. Displays at 58px. |
| `river-rock.png` | 102×102 | Obstacle. Displays at 46px. |
| `hippo.png` | 139×150 | Obstacle, MEDIUM and HARD. Displays at 68px, surfaces mid-run. |
| `pharaoh-daughter.png` | 182×246 | End of the run. SIDE view — Scene 15 flags the mixed view as intentional, and it reads fine. |

## The scrolling water

The river moves, so it cannot be one composed plate. Scene 15 prescribes the fix: crop a vertical
band from the plate's middle and tile it with every other copy mirrored on X.

That is baked in at build time rather than at runtime, as a single 1200×750 texture holding
`[band | mirrored band]`. Mirroring makes the texture's **first and last columns identical**, so a
TileSprite wraps it with no seam at all — measured at **0.00/255 mean absolute difference**, not
"looks fine". Banks run horizontally, so they continue cleanly across the mirror.

The texture is exported at 2× and drawn with `setTileScale(0.5)`, so it stays sharp when a tablet
scales the canvas up ~1.8×. One wrap is 600 display px.

## The river, measured off the plate

```
BM_RIVER = { top: 50, bottom: 329 }      // 279px of open water on a 375px stage
```

Found by classifying the plate into water and not-water and scanning every 7th column: the water
body runs rows **192…1260 of 1438**, and the top edge varies by **one pixel** across the whole
2576px plate.

**Deliberately not "wherever the grass stops".** Between the grass and the water there is a
dusty-rose mud edge that belongs to the bank, and grass tufts poke down into it by up to 150px — so
the grass edge wanders by 10% of the plate height and is useless as a boundary. A basket floating
on the mud would look beached.

## The patterns

Hand-authored per tier, never random. §15: *"Random placement can produce a wall with no gap. Every
pattern keeps a channel at least 1.5× the basket's width."* That is 63px, and it is **checked**
rather than assumed — the harness walks every column of every tier against the real sprite radii:

| Tier | Obstacles | Columns | Narrowest channel | Steering slack |
|---|---|---|---|---|
| EASY | 5 | 5 | 150.4px | 220px |
| MEDIUM | 9 + hippo | 7 | 85.6px | 140px |
| HARD | 14 + hippo + current | 7 | 85.6px | 160px |

"Steering slack" is the second thing worth checking and the one §15 does not mention: a channel can
be wide enough and still be unreachable if the previous column's gap was at the other bank. The
figures are how much further the basket *could* travel between consecutive columns than it has to.

**The opening stretch is already on the water when the round starts.** At 170px/s an obstacle takes
3.3s to cross from the right edge to the basket, but the patterns start arriving at 0.9s — so the
first few are placed during `create()`, before the intro. The player watches the basket drift into a
river that already has reeds downstream, instead of watching five of them blink into existence on
the first frame of play.

## Balance, as built

Measured with a steering bot driven from inside the page at frame rate, which reads the obstacles
ahead, finds the free intervals and aims at the nearest — the same read a child has to make.

| Tier | by TILT | by DRAG | typical bumps |
|---|---|---|---|
| EASY | 5/5 | 3/3 | 0 |
| MEDIUM | 5/5 | 3/3 | 2 |
| HARD | 5/5 | 3/3 | 3 |

An unsteered round on HARD loses with 6 bumps, so drifting is not a strategy.

The budget is exactly as §15 designs it: a 10s round against a fixed 7s run leaves 3.0s of slack,
and a bump costs 0.6s, so **every tier allows exactly five bumps**. HARD spends three of them on a
bot that never panics, which leaves a real margin for a child who does.

## Tilt

Shipped as the primary input, per §15, with drag as the fallback. There is no accelerometer in a
headless browser, so the harness synthesises real `DeviceOrientationEvent`s — which exercises the
whole chain except the physical sign.

What is proven:

- **Any starting angle calibrates to zero.** A child holding the phone at 18° starts at 0.00 steer.
- **The ±3° dead zone** absorbs a 2° wobble entirely and passes a 4° lean through at 0.045.
- **Full scale at ±25°**, symmetric, and it saturates rather than running away at ±90°.
- **Portrait steers on beta and ignores gamma**; landscape ignores beta.
- **One physical gesture steers the same way in both landscape grips** — §15's two-hands trap.
  Reading gamma without the screen angle gives −0.773 in one grip and +0.773 in the other, which is
  the bug that paragraph exists to prevent.

> **One bug this caught, which would have shipped.** The neutral was captured from the low-pass
> filter on its first frame, before the filter had converged — so calibrating at 18° captured 4.5°
> and the round began at **0.48 of full deflection**, with the basket bolting for the bank. Seeding
> the filter with the first raw reading *before* taking the neutral fixes it: 0.48 → 0.00. This is
> precisely the failure §15's "kids hold phones at every angle" note is about, and filtering before
> calibrating is the natural order to write it in.

**`BM_TILT_SIGN` is the one number only a phone can settle.** Everything above says the maths is
right; none of it says a physical tilt produces the beta the harness hands it. If the basket steers
backwards on a real device, flip that constant — nothing else needs to move.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for pockets a silhouette
  encloses. All five sprites came out at a single blob with zero magenta pixels left.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- Ripples, splashes and the "hee hee!" pop are **Phaser effects, not sprites**.
