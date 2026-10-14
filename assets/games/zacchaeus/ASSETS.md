# Zacchaeus Climbs the Tree — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §17.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 17.
Code: `src/games/ZacchaeusTreeGame.js`.
Build script: `key_zacc.py` (re-run it if any plate is redrawn — do not nudge the numbers by eye).

Eight plates, all distinct files. All four of Scene 17's layers are covered.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | The Jericho street. The tree is in the plate because it never changes. Aspect 1.791 → resized, no crop. |
| `zacchaeus-climb-l.png` | 98×160 | Climbing: left arm up, right knee raised. Displays at 72px tall. |
| `zacchaeus-climb-r.png` | 98×160 | **The same pose** — see below. Drawn flipped. |
| `zacchaeus-slip.png` | 160×153 | Both arms flailing. Never flipped. |
| `zacchaeus-wave.png` | 230×219 | Sitting on a branch. The plate includes the branch, so it is sized by WIDTH. |
| `jesus-walk.png` | 113×205 | Profile facing right. The diegetic timer. Displays at 92px. |
| `jesus-lookup.png` | 103×205 | Stopped, head up, waving. Both endings use it. |
| `crowd-strip.png` | 620×297 | Seven people from behind. Tiled; see below. |

## The two climb plates are the same pose

Scene 17 asks for `climb_r` to be `climb_l` with *"the limbs mirrored"*. They are not. Compared as
silhouettes at 96×96:

```
match as drawn   0.999
match mirrored   0.697
```

Not a close call. Drawn as delivered, the two-frame climb animation would animate by standing
perfectly still. So `climb_r` is drawn with `setFlipX(true)` (`ZT_MIRROR_R`), which produces exactly
the mirrored limbs the art doc asked for. **Set that constant to false if the plate is ever
redrawn properly.** The slip plate is its own pose and is never flipped, or he flails backwards.

## The tree, measured off the plate

Bark is isolated by colour in the right half (the houses on the left are brownish too), then the
widest run per row in the lower half is the trunk, and the highest row whose leftmost run starts
well left of the trunk is the fork over the street.

```
trunk       x 1969..2465 of 2576   ->  stage x 510..638
climbing line                      ->  stage x 574   (ZT_CLIMB_X)
trunk base  y 1320 of 1438         ->  stage y 344
ZT_GROUND = 358    ZT_BRANCH = 176
```

**He starts at 358, below the trunk's base and down among the crowd's heads.** That is deliberate
and it is the story: Luke 19:3 says he could not see over them. The climb lifts him out of the
heads, and the first few taps are the ones that make him visible at all.

Climb span 182px over 14 / 18 / 22 taps — 13.0 / 10.1 / 8.3 px a tap. Continuous, never snapped to
a drawn branch, which is what §17 requires and what lets the tap target change per tier while the
tree art does not. Verified: 23 heights on HARD, all distinct, even rise, spread 0.01px.

## The crowd

The strip is seven figures and nearly square (2.09:1), so one copy at a readable height covers only
a third of the road. Scaled by **height** to 104px and tiled with every other copy flipped — the
same trick the Baby Moses river uses, for the same reason: a repeat the eye can follow reads as a
bug, a mirrored one reads as a crowd. Four copies cover the stage.

Its base is at y=392, below the stage, so the row is cropped by the bottom edge and reads as a
foreground. Jesus walks behind it at y=350; his head and shoulders stay clear of their heads.

## Balance, as built

§17's shape unchanged: 14 taps in 8s / 18 in 7s / 22 in 6s, and the slip penalty none / 1 / 2.
Steady alternation wins **4/4 on every tier** at 230 / 190 / 170ms between taps — comfortably
slower than a child mashing. Mashing one side for a whole round reaches at most one step and loses.

**The slip penalty is the dial that matters**, and it is deliberately not scaled by adaptive
difficulty: it is the character of the tier, not its dosage.

## The input guards, and one honest simplification

§17 asks for two: *"if both halves register within 40ms, count one tap, not two"* and an
auto-clicker floor on tap timestamps. They collapse into one rule — any tap within
`ZT_TAP_MIN_MS` (40ms) of the last is dropped, whichever side it is on. Keeping a 40ms
opposite-side rule *and* a separate 50ms global floor would make the first one dead code, because
the global floor always fires first. 40ms is a ceiling of 25 taps/second; HARD asks for 3.7.

Measured: two halves in the same frame → 1 step. The same two, spaced out → 2.

## `targetTaps` and adaptive difficulty

§17 says the key is named so adaptive difficulty scales it *"for free"*. It never did —
`getAdjustedConfig` has never touched `targetTaps`, and `walkAroundJericho`'s own config comment
makes the identical claim about itself. `wrestleAngel` carries the key too.

Scaling it by key name would quietly re-balance two games that shipped and were tuned without it,
so **the opt-in is per game**: `const scalesTaps = configKey === 'zacchaeus'`. Measured —
Zacchaeus 18 → 19 on a win streak and → 13 after four losses, rounded to whole taps; Wrestle 20 and
Jericho 16 unchanged in every case. If those two should get it, add them there and re-run their
harnesses.

## One thing this build learned the hard way

**Phaser ignores synthetic `PointerEvent`s.** Dispatching one on the canvas fires a raw DOM
listener but Phaser's input manager never sees it — measured `raw 1, phaser 0, steps 0`, against
`raw 1, phaser 1, steps 1` for a real CDP click. Every tap in this game's harness goes through
`page.mouse`, which costs a round trip and is the only thing that proves the real path. A round is
at most 22 taps, so the budget is irrelevant.

This also invalidated part of the Peter Walks on Water harness, which used synthetic moves to
follow a drifting target and was in fact measuring a stationary finger. See that game's notes.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets. All
  seven sprites came out as a single blob; the crowd strip left one stray magenta pixel.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- Falling leaves, the "whoops!" pop and the slip shake are **Phaser effects, not sprites**.
- Backdrop scrim **0.69**, computed from the plate's measured luminance (0.5804) for 4.51:1 white
  text — not estimated. An earlier guess of 0.79 was wrong and was corrected against the formula.
