# Walk Around Jericho — asset manifest

Gameplay: `biblical_game_design_doc.md` §11 (redesigned 2026-10-05).
Generation prompts: `Art_Plate_Prompts.md` Scene 10 (rewritten for the same redesign).
Code: `src/games/WalkAroundJerichoGame.js`.

All nine plates arrived as one labelled contact sheet and were split out of it.

| File | Panel on the sheet | Notes |
|---|---|---|
| `bg.jpg` | BACKDROP PLATE | 1334×750. The dusty oval path on sand. **The path is the arena** — see below. |
| `cracked.png` | JERICHO_CRACKED | Starting state. The city is already cracked because six days of marching happened before the round opens; Joshua 6 is day seven. |
| `crumbling-1.png` | JERICHO_CRUMBLING (upper) | Swaps in after lap 3. |
| `crumbling-2.png` | JERICHO_CRUMBLING (lower) | Swaps in after lap 6. |
| `fallen.png` | JERICHO_FALLEN | The win. |
| `phalanx.png` | PHALANX | Four soldiers as ONE sprite, drawn **facing LEFT**; the scene sets `flipX` when moving right. They are a unit, so there is no formation to break. |
| `rock.png` | PATH_ROCK | HARD only. Two of them, on the path. |
| `horn-ready.png` | HORN_READY | Phase two, between taps. |
| `horn-blow.png` | HORN_BLOW | Phase two, on each tap. |

## The march path

`LJ_PATH = { cx: 332, cy: 176, rx: 262, ry: 118 }`, **measured off `bg.jpg`**, not chosen. Method:
classify the plate into path / sand (the path is the only dusty-rose region), keep the largest blob
so the palm trees and bushes do not count, then take the ellipse midway between the ring's inner and
outer edges. All 240 sampled points land on the path.

**If the backdrop is ever redrawn, re-run that measurement.** Do not nudge the numbers by eye.

Two constraints the layout has to hold, both verified by the test harness:

- **The city must not hide the phalanx.** The city's top edge is at y=77 and the top of the march is
  at y=58, so the phalanx passes above it. Widening the city past about 270px breaks that.
- **The phalanx is drawn in front of the city on the near half of the ring and behind it on the far
  half.** Sorting by feet-y instead looks right until the lower arc, where the phalanx's feet are
  still above the city's base line and it slides behind walls it is clearly walking in front of.

The phalanx also scales from 76px at the near side down to 76 × 0.76 at the far side. That is the
design doc's optional depth cue, but it earns its keep for a second reason: the top of the march is
y=58, so anything taller than 58px drawn at full size has its spear tips clipped off the top of the
stage. Shrinking on the far side buys a bigger, more readable phalanx on the near side — which
matters, because it is the thing the child is steering.

## Processing

- **Captions cut automatically.** Each panel carries a bold black label across its top. The cut
  point is found by locating the first contiguous run of rows carrying ink and cutting just past
  it — the sprite's own outlines also carry ink, but always after a clear gap. Looking for "the
  first clear band" instead cut nothing on the panels whose rect starts at a grid line, because
  there is already a clear band *above* the caption; and the grid rule itself has to be skipped
  first or it gets mistaken for the caption.
- **Keyed by flood fill from the border**, not a colour threshold, plus a strict magenta pass for
  pockets enclosed by a silhouette.
- **Resized with premultiplied alpha**, or the magenta in the transparent pixels averages into the
  edges and the outlines come back as dotted pink lines.
- **Exported at roughly 2.2× display size**, not source resolution — Phaser filters without
  mipmaps, so a plate minified 5× aliases its outline into dashes.

The backdrop crop starts below both the title bar and its peach underline; starting on the bar
leaves an orange band across the top of the stage.
