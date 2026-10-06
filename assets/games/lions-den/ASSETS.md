# Daniel in the Lions' Den — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §5. Code: `src/games/DanielLionsDenGame.js`.

| File | Source | Notes |
|---|---|---|
| `bg.jpg` | den plate | 1334×750. **Cropped to the lower 55% of the delivered plate** — see below. |
| `daniel.png` | character sheet (left figure) | Praying, facing the viewer. One pose only; he has no panic state and should not get one. |
| `lion.png` | character sheet (right figure) | Drawn **facing LEFT**. The scene sets `flipX` when a lion moves right. |

The angel on the win beat is **borrowed from `assets/games/fiery-furnace/angel.png`**. Daniel 6:22
is the same errand as Daniel 3:25 and it is the same style lock, so rather than commission a second
angel the scene loads that file by its own path. It is optional — a missing file costs the win beat
nothing — but it is a cross-game dependency: moving or redrawing the Fiery Furnace angel changes
this scene too. A purpose-drawn den angel would be better; this is a stand-in that happens to be
real art.

## The crop, and why the arena is what it is

The delivered plate puts the sand floor in the **bottom 20% of the frame**: a 75px band on a 375px
stage. With four lions and Daniel in it, that is not a dodging game, it is a queue. The plate is
cropped to its lower 55%, which keeps the curved wall reading as a round pit while making the floor
about three times as deep.

The floor is an **ellipse**, not a rectangle, and that ellipse is the arena. Everything on it is
positioned by its feet and clamped so its feet stay inside — clamping a bounding box instead lets a
lion stand on the wall in the corners. The ellipse was measured, not chosen: classify the plate
into sand / not-sand (sand is the only warm-orange region; the wall is dusty rose and periwinkle),
fit an ellipse, then check that an inset of 8px lands on sand at every angle. Current fit:

    cx 333   cy 254   rx 329   ry 116        (inset 8)

**If the backdrop is re-cropped or replaced, re-run that measurement and update `LD_FLOOR`.**

## Processing

Same pipeline as the Lost Sheep plates:

- **Keyed by flood fill from the border**, not a colour threshold — a global magenta key eats the
  pink blush and the lion's pink ears and nose. Plus a strict magenta test for pockets enclosed by
  a silhouette, which the border fill cannot reach.
- **Resized with premultiplied alpha**, or the magenta still sitting in the transparent pixels
  averages into the edge and the bold outline comes back as a dotted pink line.
- **Exported at roughly 2.2× display size** (165px), not source resolution. Daniel shows at ~30px
  wide and the lion at 56px; a 340px plate minified 5× aliases its outline into dashes, because
  Phaser filters without mipmaps.

## Sprite size is a balance dial

What decides this game is how many body-widths of gap there are to slip through, so shrinking the
cast is the same lever as enlarging the pit. Measured with a near-optimal dodging bot, 12–14 rounds
per tier:

| arena `ry` | Daniel / lion | easy | medium |
|---|---|---|---|
| 96 | 72 / 70 | 9/14 | 4/14 |
| 116 | 72 / 70 | 9/12 | 3/12 |
| 116 | 58 / 56 | **12/14** | 5/14 |

The last row shipped. Changing either sprite size changes the difficulty; change the collision
radii with it.
