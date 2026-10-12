# House on Rock vs Sand — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §7.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 9.
Code: `src/games/HouseOnRockGame.js`.

Both plates arrived as one labelled contact sheet (2752×1536) and were split out of it.

| File | Panel on the sheet | Notes |
|---|---|---|
| `bg.jpg` | BACKDROP PLATE | 1334×750. The split landscape. Cropped — see below. |
| `house.png` | HOUSE SPRITE | 146×150. The only moving part in the scene. Displays at 66px wide. |

## The backdrop crop

The backdrop panel is **1972×1386, aspect 1.42**, against a 16:9 stage. It is cropped
**vertically and centred**, dropping 138 rows top and bottom:

- Keeping the bottom crushes the sky down to nothing, and the sky is where the storm gathers and
  where the house floats before it is placed.
- Keeping the top loses the floodwater creeping up the bottom-right corner, which is the whole
  reason the sand is a bad idea.

Unlike the He Must Increase plate this one is **downscaled** (0.68×), so it is sharp.

## Layout, measured off `bg.jpg`

Everything below was read off the plate, not chosen. **If the backdrop is ever redrawn, re-measure
rather than nudging these by eye.**

| What | Value | How it was found |
|---|---|---|
| Storm seam | `x = 333` | Largest colour step across the sky band. It lands on the exact centre of the plate, which is also where rock ground becomes sand. |
| Rock plateau | `x 8…238`, surface `y 134 → 150` | First non-sky rock row per column. The plateau is **not level** — it drops 16px left to right, and the house follows that slope so it looks planted rather than hovering. |
| Sand | `x 345…648`, band `y 168…358` | Sand's top edge wanders between y=175 and y=192 across the right half, so the landing band is generous. Landing on sand is supposed to be the easy mistake, not a precision feat. |
| Floodwater | from `y≈352` at x=480 up to `y≈278` at x=655 | Inside the sand zone, deliberately — dropping the house in the flood is still dropping it on sand. |

**The dead gap is deliberate.** Between the rock's right face (x=238) and the seam (x=333) is plain
brown ground that is neither foundation. That leaves ~95px — 140px between the actual drop zones —
where a stray finger lands on nothing and the house springs back. A six-year-old aiming for the
rock should not be able to clip the sand.

## Processing

- **Keyed by flood fill from the border**, not a colour threshold, plus a strict magenta pass for
  pockets enclosed by a silhouette.
- **Resized with premultiplied alpha**, or the magenta in the transparent pixels averages into the
  edges and the outline comes back as a dotted pink line.
- The sprite panel also carries a small decorative sparkle, so the house is taken as the single
  largest opaque blob rather than everything that is not background.

## Balance, as built

Measured with an in-page bot — the pointer path is driven through the scene's own handlers, because
a bot built on CDP round trips measures the harness rather than the game against a 3-second clock.
Win rate out of 6, by how long the player dithers before grabbing the house:

| Hesitation | EASY (4s, labels) | MEDIUM (3s, no labels) | HARD (3s, wind) |
|---|---|---|---|
| 0 ms | 6 | 6 | 6 |
| 600 ms | 6 | 6 | 6 |
| 900 ms | 6 | 6 | 4 |
| 1200 ms | 6 | 6 | 0 |
| 1600 ms | 6 | 6 | 0 |

EASY and MEDIUM absorb well over a second of dithering; HARD falls off a cliff past about a second,
because every moment the house is not held is a moment the wind is carrying it toward the sand.
Difficulty numbers in `gameConfig.js` are unchanged.

What the bot **cannot** measure is MEDIUM's actual difficulty, which is reading the scene without
labels. The bot always knows which side the rock is on.

Three things a tester should know:

- **HARD's wind was completely dead before this.** The old build gated it on
  `this.difficulty === 2`, but `difficulty` is a string (`'easy'|'medium'|'hard'`), so the test
  never passed and HARD played identically to MEDIUM.
- **The house is sprung toward the finger on HARD, not pinned to it.** Pinned, a steady wind is
  invisible for as long as the house is held, which is most of the round. Sprung, the wind holds it
  a constant ~22px downwind and the player has to aim past the rock. Against a 230px plateau that
  is felt but forgiving — a bot aiming straight at the rock with no upwind lead still wins 6/6.
- **MEDIUM cannot do what §7 asks.** §7 wants the two foundations to "look similar" on MEDIUM, but
  the delivered plate is a grey rock beside golden sand and no runtime trick makes those match. So
  MEDIUM's step up is losing the labels and a second off the clock. The rain falling on the sand
  side only is the standing clue §7 asks for, and it is baked into the plate.

§7 also asks for "storm clouds gather as the timer counts down". The clouds are baked in, so that
beat is carried by the whole scene darkening toward a slate overlay as the clock runs out.
