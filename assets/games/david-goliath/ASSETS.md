# David vs Goliath — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §10.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 12.
Code: `src/games/DavidVsGoliathGame.js`.
Build scripts: `measure.py`, then `ground2.py`, then `key_david.py` (re-run all three if any plate is
redrawn — do not nudge the numbers by eye).

Seven plates: six square character sheets at 2048² and one landscape canyon at 2576×1438.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | The canyon. **Empty** — both characters are sprites, not painted in. |
| `david-idle.png` | 107×220 | Displays 49×100. Empty-handed. |
| `david-aim.png` | 152×211 | Displays 69×96. Sling drawn back. |
| `david-release.png` | 152×211 | Displays 69×96. Follow-through. |
| `goliath.png` | 321×440 | Displays 146×200. |
| `stone.png` | 31×24 | Displays 14px wide. Also the attempts icon. |
| `sling.png` | 57×27 | **Ships unused.** See below. |

## The plates are JPEGs, and the magenta is dirty

Every previous set arrived as PNG. These are JPEG, which changes the keying job. The background is
not `#FF00FF` anywhere — measured border colours run `(254..255, 31..47, 249..255)` — and JPEG
ringing smears intermediate colour around every bold black outline. A hard equality test keys
nothing; a loose global colour test eats the pink cheek blush, which is only 141 away in green.

So: flood fill inward from the border at tolerance 72 (flooding, not thresholding, so a
magenta-ish pixel *inside* a character is never removed by accident), then a strict pass at
tolerance 46 for pockets the flood cannot reach, then a defringe that pulls surviving
magenta-leaning pixels back toward their opaque neighbours.

```
plate           bg found       flood px  / pockets / defringed
david-idle      (255, 43, 252) 3,161,567 /   2,424 / 1,454
david-aim       (255, 38, 251) 3,036,582 /  30,928 / 2,112
david-release   (255, 31, 252) 3,041,482 /  12,502 / 2,266
goliath         (254, 44, 255) 2,394,157 /  28,609 / 1,847
sling           (253, 45, 251) 3,686,228 /  95,986 / 3,132
stone           (254, 42, 249) 3,171,617 /       0 /   791
```

The pocket pass earns its keep: 95,986 pixels on the sling (the gap inside the Y-frame and between
the bands) and 28,609 on Goliath (under his arms, between his legs) are enclosed and unreachable
from the border. Surviving magenta afterwards: 0 pixels on five plates, 2 on Goliath.

## The canyon floor is not where it looks

A first pass classified "warm" pixels as sand and put the ground at 47% of frame height. Wrong —
the rock formations are dusty **rose**, which is also warm, so it had found rock. Walking *up* from
the bottom of each column instead (the bottom edge is unambiguously floor) gives the real skyline
per column:

```
open middle third, floor top:  y 290.8 .. 293.4 of 375
ground line used:              y 292          <- feet sit here
clear floor at that height:    the full stage width
```

## David is half Goliath's height because §10 says so, not because the plates say so

Each sprite was drawn to fill its own 2048² frame, so their plate heights carry no scale
information at all — measured raw, David is 0.95× Goliath, which means nothing. The ratio is set in
code: Goliath 200px, David 100px.

**All three David poses share one scale factor**, so he cannot change size between frames. The
aiming plate is genuinely shorter than the idle plate at that scale, so anchoring at the **feet**
makes him crouch by exactly the amount the artist drew:

```
idle     49 x 100
aim      69 x  96     <- 4px shorter: the brace, as drawn
release  69 x  96
```

Anchoring at the centre instead would have made him hover.

## Three hitbox bugs, all the same bug

The stone's collision went through three wrong versions before it was right, and all three failed
the same way: **a rectangle is not a person.**

1. **Bounding box as the body.** Goliath's box is 146×200 but his silhouette fills only 78% of its
   width on average, and in the top band — just the helmet spike — 6.5%. A stone sailing clear over
   his shoulder, visibly missing, scored as a body hit. Fixed with a 48-band silhouette table
   measured off `goliath.png`: the real x span of him at each height.

