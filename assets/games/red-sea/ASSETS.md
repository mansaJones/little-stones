# Moses Parts the Red Sea — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §20.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 20.
Code: `src/games/RedSeaGame.js`.
Build scripts: `measure.py` then `key_redsea.py` (re-run both if any plate is redrawn — do not nudge
the numbers by eye).

Seven plates: four square character sheets at 2048² and three landscape plates at 2576×1438.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | Both shores and the dry seabed. **No water** — the sea has to open. |
| `water-top.png` | 1334×556 | The upper wall. Wave curls along its **bottom** edge. |
| `water-bottom.png` | 1334×599 | The lower wall. Curls along its **top** edge. |
| `moses.png` | 218×246 | Near shore, left. Displays 112 tall, staff included. |
| `crosser-a.png` | 101×102 | Bundle on a stick. Displays 45.9 wide. |
| `crosser-b.png` | 83×102 | Mother and child. 37.7 wide. |
| `crosser-c.png` | 106×102 | Goat on a rope. 48.2 wide. |

## Which wall is which, decided by pixels

The two water plates are not labelled, and getting them the wrong way round puts the wave curls
against the screen edges and the flat water against the path — a mistake that is obvious in a
picture and invisible in a diff. They are told apart by **where the row-to-row colour variance
lives**: the outlined swirls break up the flat colour bands, so the curl end has a standard
deviation of ~67 against ~2–6 for the flat end.

```
plate 06   water rows 149..1437   variance top 67.3 / bottom  1.9  ->  curls on TOP    -> water_wall_bottom
plate 07   water rows 168..1216   variance top  6.3 / bottom 67.5  ->  curls on BOTTOM -> water_wall_top
```

## Scene 20's wall-height rule is over-cautious, and the real rule is the opposite

> Each must be tall enough to cover half the screen height **plus the full stroke of the slide**, so
> no gap ever shows at the top or bottom edge.

The stroke does not add to the requirement, it subtracts from it. The walls open by moving **away**
from the path, so a retreating wall pushes its far edge further off screen, not closer. The binding
case is the **closed** sea, where the top wall's curl line sits at the path centre and it must still
reach y=0: half the stage, 187.5px. Both plates clear it with room to spare.

```
water_wall_top     278.0px at stage width   vs 187.5 needed   margin  90.5
water_wall_bottom  299.5px at stage width   vs 187.5 needed   margin 112.0
```

The walls are scaled **once**, to `CANVAS_WIDTH` rather than to the stage — on a widened phone the
stage is a 667px window on a wider canvas, and a sea only as wide as the stage has visible ends.
After that they are only ever translated, which is Scene 20's actual constraint: *"two sprites that
move apart, not scale. Scaling would stretch the outlines."* The harness asserts every wall scale is
byte-identical at every opening.

## The horizon is this game's gap-in-the-wall

Scene 20's backdrop prompt asked for a dry seabed *"across the whole middle of the frame"*. The
delivered plate puts the horizon **59% of the way down**, so the dry sand is only the bottom 41.3%.

That matters because §20 wants the path to reach 50% of the screen height on HARD. It cannot: open
it past the sand and the top wall's edge climbs above the horizon, leaving a band of **sky** between
the water and the ground, which reads as water floating in mid-air.

```
horizon            stage y 220.1
dry seabed         220.1 .. 375   =  154.9px  (41.3% of the stage)
path centre        297.5          (the seabed's centre, NOT the screen's)
widest half-path    77.5px either side, both walls still on screen
```

**So `requiredSpread` measures the finger spread, not the drawn path.** §20 words it as the path
width; read as the gesture, every number in §20 survives — HARD still demands a 187.5px stretch,
which §20 rightly calls *"a real stretch"* on a phone — and the path follows at a gain of 0.70:

```
         finger spread      drawn path
 easy  30%  112.5px   ->      78.8px
 med   40%  150.0px   ->     105.0px
 hard  50%  187.5px   ->     131.3px        (the seabed caps it at 154.9)
```

Measured at full spread: the top wall's edge lands at **220.0** against a horizon of 220.1. Not a
pixel of sky inside the path.

## Two lines of §20 that are load-bearing

**`this.input.addPointer(1)`.** §20 flags it and it is not decoration: Phaser tracks one touch
pointer by default, and without a second one the whole game is a one-finger game on a device with
ten. The harness drives real two-finger input through CDP `Input.dispatchTouchEvent` — Playwright's
own touch API taps one point and cannot express two fingers, and synthetic DOM TouchEvents are
ignored by Phaser outright (measured on Zacchaeus). It then asserts the manager really is carrying
two touch pointers.

**`getWorldPoint`, never `pointer.worldY`.** `worldY` is a cache Phaser refreshes when its input
plugin runs a hit test — that is, on input *events*. This game *polls*, so the cache goes stale and
`worldY` stays equal to the raw canvas y, which is the stage offset out on every widened canvas.
Peter Walks on Water shipped exactly that bug and was unplayable on a 2.17 phone. Measured here on a
+73 phone and a +46 tablet: a 180px finger spread reads as 180px on both.

## Nobody is ever in the water

§20: *"nobody is ever in the water... The water walls can't close on anyone."* So the walls take the
larger of what the fingers ask for and what clears everyone currently out on the sand. Measured: with
two people mid-path, releasing both fingers entirely leaves the sea held at 26.1px half-width, top
edge 271.4 against their heads at 274.5 — and they **stop walking**, which is where the pressure
actually lives.

## Balance, as built

The clock is set by the **last** crosser, not the first: the tail walks
`(RS_END_X - RS_START_X) + (n-1) × RS_QUEUE_GAP`. At the first attempt's 62px/s and a 30px gap that
was 658px — **10.6 seconds before the intro had even finished**, and HARD measured 6/8 at the
buzzer with a perfect hold. At 92px/s over 668px it is 7.3s, leaving roughly two seconds for the
player to find the spread.

Measured with the sea held wide open from the start: easy 4/4 in 5.7s, medium 6/6 in 6.4s, hard 8/8
in 7.0s, all of 10. A sea left shut loses with nobody across, and nobody drowns doing it.

## The crossers walk in two ranks

They are 38–48px wide, so a queue spaced tighter than that overlaps into one lump of elbows — eight
of them at a 28px gap were a single smear. The gap is 34px and they alternate 9px above and below
the walking line, which separates them and reads as a crowd leaving together rather than a conga
line. The clearance clamp above accounts for the lower rank's feet and the upper rank's head.

They are also sized by **person height, not plate height**: `key_redsea.py` finds each plate's body
column from the feet and takes the head top inside it, so all three people stand 46px tall whatever
they are carrying. As it happens all three measured 100% — even the bundle on a stick sits lower
than its owner's head — but the method is what stops the next plate from arriving half a head short.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Characters exported at roughly **2.2× display size**; the walls at 1334 wide, the shared 2× plate
  width.
- Backdrop resized straight to 1334×750 (aspect 1.791 against the stage's 1.779, under a percent).
- The gold path glow and the arrival bob are **Phaser effects, not sprites**.
- Backdrop scrim **0.68**, computed from the plate's measured luminance (0.5798) for 4.5:1 white
  text — not estimated.
- There is still **no audio anywhere in this build**.
