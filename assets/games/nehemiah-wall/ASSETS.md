# Nehemiah Rebuilds the Wall — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §19.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 19.
Code: `src/games/NehemiahWallGame.js`.
Build scripts: `locate.py` then `key_nehemiah.py` (re-run both if any plate is redrawn — do not
nudge the numbers by eye).

Everything arrived on one 1792×2400 contact sheet. The five panels are found by pixels rather than
by typed-in crop boxes — magenta blocks by connected components, the backdrop as the one large
non-white non-magenta region — so the sheet can be re-exported at another size without anything
downstream caring.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | Jerusalem's wall. **Cropped, not squeezed** — see below. |
| `wall-stone.png` | 99×60 | One block, one size, every tier. Displays at 45.1×27.0. |
| `crane-arm.png` | 660×118 | Beam and pulley. **No rope** — it is drawn in Phaser. |
| `nehemiah-point.png` | 159×240 | Directing, on the left. Displays at 128 tall. |
| `nehemiah-cheer.png` | 173×240 | The win pose. Same height, so he does not jump in size. |

## Scene 19's hard constraint, and the plate that misses it

> The gap's size is a hard constraint. It must be exactly one stone wide and eight stones tall at
> the shared display scale. Generate `wall_stone` **first**, then judge the backdrop's gap against
> it and regenerate until it fits.

Measured, it does not fit. Both the gap and the stone are scaled independently at runtime, so the
number no scale factor can rescue is the ASPECT RATIO:

```
gap on the stage      52.6 w × 216.0 h     aspect h/w  4.104
stone                 471 × 282 source     aspect h/w  0.5987
needed                8 × 0.5987        =             4.790
stones that fit at full gap width         =             6.86
```

The gap holds not quite seven stones, and §19 wants eight at every tier.

The gap cannot be made taller and the stone cannot be stretched — §19 is explicit that resizing it
per tier would pull the outlines, which is the whole reason the lower tiers pre-place stones instead
of using bigger ones. So **the stone is seated at 85.7% of the gap's width**: 45.1 wide instead of
52.6, which makes 27.01 tall, which makes eight of them exactly 216.08 against a 216.10 gap.

The cost is **3.75px of sky down each side of the column**, and it is the cheapest thing available.
The alternative was re-cutting §19's counts from 4/6/8 to 3/5/7, which changes the spec to fit a
plate rather than the other way round. If the backdrop is ever regenerated with a gap 17% taller
for the same width, delete this paragraph and the stone goes back to full width.

Verified against the plate as the game actually draws it, not against the cutter's own arithmetic:

```
ground line down the gap centre      y 323    NW_GAP.bottom  322.9
wall top beside the gap          y 107/108    NW_GAP.top     106.8
```

## The backdrop is cropped to the stage, not squeezed into it

Every other plate in this build is resized straight to 1334×750 and absorbs a percent or so of
distortion. This panel is 1698×990 — aspect 1.715 against the stage's 1.778 — which would be a 3.7%
horizontal stretch. That shears the gap's aspect, which is the one number this game cannot afford to
get wrong, so 35 rows of sky come off the top instead and the resize is uniform. Nothing is lost:
there were 272 rows of sky above the wall.

## The rope is not in the plate

Scene 19: *"Draw the rope as a Phaser line from the pulley to the stone; a baked rope can't swing."*
It is drawn each frame from the pulley to the top of the stone.

The pulley's position inside the arm sprite is measured, not guessed — it is the part that hangs
lowest, centred at **0.923 of the width and 0.767 of the height**. Those two fractions are the only
thing keeping the rope attached to the wheel instead of to thin air when the arm is rescaled.

## The swing, and why it is as narrow as it is

The stone hangs on a 58px rope from a pivot at y=30 and swings ±65°, reaching **±52.6px** — exactly
one gap width either side.

That is narrower than it ought to be, and the reason is the plate. The arc has to stay above the
wall top at y=106.8, because a stone hanging *below* it could not be knocked off it and "it hit the
wall and tumbled" is the only reading of a miss a child will follow. That leaves 107px of sky, of
which the crane arm needs the top 34, so the rope gets 58. At the bottom of the arc the stone's
underside sits at y=101.5, five pixels clear of the wall.

The consequence is that **aim is not where the difficulty lives — timing is.** A tolerance small
enough to be challenging in pixels would be a window of a few frames in time. So the tolerances here
look generous as fractions of the arc, and the game is still hard, because eight stones in twelve
seconds is hard.

## Balance, measured

What the two config dials really control is a window in TIME:

```
window = asin(tolerance / 52.6) / (pi * swingSpeed)   seconds, twice a cycle
```

A simulated player taps at each centre crossing with a timing error drawn from N(0, sigma), on the
game's own frames — polling from Node would add 5-15ms of round trip to an error of 80.

```
                       window     sigma 80ms   sigma 110ms   mashing
  easy  30 / 0.38Hz   ±254ms        100%          100%          0%
  med   26 / 0.50Hz   ±165ms        100%           88%          0%
  hard  22 / 0.62Hz   ±111ms         79%           50%          0%
```

An earlier ladder of 22/15/10 against 0.45/0.62/0.80 read like a sensible progression and measured
**29% on HARD** at 80ms. Eight stones in twelve seconds leaves no room for an 0.8s miss penalty at a
52% hit rate, and §19 fixes both the eight and the twelve.

Two changes bought the rest:

- **The stone swings in from an extreme, alternating sides, instead of appearing at the bottom of
  its arc.** Starting it dead centre looks tidy and plays badly: the one moment it is aimed
  correctly is the moment it arrives, before a child could react, so every stone cost a full
  half-period of waiting. Entering at an extreme halves that, and reads better — the crane swings
  the block over. It is also why **mashing scores zero on every tier**: a stone released on sight is
  52.6px off centre, outside every tolerance.
- Drop speed 520 → 760 px/s and the post-hit pause 250 → 140ms. The 0.8s miss penalty is untouched,
  because §19 names it.

## Not in the art, and not faked

§19's feedback list asks for *"workers on the wall cheer each placed stone"*. **There are no
workers.** Scene 19's layer table has four layers and none of them is a worker, so there is no plate
to put up there. Nehemiah does the cheering instead: he bobs on every seated stone and switches to
the cheer plate on the win. If worker sprites are ever generated, that is where they go.

The dust puff, the near-perfect sparkle, the camera shake and the "oops!" are **Phaser effects, not
sprites**, as §19 intends. There is still **no audio anywhere in this build**, so the thunk is a
camera shake.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets. All four
  sprites came out as a single blob at 100% of foreground — unusually clean plates.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- Backdrop scrim **0.62**, computed from the plate's measured luminance (0.4770) for 4.5:1 white
  text — not estimated.
