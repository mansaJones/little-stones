# Lost Sheep — asset manifest

Generation prompts: `Art_Plate_Prompts.md` Scene 13. Gameplay: `biblical_game_design_doc.md` §13.
Code: `src/games/LostSheepGame.js`.

## What is here

| Art-doc name      | File                   | Status | Notes |
|---|---|---|---|
| backdrop plate    | `bg.jpg`               | **in** | 1334×750. Delivered 2752×1536, resized. |
| `lost_sheep`      | `sheep.png`            | **in** | |
| `hide_bush_a`     | `bush-a.png`           | *missing* | Falls back to `bush-b` **mirrored**. |
| `hide_bush_b`     | `bush-b.png`           | **in** | |
| `hide_rock`       | `rock.png`             | **in** | |
| `shepherd_search` | `shepherd-search.png`  | **in** | Split from the 4-up pose sheet. |
| `shepherd_listen` | `shepherd-listen.png`  | **in** | |
| `shepherd_call`   | `shepherd-call.png`    | **in** | |
| `shepherd_found`  | `shepherd-found.png`   | **in** | |
| `critter_bird`    | `critter-bird.png`     | *missing* | No fallback — the rabbit does all the popping out. |
| `critter_rabbit`  | `critter-rabbit.png`   | **in** | |

Both missing files are drop-in: put them here under those names and the code picks them up on the
next load, with no edit. Nothing breaks while they are absent.

## How these were processed

Source plates arrived as 2048×2048 JPEGs on magenta `#FF00FF`.

- **Keyed by flood fill from the border, not by colour threshold.** The bush has pink flowers and
  every character has pink blush; a global magenta key eats both. Only magenta reachable from the
  edge is background — *plus* a strict magenta test for enclosed pockets, because the inside of the
  halo ring and the gap between a raised arm and the face are not reachable from the edge and came
  back as bright magenta blobs on the first pass.
- **Resized with premultiplied alpha.** Transparent pixels still carry their magenta; a straight
  resize averages that into the sprite's edge and the bold outline returns as a dotted pink line.
  Worst on the bush, whose scalloped edge has the most perimeter.
- **Exported at roughly 2× display size**, not at source resolution. A 400px plate shown at 62px is
  a 6.5× minification, and Phaser filters without mipmaps, so fine outlines alias into dashes.

## Known problems with the delivered plates

**The pose sheet crops the top-row figures.** `SEARCHING` and `LISTENING` run off the bottom of
their quadrants: the robe hems are sliced flat with no outline. Unrecoverable from the source, so
the shepherd is positioned to run off the bottom of the stage, where the cut is out of frame. If
the sheet is regenerated, keep every figure fully inside its own quadrant with margin, and the
shepherd can come back up onto the grass.

**The backdrop was replaced.** The first plate came back with forest down the middle and a shrub
cluster at the right edge, which left one cramped band of usable meadow. The second is the open
pasture the prompt asks for, with the distant sheepfold and the other ninety-nine on the far hill.
`bg.jpg` is that second plate.

**If the backdrop is ever redrawn, re-measure the slot table.** It is not a design choice, it is a
fit to this specific plate: classify the plate into grass / not-grass and keep only positions where
a spot's whole footprint is ≥95% grass. Do not hand-nudge the numbers.

## If you regenerate anything

All sprites: transparent PNG, keyed off magenta `#FF00FF`, figure fully inside the frame with
margin. The four shepherd poses must come back at the **same frame height** — the scene re-derives
the sprite scale from frame height on every pose swap, so mismatched heights make him jump.
