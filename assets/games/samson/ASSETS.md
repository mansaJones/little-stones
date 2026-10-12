# Samson and the Jawbone — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §14.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 14.
Code: `src/games/SamsonJawboneGame.js`.

Eleven separate plates, not a contact sheet — so no grid to find and no captions to cut.

| File | Pose | Notes |
|---|---|---|
| `bg.jpg` | backdrop | 1334×750. The open hillside at Lehi. |
| `samson-swing-back.png` | jawbone wound up behind the head | Profile facing LEFT, mirrored by travel. |
| `samson-swing-fwd.png` | jawbone swung forward, arm extended | Alternates with the above every 170ms. |
| `samson-victory.png` | jawbone overhead, both hands | The win beat. |
| `samson-ropes.png` | bound, no jawbone | Intro only — the Judges 15:14 beat. |
| `philistine-a.png` / `-run` / `-bonked` | mint skin, mustard tunic | |
| `philistine-b.png` / `-run` / `-bonked` | lavender skin, dusty rose tunic | |

Plates were matched to the spec by palette and prop, not by filename: Samson is the only periwinkle
figure, the only one with long hair and the only one holding a jawbone; `philistine_a` is the mint
and mustard one, `_b` the lavender and dusty rose one.

**The backdrop needed no crop.** It arrived at 2576×1438 — aspect 1.791 against the stage's 1.778 —
which makes it the first plate in the roster that is simply resized. It is also a downscale (0.52×),
so it is sharp. Every other backdrop so far has been cropped, and two were upscaled.

## The field, measured off `bg.jpg`

```
SJ_FIELD = { x0: 44, x1: 620, y0: 118, y1: 344 }     // FEET positions
```

The largest rock-free, grass-covered rectangle on the plate is **x 40…622, y 100…346** — found by
classifying the plate into grass and rock and scanning outward from the centre. The art doc promised
rocks "pushed to the very edges and corners"; that is that promise, checked rather than assumed.

The top edge is pulled down from 100 to 118 because the hill line is not level: grass starts at y=39
at the left edge but dips to y=70 in the middle of the frame. At y=118 a figure standing on the back
edge still has its head on grass rather than up in the lavender hills.

**If the backdrop is ever redrawn, re-run that measurement.** Do not nudge these by eye.

One known cosmetic overlap: the bottom-right rocks reach about x=565, y=320, which is just inside the
field. A Philistine cornered there stands in front of them. Depth sorting handles it and it reads as
a character walking past a rock, so the field was not shrunk to avoid it.

## Movement, and the two numbers that are not in config

`SJ_SAMSON_SPEED = 265` px/s and `SJ_FLEE_RADIUS = 115` are module constants, not config, because
§14 holds both constant across tiers on purpose. Flee speed is the only difficulty dial:

| Tier | fleeSpeed | vs Samson's cap | targetBonks | onField |
|---|---|---|---|---|
| EASY | 115 | 0.43× | 5 | 3 |
| MEDIUM | 185 | 0.70× | 7 | 4 |
| HARD | 240 | 0.91× | 9 | 4 |

Samson rides **45px above the finger** (`SJ_GRAB_DY`), exactly as the Fiery Furnace angel does, for
the same reason: there is no cursor on touch, and at 375px of stage height a sprite under the thumb
hides both itself and the thing it is about to reach.

## Balance, as built

Measured with a greedy chaser driven from inside the page — a bot built on CDP round trips measures
the harness, not the game, against an 8-second clock.

**All three tiers: 8/8 wins.** Config numbers are unchanged.

That took one bug fix to reach, and it is worth recording because it nearly became a config change:

> HARD first measured **4/8**, consistently falling one bonk short. The temptation was to lower the
> flee speed, which is exactly what §14 suggests. The real cause was **stacking**. Two Philistines
> fleeing into the same corner both get clamped to the same corner pixel, so the clamp overrode the
> separation force every frame and they ended up at a distance of *exactly zero* — at which point a
> push computed from the vector between them has no direction to push along, and they stayed welded
> together for the rest of the round. Closest-pair distance measured 0.0px. A welded pair is one
> target, not two, so the field was effectively short-staffed. Fixing it with a hard positional
> floor applied *after* the clamp (`unstack()`) took HARD from 4/8 to 8/8 and the closest pair from
> 0.0px to 29.7px.

### HARD's flee speed — §14's open question

§14 flags it: *"Untested: whether HARD's flee speed is fun or maddening for the 6-8 group. If it's
maddening, lower the flee speed before touching the target."* Two sweeps were run against a bot
given an artificial tracking lag:

- **Flee speed is not the lever.** Sweeping HARD from 240 down to 195 (0.91× → 0.74×) moved a
  lagged player from 0/5 to 0/5. It only helped the already-accurate bot, 3/5 → 5/5.
- **Nor is the target.** Holding fleeSpeed at 240 and dropping targetBonks 9 → 6 reached only 1/5.

The honest reading is that **the lag model is wrong for this mechanic**, not that the game is
impossible. The bot re-aims in discrete 250ms steps at where the target *was*; against something
running directly away from you that can never close, in a way it could against the static house in
House on Rock. So the numbers above are not evidence that HARD is too hard — they are evidence that
this harness cannot answer the question.

**HARD still needs a human playtest.** The config was left exactly as §14 specifies, and if it does
turn out to be maddening, the sweeps above say neither obvious dial will rescue it on its own.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for pockets a silhouette
  encloses — a global magenta key eats the pink blush and the dusty-rose tunic.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**: Samson at 150px for a 92px frame, Philistines at 120px
  for a 54px frame.
- Bonk puffs, spinning stars and the "!" pop are **Phaser effects, not sprites**, per the art doc —
  soft-edged effects fringe badly when keyed off magenta.
