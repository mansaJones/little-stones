# Joseph's Coat of Many Colors — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §18.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 18.
Code: `src/games/JosephCoatGame.js`.
Build script: `key_joseph.py` (re-run it if any plate is redrawn — do not nudge the numbers by eye).

Four source plates in, fifteen files out. Every band of the coat is a separate mask, which is what
lets §18 tint the stripes at runtime instead of generating a plate per colour combination.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | The tent interior. Trimmed 2576×1438 → 2506×1393, aspect 1.799 → resized, no crop. |
| `joseph-base.png` | 205×460 | Standing, coat plain cream. Displays at 212px tall. |
| `joseph-base-stripe-1..5.png` | 205×460 | Five band masks, same frame as the base. |
| `joseph-twirl.png` | 377×460 | Twirling, arms out, skirt flared. Also 212px tall, so he is the same size. |
| `joseph-twirl-stripe-1..5.png` | 377×460 | Five band masks for the twirl pose. |
| `dye-pot.png` | 150×146 | Clay pot. Displays at 60px wide. Never tinted. |
| `dye-liquid.png` | 150×146 | The surface inside the mouth — 7.8% of the pot. This is the part that takes the colour. |

## The stripe masks, which Scene 18 said to cut by hand

Scene 18's instruction:

> flood-fill each band in an image editor to export five masks aligned to the base sprite.
> `key_sprites.py` won't do this for you; budget about 15 minutes once.

It is scriptable, and scripting it is better than fifteen minutes of clicking, because it re-runs
when a plate changes and because it can be *checked*. `key_joseph.py` does it in four steps:

1. White, near-neutral pixels inside the keyed sprite are the coat. The bold black band outlines cut
   them into components under 4-connectivity.
2. Components merge by **Y-overlap IoU > 0.5**, not by distance between midpoints. The coat has a
   vertical centre seam as well as horizontal band lines, so every torso band arrives as a left half
   and a right half; those overlap almost perfectly in Y and merge. A sleeve segment sitting between
   two bands overlaps neither enough and stays out of the seeds — which is what we want.
3. The five largest merged groups are the bands. Their extents give the four interior boundaries.
4. Each mask is then **every coat pixel inside that band's Y range**, so the sleeves get sliced by
   the same horizontal lines as the torso. That is how a striped garment actually works, and it is
   better than trying to pair each sleeve segment with a torso band.

```
coat base band rows  [(415,526) (523,630) (625,741) (732,853) (839,949)]  of 1076
twirl     band rows  [(698,942) (805,1092) (1033,1305) (1210,1586) (1340,1745)]  of 2048
coverage             144648 / 144648 px  (100.0%)   and   830884 / 830884 px  (100.0%)
```

The eyes are white too, and on the base plate they are 6410px against a smallest band of 8099px —
far too close to filter by area. They are excluded **by position**: everything above the topmost
band is not coat.

Masks are pure white with the band's alpha, because Phaser's `setTint()` *multiplies*. Tint a
cream-coloured mask and every colour comes out muddy.

Verified in the harness, off the opaque pixels rather than the sprite rectangles (all five masks are
full-frame images, so `getBounds()` is identical for all of them by construction — that is the
point of them):

```
base  opaque rows  1:174..223  2:223..269  3:269..318  4:318..367  5:367..413   seams 0,0,0,0
twirl opaque rows  1:151..193  2:192..238  3:238..285  4:284..334  5:334..402   seams -1,0,-1,0
```

The twirl's two 1px overlaps are resampling, not a bad cut: the source rows are strictly disjoint,
but 1745px downscales to 460px, so ~3.8 source rows land in each output row and a boundary falling
mid-row leaves alpha on both sides. The lower band is created later and draws on top, so that row
simply takes its colour. Invisible at 212px.

## Two glyphs are not the ones §18 names

