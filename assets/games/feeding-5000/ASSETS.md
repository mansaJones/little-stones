# Feeding the 5,000 — asset manifest

Gameplay: `docs/biblical_game_design_doc.md` §21.
Generation prompts: `docs/Art_Plate_Prompts.md` Scene 21.
Code: `src/games/FeedingFiveThousandGame.js`.
Build scripts: `measure.py` then `key_feed5k.py` (re-run both if any plate is redrawn — do not nudge
the numbers by eye).

Seven plates: six square character sheets at 2048² and one landscape hillside at 2576×1438.

| File | Size | Notes |
|---|---|---|
| `bg.jpg` | 1334×750 | The hillside. The crowd is **painted into it** at the left and right edges. |
| `jesus.png` | 83×136 | On the rock at the crest. Displays 62 tall. |
| `bread.png` | 57×47 | Displays 26 wide. |
| `fish.png` | 57×41 | Displays 26 wide. |
| `basket-empty.png` | 153×211 | The boy. Displays 96 tall. |
| `basket-half.png` | 153×211 | Same boy, same scale. |
| `basket-full.png` | 153×211 | Same again — the three never differ in size, so he does not jump. |

## Which boy plate is which, decided by pixels

Three of the seven plates are the same boy holding the same basket, and a mislabelled fill state is
the kind of bug nobody spots in a diff. A naive warm-pixel count scored all three at **68%** — the
basket's cream weave reads exactly like bread. The **fish** is the signal: its dusty pink appears
nowhere else on the plate, and the reference colour is taken from the fish plate itself rather than
typed in.

```
fish reference colour  [217, 151, 158]      counted inside the basket's own box
  06_15e4e42e    13,607 px   ->  basket-empty.png
  01_792c4dd6    48,225 px   ->  basket-half.png
  07_a566ce16    61,715 px   ->  basket-full.png
```

The basket rim sits at **0.662 of the sprite height**, which puts the catch line at stage y 333.5.

## The open grass is a wedge, so the food falls from Jesus

Scene 21 asked to keep the middle of the frame open *"from the top rock down to the bottom edge"*,
and it is — but the hill's crest slopes away from the rock with the crowd sitting on it, so the
clear grass is a **wedge**, narrow at the top:

```
   y  82.5    clear to 110.7px either side of centre
   y 112.5    187.5
   y 150.0    272.8
   y 206.3    the full width
```

§21 says *"items spawn across the width"*. Taken literally at the top of the frame that drops loaves
on the audience. So items fall **from Jesus' hands and fan outward**, which is what the story says
anyway and which keeps every path inside the wedge by construction. Each item's landing x is chosen
first and its horizontal speed follows, so where the basket needs to be is a decision rather than an
emergent accident — and §21's 0.5s rule becomes enforceable. Measured on the two extreme aims:

```
aimed at x=26     y82.5: 15.7/110.7   y150: 87.2/272.8   y262.5: 206.3/333.4
aimed at x=641    y82.5: 67.7/110.7   y150:139.2/272.8   y262.5: 258.3/333.4
```

## The spawn guarantee is measured against the usable window

> Spawn guarantee: spawn rate × time ≥ 1.6 × the catch target, so the target is always reachable.

Against the **whole** round that promise is false, because an item released later than one fall-time
before the buzzer can never be caught. At EASY the fall takes 1.94s of the 10, so counting the full
round gives a real ratio of **1.29** against the promised 1.6. The rate is derived against
`timeLimit − fallTime` instead:

```
 easy    fall 1.94s   8.06s usable   one every 0.630s  -> 12.8 items for a target of 8
 medium  fall 1.53s   8.47s usable   one every 0.441s  -> 19.2 items for 12
 hard    fall 1.21s   8.79s usable   one every 0.366s  -> 24.0 items for 15
```

There is deliberately no `spawnRate` config key: §21 names exactly four, and the rate is a
consequence of them.

**"Never two at the same x within 0.5s"** is enforced on the landing x, with "the same x" meaning
within a basket's reach (70px). Measured over 400 spawns at HARD's interval: 399 pairs fell inside
the 0.5s window, the closest was exactly 70.0px apart, and they still spread 611px across a 667px
stage.

## The basket's speed cap, swept

§21 asks for a cap — *"same reasoning as Samson: without it, catching is free"* — but does not say
what it is. Consecutive landings are on average a third of the stage apart (~205px) and HARD
releases one every 0.366s, so merely keeping up with the average pair needs 560px/s.

Swept against a player who always chases the soonest item it can actually reach, 6 rounds a cell:

```
   440px/s   hard  50%  (14.2 of 15)
   470px/s   hard  67%  (14.7)
   500px/s   hard  67%  (14.5)
   520px/s   hard 100%
   600px/s   hard 100%        <- shipped
```

The knee is around 510 **for a perfect player**, which is exactly the wrong place to sit. 600 crosses
the stage in 1.1s: clear of the knee, and still far slower than a real thumb flick (1300px/s+), so
the cap constrains rather than decorates.

A first attempt at the simulated player chased whichever item was simply *lowest*. That plays
terribly — it lunges at things it cannot reach, arrives late, and is then out of position for the
next one as well — and measured **0/6 on HARD** where a competent player gets 6/6. The simulation
was the bug, not the game; worth remembering before re-tuning anything off a model of a player.

## One real fairness bug, found by a 1.7px discrepancy

An item was judged where the frame step happened to leave it, which is **past** the catch line. Its
x is a function of how far it has fallen, so testing it there tests it up to **2.6px beyond where it
was aimed** — an error that grows with fall speed, so it was worst on HARD. Items are now settled
onto the line before the reach test.

## Not in the art, and not faked

§21's miss feedback is *"a crowd member picks it up and munches. Every miss still feeds someone."*
**There is no crowd-member sprite.** Scene 21's layer table has four layers and none of them is a
crowd figure — the crowd is painted into the backdrop at the far left and right, nowhere near where
anything lands. A miss bounces once, puffs a few crumbs and fades. If a pick-up sprite is ever
generated, that is where it goes.

The catch pop, the basket squash and the crumb puff are **Phaser effects, not sprites**. There is
still **no audio anywhere in this build**.

## Processing

- **Keyed by flood fill from the border**, plus a strict magenta pass for enclosed pockets.
- **Resized with premultiplied alpha**, or the bold outlines come back as dotted pink lines.
- Exported at roughly **2.2× display size**.
- Backdrop resized straight to 1334×750 (aspect 1.791 against the stage's 1.779, under a percent).
- Backdrop scrim **0.65**, computed from the plate's measured luminance (0.5179) for 4.5:1 white
  text — not estimated.
