# Peter Walks on Water — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §16.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 16.
Code: `src/games/PeterWaterGame.js`.
Build script: `key_peter.py` (re-run it if any plate is redrawn — do not nudge the numbers by eye).

Nine files arrived; two of them are the same backdrop byte for byte, so there are eight assets.
All five of Scene 16's layers are covered.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | The Sea of Galilee at twilight. Aspect 1.791 against the stage's 1.778 — resized, no crop. |
| `peter-walk.png` | 131×185 | Profile facing RIGHT. Displays at 84px tall. |
| `peter-sink.png` | 153×185 | Arm up, small "oh!". |
| `peter-rescued.png` | 171×185 | Hands clasped with someone off-frame right. |
| `jesus-water.png` | 119×212 | Standing, hand out. Displays at 96px. **Drawn flipped** — see below. |
| `jesus-reach.png` | 116×212 | Leaning to lift. Also flipped. |
| `fishing-boat.png` | 330×269 | Left edge, static, two disciples watching. |
| `wave-sweep.png` | 530×287 | HARD only. Displays 240×130, which fully contains Jesus' 54×96. |

**Both Jesus plates reach toward the viewer's right.** §16 puts him at the right of the lane facing
*left* down it, so both are drawn with `setFlipX(true)` (`PW_JESUS_FLIP`). Without it his hand
reaches off the edge of the screen and Peter walks at his back.

## The sea, measured off the plate

Scene 16 asked for *"a clear horizontal band across the middle of the frame... where figures will
walk on top of the water"*. What arrived has wave crests running from the middle all the way to the
bottom edge, and **no clear band at all**. So the lane is measured off the crests themselves: count
the long black outlines per row and keep the bands that run the full plate width.

```
crest rows, on a 375px stage:  196  225  253  283  315  340  353
PW_HORIZON = 196      // the first crest; sky above it
PW_LANE    = 253      // the third; where Peter and Jesus stand
```

The third crest is the one that works. A figure standing there has **feet among the waves and head
against the sky** — verified: Peter spans y 169…253, straddling the horizon at 196. Put him on the
horizon instead and he reads as being *behind* the sea rather than on it.

This is the second scene in a row where the backdrop prompt's "keep a clear band" instruction did
not survive generation (Baby Moses was the first). Measuring the delivered plate rather than
trusting the prompt is now the rule, not the exception.

## Layout

| | x | notes |
|---|---|---|
| boat | 78 | waterline at lane + 10 |
| Peter start | 118 | stepping off the boat's right side |
| Peter end | 540 | close enough to take a hand; he never walks *through* Jesus |
| Jesus | 585 | drifts vertically ±30px on MEDIUM and HARD |

## Balance, as built

§16's shape, unchanged: a **5-second walk inside an 8-second round** at every tier, so the slack is
3 seconds of not holding. Difficulty is one dial — Jesus' drift speed, none / 1.1 / 2.0 rad·s⁻¹
against a fixed 30px amplitude. `sinkRate` is flat at 0.55/s, so a finger that comes off entirely
takes **1.97s** to reach the rescue: inside the slack, so letting go costs rather than ends.

A bot that keeps a real pointer on him wins **4/4 on every tier**, never losing grip for a single
frame. On HARD it spent 20 frames completely hidden behind a wave and held him through all 20 —
which is the mechanic §16 wants: *"keep their finger where Jesus IS, not where they can see him."*

## What §16's implementation notes bought

That section is a test list in disguise, and two of its warnings were load-bearing.

**The hit zone** is 1.5× his sprite, measured: 53.9×96 → 80.8×144, centred on his body rather than
his feet, and it tracks him as he drifts (moved him 40px, zone moved 40.0px).

**The grace window** is 150ms and absorbs everything inside it — 120ms off gives a sink of exactly
0, 140ms likewise, and past it the sink is precisely `sinkRate × ungraced time`.

**Sinking is a crop.** Only the two authored poses are ever on screen; going from half-sunk to
fully sunk changes the crop (139px → 93px of 185) and not the sprite. The waterline stays at y=253
to within a pixel at every depth while his head descends 169 → 190 → 211, which is what makes it
read as sinking rather than as his legs being erased.

> **The bug §16's own advice walked into.** §16 says, correctly, *"Don't rely on `pointerout` for
> touch... Each frame, check `pointer.isDown` and the pointer's distance to Jesus' current
> position."* So this game polls the pointer instead of listening for events — and `pointer.worldX`
> is a **cache that only an input event refreshes**. Nothing refreshed it, so it sat equal to the
> raw canvas x. On a stage-sized canvas those are the same number and everything looks perfect; on
> a 2.17 phone, where the canvas is 73px wider than the stage, **every press landed 73px to the
> left of the child's finger and Peter simply never moved.** `readHold()` now transforms through
> `cameras.main.getWorldPoint()` itself. The harness prints both numbers on every run
> (`cached worldX=657.5  real worldX=585`) so a regression is visible rather than silent.

**`touchcancel`** is handled explicitly rather than trusted to Phaser: a system gesture mid-round
stops the walk and leaves Peter where he was, instead of leaving a round running that nobody is
touching.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets. All
  seven sprites came out as a single blob with zero magenta pixels left.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- The glow, the step splashes, the bubbles and the waterline are **Phaser effects, not sprites**.
  The glow is a Graphics *positioned at* Jesus and drawn at (0,0) — drawing it at his coordinates
  on a Graphics parked at the origin scales about the stage corner the moment anything tweens it.