§18 asks for *"dot, star, heart, wave, square, moon"*. Shipped: **dot ● star ★ heart ♥ triangle ▲
square ■ diamond ◆**. Wave and moon have no glyph that renders reliably across the platform fonts
this build can count on, and a missing glyph is a tofu box — which on this game of all games is a
hard fail, because the symbol is the *entire* accessibility story.

The harness asserts every glyph rendered at a plausible width (4–40px) rather than trusting that it
did. Measured: 15, 21, 15, 22, 15, 18.

The substitutes keep what matters — six shapes distinguishable by silhouette alone, nothing that
reads only as a colour:

| pot | colour | symbol | note |
|---|---|---|---|
| 0 | `#E8533A` | ● dot | C5 523.25 |
| 1 | `#4A90E2` | ★ star | D5 587.33 |
| 2 | `#F5C33B` | ♥ heart | E5 659.25 |
| 3 | `#5FBF77` | ▲ triangle | F5 698.46 |
| 4 | `#9B6FD1` | ■ square | G5 784.00 |
| 5 | `#E55FA3` | ◆ diamond | A5 880.00 |

The notes are carried on each dye and go unused — **there is still no audio anywhere in this
build.** They are recorded here so the ratios are already decided when sound arrives.

## "The coat is complete" is load-bearing

§18's success line is *"The coat is complete, Joseph twirls."* EASY answers 3 of the coat's 5 bands
and MEDIUM 4, so carrying across only the answered ones twirls a coat still two-fifths cream at the
one moment a child is being told it is beautiful.

On a win the leftover bands fill with dyes the pattern did **not** use, preferring ones that had a
pot on screen this round, fading in 170ms apart behind the answered ones. HARD needs no fillers.
Measured — easy fills 2, medium 1, hard 0, and no filler ever repeats a colour already on the coat.

## Measurements off the plate

```
rug top        stage y 295   ->  JC_FLOOR = 300   (his feet)
Joseph         212px tall, both poses, so the twirl does not jump in size
pots           60px wide, 18px apart, feet at y 372, centred as a row
scrim          0.70   from the plate's measured luminance 0.5830, for 4.51:1 white text
```

The pot row is centred and re-laid-out per tier, so 4 / 5 / 6 pots all sit symmetrically. Hit areas
are measured in the harness on a widened canvas (852×393, +73 stage offset) and on a tall one
(1194×834, +46), because the stage offset is applied by the camera and a hit area that forgets it
lands 73px off — the bug that made Peter unplayable.

## The timing, and why it is not on `delayedCall`

§18: *"Use the clamped game clock for the playback timing as well as the answer timer, so a
throttled tab doesn't desync the playback from the sound."* `stepPlayback(dt)` accumulates `playT`
off `update()`'s clamped dt; the lit band is `floor(playT / playbackStep)`. A backgrounded tab slows
the playback and the answer clock together, and the pattern a child sees is always the pattern the
game is waiting for.

Each band is lit for `JC_FLASH_FRAC` (0.72) of its step and dark for the rest. **That gap is the
whole difficulty of HARD**, where colours may repeat: without it "red red" is one long flash instead
of two. Measured through a full HARD playback — exactly one band lit per step, and nothing lit at
the tail of any of them.

`beginAnswer()` sets `timeRemaining = timeLimit` outright, so watching is free however long it took.
Measured: a 2.25s playback leaves 7.93 of 8s.

## One thing about the plates themselves

**Joseph's skin is lavender.** `rgb(162,174,234)` on the forehead, cheeks, hands and feet, in the
source plate as delivered — this is not keying damage and not spill suppression, which only touches
a 2px rim. Both poses match, so he is at least consistently lavender. Re-prompt Scene 18 if that was
not the intent; nothing in the code needs to change.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets.
- The backdrop is trimmed with an `INSET = 10` bite *inward* past the magenta bounding box. The
  exact box leaves a pink hairline along the top-left and right of the stage: the border's inner
  edge is anti-aliased and the magenta test needs a saturated pixel, so the blended ones slip
  through it.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- The pot's scale-up on a flash, the paint fade and the twirl wobble are **Phaser tweens, not
  sprites**.