2. **Bounding rectangles as head and forehead.** Same error one level down. The head rectangle was
   49% of his sprite wide while he is only 32% wide at helmet height, so a stone clearing his helmet
   comfortably scored as a head hit — which on HARD ends the round.

3. **A left edge on the forehead.** The forehead rectangle started at x 0.110 while his helmet
   already starts at 0.093. Every stone arrives from David's side, so it touched the silhouette's
   leading edge first, scored as something else one pixel early, and **the forehead was unreachable
   from the only direction anyone can shoot from.** A solved, led shot that was genuinely on course
   kept dying 46px short of it.

The shipped version: the silhouette gates every hit, and the bands only decide *which part* was
struck. Head and forehead are bounded on the **right** only — Goliath is hunched, so his pauldron
sits level with his helmet and a pure depth band cannot tell them apart, but bounding the left is
what made the target unreachable.

```
y 0.065  helmet solid, FOREHEAD starts     y 0.270  eyes
y 0.240  FOREHEAD ends                     y 0.330  jaw, head ends
```

The forehead starts at the crown rather than below it because a slung stone arrives on a falling
arc and strikes the top of the helmet first — and 1 Samuel 17:49 has the stone sinking into his
forehead.

## The launch power was derived from the wrong formula

The first derivation used the flat-range formula `v² / g`, which assumes the target is level with
the launch. Goliath's forehead is **108px above** David's hand, and climbing costs energy the flat
formula never charges for. The honest minimum is

```
v_min² = g · (h + √(dx² + h²))
```

which for the forehead (dx 315, h 108) is **630 px/s**, not the 566 the flat formula claimed. At the
original `MAX_PULL × POWER` of 665 px/s that put the forehead at **95% of the entire envelope**, and
only at the one minimum-energy angle. Effectively unhittable. The harness caught it: solved forehead
shots came back "out of range".

At `POWER 9.0` (855 px/s):

```
forehead  dx 315  up 108   v_min 630   74% of max pull
head      dx 307  up  89   v_min 606   71%
body      dx 344  up  -8   v_min 550   64%
```

Flat range is 812px against a 667px stage, so overshooting off the top of the screen is still a real
way to miss.

## The sling plate ships unused, and that is deliberate

Scene 12 generated the sling separately so it could be rotated on the drag — "anything that
rotates, scales, or animates independently gets its own sprite." Sound reasoning, overtaken by the
art: three David poses came back with a sling already drawn in his hands, which is a better
animation than a cutout pinned to a static body. Two slings on screen reads as a bug.

It was then tried as the attempts icon at 26px and again at 38px and failed both times — at 2.1:1 it
is a squiggle at any size that fits three in a corner. The **stone** took that job: round, legible
at 18px, and "stones left" is what the player actually has (1 Samuel 17:40).

The plate stays in the folder rather than being forced somewhere it does not belong.

## Known: HARD's lose-by-charging cannot fire

§10 lists "Goliath reaches David (charges forward)" as a HARD lose condition, and it is implemented.
It cannot trigger at the configured numbers:

```
gap to close   480 - 73 - 128 = 279px
goliathSpeed   40 px/s   ->   7.0s
timeLimit      6.0s
```

The timer always expires first. The charge still does real work — he closes 240px in a round, so the
target moves while the stone is in flight, and the shot has to be **led**. Measured: a stone takes
~0.76s to reach him, during which he moves ~30px against a forehead band ~56px wide, so firing at
where he *is* misses. Raising `goliathSpeed` to ~56 would make the lose condition reachable; that is
a difficulty decision, not a bug fix, so it has been left alone and written down instead.

## Processing

- **Keyed by flood fill from the border**, plus a strict pass for enclosed pockets, plus a defringe.
- **Resized with premultiplied alpha**, or transparent magenta bleeds back and the bold outlines
  return stippled pink.
- Exported at **2.2×** display size.
- Backdrop resized to 1334×750 (aspect 1.791 against the stage's 1.779, 0.71% off).
- Backdrop scrim **0.74**, computed from the plate's measured luminance (0.7004) for 4.5:1 white
  text. That scrim only affects the Story / How to Play / result pages — `drawGameBackdrop` is
  called by those three scenes, while the game scene draws the plate itself at full brightness.

There is still **no audio anywhere in this build**.
