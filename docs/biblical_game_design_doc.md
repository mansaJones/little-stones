# Biblical Mini-Games - Complete Game Design Document
**Version 1.0**  
**Target Platform:** iOS & Android Mobile  
**Target Audience:** Children ages 6-12  
**Tech Stack:** Phaser.js + Capacitor  
**Game Style:** "Dumb Ways to Die" inspired quick-reflex mini-game collection

---

## Table of Contents
1. [Core Game Loop](#core-game-loop)
2. [Mini-Game Specifications](#mini-game-specifications)
3. [Difficulty System](#difficulty-system)
4. [Scoring System](#scoring-system)
5. [Lives & Session Structure](#lives--session-structure)
6. [Educational Integration](#educational-integration)
7. [Progression & Unlocks](#progression--unlocks)
8. [Meta Systems](#meta-systems)
9. [UI/UX Flow](#uiux-flow)
10. [Technical Implementation Notes](#technical-implementation-notes)
11. [Tutorial & Onboarding](#tutorial--onboarding)
12. [Difficulty Balancing & Configuration System](#difficulty-balancing--configuration-system)
13. [Asset Loading Strategy](#asset-loading-strategy)
14. [Error Handling & Recovery](#error-handling--recovery)
15. [Screen Size & Responsive Layout](#screen-size--responsive-layout)

---

## Core Game Loop

### Session Structure: "Challenge Run"

```
START SESSION
├─ Player begins with 3 lives
├─ Random mini-game selected from current level's game pool
├─ Educational story context (3 seconds)
├─ Game instructions (2 seconds)  
├─ Mini-game plays
│  ├─ SUCCESS → Award points, next game
│  └─ FAILURE → Lose 1 life
├─ Repeat until:
│  ├─ Player quits (keeps points earned)
│  └─ OR Lives = 0
│     ├─ Option: Watch ad for +1 life (max 3/session)
│     └─ OR End session
└─ END SESSION
   ├─ Display stats (games played, win rate, points earned, streak)
   ├─ Add points to total score
   ├─ Check achievement unlocks
   └─ Return to home screen
```

### Why This Structure Works:
- **Familiar**: Similar to popular mobile games (Dumb Ways to Die, WarioWare)
- **Replayable**: Random game selection keeps sessions fresh
- **Monetizable**: Ad-for-life creates revenue without paywall
- **Age-appropriate**: Simple enough for 6yo, challenging enough for 12yo
- **Educational**: Brief story context before each game reinforces learning

---

## Mini-Game Specifications

Each mini-game follows this template:

```
GAME NAME
├─ Biblical Reference
├─ Educational Message (2-3 sentences)
├─ Core Mechanic
├─ Win Condition (measurable, clear)
├─ Lose Condition (specific failure states)
├─ Difficulty Parameters (Easy/Medium/Hard)
└─ Feedback (visual, audio, haptic)
```

### 1. WRESTLE THE ANGEL
**Biblical Reference:** Genesis 32:24-26  
**Story Context:** "Jacob wrestled with an angel all night and wouldn't give up. God blessed him for his determination!"

**Core Mechanic:** Tap screen rapidly  
**Visual:** Character wrestling angel, tap counter shows progress

**Win Conditions:**
- **EASY** (Levels 1-3): Tap 15 times in 5 seconds
- **MEDIUM** (Levels 4-6): Tap 20 times in 4 seconds
- **HARD** (Levels 7-10): Tap 25 times in 3 seconds

**Lose Conditions:**
- Fail to reach target taps before timer expires
- Timer runs out

**Progressive Elements:**
- MEDIUM: Angel occasionally "pushes back" requiring double-tap
- HARD: Device must stay level (tilt detection), tilting slows tap counting

**Feedback:**
- Tap counter updates in real-time
- Angel struggles visually with each tap
- Screen shake on each tap
- SUCCESS: Angel blesses player, golden glow effect
- FAILURE: Angel pins player, "Try again!" message

**Implementation Notes:**
- Track tap timestamps to prevent auto-clicker cheating
- Haptic feedback on each tap
- Progressive visual strain on both characters

---

### 2. WATER TO WINE
**Biblical Reference:** John 2:1-11  
**Story Context:** "At a wedding, Jesus performed his first miracle by turning water into wine. Amazing!"

**Core Mechanic:** Swipe screen to change water color from blue to red  
**Visual:** Large jar of water, color gradually shifts with swipes

**Win Conditions:**
- **EASY**: Swipe until water reaches 80-100% red within 6 seconds (each swipe = 10% color change)
- **MEDIUM**: Swipe until water reaches exactly 90-100% red within 5 seconds (each swipe = 8%, requires precision)
- **HARD**: Swipe until water reaches exactly 95-100% red within 4 seconds (each swipe = 6%, color drains 3%/second if not swiping)

**Lose Conditions:**
- EASY: Fail to reach 80% red before timer expires
- MEDIUM/HARD: Overshoot past 100% OR undershoot below threshold OR timer expires

**Progressive Elements:**
- MEDIUM: Tighter target range, smaller swipe increments
- HARD: Color drains over time, must maintain swiping momentum

**Feedback:**
- Color meter shows current percentage
- Water color changes in real-time
- Sparkle effect at target range
- SUCCESS: Wine glows, wedding guests cheer
- FAILURE: Water stays blue/purple, "Almost!" message

**Implementation Notes:**
- Track swipe velocity (faster swipes = larger color change in HARD mode)
- Prevent spam swiping (cooldown between swipes)
- Visual gradient smooth, not stepped

---

### 3. LET THERE BE LIGHT
**Biblical Reference:** Genesis 1:3  
**Story Context:** "God said 'Let there be light' and created light from darkness. He creates everything!"

**Core Mechanic:** Reaction speed - tap light switch when it appears  
**Visual:** Dark room, light switch appears in random position

**Win Conditions:**
- **EASY**: Tap the switch within 2 seconds when it appears (appears in same position each time)
- **MEDIUM**: Tap correct switch among 3 decoys within 1.5 seconds (only 1 works, others labeled wrong)
- **HARD**: Tap sequence of 3 switches in order (Day 1→Day 2→Day 3) within 3 seconds total

**Lose Conditions:**
- EASY: Don't tap within time limit
- MEDIUM: Tap wrong switch OR timeout
- HARD: Tap switches in wrong order OR timeout

**Progressive Elements:**
- MEDIUM: Multiple switches, only one correct (visual indicators help)
- HARD: Sequential switches, must remember order

**Feedback:**
- Timer countdown visible
- Switch glows when tappable
- SUCCESS: Room floods with light, "Let there be light!" text
- FAILURE: Room stays dark, "Too slow!" message

**Implementation Notes:**
- Switch positions randomized but always reachable
- In HARD mode, brief flash shows correct order before dark
- Audio cue when switch becomes tappable

---

### 4. ROLL THE STONE AWAY
**Biblical Reference:** Luke 24:2  
**Story Context:** "When Jesus rose from the dead, the heavy stone was rolled away from the tomb. A miracle!"

**Core Mechanic:** Swipe/drag stone across screen  
**Visual:** Large stone blocking tomb entrance, must roll it aside

**Win Conditions:**
- **EASY**: Swipe stone 80% across screen within 5 seconds (single swipe works)
- **MEDIUM**: Drag stone fully across screen within 4 seconds (requires continuous drag, stone is "heavy")
- **HARD**: Drag stone across while avoiding obstacles (rocks fall, must dodge) within 4 seconds

**Lose Conditions:**
- Stone doesn't reach target position before timer expires
- HARD: Stone hits obstacle 3 times (breaks)

**Progressive Elements:**
- MEDIUM: Requires continuous drag (can't just flick)
- HARD: Falling rocks create obstacles to dodge

**Feedback:**
- Stone moves with finger position
- Progress bar shows distance covered
- Stone has weight/inertia feel (physics-based)
- SUCCESS: Tomb opens, bright light shines out
- FAILURE: Stone rolls back, "Try harder!" message

**Implementation Notes:**
- Use Phaser physics for realistic stone movement
- HARD mode: Obstacle spawn rate increases over time
- Visual indication of stone "weight" (struggles at first)

---

### 5. DANIEL IN THE LIONS' DEN
**Biblical Reference:** Daniel 6  
**Story Context:** "Daniel trusted God even in a den of hungry lions. God kept him safe all night!"

**Core Mechanic:** Drag Daniel to avoid moving lions  
**Visual:** Daniel in center, lions circle/patrol, must avoid contact

**Win Conditions:**
- **EASY**: Survive 5 seconds avoiding 2 slow-moving lions
- **MEDIUM**: Survive 7 seconds avoiding 3 medium-speed lions
- **HARD**: Survive 10 seconds avoiding 4 fast lions with unpredictable patterns

**Lose Conditions:**
- Daniel touches a lion (instant fail)
- Timer runs out before reaching target time = fail

**Progressive Elements:**
- More lions
- Faster lion movement
- Less predictable patterns (HARD mode lions occasionally charge)

**Feedback:**
- Danger zone glows red as lions approach
- Countdown timer visible
- Lions growl when nearby (audio cue)
- SUCCESS: Angel appears, lions lie down
- FAILURE: Lion roars, screen darkens

**Implementation Notes:**
- Lions use pathfinding AI (predictable in EASY, random in HARD)
- Safe zone shrinks slightly over time
- Touch controls responsive, no lag

---

### 6. FIERY FURNACE
**Biblical Reference:** Daniel 3:25  
**Story Context:** "Shadrach, Meshach and Abednego were thrown into the hottest furnace — and God sent a fourth figure to walk with them in the fire."

**Core Mechanic:** Drag the angel around the screen to intercept fireballs before they reach the three boys  
**Visual:** Three boys stand still in the centre of the furnace. Fireballs fly in from both side edges at varied heights. The player controls an angel that blocks them.

> **Redesigned 2026-09-24.** Replaces the original tap-to-stoke heat meter. The old mechanic sat the player in the furnace crew's seat, raising the heat on three children; this one makes them the fourth figure in the fire, which is what Daniel 3:25 describes. The reference moved from 3:23 to 3:25 for the same reason.

**Input Model:** Offset drag — the angel renders roughly 45px above the player's finger, so the thumb never covers the angel or the point of impact. There is no cursor on touch, and at 375px of screen height a direct-under-finger angel hides most of the action.

**Win Conditions:** every tier is an 8-second round. The only thing that changes is how many
fireballs are in the air at once — speed, angel radius, angel speed and round length are identical
across all three, so crowding is the difficulty.
- **EASY**: Survive 8 seconds with at most **2** fireballs on screen. Up to 2 may get through.
- **MEDIUM**: Survive 8 seconds with at most **4** on screen. Up to 1 may get through.
- **HARD**: Survive 8 seconds with at most **6** on screen. None may get through.

**Lose Conditions:**
- More than the allowed number of fireballs reach the boys before the timer ends
- Note: the boys are never harmed and never flinch (this is the miracle). A hit costs the player, not the characters.

**Progressive Elements:**
- **More simultaneous fireballs — 2 / 4 / 6. This is the difficulty dial.** Everything else is
  held constant so the tiers differ in exactly one way.
- Fewer allowed hits, reaching zero on HARD. This is a second dial and could be flattened to 0
  across the board if crowding should be the whole story.
- Spawn interval is fixed at 0.45s and is deliberately shorter than the refill needs to be, so
  the field saturates to the cap and stays there. It is not a difficulty knob.

**Feedback:**
- Deflect burst at each successful block; fireballs despawn off-screen after deflection
- SUCCESS: Angel and boys together unharmed, "Not one of them was harmed! God walked with them in the fire."
- FAILURE: "A fireball got through! Stay closer to the boys!"

**Implementation Notes:**
- The angel lerps toward the pointer with a speed cap. If it snapped to the finger, interception would be free and there would be no game — and with crowding as the difficulty dial, the cap is precisely what makes six fireballs harder than two.
- **Angel facing.** The sprite is drawn in profile facing LEFT. Mirror it on the X axis when the angel is on the right half of the screen, so it always faces outward toward the edge the fireballs are arriving from. Do **not** flip on a bare `x < 333` test: the boys stand at centre, so the angel spends most of the game hovering near the flip line, and a bare threshold makes the sprite strobe — flipping every frame as the pointer jitters by a pixel. Use a dead zone instead: face left below `x = 313`, face right above `x = 353`, and keep the current facing between the two.
- Spawning from **both** edges at varied heights is what prevents the degenerate strategy of parking the angel in front of the boys. No artificial cooldown is needed.
- The boys have no hurt state and no flinch animation at any difficulty. They were never in danger — that is the point of the story. Do not add a damage reaction.
- **Known gap:** `getAdjustedConfig` scales `timeLimit` and `reactionWindow` on win/loss streaks. Neither key exists in this game's config, so adaptive difficulty silently skips it. Add `surviveTime` to that function's scaling list.
- **Untested and probably unfair:** HARD is six simultaneous fireballs converging from two edges with zero allowed hits. One angel cannot be in six places. Expect this to need either a hit allowance or a smaller cap after the first playtest.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 8.

---

### 7. HOUSE ON ROCK vs SAND
**Biblical Reference:** Matthew 7:24-27  
**Story Context:** "Jesus taught that wise people build their house on solid rock, not shifting sand!"

**Core Mechanic:** Drag house to correct foundation before storm hits  
**Visual:** House in center, rock platform on one side, sand on other, storm approaching

**Win Conditions:**
- **EASY**: Drag house to rock foundation within 4 seconds (rock clearly labeled "ROCK")
- **MEDIUM**: Choose correct foundation (both look similar) within 3 seconds, rain gives visual clues
- **HARD**: Drag house to rock while wind pushes it toward sand, must fight resistance within 3 seconds

**Lose Conditions:**
- Place house on sand (house collapses in storm)
- Timer expires before placing house
- HARD: House blown off screen

**Progressive Elements:**
- MEDIUM: Foundations look similar, need to read labels or watch rain behavior
- HARD: Wind physics push house wrong direction

**Feedback:**
- Foundations labeled (ROCK / SAND)
- Storm clouds gather as timer counts down
- Rain shows which foundation is stable
- SUCCESS: House stands firm, family safe
- FAILURE: House collapses, "Build on solid ground!" message

**Implementation Notes:**
- Drag physics feel natural
- HARD mode: Wind force increases over time
- Visual feedback shows foundation strength

---

### 8. NOAH'S ARK - MEMORY MATCHING
**Biblical Reference:** Genesis 7:9  
**Story Context:** "Noah brought animals onto the ark two by two, male and female of each kind!"

**Core Mechanic:** Memory matching - flip cards to find pairs of animals  
**Visual:** Grid of face-down cards with animal pairs hidden

**Win Conditions:**
- **EASY**: Match 3 pairs (6 cards total) within 30 seconds
- **MEDIUM**: Match 5 pairs (10 cards total) within 25 seconds
- **HARD**: Match 8 pairs (16 cards total) within 20 seconds

**Lose Conditions:**
- Fail to match all pairs before timer expires
- No penalty for wrong matches, just time lost

**Progressive Elements:**
- More pairs to match
- Less time
- Card positions randomized each game

**Feedback:**
- Cards flip with animation
- Matched pairs stay face-up, animals "board ark"
- Mismatch cards flip back after 0.5s
- SUCCESS: All animals aboard, ark sails away
- FAILURE: "Some animals missed the boat!" message

**Implementation Notes:**
- Card shuffle algorithm ensures solvable layout
- Brief memory period when HARD mode starts (1 second peek)
- Animal illustrations child-friendly and distinct

---

### 9. TOWER OF BABEL
**Biblical Reference:** Genesis 11  
**Story Context:** "People tried to build a tower to reach heaven, but God confused their languages. Teamwork needs understanding!"

**Core Mechanic:** Tap blocks to knock tower over before it reaches "heaven"  
**Visual:** Tower building upward block by block, tap to destroy blocks

**Win Conditions:**
- **EASY**: Knock down tower by destroying 5 blocks within 4 seconds
- **MEDIUM**: Knock down tower by destroying 8 blocks within 3.5 seconds (tower builds faster)
- **HARD**: Knock down tower that builds in random patterns, destroy 10 blocks within 3 seconds

**Lose Conditions:**
- Tower reaches top of screen before knocked down
- Timer expires before tower falls

**Progressive Elements:**
- Tower builds faster
- More blocks required
- Blocks placed in random patterns (harder to topple)

**Feedback:**
- Tower grows upward automatically
- Tapping blocks causes cracks/destruction
- Tower wobbles when unstable
- SUCCESS: Tower topples, "Languages confused!" message
- FAILURE: Tower reaches heaven, "Too late!" message

**Implementation Notes:**
- Physics-based tower collapse
- Strategic block destruction (bottom blocks more effective)
- Visual height indicator showing danger zone

---

### 10. DAVID vs GOLIATH
**Biblical Reference:** 1 Samuel 17  
**Story Context:** "Young David defeated the giant Goliath with just a sling and stone. God gives courage to the faithful!"

**Core Mechanic:** Slingshot - drag back and release to launch stone  
**Visual:** David with sling, Goliath in distance, pull-back and aim mechanic

**Win Conditions:**
- **EASY**: Hit Goliath anywhere with stone (large target, no time limit)
- **MEDIUM**: Hit Goliath in head/body within 2 attempts (headshot = instant win)
- **HARD**: Hit Goliath in forehead within 1 attempt while he moves

**Lose Conditions:**
- MEDIUM/HARD: Run out of attempts
- HARD: Goliath reaches David (charges forward)

**Progressive Elements:**
- MEDIUM: Limited attempts, headshot bonus
- HARD: Moving target, time pressure

**Feedback:**
- Sling stretches as dragged back
- Trajectory line shows aim (fades in HARD mode)
- Stone flies with physics
- SUCCESS: Goliath falls, "Victory!" message
- FAILURE: Stone misses, "Try again, David!" message

**Implementation Notes:**
- Drag-and-release slingshot feel (like Angry Birds)
- Physics-based stone trajectory
- Headshot hitbox smaller but instant-win

---

### 11. WALK AROUND JERICHO
**Biblical Reference:** Joshua 6:15-20  
**Story Context:** "On the seventh day, Joshua's army marched around Jericho seven times. Then the horns blew, the people shouted, and the walls came tumbling down!"

**Core Mechanic:** Two phases — drag the marching soldiers around the city 7 times, then tap rapidly to blow the horn  
**Visual:** The city of Jericho sits in the centre of the screen with a dusty oval path around it. A tight phalanx of four soldiers — shields in front, helmets, spears upright — marches the path as one unit. After lap 7, a horn-blower steps in at the lower left.

> **Redesigned 2026-10-05.** Replaces the tap-to-walk lap counter. The march becomes a drag the player physically performs seven times, and the walls now fall on the horn blast the player supplies — which is the order Joshua 6 tells it in.

**Input Model:**
- **Phase 1 — circular drag.** The touch can start anywhere. The phalanx follows the pointer's *angle* around the city centre and is locked to the path, so the child draws circles rather than having to keep a finger on a moving sprite. Progress counts clockwise only; dragging backward walks them back.
- **Phase 2 — tap anywhere.** The whole screen is the tap target, same as Wrestle the Angel.

**Win Conditions:** each phase has its own timer. Numbers below are playtest starting points; the live values are in `gameConfig.js`.
- **EASY**: 7 laps within 12 seconds, then 12 horn taps within 4 seconds
- **MEDIUM**: 7 laps within 10 seconds, then 16 horn taps within 4 seconds (horn meter drains slowly between taps)
- **HARD**: 7 laps within 9 seconds with rocks on the path, then 20 horn taps within 4 seconds (meter drains)

**Lose Conditions:**
- March timer expires before lap 7 is complete
- Horn timer expires before the horn meter is full
- Note: the horn phase starts on a fresh timer. Scraping through lap 7 with 0.1s left does not doom the horn.

**Progressive Elements:**
- **March time — 12 / 10 / 9s against a fixed speed cap of one lap per second.** The fastest possible march is 7s, so HARD leaves 2s of slack. This is the phase 1 dial.
- **Horn target — 12 / 16 / 20 taps**, with drain from MEDIUM up. This is the phase 2 dial.
- HARD: two rocks sit on the path; touching one stalls the phalanx for 0.5s. Carried over from the original HARD tier. The old "hit 3 times and lose" rule is dropped — a stall already costs time.

**Feedback:**
- Lap counter (1/7, 2/7 ... 7/7)
- Marching footstep sound and a small in-step bob while the phalanx moves; dust puffs at their feet
- City swaps to a more cracked state after laps 3 and 6
- At lap 7: the phalanx halts, the horn-blower slides in, "Blow the horn!" prompt
- Each tap: horn blast, horn-blower toggles to the blowing pose, city shakes, meter fills
- SUCCESS: walls crumble (fallen city sprite, dust burst, screen shake), "The walls came tumbling down!"
- FAILURE (march): walls stand, "Keep marching!"
- FAILURE (horn): walls stand, "Blow louder!"

**Implementation Notes:**
- **Path:** an ellipse centred on the city, measured off the backdrop plate. It must clear the city sprite on every side so the phalanx is never hidden behind the walls — no depth sorting needed.
- **Progress** is the unwrapped angle travelled; one lap = 2π. Unwrap across the `atan2` seam at ±π, or a lap gets double-counted or lost there.
- **Speed cap:** the phalanx lerps toward the pointer's angle with an angular speed cap. Without it a fast spin finishes the march in two seconds and the timer means nothing — same reasoning as the angel cap in Fiery Furnace.
- **Facing:** the sprite is drawn in profile facing LEFT and mirrored by the direction of horizontal travel. At the left and right ends of the ellipse horizontal velocity passes through zero, and a bare sign test strobes the sprite. Flip only when |vx| clears a threshold and hold the current facing below it — the Fiery Furnace dead-zone problem in a different shape.
- Optional: scale the phalanx to ~0.85 on the far (top) side of the path for depth. Cosmetic only.
- **City states** are separate sprites from edit turns and will not be pixel-aligned. Hide each swap under a short shake tween.
- **Horn taps:** track tap timestamps to reject auto-clickers, same as Wrestle the Angel.
- **Config:** name the march timer `timeLimit` and the horn target `targetTaps`, so `getAdjustedConfig` scales both for free. Name the horn duration `hornTime`; it is not scaled.
- **Untested:** two phases make this ~16s at EASY, one of the longest rounds in the roster. If it drags in playtest, trim the timers. The laps stay at 7 — the number is the story.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 10.

---

### 12. RESIZABLE TILES - "HE MUST INCREASE, I MUST DECREASE"
**Biblical Reference:** John 3:30  
**Story Context:** "John the Baptist said about Jesus: 'He must increase, I must decrease.' We make room for God in our lives!"

**Core Mechanic:** Pinch/spread to resize two tiles simultaneously (one grows, one shrinks)  
**Visual:** Two tiles side by side, labeled "ME" and "GOD", resize with pinch gesture

**Win Conditions:**
- **EASY**: Make GOD tile 70%+ of screen and ME tile 30% or less within 5 seconds
- **MEDIUM**: Make GOD tile exactly 80-90% and ME tile 10-20% within 4 seconds
- **HARD**: Make GOD tile exactly 90-95% and ME tile 5-10% within 3 seconds (they shrink back slowly)

**Lose Conditions:**
- Fail to reach target proportions before timer expires
- MEDIUM/HARD: Overshoot or undershoot target range

**Progressive Elements:**
- Tighter precision requirements
- Tiles slowly revert to equal size in HARD mode

**Feedback:**
- Percentage shown on each tile
- Target zone highlighted when reached
- Visual glow when correct ratio achieved
- SUCCESS: "He must increase!" message, light radiates from GOD tile
- FAILURE: Tiles reset to equal, "Try again!" message

**Implementation Notes:**
- Pinch gesture detection (or swipe if pinch unavailable)
- Synchronized inverse resizing (one grows = other shrinks)
- Haptic feedback when target zone reached

---

### 13. FIND THE LOST SHEEP
**Biblical Reference:** Luke 15:3-7  
**Story Context:** "Jesus told a story about a shepherd with 100 sheep. When one wandered off, he searched until he found it. God never stops looking for us!"

**Core Mechanic:** Hide-and-seek — tap hiding spots to find the one lost sheep  
**Visual:** A pastel hillside pasture. Jesus, as the shepherd, stands at the left edge. Bushes and rocks are scattered across the rest of the field, and the sheep is hidden behind one of them.

**Input Model:** Single tap on a hiding spot. The whole spot sprite is the hit target, expanded to the 44x44 minimum where the sprite is smaller. Taps outside a hiding spot do nothing and cost nothing.

**Win Conditions:**
- **EASY**: Find the sheep among **4** hiding spots within 8 seconds. The sheep's ear or tail peeks out from its spot every 2 seconds.
- **MEDIUM**: Find the sheep among **6** hiding spots within 6 seconds. No peeking; each wrong tap gives a hot/cold cue.
- **HARD**: Find the sheep among **8** hiding spots within 5 seconds. Hot/cold cue only, and the sheep moves to a new spot once, after the 2nd wrong tap.

**Lose Conditions:**
- Timer expires before the sheep is found
- MEDIUM: 4 wrong taps
- HARD: 3 wrong taps
- Note: the sheep is never lost for good — that is the whole point of the parable. Failure means time ran out and the shepherd is still searching. Nothing in the fail state may suggest the sheep is gone.

**Progressive Elements:**
- **More hiding spots — 4 / 6 / 8. This is the main difficulty dial.**
- The EASY peek is replaced by the hot/cold cue on MEDIUM and HARD
- A wrong-tap limit appears on MEDIUM and tightens on HARD
- HARD: one mid-round relocation, so brute-force memory of "not that bush" stops working

**Feedback:**
- Wrong spot: the bush or rock rustles, and some spots release a critter (bird flutters up, rabbit hops out)
- Hot/cold: after a wrong tap, the bleat gets louder and the rustle gets stronger the closer that tap was to the sheep
- Shepherd sprite turns toward the last tapped spot
- SUCCESS: Sheep hops out, shepherd lifts it onto his shoulders, "Found you! God never stops looking for us."
- FAILURE: Shepherd keeps searching and calling, "Keep looking! The shepherd never gives up."

**Implementation Notes:**
- Hiding spots are **runtime sprites**, not baked into the plate: the count changes per tier and the sheep relocates on HARD. Spot positions come from a fixed slot table measured off the backdrop; each round picks N slots and hides the sheep behind one at random.
- The sheep renders on the layer **behind** the spot sprites so the EASY peek is just a short tween of the sheep's offset out past the spot's edge.
- Hot/cold strength = distance from the tapped spot to the sheep, normalized to the play-area width, mapped to bleat volume and rustle amplitude. The rustle mirrors the audio so the cue still works with sound off.
- Tap debounce (~250ms) so spam-tapping every spot is not a strategy. EASY has no wrong-tap limit, so on EASY the debounce is the only thing stopping a sweep — that is acceptable at 4 spots.
- Pose is a pure function of (wrong taps, last cue strength, elapsed), same pattern as Wrestle the Angel: initial = searching; mid-win = last cue was warm; mid-lose = past 50% of the timer with no warm cue; win-final = sheep on shoulders; lose-final = reuses the mid-lose calling pose. There is deliberately no sad or defeated state.
- **Config:** add a `lostSheep` entry to `src/systems/gameConfig.js`. Name the round length `timeLimit` so the existing `getAdjustedConfig` scaling picks it up. The spot count and wrong-tap limit are not scaled by adaptive difficulty; that is intentional, not a gap.
- **Untested:** HARD at 8 spots in 5 seconds with a relocation may be too tight for the 6-8 group. Expect the first playtest to push the time up or the relocation out.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 13.

---

### 14. SAMSON AND THE JAWBONE
**Biblical Reference:** Judges 15:14-16  
**Story Context:** "Samson was tied up with brand-new ropes, but God made him strong — the ropes fell off like burnt thread! With only a donkey's jawbone, Samson chased off a whole army of Philistines."

**Core Mechanic:** Drag Samson around the field to bonk fleeing Philistine troublemakers  
**Visual:** An open hillside field. Samson swings a jawbone on a continuous loop. Unarmoured Philistine troublemakers wander the field and scatter when he gets close.

**Input Model:** Offset drag — Samson renders roughly 45px above the player's finger, same as the Fiery Furnace angel, so the thumb never hides him or the Philistine he is about to reach. He lerps toward the pointer with a speed cap; he does not snap to it.

**Win Conditions:** every tier is an 8-second round. Numbers are playtest starting points; the live values are in `gameConfig.js`.
- **EASY**: Bonk **5** Philistines within 8 seconds. They flee slowly.
- **MEDIUM**: Bonk **7** within 8 seconds. They flee at a moderate speed.
- **HARD**: Bonk **9** within 8 seconds. They flee nearly as fast as Samson moves.

**Lose Conditions:**
- Timer expires before the bonk target is reached
- Note: there is no other way to lose. Touching a Philistine is always good — it bonks them. Samson has no hurt state and no health.

**Progressive Elements:**
- **Flee speed relative to Samson's speed cap. This is the difficulty dial.** On HARD a Philistine in open ground can nearly outrun him, so the player has to herd them toward an edge or corner.
- Bonk target rises 5 / 7 / 9 to keep the pace honest as fleeing gets harder.
- Samson's speed cap, flee radius and round length are held constant across tiers.

**Feedback:**
- Samson's jawbone swing loops continuously, with a whoosh sound on each swing
- Philistines get a "!" pop and a scramble animation when they start fleeing
- Bonk: cartoon puff, little spinning stars over the head, boing sound, Philistine tumbles off the nearest screen edge
- Bonk counter (3/7) in the HUD
- SUCCESS: The remaining Philistines run off-screen, Samson raises the jawbone, "God gave Samson strength!"
- FAILURE: Philistines dance just out of reach, "Keep chasing!"

**Implementation Notes:**
- **Contact = bonk.** Overlap between Samson's hit circle and a Philistine's body circle bonks immediately, on any frame. The swing loop is cosmetic. If hits only counted on swing frames, kids would visibly touch a Philistine and get nothing, which reads as a bug.
- **Speed cap** is what makes the timer mean anything. Without it, a snap-to-finger Samson clears the field in two seconds. Same reasoning as the Fiery Furnace angel.
- **Flee behaviour:** each Philistine wanders on a slow random heading. Inside the flee radius of Samson it runs directly away from him, with the flee vector clamped to the play area so they get pinned against edges instead of sliding along them forever. Cornering is the skill.
- Add a small separation force between Philistines so they do not stack into one blob, which would let one pass bonk several.
- **Respawn:** a bonked Philistine is replaced by a new one entering from a random edge away from Samson after ~0.5s, keeping a fixed number on the field (3 on EASY, 4 on MEDIUM and HARD). The field never empties before the target.
- **Samson facing:** the sprite is drawn in profile facing LEFT and mirrored by horizontal travel. Flip only when |vx| clears a threshold and hold the current facing below it, or the sprite strobes when the player wiggles. Same problem as the Furnace angel and the Jericho phalanx.
- **Philistine facing:** each faces its own direction of travel, same threshold rule.
- **Optional 1-second intro:** Samson stands bound in ropes, the ropes flash and drop away, then control begins. This is the Judges 15:14 beat and makes the point that the strength is God's. It runs before the timer starts.
- **Config:** add a `samsonJawbone` entry to `src/systems/gameConfig.js`. Name the round length `timeLimit` so `getAdjustedConfig` scales it. The bonk target (`targetBonks`) and flee speed are not scaled by adaptive difficulty; if that turns out to matter, add `targetBonks` to that function's list.
- **Untested:** whether HARD's flee speed is fun or maddening for the 6-8 group. If it's maddening, lower the flee speed before touching the target.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 14.

---

### 15. BABY MOSES IN THE BASKET
**Biblical Reference:** Exodus 2:1-10  
**Story Context:** "Baby Moses' mother put him in a little basket on the river. God watched over him, and Pharaoh's daughter found him and kept him safe!"

**Core Mechanic:** Tilt the device to steer the basket down the river  
**Visual:** A river seen from above, flowing right to left across the screen. The basket floats in the left third and steers up and down across the river's width. Reeds, rocks and a sleepy hippo drift in from the right. Pharaoh's daughter waits on the bank at the end of the run.

**Input Model:** Device tilt steers the basket toward the top or bottom bank. Drag up/down is the fallback whenever motion is unavailable or permission is denied (desktop, or a parent who taps "Don't Allow").

**Win Conditions:** the river run takes 7 seconds with zero bumps at every tier, and the round is 10 seconds. Each bump stalls the basket for 0.6s, so the timer is really a bump budget.
- **EASY**: Reach Pharaoh's daughter within 10 seconds. Sparse obstacles, wide channels.
- **MEDIUM**: Same, with denser obstacles and a hippo that surfaces mid-run.
- **HARD**: Same, with dense obstacles and a sideways current that pushes the basket toward the banks.

**Lose Conditions:**
- Timer expires before the basket reaches Pharaoh's daughter
- Note: the basket never tips and never sinks, and the baby is never in danger. A bump makes the basket spin gently and the baby giggles.

**Progressive Elements:**
- **Obstacle density is the difficulty dial.** Run length and stall time are held constant.
- MEDIUM: the hippo surfaces as a moving obstacle
- HARD: a sideways current the player has to lean against

**Feedback:**
- Ripple trail behind the basket
- Bump: soft bonk, basket spins once, baby giggles
- Progress strip in the HUD: basket icon sliding toward a princess icon
- SUCCESS: Pharaoh's daughter lifts the basket from the reeds, "God kept baby Moses safe!"
- FAILURE: Basket still bobbing peacefully downstream, "Keep steering!"

**Implementation Notes:**
- **Motion permission on iOS.** iOS Safari only delivers device motion after `DeviceMotionEvent.requestPermission()` (or the `DeviceOrientationEvent` equivalent) is called from a user gesture. Call it from the "Tap to start" on the instruction screen. `@capacitor/motion` is built on the same Web APIs and has the same requirement in the native build. Never call it on page load: it fails silently and the game looks broken.
- **Landscape axes.** The orientation axes do not rotate with the screen. Read `screen.orientation.angle` and pick the axis and sign from it, so landscape-left and landscape-right both steer the same way. Easy to miss when you only test on one hand.
- **Calibrate neutral at round start.** Capture the current tilt as zero, because kids hold phones at every angle. Use a ±3° dead zone, map ±25° to full steering speed, and low-pass the signal so hand tremor doesn't jitter the basket.
- **Hand-authored obstacle patterns per tier, not random spawns.** Random placement can produce a wall with no gap. Every pattern keeps a channel at least 1.5× the basket's width.
- The river scrolls as a TileSprite, and obstacles move at the same speed (see `Art_Plate_Prompts.md` Scene 15 for why the water is mirror-tiled).
- **Config:** add `babyMoses` to `gameConfig.js`. Use `timeLimit` for the round so adaptive difficulty scales it; `runTime` and `bumpStall` stay fixed.
- **Untested:** six-year-olds tilt with their whole body. If playtest shows drag winning on fun, make drag the default and tilt the option. Don't fight the kids on this.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 15.

---

### 16. PETER WALKS ON WATER
**Biblical Reference:** Matthew 14:22-33  
**Story Context:** "Jesus walked on the stormy sea and called Peter to come. When Peter kept his eyes on Jesus, he walked on water too!"

**Core Mechanic:** Hold your finger on Jesus to keep Peter walking  
**Visual:** A choppy pastel sea at twilight. The disciples' boat sits at the left; Peter steps off it and walks right, across the water, toward Jesus standing on the waves at the right.

**Input Model:** Press and hold on Jesus. The hit zone is about 1.5× his sprite. While the finger stays on him, Peter walks. Lift or slide off and Peter stops and slowly sinks; put the finger back and he rises and walks on.

**Win Conditions:** Peter's full walk takes 5 seconds of holding at every tier.
- **EASY**: Reach Jesus within 8 seconds. Jesus stands still.
- **MEDIUM**: Reach Jesus within 8 seconds. Jesus drifts slowly up and down, so the finger has to follow him.
- **HARD**: Reach Jesus within 8 seconds. Jesus drifts faster, and big waves sweep across and hide him for a moment.

**Lose Conditions:**
- The sink meter fills (Peter is waist-deep)
- Timer expires before Peter reaches Jesus
- Note: Peter never goes under. When the sink meter fills, Jesus reaches out and pulls him up. That is exactly what Matthew 14:31 says happens, so the fail state is a rescue.

**Progressive Elements:**
- **Jesus' drift speed (none / slow / faster) is the difficulty dial.**
- HARD: wave occlusions. The child has to keep their finger where Jesus *is*, not where they can see him. That is the lesson, delivered as a mechanic.

**Feedback:**
- Jesus glows softly while the finger is on him. Kids need to *see* that the hold registered.
- Peter's feet splash on each step
- Sinking: the waterline rises up Peter's body with a few bubbles
- SUCCESS: Jesus takes Peter's hand, the wind drops, "Peter walked on water!"
- FAILURE: Jesus lifts Peter up by the hand, both safe, "Keep your eyes on Jesus!"

**Implementation Notes:**
- **Don't rely on `pointerout` for touch.** It's unreliable on touch input. Each frame, check `pointer.isDown` and the pointer's distance to Jesus' current position.
- 150ms grace before sinking starts, so a finger twitch doesn't punish.
- Treat `touchcancel` (a system gesture, a notification pulling focus) as a lift, not an error.
- Sinking is a `setCrop` on Peter's sprite plus a waterline overlay, not extra sink sprites. Cheaper, and continuous.
- Pose is a pure function of (holding, sink level), same pattern as Wrestle the Angel: initial = Peter at the boat's edge; mid-win = walking; mid-lose = sinking and reaching out; win-final = hand in hand; lose-final = being lifted. No frightened state.
- **Config:** add `peterWater`. Use `timeLimit`, plus `walkTime`, `sinkRate` and `driftSpeed`. The slack is `timeLimit − walkTime`.
- Jesus uses the canonical seafoam design from Roll the Stone.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 16.

---

### 17. ZACCHAEUS CLIMBS THE TREE
**Biblical Reference:** Luke 19:1-10  
**Story Context:** "Zacchaeus was too short to see Jesus, so he climbed a tree! Jesus looked up and said, 'Come down, I'm visiting your house today!'"

**Core Mechanic:** Tap the left and right sides of the screen, one after the other, to climb  
**Visual:** A big sycamore-fig tree on the right. A crowd lines the road at the bottom. Jesus walks along the road from the left edge, and his walk is the timer.

**Input Model:** The screen is split into left and right halves. Each tap on the side opposite the last tap climbs one step. Two big hand icons pulse in the bottom corners on the instruction screen.

**Win Conditions:**
- **EASY**: 14 alternating taps within 8 seconds. A same-side tap does nothing.
- **MEDIUM**: 18 alternating taps within 7 seconds. A same-side tap slips him down 1 step.
- **HARD**: 22 alternating taps within 6 seconds. A same-side tap slips him down 2 steps.

**Lose Conditions:**
- Jesus reaches the tree before Zacchaeus reaches the lookout branch (timer)
- Note: Jesus never walks past him. In the fail state, Jesus stops under the tree and looks around while Zacchaeus peeks from a low branch. Jesus came looking for him; the game shouldn't say otherwise.

**Progressive Elements:**
- Tap target and time tighten together
- **The slip penalty is the real dial**: none, then 1 step, then 2. It turns mashing into rhythm.

**Feedback:**
- Rustle sound and a few falling leaves on each step
- Slip: wobble, "whoops!", short slide down
- Crowd heads bob as Jesus passes
- SUCCESS: Jesus stops under the tree, looks up and waves, "Zacchaeus, come down!"
- FAILURE: Zacchaeus peeks between the leaves, "Climb higher!"

**Implementation Notes:**
- Climb height is continuous progress, not snapped to drawn branches. The tap target changes per tier; the tree art doesn't.
- **Two-thumb exploit:** if both halves register within 40ms, count one tap, not two. Otherwise a kid with two thumbs on the glass wins for free.
- Jesus' walk is a tween from the left edge to the tree's x over `timeLimit`, driven by the same clamped clock as the loss timeout. Keep the HUD timer too; not every kid reads the diegetic one.
- Auto-clicker guard on tap timestamps, same as Wrestle the Angel.
- **Config:** add `zacchaeus` with `timeLimit` and `targetTaps`, so adaptive difficulty scales both for free. `slipSteps` stays fixed.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 17.

---

### 18. JOSEPH'S COAT OF MANY COLORS
**Biblical Reference:** Genesis 37:3  
**Story Context:** "Jacob gave his son Joseph a beautiful coat of many colors. Every color showed how much his father loved him!"

**Core Mechanic:** Watch the coat's stripes light up in order, then tap the same colors in the same order  
**Visual:** Joseph stands in the centre wearing a cream coat with plain stripe bands. A row of clay dye pots sits along the bottom.

**Input Model:** Tap the dye pots. Input is locked while the pattern plays back.

**Win Conditions:** the 8-second answer timer starts after the playback finishes. Watching never eats into answer time.
- **EASY**: Repeat a 3-color pattern from 4 dye pots within 8 seconds
- **MEDIUM**: Repeat a 4-color pattern from 5 dye pots within 8 seconds
- **HARD**: Repeat a 5-color pattern from 6 dye pots within 8 seconds. Colors may repeat.

**Lose Conditions:**
- Tap a wrong color
- Answer timer expires

**Progressive Elements:**
- **Pattern length (3 / 4 / 5) is the difficulty dial.**
- More dye pots to choose from
- HARD allows repeats (red, blue, red), which is much harder than it sounds

**Feedback:**
- Playback: each stripe flashes its color with its own musical note
- Answering: each correct tap paints the next stripe, so the coat fills in as the child answers
- SUCCESS: The coat is complete, Joseph twirls, "What a beautiful coat!"
- FAILURE: The stripes fade back to cream, "Watch closely!"

**Implementation Notes:**
- **Never color alone.** Each dye pot carries a distinct symbol (dot, star, heart, wave, square, moon) and its own note. Roughly 1 in 12 boys has a color vision deficiency; without the symbols, this game is a wall for them.
- Playback speed is a config value: about 0.6s per stripe on EASY, down to 0.45s on HARD.
- The coat's stripes are tinted at runtime, not generated per combination (see `Art_Plate_Prompts.md` Scene 18).
- Use the clamped game clock for the playback timing as well as the answer timer, so a throttled tab doesn't desync the playback from the sound.
- The story card deliberately stops at the coat. The brothers' jealousy and selling Joseph are a different game, if ever.
- **Config:** add `josephCoat`. Name the answer timer `timeLimit` so adaptive difficulty scales it; `patternLength`, `potCount`, `allowRepeats` and `playbackStep` stay fixed.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 18.

---

### 19. NEHEMIAH REBUILDS THE WALL
**Biblical Reference:** Nehemiah 2:17-18; 4:6; 6:15  
**Story Context:** "Jerusalem's walls were broken down. Nehemiah got everyone working together, and they rebuilt the whole wall in just 52 days!"

**Core Mechanic:** Tap to drop swinging stones into a gap in the wall  
**Visual:** Jerusalem's wall runs across the screen with a tall gap in the middle. A wooden crane swings a stone block on a rope above the gap. Nehemiah directs from the side.

**Input Model:** Tap anywhere to release the swinging stone. It drops straight down.

**Win Conditions:** the gap holds 8 stones at every tier. Lower tiers start with some already placed (Nehemiah 4:6: the wall was joined "to half its height").
- **EASY**: 4 stones already placed, place 4 more within 12 seconds. Slow swing, wide tolerance.
- **MEDIUM**: 2 already placed, place 6 within 12 seconds. Medium swing and tolerance.
- **HARD**: 0 placed, place all 8 within 12 seconds. Faster swing, tight tolerance.

**Lose Conditions:**
- Timer expires before the gap is filled
- A stone that misses tumbles onto the rubble and the next one swings in after 0.8s. The only cost is time.

**Progressive Elements:**
- **Stones to place (4 / 6 / 8) is the main dial.**
- Swing speed and landing tolerance tighten together

**Feedback:**
- Landing: thunk plus a dust puff; a sparkle for a near-perfect centre drop
- Miss: the stone bounces off the rubble, "oops!"
- Workers on the wall cheer each placed stone
- SUCCESS: The wall is whole, workers cheer, "The wall is finished!"
- FAILURE: The gap is still open, "Keep building!"

**Implementation Notes:**
- **No physics engine.** Landing is a deterministic check: if |stone x − gap centre| ≤ tolerance, snap to centre and stack. Real physics would wobble and topple, which would be unfair here. (Babel uses toppling on purpose; this is its mirror.)
- **Fixed stone size, fixed gap.** Changing the count per tier by resizing stones would stretch the outlines. Pre-placing stones on lower tiers keeps every asset at one size.
- Straight-down drops on every tier, with no horizontal carry from the swing. Carry would be "realistic" and a nightmare for six-year-olds.
- The swing is a sine pendulum on the shared clamped clock.
- **Config:** add `nehemiahWall` with `timeLimit`, `stonesToPlace`, `tolerance` and `swingSpeed`.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 19.

---

### 20. MOSES PARTS THE RED SEA
**Biblical Reference:** Exodus 14:21-22  
**Story Context:** "Moses stretched out his hand over the sea. God split the water in two, and His people walked across on dry ground!"

**Core Mechanic:** Spread two fingers apart to part the sea, and hold it open while the people cross  
**Visual:** Side view. Moses stands on the near shore at the left with his staff raised. The sea fills the middle of the screen. The far shore is at the right. Spreading the fingers opens a dry path straight across, with walls of water above and below it.

**Input Model:** Two-finger vertical spread. The width of the dry path follows the vertical distance between the fingers. With a single finger (desktop mouse, or a kid who uses one finger), the path width follows that finger's distance from the centre line, doubled.

**Win Conditions:**
- **EASY**: Get 4 people across within 10 seconds. The path needs to be at least 30% of the screen height for people to walk.
- **MEDIUM**: 6 people within 10 seconds. Path at least 40%.
- **HARD**: 8 people within 10 seconds. Path at least 50%.

**Lose Conditions:**
- Timer expires before everyone has crossed
- Note: nobody is ever in the water. If the path narrows below the minimum, people stop and wait on dry ground. The water walls can't close on anyone. The Egyptian army isn't in this game; the story's ending is not material for this audience.

**Progressive Elements:**
- **Crosser count and required width rise together.** On a phone, 50% of the screen height between two fingers is a real stretch, which is the point.

**Feedback:**
- The water walls follow the fingers with slight lag, so they feel heavy
- The path glows gold when it's wide enough to walk
- People walk across carrying bundles; anyone mid-path pauses if it narrows
- SUCCESS: Everyone cheers on the far shore, the water gently closes behind them over an empty path, "God made a way!"
- FAILURE: Some people still waiting on the near shore, "Hold the water open!"

**Implementation Notes:**
- **Phaser tracks one touch pointer by default.** Call `this.input.addPointer(1)` in `create()` to track a second, or the second finger is ignored and the game is unplayable on touch.
- Use only the y-distance between the two pointers; ignore x.
- Single-pointer fallback kicks in when only one pointer has been down for more than 300ms.
- The water walls are two sprites that move apart, not scale. Scaling would stretch the outlines.
- **Config:** add `redSea` with `timeLimit`, `crossers` and `requiredSpread`.
- Moses' design follows the `moses.png` style reference.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 20.

---

### 21. FEEDING THE 5,000
**Biblical Reference:** John 6:1-13  
**Story Context:** "A boy shared his five loaves and two fish. Jesus thanked God, and everyone ate. There were even twelve baskets left over!"

**Core Mechanic:** Drag the basket left and right to catch the bread and fish  
**Visual:** A grassy hillside. Jesus stands at the top centre breaking bread, and loaves and fish tumble down. The boy holds a basket at the bottom.

**Input Model:** Horizontal drag only. The basket follows the finger's x with a speed cap; vertical movement is ignored.

**Win Conditions:**
- **EASY**: Catch 8 within 10 seconds. Slow fall.
- **MEDIUM**: Catch 12 within 10 seconds (the twelve baskets).
- **HARD**: Catch 15 within 10 seconds. Fast fall, and items sway as they drop.

**Lose Conditions:**
- Timer expires before the catch target is reached
- Note: no penalty for a miss. The story is abundance; there's always more. A missed loaf lands on the grass and someone in the crowd happily picks it up.

**Progressive Elements:**
- **Fall speed and catch target rise together.**
- HARD: items sway side to side as they fall

**Feedback:**
- Catch: a little pop, and the basket visibly fills
- Miss: a crowd member picks it up and munches. Every miss still feeds someone.
- SUCCESS: The basket overflows, the crowd cheers, "Everyone had enough!"
- FAILURE: "Catch some more!"

**Implementation Notes:**
- **Spawn guarantee:** spawn rate × time ≥ 1.6 × the catch target, so the target is always reachable.
- Speed cap on the basket, same reasoning as Samson: without it, catching is free.
- Items spawn across the width but never two at the same x within 0.5s, so pairs stay catchable.
- Basket fill is three overlay states, swapped at 1/3 and 2/3 of the target.
- **Config:** add `feedingFiveThousand` with `timeLimit`, `targetCatches`, `fallSpeed` and `swayAmount`. `targetCatches` is not scaled by adaptive difficulty.
- Jesus uses the canonical seafoam design.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 21.

---

### 22. JONAH AND THE BIG FISH
**Biblical Reference:** Jonah 1:17; 2:10; 3:1-3  
**Story Context:** "Jonah ran away from God and was swallowed by a big fish! After three days, the fish spat him onto dry land, and Jonah obeyed God."

**Core Mechanic:** Tap to stop a power meter and launch Jonah from the fish onto the beach  
**Visual:** Side view. A big friendly fish floats in the water at the left. A beach runs along the right with a target zone marked in the sand. Palm trees stand beyond the beach.

**Input Model:** A power meter swings up and down on its own. Tap to lock the power, and the fish spits Jonah in an arc.

**Win Conditions:**
- **EASY**: Land Jonah in the zone within 3 attempts. Wide zone, slow meter.
- **MEDIUM**: Within 2 attempts. Medium zone, faster meter.
- **HARD**: Within 2 attempts. Narrow zone, fast meter, and the fish bobs so the launch height varies.

**Lose Conditions:**
- Out of attempts
- Timer (12 seconds) expires
- Too short: Jonah splashes into the shallows and the fish scoops him back up. Too far: he lands in a palm tree. Both are funny, never scary.

**Progressive Elements:**
- **Zone width and meter speed are the dials.**
- Fewer attempts from MEDIUM up
- HARD: fish bobbing changes the launch point each attempt

**Feedback:**
- The fish's cheeks puff up as the meter swings
- "PTOO!" sound, Jonah tumbles through the air with seaweed on his head
- Sand puff on landing
- A faint ghost marker shows where the last attempt landed
- SUCCESS: Jonah sits up on the beach, picks seaweed off his head and waves, "Jonah got a second chance!"
- FAILURE: Jonah dangles from a palm tree, grinning, "Try again!"

**Implementation Notes:**
- **Deterministic arc, not physics.** Landing x is a fixed function of power, so the result is predictable and the child can learn from it.
- **The ghost marker is the teaching tool.** Seeing "too far last time" is how a six-year-old corrects. Don't cut it.
- The meter is a ping-pong tween on the clamped game clock, not wall-clock.
- The inside of the fish is never shown. The fish starts with its mouth closed; Jonah only appears when he's spat out.
- **Config:** add `jonahFish` with `timeLimit`, `attempts`, `zoneWidth` and `meterSpeed`.
- Jonah's design follows the `jonah.png` style reference.
- Art assets and generation prompts: see `Art_Plate_Prompts.md` Scene 22.

---

## Difficulty System

### Level-Based Difficulty Progression

**Level Structure:**
```
Level 1: Mini-games 1-3 unlocked (EASY difficulty only)
Level 2: Mini-games 1-6 unlocked (EASY difficulty)
Level 3: Mini-games 1-9 unlocked (EASY → MEDIUM transition)
Level 4: Mini-games 1-12 unlocked (MEDIUM difficulty)
Level 5: Mini-games 1-15 unlocked (MEDIUM difficulty)
Level 6: Mini-games 1-18 unlocked (MEDIUM difficulty)
Level 7: All 22 mini-games unlocked (MEDIUM → HARD transition)
Level 8: All 22 mini-games (HARD difficulty)
Level 9: All 22 mini-games (HARD difficulty)
Level 10: All 22 mini-games (EXPERT difficulty - 15% harder than HARD)
```

**Unlocking Levels:**
- Level 1: Unlocked by default
- Levels 2-10: Unlock by earning required points
  - Level 2: 1,000 points
  - Level 3: 2,500 points
  - Level 4: 5,000 points
  - Level 5: 8,000 points
  - Level 6: 12,000 points
  - Level 7: 17,000 points
  - Level 8: 23,000 points
  - Level 9: 30,000 points
  - Level 10: 40,000 points

**Alternative Unlock:** Can spend 500 points to unlock next level early (monetization opportunity)

### Adaptive Difficulty (Within Session)

To maintain "flow state" and prevent frustration:

```
IF player wins 3 mini-games in a row:
  ├─ Slightly increase difficulty (reduce timer by 0.3s or increase requirement by 5%)
  └─ Apply 1.2x score multiplier for next game

IF player loses 2 mini-games in a row:
  ├─ Slightly decrease difficulty (add 0.5s to timer or decrease requirement by 10%)
  └─ Show encouraging message: "You've got this!"

IF player loses 4 mini-games in a row:
  ├─ Offer hint: "Try tapping faster!" or "Remember the pattern!"
  └─ Reduce difficulty to minimum for current level
```

This ensures challenging but not frustrating gameplay.

---

## Scoring System

### Base Points Per Mini-Game

**Difficulty-Based Base Score:**
- EASY: 100 points
- MEDIUM: 200 points
- HARD: 300 points
- EXPERT: 400 points

**Performance Multipliers:**
- **Perfect Completion** (no mistakes, first try): 2x multiplier
- **Fast Completion** (beat target time by 30%+): 1.5x multiplier
- **Combo Active** (see below): Combo multiplier applies

**Example Calculations:**
```
MEDIUM difficulty mini-game completed perfectly:
200 (base) × 2 (perfect) = 400 points

HARD difficulty mini-game completed fast with 5-combo:
300 (base) × 1.5 (fast) × 1.5 (5-combo) = 675 points

EASY difficulty mini-game completed normally:
100 (base) × 1 = 100 points
```

### Combo/Streak System

Rewards consecutive wins within a session:

```
Win 3 mini-games in a row: 1.5x multiplier on all points
Win 5 mini-games in a row: 2x multiplier on all points
Win 10 mini-games in a row: 3x multiplier on all points
Win 15 mini-games in a row: 5x multiplier + special achievement

Losing ANY mini-game resets combo to 0
```

**Visual Feedback:**
- Combo counter displays prominently after each win
- Screen flashes with increasing intensity as combo grows
- "COMBO x5!" announcement when thresholds reached
- Combo meter fills progressively

### Bonus Points

**Daily Login Bonus:**
- Day 1: +100 points
- Day 2: +150 points
- Day 3: +200 points
- Day 7: +500 points
- Day 14: +1000 points + special avatar

**Achievement Points:**
- First time completing each mini-game: +200 points
- First perfect completion of each game: +300 points
- Complete all 22 games at least once: +1000 points
- Earn 10-combo: +500 points
- Complete level without losing a life: +500 points

**Referral Bonus:**
(From SRS document - Refer a Friend system)
- Refer a friend who completes tutorial: +500 points
- Maximum referral points: 5,000 points (capped)

---

## Lives & Session Structure

### Life System

**Starting Lives:** 3 lives per session

**Losing Lives:**
- Fail any mini-game = lose 1 life
- Lives persist only within current session
- Lives reset to 3 at start of each new session

**Regaining Lives:**
- **Watch Advertisement:** Gain 1 life (max 3 per session)
  - Cooldown: Can watch ad every 2 minutes
  - Session cap: 3 ads maximum per session
  - After 3 ads, no more lives available (session ends on next fail)

**Lives Do NOT Regenerate Over Time** (unlike some mobile games)
- This creates urgency within sessions
- Encourages skill improvement rather than waiting
- Monetization via ads is clear and fair

### Session End Conditions

**Session ends when:**
1. Player manually quits (tap pause → quit)
2. Lives reach 0 and player declines/exhausts ad option
3. Player completes 20 mini-games in one session (natural break point)

**When Session Ends:**
```
Display Session Stats Screen:
├─ Games Played: X
├─ Win Rate: Y%
├─ Points Earned: Z pts
├─ Best Combo: N wins
├─ New Achievements: [list]
├─ Total Score Now: XXXXX pts
└─ "Play Again" or "Home" buttons
```

Points earned in session are added to lifetime total score.

---

## Educational Integration

### Pre-Game Story Context

**Before each mini-game:**

```
┌─────────────────────────────────┐
│   [Biblical Scene Illustration] │
│                                  │
│  "Story Title"                   │
│  Brief 2-3 sentence story        │
│  explaining the Biblical event   │
│                                  │
│  [Verse Reference: Book Ch:Vs]  │
└─────────────────────────────────┘
        ↓ (auto-advance after 3s)
┌─────────────────────────────────┐
│   [Game Instruction Icon]        │
│                                  │
│  "How to Play:"                  │
│  Simple instruction for mechanic │
│                                  │
│  [Visual demonstration]          │
└─────────────────────────────────┘
        ↓ (auto-advance after 2s)
    [MINI-GAME STARTS]
```

**Example for "Wrestle the Angel":**

```
Screen 1 (Story Context):
┌─────────────────────────────────┐
│   [Jacob wrestling angel art]   │
│                                  │
│  "Jacob Wrestles an Angel"       │
│                                  │
│  Jacob wrestled with an angel    │
│  all night and wouldn't give up. │
│  God blessed him for his         │
│  determination!                  │
│                                  │
│  Genesis 32:24-26                │
└─────────────────────────────────┘

Screen 2 (Instructions):
┌─────────────────────────────────┐
│   [Tap gesture animation]        │
│                                  │
│  "How to Play:"                  │
│                                  │
│  Tap the screen quickly          │
│  to wrestle the angel!           │
│                                  │
│  [Finger tapping animation]      │
└─────────────────────────────────┘

[GAME BEGINS]
```

### Post-Game Educational Moment

**After SUCCESSFUL completion:**

```
┌─────────────────────────────────┐
│   [Success Animation]            │
│                                  │
│  "Great job!"                    │
│                                  │
│  Short encouraging message       │
│  relating to Biblical lesson:    │
│  "Like Jacob, you didn't give    │
│  up! God rewards persistence."   │
│                                  │
│  +300 Points!                    │
│                                  │
│  [Continue Button]               │
└─────────────────────────────────┘
```

**After FAILURE:**

```
┌─────────────────────────────────┐
│   [Sympathetic Animation]        │
│                                  │
│  "Almost there!"                 │
│                                  │
│  Encouraging message:            │
│  "Keep trying - practice makes   │
│  perfect, just like David        │
│  practiced with his sling!"      │
│                                  │
│  Lives: ♥♥                       │
│                                  │
│  [Try Again Button]              │
└─────────────────────────────────┘
```

### Educational Reinforcement Strategy

**Multiple touchpoints ensure learning:**

1. **Pre-game context** (3 seconds): Story introduction
2. **During game**: Visual representation of Biblical scene
3. **Post-game message**: Character lesson connection
4. **Separate "Challenges" mode**: Quiz questions about stories (from SRS)
5. **Videos section**: Longer educational content (from SRS)

**Age-Appropriate Language:**
- Simple vocabulary (6th grade reading level max)
- Short sentences (under 15 words)
- Active voice
- Positive messaging
- No guilt/fear-based language

---

## Progression & Unlocks

### Level Unlocking System

**Points Required to Unlock:**
```
Level 1: FREE (default)
Level 2: 1,000 pts
Level 3: 2,500 pts
Level 4: 5,000 pts
Level 5: 8,000 pts
Level 6: 12,000 pts
Level 7: 17,000 pts
Level 8: 23,000 pts
Level 9: 30,000 pts
Level 10: 40,000 pts
```

**Alternative Unlock Methods:**
- **Pay to unlock early:** 500 points to unlock next level
- **Daily challenge:** Complete special challenge to unlock next level
- **Referral:** Refer 3 friends = unlock next level free

### Avatar Unlocking System

**Default Avatars (Always Available):**
- Boy character (default)
- Girl character (default)
- Generic Bible character silhouettes

**Unlockable Avatars (Redeem Points or Achievements):**

```
Common Avatars (500 points each):
├─ Noah
├─ Moses
├─ David (boy)
├─ Esther (girl)
└─ Daniel

Rare Avatars (1,000 points each):
├─ Joshua
├─ Deborah
├─ Samuel
└─ Ruth

Epic Avatars (2,000 points each):
├─ Elijah
├─ Miriam
└─ Joseph (coat of many colors)

Legendary Avatars (Achievement-only):
├─ Complete all 22 games perfectly → Jesus avatar
├─ Earn 20-combo → Angel avatar
├─ Play 30 days in a row → Apostle Paul avatar
```

**Customization:**
- Once unlocked, avatars available permanently
- Can change avatar anytime from Profile screen
- Avatar appears in mini-games as playable character

### Achievement System

**Categories:**

**SKILL Achievements:**
```
"First Victory" - Complete any mini-game (100 pts)
"Perfect Play" - Complete any mini-game perfectly (200 pts)
"Combo Starter" - Earn 3-combo (200 pts)
"Combo Master" - Earn 10-combo (500 pts)
"Combo Legend" - Earn 20-combo (1,000 pts + Legendary Avatar)
"All Rounder" - Complete all 22 mini-games at least once (1,000 pts)
"Bible Scholar" - Complete all 22 mini-games perfectly (2,000 pts)
"Speed Demon" - Complete 10 mini-games under target time (500 pts)
```

**DEDICATION Achievements:**
```
"Welcome" - Complete tutorial (50 pts)
"Daily Player" - Play 3 days in a row (200 pts)
"Weekly Warrior" - Play 7 days in a row (500 pts + Daily Login Avatar)
"Monthly Master" - Play 30 days in a row (2,000 pts + Special Avatar)
"Century Club" - Play 100 total games (1,000 pts)
```

**COLLECTION Achievements:**
```
"Avatar Collector" - Unlock 5 avatars (300 pts)
"Avatar Master" - Unlock all Common avatars (800 pts)
"Legendary Collector" - Unlock 1 Legendary avatar (Achievement-only reward)
```

**SOCIAL Achievements:**
```
"Friend Maker" - Refer 1 friend (500 pts)
"Community Builder" - Refer 5 friends (2,000 pts)
"Ambassador" - Refer 10 friends (Max referral cap reached)
```

**Achievement Display:**
- Badge icon system (bronze, silver, gold, platinum)
- Progress bars for incremental achievements
- Achievement notification popup when unlocked
- Achievement showcase in Profile screen

---

## Meta Systems

### Daily Challenges

**Structure:** One special challenge each day, resets at midnight

**Challenge Types:**

```
Monday - "Speed Day"
├─ Complete 3 mini-games under target time
└─ Reward: 300 bonus points

Tuesday - "Perfect Day"  
├─ Complete 2 mini-games perfectly (no mistakes)
└─ Reward: 400 bonus points

Wednesday - "Combo Day"
├─ Achieve a 5-combo in one session
└─ Reward: 500 bonus points

Thursday - "Endurance Day"
├─ Complete 10 mini-games in one session
└─ Reward: 600 bonus points

Friday - "Education Day"
├─ Answer 5 Challenge Questions correctly
└─ Reward: 400 bonus points + Educational badge

Saturday - "Explorer Day"
├─ Play 3 different mini-games you haven't played this week
└─ Reward: 350 bonus points
```

**Daily Challenge UI:**
- Banner on home screen showing today's challenge
- Progress tracker
- Countdown to challenge reset
- "Claim Reward" button when completed

### Leaderboards

**Types:**

**1. Friends Leaderboard**
- Shows your rank vs. friends who also play
- Displays top 10 friends by total score
- Updates real-time

**2. Global Leaderboard**
- Shows top 100 players worldwide
- Resets monthly
- Rewards for top positions:
  - 1st place: 5,000 bonus points + Special Crown Avatar
  - 2-10th place: 2,000 bonus points
  - 11-100th place: 500 bonus points

**3. Level-Specific Leaderboards**
- Best score on each mini-game individually
- Shows personal best + top 10

**Privacy:**
- Kids' usernames anonymized (e.g., "Player123")
- No personal info displayed
- Parents can disable leaderboards in settings

### Parental Features

**Email Reports (From SRS):**
- Weekly activity summary sent to parent email
- Shows: Games played, time spent, educational progress
- Opt-in during registration

**Parental Controls:**
- Disable in-app ads
- Disable leaderboards
- Disable referral system
- Set playtime limits
- View detailed progress reports

**Educational Dashboard:**
- Shows which Bible stories child has learned
- Quiz scores (from Challenge mode)
- Comprehension metrics

---

## UI/UX Flow

### Home Screen

```
┌─────────────────────────────────────────┐
│  [App Logo: Biblical Mini-Games]        │
│                                          │
│  ┌──────────────────────────┐           │
│  │   [PLAY Button - Large]   │           │
│  └──────────────────────────┘           │
│                                          │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │Levels│  │Chall│  │Video│  │Store│    │
│  └─────┘  └─────┘  └─────┘  └─────┘    │
│                                          │
│  Daily Challenge: [Progress: 1/3]       │
│                                          │
│  ┌──────────────────┐                   │
│  │ [Avatar Icon]    │  Score: 12,450    │
│  │ Username         │  Level: 5         │
│  └──────────────────┘  Lives: ♥♥♥       │
│                                          │
│  [Settings] [Achievements] [Leaderboard]│
└─────────────────────────────────────────┘
```

**Navigation:**
- **PLAY**: Starts new session (goes to Level Select if multiple unlocked)
- **Levels**: Shows locked/unlocked levels, progress
- **Challenges**: Bible quiz mode (separate from mini-games)
- **Videos**: Educational content library
- **Store**: Avatar shop, level unlocks
- **Avatar/Profile**: View stats, achievements, change avatar
- **Settings**: Audio, parental controls, account
- **Achievements**: Badge collection, progress
- **Leaderboard**: Friends & global rankings

### Level Select Screen

```
┌─────────────────────────────────────────┐
│  < Back                 Select Level     │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ Lvl 1│ │ Lvl 2│ │ Lvl 3│ │ Lvl 4│   │
│  │  ✓   │ │  ✓   │ │  ✓   │ │  🔒  │   │
│  │ Easy │ │ Easy │ │Medium│ │Medium│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ Lvl 5│ │ Lvl 6│ │ Lvl 7│ │ Lvl 8│   │
│  │  🔒  │ │  🔒  │ │  🔒  │ │  🔒  │   │
│  │ Hard │ │ Hard │ │Expert│ │Expert│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  Next Unlock: Level 4 (need 1,200 pts)  │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  [START CURRENT LEVEL]        │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

**Visual Indicators:**
- ✓ = Unlocked and completed
- Current level highlighted
- Locked levels show unlock requirements
- Difficulty badge on each level

### In-Game HUD

```
┌─────────────────────────────────────────┐
│  Lives: ♥♥♥          Timer: 4.2s        │
│  Score: 1,250        Combo: x3          │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │      [MINI-GAME AREA]             │  │
│  │                                   │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Progress: 3/12 games this session      │
│  [Pause Button]                         │
└─────────────────────────────────────────┘
```

**HUD Elements:**
- **Lives**: Visual hearts, decrease on fail
- **Timer**: Countdown for current mini-game
- **Score**: Running total for session
- **Combo**: Current win streak multiplier
- **Progress**: Games completed this session
- **Pause**: Access settings, quit option

### Pause Menu

```
┌─────────────────────────────────────────┐
│            GAME PAUSED                   │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  [RESUME]                     │      │
│  └───────────────────────────────┘      │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  [RESTART MINI-GAME]          │      │
│  │  (Costs 1 Life)               │      │
│  └───────────────────────────────┘      │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  [QUIT SESSION]               │      │
│  │  (Keep points earned)         │      │
│  └───────────────────────────────┘      │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  [SETTINGS]                   │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### Session End Screen

```
┌─────────────────────────────────────────┐
│          SESSION COMPLETE!               │
│                                          │
│  Games Played: 8                         │
│  Win Rate: 75% (6 wins, 2 losses)        │
│  Best Combo: 4 wins                      │
│                                          │
│  ┌───────────────────────────────┐      │
│  │  Points Earned: +1,450        │      │
│  │  Total Score: 13,900          │      │
│  └───────────────────────────────┘      │
│                                          │
│  New Achievements Unlocked:              │
│  🏆 "Combo Starter" (+200 pts)           │
│                                          │
│  Progress to Next Level:                 │
│  [▓▓▓▓▓▓▓▓░░] 80% (Need 1,100 pts)       │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │  PLAY AGAIN  │  │  HOME        │     │
│  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Phaser.js Architecture

**Recommended Scene Structure:**

```javascript
// Core Scenes
scenes/
├── BootScene.js          // Asset loading
├── MenuScene.js          // Home screen
├── LevelSelectScene.js   // Level selection
├── GameScene.js          // Main game loop (loads mini-games)
├── ResultScene.js        // Session end stats
└── mini-games/
    ├── BaseGameScene.js  // Base class all mini-games extend
    ├── WrestleAngelGame.js
    ├── WaterToWineGame.js
    ├── LetThereBeLight.js
    └── ... (all 22 mini-games)
```

**Base Mini-Game Class:**

```javascript
class BaseGameScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.gameName = config.name;
    this.difficulty = config.difficulty; // EASY, MEDIUM, HARD
    this.timeLimit = config.timeLimit;
    this.winCondition = config.winCondition;
    this.loseCondition = config.loseCondition;
  }

  preload() {
    // Load game-specific assets
  }

  create() {
    this.showStoryContext(); // 3 second story screen
    this.time.delayedCall(3000, () => {
      this.showInstructions(); // 2 second instructions
      this.time.delayedCall(2000, () => {
        this.startGame(); // Begin actual gameplay
      });
    });
  }

  startGame() {
    // Start timer, enable input, begin game logic
    this.startTimer();
    this.enableInput();
  }

  checkWinCondition() {
    // Override in child classes
    if (this.hasWon()) {
      this.handleWin();
    }
  }

  checkLoseCondition() {
    // Override in child classes
    if (this.hasLost()) {
      this.handleLoss();
    }
  }

  handleWin() {
    this.stopTimer();
    this.disableInput();
    this.calculateScore();
    this.showSuccessMessage();
    this.returnToGameLoop();
  }

  handleLoss() {
    this.stopTimer();
    this.disableInput();
    this.showFailureMessage();
    this.returnToGameLoop(false); // false = lost life
  }

  returnToGameLoop(won = true) {
    // Return to GameScene with result
    this.scene.start('GameScene', {
      result: won ? 'WIN' : 'LOSS',
      score: this.score,
      gameName: this.gameName
    });
  }
}
```

**Game Loop Manager:**

```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.sessionLives = 3;
    this.sessionScore = 0;
    this.sessionGames = [];
    this.combo = 0;
    this.currentLevel = 1;
  }

  create(data) {
    if (data && data.result) {
      this.processGameResult(data);
    }
    
    if (this.sessionLives > 0) {
      this.loadNextMiniGame();
    } else {
      this.endSession();
    }
  }

  processGameResult(data) {
    if (data.result === 'WIN') {
      this.sessionScore += data.score;
      this.combo++;
      this.sessionGames.push({ game: data.gameName, result: 'WIN' });
    } else {
      this.sessionLives--;
      this.combo = 0;
      this.sessionGames.push({ game: data.gameName, result: 'LOSS' });
      
      if (this.sessionLives === 0) {
        this.offerAdForLife();
      }
    }
  }

  loadNextMiniGame() {
    const availableGames = this.getAvailableGamesForLevel(this.currentLevel);
    const randomGame = Phaser.Math.RND.pick(availableGames);
    const difficulty = this.getDifficultyForLevel(this.currentLevel);
    
    this.scene.start(randomGame, {
      difficulty: difficulty,
      combo: this.combo
    });
  }

  offerAdForLife() {
    // Show ad-watching UI
    // If accepted and ad watched successfully:
    this.sessionLives = 1;
    this.loadNextMiniGame();
  }

  endSession() {
    this.scene.start('ResultScene', {
      gamesPlayed: this.sessionGames.length,
      score: this.sessionScore,
      sessionGames: this.sessionGames,
      bestCombo: this.calculateBestCombo()
    });
  }
}
```

### Data Persistence

**LocalStorage Structure:**

```javascript
const GameData = {
  totalScore: 0,
  currentLevel: 1,
  unlockedLevels: [1],
  unlockedAvatars: ['default_boy', 'default_girl'],
  currentAvatar: 'default_boy',
  achievements: [],
  stats: {
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    bestCombo: 0,
    perfectGames: 0
  },
  dailyChallenges: {
    lastCompleted: null,
    currentStreak: 0,
    longestStreak: 0
  },
  miniGameStats: {
    'wrestle_angel': { played: 0, won: 0, best_time: null },
    'water_to_wine': { played: 0, won: 0, best_time: null },
    'lost_sheep': { played: 0, won: 0, best_time: null },
    'samson_jawbone': { played: 0, won: 0, best_time: null },
    'baby_moses': { played: 0, won: 0, best_time: null },
    'peter_water': { played: 0, won: 0, best_time: null },
    'zacchaeus': { played: 0, won: 0, best_time: null },
    'joseph_coat': { played: 0, won: 0, best_time: null },
    'nehemiah_wall': { played: 0, won: 0, best_time: null },
    'red_sea': { played: 0, won: 0, best_time: null },
    'feeding_5000': { played: 0, won: 0, best_time: null },
    'jonah_fish': { played: 0, won: 0, best_time: null },
    // ... all 22 games
  },
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    hapticEnabled: true
  },
  parentalControls: {
    adsDisabled: false,
    leaderboardsDisabled: false,
    playtimeLimitMinutes: null
  }
};

// Save/Load functions
function saveGameData() {
  localStorage.setItem('biblicalGameData', JSON.stringify(GameData));
}

function loadGameData() {
  const saved = localStorage.getItem('biblicalGameData');
  return saved ? JSON.parse(saved) : getDefaultGameData();
}
```

### Mobile-Specific Considerations

**Touch Input:**
```javascript
// Use Phaser's pointer events, not mouse events
this.input.on('pointerdown', (pointer) => {
  // Handle tap
});

this.input.on('pointermove', (pointer) => {
  if (pointer.isDown) {
    // Handle drag/swipe
  }
});

// Detect swipe gestures
let swipeStartX, swipeStartY;
this.input.on('pointerdown', (pointer) => {
  swipeStartX = pointer.x;
  swipeStartY = pointer.y;
});

this.input.on('pointerup', (pointer) => {
  const swipeDistanceX = pointer.x - swipeStartX;
  const swipeDistanceY = pointer.y - swipeStartY;
  
  if (Math.abs(swipeDistanceX) > 100) {
    // Horizontal swipe detected
    const direction = swipeDistanceX > 0 ? 'RIGHT' : 'LEFT';
    this.handleSwipe(direction);
  }
});
```

**Device Tilt (Accelerometer):**
```javascript
// For games using device tilt (e.g., Wrestle Angel - HARD mode)
// Use Capacitor's Motion plugin

import { Motion } from '@capacitor/motion';

Motion.addListener('accel', (event) => {
  const tilt = event.accelerationIncludingGravity.x;
  // Use tilt value in game logic
  this.handleTilt(tilt);
});
```

**Performance Optimization:**
```javascript
// Mobile devices have limited resources
// Use these optimizations:

// 1. Limit particle effects
const particles = this.add.particles('particle', {
  speed: { min: -100, max: 100 },
  scale: { start: 0.5, end: 0 },
  blendMode: 'ADD',
  lifespan: 600,
  maxParticles: 50 // Limit for mobile performance
});

// 2. Use object pooling for frequently created/destroyed objects
class ObjectPool {
  constructor(scene, classType, initialSize) {
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = new classType(scene);
      obj.setActive(false).setVisible(false);
      this.pool.push(obj);
    }
  }
  
  get() {
    let obj = this.pool.find(obj => !obj.active);
    if (!obj) {
      obj = this.pool[0]; // Reuse oldest if pool full
    }
    return obj.setActive(true).setVisible(true);
  }
  
  release(obj) {
    obj.setActive(false).setVisible(false);
  }
}

// 3. Disable physics when not needed
this.physics.world.pause(); // Pause when not in gameplay
this.physics.world.resume(); // Resume when gameplay starts
```

**Responsive Design:**
```javascript
// Handle different screen sizes/orientations
const config = {
  type: Phaser.AUTO,
  width: 375,  // Base iPhone width
  height: 667, // Base iPhone height
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, ...]
};

// Force portrait orientation (via Capacitor config)
// capacitor.config.json:
{
  "plugins": {
    "ScreenOrientation": {
      "default": "portrait"
    }
  }
}
```

### Capacitor Integration

**Install Capacitor:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npm install @capacitor/ios @capacitor/android
```

**Add Plugins:**
```bash
# Haptics for vibration feedback
npm install @capacitor/haptics

# Motion for accelerometer (tilt detection)
npm install @capacitor/motion

# AdMob for advertisements
npm install @capacitor-community/admob

# In-App Purchases (if using paid unlocks)
npm install @capacitor-community/in-app-purchases
```

**Build for Mobile:**
```bash
# Build web version
npm run build

# Sync with native projects
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio (Android)
npx cap open android
```

### Ad Integration (AdMob)

```javascript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Initialize AdMob
await AdMob.initialize({
  requestTrackingAuthorization: true,
  testingDevices: ['YOUR_TEST_DEVICE_ID'],
  initializeForTesting: true, // Remove for production
});

// Show rewarded ad (for gaining extra life)
async function showRewardedAd() {
  const options = {
    adId: 'ca-app-pub-XXXXX/XXXXX', // Your AdMob ID
    isTesting: true, // Set false for production
  };
  
  await AdMob.prepareRewardVideoAd(options);
  const result = await AdMob.showRewardVideoAd();
  
  if (result.rewarded) {
    // User watched full ad, grant extra life
    this.sessionLives++;
    this.loadNextMiniGame();
  }
}

// Show banner ad (optional, on home screen)
async function showBannerAd() {
  const options: BannerAdOptions = {
    adId: 'ca-app-pub-XXXXX/XXXXX',
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true,
  };
  
  await AdMob.showBanner(options);
}
```

---

## Tutorial & Onboarding

### First-Launch Experience

The onboarding must be lightweight and non-blocking. Children ages 6-12 have near-zero patience for setup flows, so every screen must be skippable and the total onboarding time should not exceed 15 seconds.

**First Launch Flow:**

```
APP OPENS (first time ever)
├─ Splash Screen (1.5s auto-advance)
│  └─ App logo + "Bible Adventures" title
├─ Welcome Overlay (tap to advance)
│  ├─ "Welcome! Let's Play!"
│  ├─ Animated hand showing tap gesture
│  └─ [START PLAYING] button (large, pulsing)
├─ First Game Auto-Starts
│  ├─ Always starts with "Let There Be Light" (EASY)
│  ├─ Story context screen shows normally (3s)
│  ├─ Instruction screen has extra emphasis:
│  │  "TAP the light switch when it appears!"
│  │  + animated finger demo overlay
│  └─ Game plays normally
├─ Post-First-Game Overlay (only appears once)
│  ├─ "Great job! You earned [X] points!"
│  ├─ "You have 3 lives: ♥♥♥"
│  ├─ "Lose a game = lose a life. Keep playing!"
│  └─ [GOT IT!] button
└─ Normal session continues from here
```

**Design Principles:**
- No account creation, no name entry, no settings on first launch
- Teach by playing, not by reading
- The pre-game story context + instruction screens (already in the game loop) serve as per-game tutorials — onboarding only needs to teach "press play"
- Store `firstLaunch: false` in localStorage after first session completes
- If localStorage is empty (reinstall/new device), treat as first launch again

**Returning Player Flow:**

```
APP OPENS (returning player)
├─ Splash Screen (1s auto-advance)
├─ Home Screen loads immediately
│  ├─ Daily Challenge banner visible
│  └─ "Welcome back!" toast notification (2s, non-blocking)
└─ Player taps PLAY when ready
```

### Per-Game Instructions (Already Designed, Clarified Here)

Each mini-game already has a 2-second instruction screen before gameplay. For the prototype, these screens should include:

- **One sentence** describing the action: "Tap the screen quickly!"
- **Animated gesture demo**: A looping 1-second animation showing the required input (tap, swipe, drag, etc.)
- **Visual target highlight**: The interactive element glows or pulses to draw attention

These instruction screens ARE the tutorial for each game. No separate tutorial mode is needed.

---

## Difficulty Balancing & Configuration System

### Centralized Game Configuration

All difficulty parameters must be externalized into a single configuration object. This is critical for two reasons: rapid iteration during playtesting, and the adaptive difficulty system needs to modify these values at runtime.

**Master Configuration Structure:**

Difficulty parameters live in **`src/systems/gameConfig.js`**. That file is the single source of truth — read the values there, not here.

> This document used to carry its own copy of the config object. It was removed on 2026-09-24 after it was found to have drifted from the code: `fieryFurnace` easy read `timeLimit: 8.0` here against `6.0` in the codebase, `danielLionsDen` hard carried a `chargeable` flag that does not exist, and `houseOnRock` used `decoyFoundations` and `windForce: 1.5` against the code's `labelsVisible` and `windForce: 80`. Numbers duplicated across a spec and an implementation drift silently, and then someone balances against the wrong set.

What belongs in this document is the *reasoning* — why a knob exists and what it is meant to do. Per-game win and lose conditions are in the Mini-Game Specifications section above. The exact numbers are in code.

**Accessing Config in Mini-Games:**

```javascript
class WrestleAngelGame extends BaseGameScene {
  create(data) {
    const config = GAME_CONFIG.wrestleAngel[data.difficulty];
    this.targetTaps = config.targetTaps;
    this.timeLimit = config.timeLimit;
    this.pushBackChance = config.pushBackChance;
    this.tiltRequired = config.tiltRequired;
    // ... game setup uses config values exclusively
  }
}
```

### Adaptive Difficulty Modifiers

The adaptive difficulty system (defined in the Difficulty System section) works by applying multipliers to the config values at runtime. These modifiers are applied BEFORE the config is passed to the mini-game:

```javascript
function getAdjustedConfig(gameName, difficulty, sessionPerformance) {
  const baseConfig = { ...GAME_CONFIG[gameName][difficulty] };

  if (sessionPerformance.consecutiveWins >= 3) {
    // Make it slightly harder
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 0.93;  // 7% less time
    if (baseConfig.targetTaps) baseConfig.targetTaps = Math.ceil(baseConfig.targetTaps * 1.05);
  }

  if (sessionPerformance.consecutiveLosses >= 2) {
    // Make it slightly easier
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.10;  // 10% more time
    if (baseConfig.targetTaps) baseConfig.targetTaps = Math.floor(baseConfig.targetTaps * 0.90);
  }

  if (sessionPerformance.consecutiveLosses >= 4) {
    // Reduce to minimum difficulty for this level
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.25;
    if (baseConfig.targetTaps) baseConfig.targetTaps = Math.floor(baseConfig.targetTaps * 0.75);
  }

  return baseConfig;
}
```

### Debug Panel (Prototype Only)

For playtesting, include a hidden debug panel accessible by triple-tapping the version number on the home screen. This panel allows real-time adjustment of game parameters without redeploying.

**Debug Panel Features:**

```
┌─────────────────────────────────────────┐
│  DEBUG PANEL (triple-tap version to open)│
│                                          │
│  Current Game: [dropdown - all 22 games] │
│  Difficulty:   [EASY / MEDIUM / HARD]    │
│                                          │
│  Time Limit:   [slider: 1.0s - 15.0s]   │
│  Target Value:  [slider: 5 - 50]         │
│  Speed Factor: [slider: 0.5x - 3.0x]    │
│                                          │
│  ☑ Show hitboxes                         │
│  ☑ Show FPS counter                      │
│  ☑ Infinite lives                        │
│  ☐ Skip story screens                    │
│                                          │
│  [APPLY]  [RESET TO DEFAULTS]  [CLOSE]   │
└─────────────────────────────────────────┘
```

**Implementation:**

```javascript
class DebugPanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
  }

  handleVersionTap() {
    const now = Date.now();
    if (now - this.lastTapTime < 500) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = now;

    if (this.tapCount >= 3) {
      this.toggle();
      this.tapCount = 0;
    }
  }

  toggle() {
    this.visible = !this.visible;
    // Render/hide DOM overlay with sliders and checkboxes
    // Changes write directly to GAME_CONFIG at runtime
  }

  applyChanges(gameName, difficulty, overrides) {
    Object.assign(GAME_CONFIG[gameName][difficulty], overrides);
    console.log(`[DEBUG] Updated ${gameName}.${difficulty}:`, overrides);
  }
}
```

**Remove before production release.** Gate behind a build flag:

```javascript
const DEBUG_MODE = process.env.NODE_ENV === 'development';
if (DEBUG_MODE) {
  new DebugPanel(this);
}
```

### Playtesting Protocol

When testing difficulty with children, track the following metrics per session:

```
Per Mini-Game:
├─ Win rate by age group (6-8, 9-10, 11-12)
├─ Average completion time vs. time limit
├─ Number of attempts before first win
├─ Point at which child visibly disengages (observe, don't ask)
└─ Tap speed (taps per second) — actual vs. required

Per Session:
├─ Total session length before voluntary quit
├─ Number of ad-for-life uses (frustration indicator)
├─ Longest combo achieved
└─ Which game caused most failures
```

**Target Benchmarks:**
- Win rate on EASY should be 80-90% for the youngest age group (6-8)
- Win rate on EASY should be 95%+ for oldest group (11-12)
- Average session length should be 5-8 minutes before voluntary quit
- No child should fail the same game 3+ times in a row on EASY

If benchmarks aren't met, adjust GAME_CONFIG values and retest. The debug panel enables this in real-time during a playtest session.

---

## Asset Loading Strategy

### Boot Sequence

The game uses a two-phase loading approach: load the minimum required to show a loading screen, then load everything else with a visible progress bar.

**Phase 1: Immediate Load (BootScene)**

```javascript
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Phase 1: Only load what's needed for the loading screen itself
    // These should be tiny assets (<10KB total)
    this.load.image('loading-bg', 'assets/ui/loading-bg.png');
    this.load.image('loading-bar-frame', 'assets/ui/loading-bar-frame.png');
    this.load.image('loading-bar-fill', 'assets/ui/loading-bar-fill.png');
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
```

**Phase 2: Full Asset Load (PreloadScene)**

```javascript
class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Show loading bar
    const progressBar = this.add.image(187, 400, 'loading-bar-fill');
    progressBar.setCrop(0, 0, 0, progressBar.height);

    this.load.on('progress', (value) => {
      progressBar.setCrop(0, 0, progressBar.width * value, progressBar.height);
    });

    this.load.on('complete', () => {
      this.scene.start('MenuScene');
    });

    // Phase 2: Load ALL shared UI assets
    this.loadUIAssets();

    // Phase 2: Load ONLY the currently unlocked mini-game assets
    this.loadUnlockedGameAssets();
  }

  loadUIAssets() {
    // Shared assets used across all screens
    this.load.image('btn-play', 'assets/ui/btn-play.png');
    this.load.image('btn-back', 'assets/ui/btn-back.png');
    this.load.image('heart-full', 'assets/ui/heart-full.png');
    this.load.image('heart-empty', 'assets/ui/heart-empty.png');
    this.load.image('combo-badge', 'assets/ui/combo-badge.png');
    this.load.image('timer-bg', 'assets/ui/timer-bg.png');
    // ... all shared UI elements

    // Audio: shared sounds
    this.load.audio('sfx-win', 'assets/audio/win.mp3');
    this.load.audio('sfx-lose', 'assets/audio/lose.mp3');
    this.load.audio('sfx-tap', 'assets/audio/tap.mp3');
    this.load.audio('bgm-menu', 'assets/audio/menu-music.mp3');
  }

  loadUnlockedGameAssets() {
    const gameData = loadGameData();
    const unlockedGames = getUnlockedGamesForLevel(gameData.currentLevel);

    unlockedGames.forEach(gameName => {
      // Each game registers its required assets
      GAME_ASSETS[gameName].forEach(asset => {
        this.load[asset.type](asset.key, asset.path);
      });
    });
  }
}
```

**Game Asset Registry:**

```javascript
const GAME_ASSETS = {
  wrestleAngel: [
    { type: 'spritesheet', key: 'jacob-sprite',  path: 'assets/games/wrestle/jacob.png',  frameConfig: { frameWidth: 64, frameHeight: 64 } },
    { type: 'spritesheet', key: 'angel-sprite',  path: 'assets/games/wrestle/angel.png',  frameConfig: { frameWidth: 64, frameHeight: 64 } },
    { type: 'image',       key: 'wrestle-bg',    path: 'assets/games/wrestle/background.png' },
    { type: 'audio',       key: 'sfx-wrestle',   path: 'assets/games/wrestle/struggle.mp3' }
  ],
  waterToWine: [
    { type: 'image', key: 'jar',        path: 'assets/games/wine/jar.png' },
    { type: 'image', key: 'wine-bg',    path: 'assets/games/wine/background.png' },
    { type: 'audio', key: 'sfx-splash', path: 'assets/games/wine/splash.mp3' }
  ],
  letThereBeLight: [
    { type: 'image', key: 'switch',      path: 'assets/games/light/switch.png' },
    { type: 'image', key: 'dark-room',   path: 'assets/games/light/dark-room.png' },
    { type: 'image', key: 'lit-room',    path: 'assets/games/light/lit-room.png' },
    { type: 'audio', key: 'sfx-switch',  path: 'assets/games/light/switch-click.mp3' }
  ]
  // ... remaining 9 games follow same pattern
};
```

### Prototype Simplification

For the prototype, skip external asset files entirely. Generate placeholder visuals programmatically:

```javascript
// Instead of loading sprite images, draw shapes
class PrototypePlaceholders {
  static createCharacter(scene, x, y, color, label) {
    const body = scene.add.circle(x, y, 25, color);
    const head = scene.add.circle(x, y - 30, 15, color);
    const text = scene.add.text(x, y + 40, label, {
      fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5);
    return scene.add.container(x, y, [body, head, text]);
  }

  static createButton(scene, x, y, width, height, label, color) {
    const bg = scene.add.rectangle(x, y, width, height, color, 0.9)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(x, y, label, {
      fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    return { bg, text };
  }

  static createBackground(scene, colorTop, colorBottom) {
    // Simple gradient rectangle as background
    const graphics = scene.add.graphics();
    for (let y = 0; y < 667; y++) {
      const ratio = y / 667;
      const r = Phaser.Math.Interpolation.Linear([colorTop >> 16 & 0xFF, colorBottom >> 16 & 0xFF], ratio);
      const g = Phaser.Math.Interpolation.Linear([colorTop >> 8 & 0xFF, colorBottom >> 8 & 0xFF], ratio);
      const b = Phaser.Math.Interpolation.Linear([colorTop & 0xFF, colorBottom & 0xFF], ratio);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, y, 375, 1);
    }
  }
}
```

This avoids any asset loading delays during prototype development and lets you focus on gameplay mechanics.

---

## Error Handling & Recovery

### Data Persistence Safety

localStorage is the only persistence layer in the prototype. It is unreliable — it can be cleared by the OS, corrupted by a crash mid-write, or unavailable in certain browser contexts. All reads and writes must be guarded.

```javascript
const STORAGE_KEY = 'biblicalGameData';

function saveGameData(data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Write a backup with timestamp
    localStorage.setItem(STORAGE_KEY + '_backup', serialized);
    localStorage.setItem(STORAGE_KEY + '_lastSave', Date.now().toString());
  } catch (e) {
    console.warn('[Save] Failed to save game data:', e.message);
    // Storage might be full — don't crash, just lose this save
  }
}

function loadGameData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure has expected keys
      if (validateGameData(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Load] Primary save corrupted, trying backup...');
  }

  // Try backup
  try {
    const backup = localStorage.getItem(STORAGE_KEY + '_backup');
    if (backup) {
      const parsed = JSON.parse(backup);
      if (validateGameData(parsed)) {
        // Restore backup as primary
        localStorage.setItem(STORAGE_KEY, backup);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Load] Backup also corrupted, resetting to defaults.');
  }

  // Both corrupted or missing — fresh start
  return getDefaultGameData();
}

function validateGameData(data) {
  // Check that critical fields exist and have sane values
  return (
    typeof data === 'object' &&
    typeof data.totalScore === 'number' &&
    data.totalScore >= 0 &&
    typeof data.currentLevel === 'number' &&
    data.currentLevel >= 1 &&
    data.currentLevel <= 10 &&
    Array.isArray(data.unlockedLevels)
  );
}
```

### Scene Transition Safety

If a scene transition targets a non-existent scene (typo, missing import, race condition), the game freezes with no feedback. Wrap all transitions:

```javascript
function safeSceneStart(currentScene, targetSceneKey, data) {
  if (currentScene.scene.manager.keys[targetSceneKey]) {
    currentScene.scene.start(targetSceneKey, data);
  } else {
    console.error(`[Scene] Target scene "${targetSceneKey}" not found. Falling back to MenuScene.`);
    currentScene.scene.start('MenuScene');
  }
}

// Usage in BaseGameScene:
returnToGameLoop(won = true) {
  safeSceneStart(this, 'GameScene', {
    result: won ? 'WIN' : 'LOSS',
    score: this.score,
    gameName: this.gameName
  });
}
```

### Input Edge Cases

Children produce unpredictable input patterns. Handle these explicitly:

```javascript
// Tap debouncing: prevent double-registration from shaky fingers
class TapHandler {
  constructor(scene, minInterval = 50) {
    this.lastTapTime = 0;
    this.minInterval = minInterval;
    this.tapCount = 0;

    scene.input.on('pointerdown', (pointer) => {
      const now = Date.now();
      if (now - this.lastTapTime >= this.minInterval) {
        this.lastTapTime = now;
        this.tapCount++;
        this.onTap(pointer);
      }
    });
  }

  onTap(pointer) {
    // Override in usage
  }
}

// Drag safety: handle finger leaving game area mid-drag
class DragHandler {
  constructor(scene) {
    this.isDragging = false;
    this.dragTarget = null;

    scene.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.onDragStart(pointer);
    });

    scene.input.on('pointermove', (pointer) => {
      if (this.isDragging && pointer.isDown) {
        // Clamp to game bounds
        const clampedX = Phaser.Math.Clamp(pointer.x, 0, 375);
        const clampedY = Phaser.Math.Clamp(pointer.y, 0, 667);
        this.onDragMove(clampedX, clampedY);
      }
    });

    scene.input.on('pointerup', (pointer) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.onDragEnd(pointer);
      }
    });

    // Handle finger leaving the canvas entirely
    scene.input.on('pointerupoutside', (pointer) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.onDragCancel();
      }
    });
  }

  onDragStart(pointer) {}
  onDragMove(x, y) {}
  onDragEnd(pointer) {}
  onDragCancel() {
    // Return dragged object to its starting position
    // Don't count as a loss — just reset
  }
}
```

### Crash Recovery

If the app crashes or is force-closed mid-session, the next launch should handle it gracefully:

```javascript
// On session start, write a "session in progress" flag
function startSession() {
  const sessionState = {
    inProgress: true,
    startTime: Date.now(),
    score: 0,
    gamesPlayed: 0
  };
  localStorage.setItem('currentSession', JSON.stringify(sessionState));
}

// On session end (normal), clear the flag
function endSession(finalScore) {
  localStorage.removeItem('currentSession');
  // Save final score to game data normally
}

// On app launch, check for orphaned session
function checkForCrashedSession() {
  const orphan = localStorage.getItem('currentSession');
  if (orphan) {
    try {
      const session = JSON.parse(orphan);
      if (session.inProgress && session.score > 0) {
        // Award partial points from crashed session
        const gameData = loadGameData();
        gameData.totalScore += session.score;
        saveGameData(gameData);
        console.log(`[Recovery] Recovered ${session.score} points from crashed session.`);
      }
    } catch (e) {
      // Corrupted — just discard
    }
    localStorage.removeItem('currentSession');
  }
}
```

---

## Screen Size & Responsive Layout

### Base Resolution & Scaling Strategy

The game targets a base resolution of **375 x 667 pixels** (iPhone SE / iPhone 8 aspect ratio, 9:16). All game elements are designed against this base resolution.

**Phaser Scale Configuration:**

```javascript
const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,          // Scale to fit, maintain aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH  // Center in viewport
  },
  backgroundColor: '#000000',        // Letterbox bars are black
  scene: [BootScene, PreloadScene, MenuScene, GameScene, ResultScene, /* mini-games */]
};
```

### Aspect Ratio Handling

`Phaser.Scale.FIT` automatically letterboxes when the device aspect ratio doesn't match 9:16. This produces black bars on wider devices (tablets) or taller devices (iPhone 14 Pro Max at ~9:19.5).

**Acceptable aspect ratio range:** 9:16 to 9:20 (covers virtually all phones)

For devices outside this range (tablets at 3:4 or 4:3):

```javascript
// In BootScene, detect and warn or adjust
create() {
  const screenRatio = window.innerHeight / window.innerWidth;

  if (screenRatio < 1.4) {
    // Very wide device (tablet in landscape) — force portrait prompt
    this.showRotateDeviceScreen();
    return;
  }

  if (screenRatio > 2.2) {
    // Extremely tall device — letterbox is fine, just ensure
    // touch targets remain reachable
    console.log('[Layout] Very tall screen detected, using standard letterbox.');
  }

  this.scene.start('PreloadScene');
}

showRotateDeviceScreen() {
  // Display "Please rotate your device" message with phone icon
  // Listen for orientation change event to auto-continue
  window.addEventListener('orientationchange', () => {
    if (window.innerHeight > window.innerWidth) {
      this.scene.start('PreloadScene');
    }
  });
}
```

### Orientation Lock

The game is portrait-only. Lock orientation via Capacitor:

**capacitor.config.json:**
```json
{
  "appId": "com.yourcompany.biblicalgames",
  "appName": "Bible Adventures",
  "plugins": {
    "ScreenOrientation": {
      "default": "portrait"
    }
  }
}
```

For the browser-based prototype (no Capacitor), use CSS:

```css
#game-container {
  width: 100vw;
  height: 100vh;
  max-width: 375px;
  margin: 0 auto;
  overflow: hidden;
}

@media screen and (orientation: landscape) {
  #rotate-prompt {
    display: flex;
    /* Full-screen overlay prompting portrait rotation */
  }
  #game-container {
    display: none;
  }
}
```

### Touch Target Sizing

Per Apple's Human Interface Guidelines, minimum touch target size is **44x44 points**. At the 375px base width:

- **Buttons:** Minimum 44px height, ideally 50-60px for primary actions (PLAY, CONTINUE)
- **Interactive game elements:** Minimum 44x44px hitbox, even if the visual sprite is smaller. Use `setSize()` on Phaser game objects to expand the interactive area:

```javascript
// Light switch visual is 30x30, but hitbox is 50x50
const lightSwitch = this.add.image(x, y, 'switch');
lightSwitch.setInteractive();
lightSwitch.input.hitArea.setTo(-10, -10, 50, 50); // Expanded hit area
```

- **Cards (Noah's Ark memory game):** With 16 cards in a 4x4 grid on a 375px-wide screen, each card is about 80x80px — comfortably above the 44px minimum
- **HUD elements (hearts, pause button):** At least 36px, grouped with spacing so fat-finger taps don't hit the wrong element

### Safe Area Handling

Modern phones have notches, dynamic islands, and rounded corners. Ensure no interactive elements sit in the unsafe zone:

```javascript
// After Phaser initializes, calculate safe area insets
const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('env(safe-area-inset-top)')) || 20;
const safeAreaBottom = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('env(safe-area-inset-bottom)')) || 0;

// Offset HUD elements by safe area
const hudTopY = safeAreaTop + 10;    // Lives, timer positioned below notch
const hudBottomY = 667 - safeAreaBottom - 10;  // Progress bar above home indicator
```

For the prototype (browser), safe areas don't apply — but structuring the code this way means it works on real devices later without refactoring.

---

## Summary: What Was Missing vs. What You Now Have

### YOU HAD:
✗ Mini-game concepts without win/lose conditions  
✗ Vague difficulty mentions without parameters  
✗ Scoring mentioned but not designed  
✗ Lives system partially defined  
✗ No clear session structure  
✗ No educational integration plan  
✗ Weak progression hooks  
✗ No UI/UX flow defined  

### YOU NOW HAVE:
✓ Complete win/lose specs for all 22 mini-games
✓ Difficulty parameters (EASY/MEDIUM/HARD/EXPERT) for each game
✓ Full scoring system with combos and multipliers
✓ Complete lives system with ad integration
✓ Clear session structure (Challenge Run model)
✓ Educational integration at every touchpoint
✓ Progression system with unlocks, achievements, dailies
✓ Complete UI/UX flow from home to game to results
✓ Technical implementation notes for Phaser.js
✓ Capacitor integration guide for mobile deployment
✓ Tutorial & onboarding flow for first-launch and returning players
✓ Centralized difficulty config with adaptive modifiers and debug panel
✓ Playtesting protocol with target benchmarks by age group
✓ Two-phase asset loading strategy with prototype placeholder system
✓ Error handling for data persistence, scene transitions, input edge cases, and crash recovery
✓ Responsive layout strategy with aspect ratio handling, orientation lock, safe areas, and touch target sizing  

---

## Next Steps

1. **Review this document thoroughly** - Make sure you understand every system

2. **Prioritize for MVP** - You don't need to build everything at once:
   - **Phase 1 MVP:** 3 mini-games, basic scoring, lives system, simple UI
   - **Phase 2:** Remaining 19 mini-games, combo system, achievements
   - **Phase 3:** Daily challenges, leaderboards, advanced features

3. **Create asset list** - Based on this doc, list all visual/audio assets needed

4. **Start prototyping** - Build ONE complete mini-game end-to-end using the framework

5. **Test with kids** - Get real 6-12yo feedback on difficulty and engagement

---

**This is your actual game design. Not vague concepts. Not admin panel features. The real game.**

Now you can actually start building.
