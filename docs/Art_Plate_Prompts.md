# Art Plate Generation Prompts
**Project:** Biblical Mini-Games (Little Pebbles)
**Purpose:** Generate painted art plates and character sprites matching the locked reference style
**Target model:** Google Gemini 3 Pro Image ("Nano Banana Pro")
**Scope:** Art only — background, characters, props. No HUD; chrome composites separately in Phaser.
**Created:** 2026-08-26
**Companion doc:** `UI_Mockup_Prompts.md` — HTML/CSS mockups for screens and HUD

---

## How to Use This Document

1. Read **Why Gemini 3 Pro specifically** — the model tier matters, Flash will not work
2. Follow **Workflow** to set up the conversation with your three style references
3. Paste the **STYLE LOCK preamble** once per conversation
4. Calibrate on **Scene 12: David vs Goliath** before running anything else
5. Work through the remaining scene blocks, one change per turn when iterating
6. Run **Pass B** sprite prompts in the same conversation as their scene

**Reference images live in:** `H:\My Drive\bible game\sprite samples`

---

## Why Gemini 3 Pro specifically

Per Google's API docs, model tiers differ in what reference images they accept:

| Model | Object refs | Character refs | Style refs |
|---|---|---|---|
| Gemini 3 Pro Image | 6 | 5 | **3** |
| Gemini 3.1 Flash | 10 | 4 | — |
| Gemini 3.1 Flash Lite | 14 | — | — |

Only **Pro** has a documented style-reference slot. Style transfer is the whole job here, so use Pro.

Other confirmed facts:
- Supported aspect ratios include **16:9** (game canvas is 667x375 = 16:9)
- Output resolutions: 512px / 1K / 2K / 4K
- **No documented alpha channel output** — hence the magenta-key workflow for sprites
- All outputs carry an invisible **SynthID** watermark (does not block commercial use)
- Negative prompts are not a feature — phrase exclusions as plain instructions

Reference provenance note: `david.png` came from a Google model (IPTC says "Made with Google AI").
The other five carry `hf-job-id` chunks — Hugging Face. The style set is not from one source, which
is part of why matching is fuzzy. `david.png` is the strongest anchor for this pipeline.

---

## Workflow

1. Open a Gemini 3 Pro Image conversation
2. Attach exactly three style references: **`david.png`, `nativity.png`, `adam&eve.png`**
   (anchor / multi-character staging / full-body proportions — Pro caps style refs at 3)
3. Paste the **STYLE LOCK preamble** once
4. Paste a scene block; generate; iterate one change per turn
5. Paste the next scene block in the same conversation — style carries forward
6. Start a fresh chat when drift appears (usually after 6–8 generations)

---

## STYLE LOCK preamble

Paste once at the top of each conversation, with the three reference images attached.

```
I've attached three images. Use all three as STYLE REFERENCES only — copy their
drawing style exactly, but do not copy their subjects or compositions.

The style to match, precisely:
- Flat 2D children's cartoon illustration, digital, no photographic elements.
- Every shape has a bold black outline of consistent, uniform thickness.
- Fills are flat with very soft internal shading. No texture, no visible brush
  strokes, no rim lighting, no drop shadows on the characters themselves.
- Characters have pastel, non-human skin colors — periwinkle blue, mint green,
  lavender. Never realistic skin tones. This is essential to the style.
- Eyes are very large white ovals with big black pupils and a full black
  outline, taking up roughly a quarter of the head's height.
- Every face has soft pink oval blush on both cheeks.
- Bodies are chunky and rounded with no sharp corners, mitten-like hands, and
  large heads roughly one third of the total body height.
- The whole palette is desaturated pastel — mint, cream, soft sky blue, dusty
  rose, muted tan, pale lavender. Nothing is a saturated primary color.
```

## Standard scene footer

Append these two lines to **every** scene block below.

```
Composition: Wide landscape shot, 16:9 aspect ratio.
Do not include any user interface elements, text, numbers, hearts, score
counters, buttons, borders or frames. This is background artwork only.
```

---

## Calibration loop

Change **one thing per turn**. Gemini's image editing is conversational — it preserves what you
don't mention. Rewriting the whole prompt each time throws away the consistency you're paying for.

| Symptom | Next turn |
|---|---|
| Skin went realistic | "The skin must not be a human skin tone. Make it pastel blue and green." |
| Outlines thin or missing | "Make the black outlines thicker and put an outline on every shape." |
| Too colorful | "Desaturate the whole palette. Nothing should be a bright primary color." |
| Painterly, textured | "Flatten the shading. Remove all texture and brush strokes." |
| Proportions too adult | "Make the heads larger relative to the bodies." |
| Ground shadow in a sprite | "Remove the shadow under him. The background must be pure flat magenta." |

---

## Pass A — Scene plates

Calibrate on **David vs Goliath** first: `david.png` came from this same Google model, so it is the
tightest possible style anchor. Confirm the style holds before running the other twenty-one.

### Scene 12: David vs Goliath — *aim & release (1 Samuel 17)*

```
Now draw a new scene in exactly that style.

Scene: David and Goliath facing off in a desert canyon.

DAVID is a small boy with periwinkle blue skin and darker blue hair, wearing a
simple cream tunic with a tan sash and leather sandals. He stands in the left
third of the frame, leaning forward with determination, holding a small leather
sling pulled back and ready to release. He is roughly half of GOLIATH's height.

GOLIATH is an enormous giant with mint green skin, filling the right half of the
frame. He wears a pale sage-grey helmet, a brown leather kilt with a wide belt,
a leather shoulder pauldron, and heavy sandals. He is hunched forward, scowling
down at David, with two small white tusks in a downturned mouth. He should look
comically oversized and grumpy rather than frightening — this is for children
aged 6 to 12.

Setting: A wide desert canyon floor in warm pastel sand. Rounded, soft-edged
rock formations in dusty rose and pale periwinkle sit on the horizon behind
them. The sky is a soft vertical gradient from pale sky blue at the top,
through mint, to warm cream at the horizon, with two or three simple white
clouds that have black outlines and flat bottoms.

Composition: Wide landscape shot, 16:9 aspect ratio. Both characters fully
visible and standing on the ground, with clear empty sky above them. Keep the
upper-left and upper-right corners relatively uncluttered.

Do not include any user interface elements, text, numbers, hearts, score
counters, buttons, borders or frames. This is background artwork only.
```

---

## Pass B — Character sprites

Run these **in the same conversation, immediately after the scene**. That is the whole trick: the
sprite inherits the established character design instead of reinventing it, and `GOLIATH` is a name
the model is already tracking.

### Why magenta, and why the margin

**Magenta** (`#FF00FF`) because Gemini has no documented alpha output — ask for transparency and you
get an opaque background anyway. So you key it out yourself, and you need a colour that shares
nothing with the palette. Green screen is the wrong call here: the characters have **mint green
skin** (`168,221,181`), too close to pure green for a safe tolerance. Magenta's nearest neighbour in
the palette is the pink blush (`245,181,200`), still 181 away in the green channel.

**The margin** solves two non-colour problems: the keyer needs uninterrupted background pixels all
the way around the silhouette (a character touching the frame edge gets clipped flat), and visible
magenta on all four sides is your proof that no limb got cropped. You crop to the alpha bounding box
after keying anyway, so it costs nothing.

**Expect magenta fringing.** Anti-aliased edge pixels blend character colour with background,
leaving a faint pink halo. Fix with a defringe/decontaminate pass, or key with a tight fuzz and
erode one pixel. Keying command: `magick in.png -fuzz 12% -transparent magenta out.png`

### Sprite prompt — Goliath

```
Now, keeping the exact same art style and the exact same character design from
the image you just made, redraw GOLIATH alone as a game sprite.

- GOLIATH only. No David, no rocks, no sky, no ground, and no shadow beneath him.
- Full body, head to feet, facing slightly left, in a neutral idle standing pose
  with both arms held away from his sides so the silhouette reads cleanly.
- Place him centered on a completely flat, solid, uniform magenta background
  (#FF00FF). The background must be one perfectly even color with no gradient,
  no texture, no shading and no shadow of any kind.
- No magenta anywhere on or inside his body.
- Square 1:1 framing with a small even margin of magenta around him.
```

### Sprite prompt — David

Note the two deliberate differences: he faces **right** (they need to look at each other), and the
sling is stripped out.

```
Now, keeping the exact same art style and the exact same character design from
the scene image, redraw DAVID alone as a game sprite.

- DAVID only. No Goliath, no rocks, no sky, no ground, and no shadow beneath him.
- Full body, head to feet, facing slightly right, in a neutral idle standing pose
  with both arms held away from his sides so the silhouette reads cleanly.
- He is empty-handed in this sprite — no sling, no stone, nothing held.
- Place him centered on a completely flat, solid, uniform magenta background
  (#FF00FF). The background must be one perfectly even color with no gradient,
  no texture, no shading and no shadow of any kind.
- No magenta anywhere on or inside his body.
- Square 1:1 framing with a small even margin of magenta around him.
```

### Sprite prompt — sling (separate object)

The sling is what *moves* in an aim-and-release game. Bake it into David and you cannot rotate the
pull angle independently — you would be re-rendering him at every draw angle. Generate it separately,
anchor it to his hand in Phaser, rotate on drag. Same logic applies to the stone.

```
Now draw just the leather sling from the scene, alone, as a game object.

- The sling only — no character, no hands, no arms.
- Side view, held horizontally, with the pouch on the left and the Y-shaped
  frame on the right, as if pulled back and ready to release.
- Same art style, same bold black outline, same muted tan and brown leather.
- Flat solid uniform magenta background (#FF00FF), no shadow, no gradient.
- Square 1:1 framing with an even magenta margin.
```

**Rule of thumb:** anything that rotates, scales, or animates independently gets its own sprite.
Everything welded to the character stays in the character sprite.

---

## The remaining 21 scene blocks

Numbered to match `ALL_GAME_KEYS` order in `src/utils/constants.js`. Remember the standard footer.

### Scene 1: Let There Be Light — *tap the switch when it lights up (Genesis 1:3)*

Mechanic: tap the lit switch within the reaction window; decoys on medium; sequential order on hard.

```
Scene: The moment of creation, in darkness.

Setting: A deep indigo and dusty purple void filling the frame, with soft
swirling pastel nebula clouds in lavender and dusty rose drifting through it,
and a scattering of tiny pale stars.

Objects: Four chunky cartoon wall-mounted light switch plates float in the
middle of the void, evenly spaced in a loose horizontal row. Each is a rounded
cream-colored plate with a bold black outline and a small tan toggle lever.
One switch on the left is flipped ON and glows warm butter yellow, casting a
soft round pool of warm light around it. The other three are OFF and unlit.

Character: A small round smiling STAR character with a soft yellow face, two
big black dot eyes and pink blush hovers near the lit switch, just becoming
visible in its glow. Cheerful, not spooky.
```

Darkest plate in the set by design. Keep it curious, not gloomy — the audience is six-year-olds.
**Risk: high.** The glow effect fights the flat-fill style rule. Expect to iterate.

**What actually came back (2026-08-29):** one switch rather than four, in the OFF position, with the
star character floating beside it. Better than the brief — it means the switch is not welded into the
background. Treat the dark plate as a pure backdrop and the switch as a separate sprite (Scene 1c).

#### Scene 1b: Light state — run as an EDIT, not a fresh generation

This game toggles between a dark state and a lit state. The two plates **must be pixel-aligned**, or
the switch shifts a few pixels between states and visibly jumps when the player taps it. Editing the
existing image is the only reliable way to hold that position. Attach the finished dark plate.

```
Using the attached image, keep the composition, framing and every object in
exactly the same position. Change only the lighting and the elements below.

THE SWITCH — keep the plate exactly as it is: same size, same position, same
rounded white plate, same bold black outline, same two tan screw dots. Flip the
tan toggle lever UP into the ON position. The switch is now on, so add a soft
warm butter-yellow glow radiating outward from the plate.

THE SKY — replace the dark indigo and purple void with bright daytime sky: a
soft vertical gradient from pale sky blue at the top, through pale mint, into
warm cream toward the bottom. Remove all the small scattered stars.

THE CLOUDS — keep the exact same flowing ribbon shapes and paths as the purple
nebula clouds, in the exact same positions, but redraw them as soft white
daytime clouds with gently rounded edges and a faint pale blue underside.

THE STAR BECOMES A SUN — replace the small yellow star character with a small
round sun character in the same position and at a similar size. The sun keeps
the star's exact face: the same two round black dot eyes, the same soft pink
oval blush on both cheeks, the same small curved smile. Same soft butter-yellow
fill, same warm tan-gold outline. Give it short rounded triangular rays around
the edge of its circular body.

Keep the same flat cartoon style, the same bold outlines and the same
desaturated pastel palette. Do not add any user interface elements, text,
numbers, buttons, borders or frames.
```

**If it repaints the plate anyway** — editing models like to "improve" what you told them to leave
alone — follow up with one turn:

> The switch plate moved. Put it back in exactly the same position and at exactly the same size as
> the original image. Change only the lever direction.

#### Scene 1c: Switch sprite pair

Medium difficulty needs decoys and hard needs a three-switch sequence, so the switch cannot live
baked into the background. Generate an OFF/ON pair and let Phaser place and toggle four instances
over the backdrop.

OFF state:

```
Now draw just the light switch plate from this scene, alone, as a game object.

- The switch plate only — no sky, no clouds, no star, no glow, no shadow.
- Front view, exactly the same plate design: rounded white plate, bold black
  outline, two tan screw dots, chunky tan toggle lever in the OFF position
  pointing down.
- Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
- Square 1:1 framing with an even magenta margin.
```

ON state — same prompt with these two bullets swapped in:

```
- Front view, exactly the same plate design: rounded white plate, bold black
  outline, two tan screw dots, chunky tan toggle lever flipped UP into the ON
  position.
- Add a soft warm butter-yellow glow around the plate. The glow must not touch
  the edge of the frame, and the background outside it stays pure flat magenta.
```

Generate the ON state **immediately after** the OFF state in the same conversation so the plate
geometry carries over. Same pixel-alignment logic as 1b: if the plate changes size between the two
sprites, the switch will pop when it toggles.

**State-pair pattern.** Any object with two visual states — this switch, and potentially the
He Must Increase tiles — gets generated as a pair by editing the first into the second, never as two
independent generations. Applies to scene plates and sprites alike.

### Scene 2: Noah's Ark — *memory match, grid up to 4x4 (Genesis 7:9)*

Mechanic: flip cards to find matching animal pairs. Grid is drawn at runtime over this backdrop.

```
Scene: The interior deck of Noah's ark, as a backdrop.

Setting: A wide wooden deck inside the ark, built from chunky muted tan planks
with a bold black outline. Thick wooden support beams frame the left and right
edges of the frame. Through a large opening in the back wall, a clearing pastel
sky is visible with a soft rainbow in muted bands of dusty rose, peach, pale
yellow, sage, powder blue and lavender.

Characters: Pairs of small pastel cartoon animals peek in from the far left and
far right edges only — a lavender donkey, a mint sheep, a periwinkle lion, a
dusty rose elephant. Big white eyes, black pupils, pink blush on each.

Important: Keep the entire centre of the frame open, uncluttered and evenly
lit. A grid of game cards will be drawn on top of it, so nothing important
should sit in the middle.
```

This is a **backdrop, not a composed scene**. Judge it on whether the centre stays clean.

### Scene 3: Tower of Babel — *tap blocks to destroy the tower (Genesis 11:1-9)*

Mechanic: **demolition, not construction.** Tap blocks to bring the tower down before it tops out.

```
Scene: The Tower of Babel, mid-collapse.

Setting: A wide dusty plain under a hazy pale gold sky with a few thin
outlined clouds.

Object: A tall stepped ziggurat tower rises from the centre of the frame toward
the top edge, built from large chunky rectangular blocks in muted tan and dusty
clay with bold black outlines and visible mortar lines. Several blocks near the
middle are cracked and one or two have broken free and tumble outward, drawn
with small cartoon dust puffs.

Characters: Three tiny builders — periwinkle blue, mint green and lavender
skin, in simple cream work tunics — stand at the base of the tower looking up
in comic alarm, arms raised. They are small; the tower dominates.

The tower should read as tall and precarious, not menacing.
```

### Scene 4: Wrestle the Angel — *tap as fast as you can (Genesis 32:24-26)*

Mechanic: tap-mash to a target count; push-backs subtract progress on medium and hard.

```
Scene: Jacob wrestling the angel at the river ford, all night.

Setting: A shallow rocky river crossing at dawn. Soft pastel water in pale
mint and powder blue with simple outlined ripple lines, rounded river stones in
dusty rose and sage along the bank, and a sky graduating from deep lavender at
the top to warm peach at the horizon.

Characters: JACOB, on the left, has periwinkle blue skin, dark blue hair and a
tan tunic. He is braced forward, gripping THE ANGEL, jaw set, refusing to let
go. THE ANGEL, on the right, has mint green skin and a completely bald, rounded
head with no hair. A simple flowing white robe draped asymmetrically over one
shoulder, mint green hands and bare mint green feet. Two large white feathered
wings behind the shoulders with a bold black outline, the feathers divided into
layered rows by simple curved lines. A thin pale gold ring floats horizontally
above the head, not touching it. The angel's expression is calm and patient,
not angry.

They are locked together at centre frame, roughly the same height, leaning into
each other. Playful determination, not violence — this is for children.
```

**This is the canonical ANGEL design** (locked 2026-09-23, from JJ's reference image). The same
figure appears as the player-controlled sprite in Scene 8. Mint green skin, bald, white robe, white
feathered wings, thin gold halo ring. It replaces an earlier pale-cream spec — if you find cream
angels in older notes, they are stale.

### Scene 5: Water to Wine — *swipe up to fill (John 2:1-11)*

Mechanic: swipe up to raise the fill toward a target band; colour drains back on hard.

```
Scene: The wedding feast at Cana.

Setting: A warm indoor wedding hall with cream plaster walls and a rounded
alcove arch in the back wall. A garland of sage green leaves and small pink
flowers swags across the top of the frame. A long wooden table in muted tan
runs across the foreground.

Objects: One large clay water jar stands centred on the table, tall with a wide
rounded body, two curved handles and a lipped rim, in muted tan with a bold
black outline. It is filled a little over halfway with liquid that is pale blue
at the surface and deepens into soft wine purple lower down, with a few small
white bubbles rising. Two smaller clay jars sit further back on the table.

Character: A wedding GUEST with mint green skin stands to the right of the jar,
in a sage green robe, holding up a small clay cup, eyes closed in delight with
a wide happy smile and pink blush.
```

### Scene 6: Roll the Stone Away — *drag the stone (Luke 24:2)*

Mechanic: drag the stone to a target displacement (80% easy, 100% medium and hard); falling rocks to
dodge on hard. **The drag is continuous**, so the reveal cannot be a two-plate swap — see layering.

#### Layering — read before generating anything

The player drags the stone progressively, so JESUS must be revealed gradually as it moves. That means
three layers, not one composed image:

| Layer | Asset | Contents |
|---|---|---|
| 0 | Scene 6 backdrop plate | Hillside, sky, rock face with an **empty dark doorway**. No stone, no figure. |
| 1 | `jesus_risen` sprite | Sits inside the doorway, behind the stone. Progressively revealed. |
| 2 | `tomb_stone` sprite | Slides horizontally along the track on drag. |

Bake the stone or the figure into the backdrop and the reveal stops working. This is why the backdrop
prompt below differs from the other scenes — it deliberately generates an empty doorway.

#### Backdrop plate

```
Scene: The garden outside the empty tomb on Easter morning.

Setting: A rocky hillside garden at dawn. A tomb entrance is cut into a large
pale sandstone rock face on the right side of the frame — a tall rounded
doorway that is completely dark and empty inside, with a carved stone track
running horizontally along its base. Soft pastel garden foliage in sage and
mint sits at the edges, with a few small pink and cream flowers. The sky is a
warm gradient from pale gold at the horizon up through peach to soft powder
blue, with two outlined clouds catching the light.

The doorway must be empty — no stone, no figure and nothing else inside it.
The stone track must be clear and unobstructed along its whole length.

No characters. Warm, hopeful and calm.
```

#### The JESUS character — design note

Skin is **seafoam `#B8E3D4`** — a cool, pale blue-green (h159 s43 l81).

Pale cream was the obvious alternative, following `nativity.png` where the infant Christ is cream
against Mary's periwinkle and Joseph's mint. Seafoam was chosen over it on hue-clearance grounds
after reviewing the full candidate palette.

*Historical note:* cream was originally rejected because the Angel was specced as pale cream. That is
no longer true — the Angel was redesigned as mint green on 2026-09-23 and **cream is now unassigned**.
The seafoam decision stands on its own merits; it was not reached by elimination.

**The risk with seafoam, stated plainly.** Its nearest neighbour is the mint green used for Goliath,
Noah and John the Baptist — only **24° of hue separation** (mint sits at h135), with near-identical
saturation and lightness. That is close enough to read as "another mint character" at sprite size
unless the prompt pushes it. The prompt below therefore names it as *distinctly blue-green, not
yellow-green*, which is the axis that actually separates the two. If a generation comes back looking
like a pale Goliath, that phrase is the lever — repeat it and push cooler.

**Upside over the rose it replaces.** Cool green skin takes the standard cast blush `#F5B5C8` cleanly
— warm pink on cool green is high contrast, so no custom blush is needed. The gold sash and halo also
read as a complementary pop against it rather than blending in.

Hue clearances for the whole cast are worked out in the palette reference; the short version is that
the assigned hues are periwinkle 217°, mint 135°, lavender 265°, cream 44° and rose 0°.

#### JESUS sprite

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

JESUS, risen, standing calmly. Full body, head to feet, facing forward.

- Skin is a cool pale seafoam, roughly #B8E3D4 — a soft blue-green. It must
  read as distinctly BLUE-green, clearly cooler and bluer than the yellow-green
  mint used for the other characters. Never a realistic human skin tone.
- Soft brown shoulder-length hair and a short neat brown beard, drawn as chunky
  rounded shapes with the same bold black outline.
- Large white oval eyes with big black pupils, soft pink blush on both cheeks,
  and a gentle warm closed-mouth smile. Calm and kind, not solemn.
- A simple flowing white robe with a soft pale gold sash at the waist, and bare
  feet.
- Both arms relaxed at his sides, palms open and turned slightly forward.
- A thin pale gold ring floats horizontally above his head.
- No glow, no light rays, no shadow.

Place him centered on a completely flat, solid, uniform magenta background
(#FF00FF) with no gradient, no texture and no shadow. Square 1:1 framing with a
small even margin of magenta around him.
```

**Do the glow in Phaser, not in the sprite.** A soft gold radial glow fading into magenta is exactly
the case that fringes badly when keyed — you get a dirty pink halo baked into the asset with no clean
way to remove it. Generate him flat, then put a radial-gradient graphic behind him at runtime and
tween its alpha as the stone clears. Better result, and the glow becomes something you can tune
without regenerating art.

#### Stone sprite

```
Now draw just the tomb stone from this scene, alone, as a game object.

- The stone only — no tomb, no rock face, no garden, no ground, no shadow.
- A very large round stone disc seen face on, slightly thicker than a coin, in
  pale grey-lavender with a bold black outline and a few simple curved texture
  lines across its face.
- It should look heavy and satisfying to push.
- Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
- Square 1:1 framing with an even magenta margin.
```

### Scene 7: Daniel in the Lions' Den — *drag to dodge (Daniel 6)*

Mechanic: drag Daniel to avoid 2–4 roaming lions for the survival duration.

```
Scene: Daniel standing calmly in the lions' den.

Setting: The inside of a deep stone pit. The back wall is built from rows of
large rounded stone blocks in muted dusty rose and pale periwinkle with bold
black outlines. The floor is warm pastel sand. A soft shaft of pale gold light
falls from an opening high above, down onto the centre of the pit.

Characters: DANIEL stands in the centre in the shaft of light. He has lavender
skin, a cream robe with a soft gold sash, hands clasped peacefully in front of
him, and his eyes closed in calm prayer with pink blush on his cheeks. Three
cartoon LIONS are positioned around him — pale cream-gold bodies with big
rounded dusty orange manes, oversized white eyes with black pupils, small pink
noses and pink blush. They look sulky and sleepy rather than fierce.

Leave a clear band of open sand across the lower third of the frame so
characters can move.
```

### Scene 8: The Fiery Furnace — *deflect fireballs with the angel (Daniel 3:25)*

**Gameplay redesigned — see `biblical_game_design_doc.md` §6** for the mechanic, win/lose
conditions, input model and config. That document is canonical for how this game plays. What follows
here is art only.

In short, so the art briefs make sense: fireballs fly in from both side edges toward three boys
standing in the centre, and the player drags an angel around the screen to intercept them.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Furnace interior. Centre and both side lanes kept clear. |
| 1 | `boys_trio` | Three friends, static, centred around (333, 210). |
| 2 | `fireball` | Spawned off-canvas left and right, drifting inward. |
| 3 | `angel_cursor` | Follows the player's drag, offset ~45px above the finger. |
| 4 | `deflect_burst` | One-shot at each successful block. |

#### Backdrop plate

```
Scene: The inside of the fiery furnace, as a backdrop.

Setting: A large domed brick furnace chamber seen from within. The walls are
built from chunky rounded bricks in deep dusty clay and muted plum with bold
black outlines — darker and cooler than a warm amber room. Cartoon flames sit
along the floor and creep up the far left and far right edges only: rounded,
soft-edged, outlined flame shapes in pale gold, soft peach and dusty coral,
flat and stylised, never realistic fire. Two large wooden bellows rest against
the lower left wall.

Keep the entire centre of the frame open and uncluttered, and keep a clear
horizontal band across the middle third of the frame running from the far left
edge to the far right edge. Characters and projectiles are drawn on top of
this, so nothing important or bright may sit there.

The background must stay darker and cooler than the flames, so that bright
gold projectiles drawn over it remain clearly visible at all times.

No characters.
```

#### Colour readability — the constraint that shapes this scene

The angel is the player's cursor, so it has to be unmistakable at speed. The scene is built around
three separations, ordered by how much each actually matters in play:

| Must read apart | What carries it |
|---|---|
| **Angel vs boys** | The angel is the only green on screen, and the only figure with wings and a halo |
| **Boys vs fireballs** | Boys are cool-toned and static; fireballs are the only warm saturated objects, and they move |
| Boy vs boy | Barely matters — the trio is one clustered target, not three things the player tracks separately |

That last row is the reason the third boy moved from mint green to **soft mauve `#D8BEDD`**
(decided 2026-09-24). Mint would have matched the angel exactly. Mauve sits 155° from it. It lands
only 25° from his lavender brother, which is tight — but boy-to-boy separation is cosmetic here, so
the trade is strongly worth it.

*History:* the swap was declined once, on the argument that wings and a halo carry the separation by
silhouette alone. That argument is still true and still useful as a second line of defence — but
there is no reason to lean on it when a free hue is available. Do not restore mint to the trio.

Final roster for this scene:

| Role | Colour | Hue |
|---|---|---|
| Angel — player-controlled | Mint green `#A8DDB5` | 135° |
| Boy 1 | Periwinkle `#A9C4EE` | 217° |
| Boy 2 | Lavender `#C9B6E4` | 265° |
| Boy 3 | Soft mauve `#D8BEDD` | 290° |
| Fireballs | Gold core into coral | ~30° |

**If the two purples blur at sprite size**, give them clearly different tunics — one cream, one dusty
rose — before touching a skin colour. They are a static group; costume is enough to separate them.

The backdrop is deliberately darker and cooler than every character and projectile, so nothing on the
play layer disappears into it.

#### Delivered assets

Generated and approved 2026-09-24. These supersede the prompts below — the prompts are kept as the
record of what was asked for and as the basis for regenerating or extending the set.

| File | Asset | Notes |
|---|---|---|
| `furnace background.jpg` | Backdrop plate | Arched brick vault in dusty plum and clay. Flames confined to the left and right edges plus a row along the floor. Centre clear. |
| `furnace angel.jpg` | `angel_cursor` | **Profile view facing left**, mid-flight. Magenta key background. |
| `furnace boys.jpg` | `boys_trio` | Three boys, periwinkle / lavender / pink. Magenta key background. |

**The angel came back in profile rather than the front view the prompt asked for, and that is an
improvement** — a game that flips the sprite by screen side needs a profile. The prompt below still
says front view; treat the delivered asset as correct and the prompt as superseded.

**Facing behaviour** is specified in `biblical_game_design_doc.md` §6: the sprite faces left by
default and is mirrored on the X axis on the right half of the screen, with a dead zone around the
centre line so it does not strobe.

#### `angel_cursor` sprite

```
Now draw THE ANGEL alone, in exactly the same art style, as a game sprite.

- THE ANGEL only — no boys, no furnace, no flames, no ground, no shadow.
- Mint green skin and a completely bald, rounded head — no hair.
- Large white oval eyes with big black pupils, thin arched black eyebrows, a
  tiny nose, soft pink oval blush on both cheeks, and a small gentle
  closed-mouth smile. Calm and kind.
- A simple flowing white robe draped asymmetrically over one shoulder, falling
  to the ankles, with a loose sleeve. Mint green hands and bare mint green feet
  visible.
- Two large white feathered wings behind the shoulders with a bold black
  outline, the feathers divided into layered rows by simple curved lines. Both
  wings open and clearly visible.
- A thin pale gold ring floats horizontally above the head, not touching it.
- Front view, facing forward, arms held slightly out from the sides, full body,
  head to feet.
- No glow, no light rays, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around the figure.
```

#### `boys_trio` sprite

```
Now draw THE THREE FRIENDS together, alone, as a single game sprite.

- The three boys only — no angel, no furnace, no flames, no ground, no shadow.
- Three young boys standing close together in a tight group, shoulder to
  shoulder, facing forward, the middle one slightly forward of the other two.
- One has periwinkle blue skin, one has lavender skin, and one has soft mauve
  skin — a pale pink-purple. None of the three is green: the angel is the only
  green character in this game and the boys must never be mistaken for it.
- Give each a clearly different tunic so they read apart from one another: one
  cream, one dusty rose, one muted tan. Bare feet.
- All three are completely calm and unafraid — eyes closed peacefully or softly
  smiling, pink blush on every cheek, hands at their sides or gently clasped.
  They are never flinching, cowering or frightened.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

**They stay calm even when a fireball lands.** No flinch animation, no hurt state. That is the
theology doing work in the animation: they were never in danger, which is the entire point of the
story. Resist the instinct to add a damage reaction.

#### `fireball` sprite

```
Now draw a single fireball, alone, as a game object.

- The fireball only — no character, no background, no shadow.
- A rounded teardrop of flame travelling to the LEFT, with a short trailing
  flame tail behind it on the right.
- Flat cel fill: a pale gold core, a soft peach middle and a dusty coral outer
  edge, all with a bold black outline. Flat and stylised — no glow, no gradient
  blur, no light rays, no sparks.
- It must read as hot and dangerous while staying friendly and cartoon-like.
  This is for children aged 6 to 12.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

One sprite covers both directions — flip it horizontally in Phaser for the right-edge spawns. Don't
generate a second one; two independent generations will differ in size and the fireballs will look
mismatched depending on which side they came from.

#### `deflect_burst` sprite

```
Now draw a small impact burst, alone, as a game effect.

- A single round starburst: six to eight short rounded spikes radiating from a
  small soft centre, like a comic-book impact pop.
- Flat cel fill in pale gold with a soft white centre and a bold black outline.
- No character, no fireball, no background, no shadow, no motion lines.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

### Scene 9: House on Rock vs Sand — *drag the house to the rock (Matthew 7:24-27)*

Mechanic: drag the house onto the rock foundation; wind pushes back on hard.

```
Scene: The parable of the two foundations — a split landscape.

Setting: The frame divides down the middle. On the LEFT, a broad solid grey
rock outcrop with bold black outlines and flat rounded facets, sitting above
calm ground. On the RIGHT, loose golden sand with visible drift ripples and a
shallow puddle of pale blue floodwater creeping in. Behind both, a stormy sky
of layered dusty lavender and slate clouds with outlined edges, and slanted
pastel rain streaks on the right half only.

Object: A small cartoon house floats in the centre of the frame, as if being
carried into place — chunky and rounded with cream walls, a dusty rose pitched
roof, one round window and a small tan door, all bold black outline. It should
look liftable and toy-like.

Wind is suggested by three or four curved white swoosh lines sweeping across
the frame from right to left.

No characters.
```

Generate the **house as a separate sprite** too — it is the draggable object.

### Scene 10: Walk Around Jericho — *drag the march, then blow the horn (Joshua 6:15-20)*

**Gameplay redesigned 2026-10-05 — see `biblical_game_design_doc.md` §11** for the mechanic,
win/lose conditions and config. What follows here is art only.

In short: the city sits in the centre, the player drags a four-soldier phalanx around it seven
times, then a horn-blower appears and the player taps to blow the walls down.

#### Layering — read before generating anything

The city has to crack and then fall, and the phalanx circles it, so **neither can be baked into the
backdrop.**

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Desert ground with an oval dusty path. Centre empty. |
| 1 | `jericho_intact` / `_cracked` / `_crumbling` / `_fallen` | The walled city, centred. One sprite per state. |
| 2 | `path_rock` | HARD only, placed on the path. |
| 3 | `phalanx` | Four soldiers as one sprite, profile facing LEFT. |
| 4 | `horn_ready` / `horn_blow` | Horn-blower at the lower left, phase 2 only. |

The path in the backdrop has to clear the city sprite on every side. Generate the city first, then
judge the backdrop's ring against it.

#### Backdrop plate

```
Scene: The plain around Jericho, as a backdrop, seen from a high angle.

Setting: Flat pale sandy desert ground in muted tan and cream. A wide dusty
path in a slightly darker dusty clay forms a large smooth oval ring around the
centre of the frame, with a soft black outline on both edges. The area inside
the ring is plain empty sand. A few rounded palm trees and small sage shrubs sit
in the corners, outside the ring. A thin strip of warm peach sky with one
outlined cloud runs along the very top edge.

Keep the centre of the frame completely empty — no city, no walls, no
buildings. Keep the whole path clear and unobstructed along its full length.

No characters.
```

#### City sprites

```
Now draw just the city of JERICHO, alone, as a game object, seen from the same
high angle as the backdrop.

- A compact round walled city: a thick circular wall of large rounded sandstone
  blocks in muted tan and dusty clay with bold black outlines and simple square
  battlements along the top, and one arched wooden gate facing the viewer.
- A few small flat-roofed houses and one round tower peek above the wall.
- No people, no ground, no path, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

Then, as edit turns in the same conversation, one per turn:

| Asset | Edit turn |
|---|---|
| `jericho_cracked` | "Same city, same framing. Add a few thin black zigzag cracks across the wall blocks. Change nothing else." |
| `jericho_crumbling` | "Same city. Make the cracks larger and knock a few blocks loose from the battlements, tilting outward. Change nothing else." |
| `jericho_fallen` | "Same framing. The wall has collapsed outward into low piles of rounded sandstone blocks with soft dust puffs. The houses and tower inside still stand. No people anywhere." |

#### `phalanx` sprite

```
Now draw a new group in exactly the same art style, alone, as a single game sprite.

FOUR SOLDIERS marching together in a tight phalanx, side by side and slightly
overlapping, all in profile facing LEFT, in step.
- Pastel skin, never realistic: periwinkle blue, lavender, soft mauve and
  periwinkle again. Big white eyes with black pupils visible under the helmet
  brims, pink blush on every cheek, determined cheerful expressions.
- Simple rounded bronze helmets in soft muted gold with a bold black outline.
- Large round shields in dusty rose held in front, overlapping edge to edge
  into one shield wall. Plain shields — no symbols or markings.
- Each holds a spear pointing straight UP, muted tan shaft with a small rounded
  grey tip. Spears are upright, not pointed at anything.
- Short cream and tan tunics, chunky sandaled feet mid-step.
- No shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Wide framing with an even magenta margin.
```

**Readability:** the dusty rose shield wall is what separates the phalanx from the tan city and
path. If the group blurs into the sand, push the shields warmer before touching anything else.

#### Horn-blower sprites

```
Now draw one soldier alone, in exactly the same art style, as a game sprite.

- Same helmet, tunic and style as the phalanx soldiers, lavender skin.
- He holds a long curved ram's horn in muted tan with both hands, lowered,
  ready to blow. Facing right, full body, eager expression.
- No shadow, no sound lines.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

Edit turn for **`horn_blow`**: "Same soldier, same framing. Change only the pose: the horn is raised
to his lips and pointed up and right, cheeks puffed out, eyes squeezed shut with effort."

**Do the blast effect in Phaser, not in the sprite** — same reason as the Roll the Stone glow.
Sound lines baked onto magenta fringe badly when keyed.

#### `path_rock` sprite

```
Now draw just one small rounded rock in dusty clay and tan, bold black outline,
alone. No ground, no shadow. Flat solid uniform magenta background (#FF00FF).
Square 1:1 framing with an even magenta margin.
```

### Scene 11: He Must Increase — *swipe to rebalance (John 3:30)*

Mechanic: swipe up to grow the GOD tile, down to shrink the ME tile, into a target band.
Tiles slowly revert on hard.

```
Scene: John the Baptist at the river Jordan.

Setting: A calm river bank in soft morning light. Pale mint and powder blue
water with simple outlined ripples, rounded river stones in dusty rose along
the near bank, and gentle sage green reeds and foliage at the frame edges. The
sky is a warm gradient from pale gold at the horizon into soft powder blue,
with one or two outlined clouds.

Character: JOHN THE BAPTIST stands on the left third of the bank. He has mint
green skin, shaggy dark hair and a simple rough tan tunic, one hand raised and
open in a gesture of pointing away from himself. His expression is warm and
humble. Big white eyes, black pupils, pink blush.

Objects: Two plain rounded rectangular tiles float side by side in the open
right half of the frame, like smooth river stones standing on end. Both are
blank — no text, no symbols, no markings of any kind. The left tile is soft
gold and noticeably larger. The right tile is pale periwinkle and smaller.

Keep the right half of the frame open and simple around the two tiles.
```

**The tiles must come out blank.** GOD and ME are runtime text that scales with the swipe — bake
them into the art and they stretch into garbage the moment the tile resizes. This is the one plate
where the art does very little work; if it comes back weak, that is the game's shape, not the prompt.

---

### Scene 13: Find the Lost Sheep — *tap to find the sheep (Luke 15:3-7)*

**Gameplay is specified in `biblical_game_design_doc.md` §13** — mechanic, win/lose conditions and
config. What follows here is art only.

In short: the player taps bushes and rocks to find one hidden sheep. 4 / 6 / 8 hiding spots by
difficulty, and on HARD the sheep moves once mid-round.

#### Layering — read before generating anything

The number of hiding spots changes per difficulty and the sheep relocates on HARD, so **nothing the
player taps can be baked into the backdrop.**

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Pasture, hills, sky. Play area empty. |
| 1 | `lost_sheep` | Placed behind one hiding spot; peeks out on EASY. |
| 2 | `hide_bush_a`, `hide_bush_b`, `hide_rock` | Hiding spots, placed at runtime from a slot table. |
| 3 | `critter_bird`, `critter_rabbit` | Pop out on some wrong taps. |
| 4 | `shepherd_search` / `_listen` / `_call` / `_found` | Jesus at the left edge; one sprite per pose. |

Every hiding-spot sprite must be large enough to fully cover the sheep at the shared display scale.
Generate the sheep first and judge the bushes against it.

#### Backdrop plate

```
Scene: A quiet hillside pasture in the late afternoon, as a backdrop.

Setting: Soft rolling hills in pale sage and mint grass with simple outlined
contours, fading to lavender-blue hills in the distance. On the far hill, very
small, a low stone sheepfold with a tiny cluster of white sheep inside it. The
sky is a warm gradient from soft peach at the horizon up into pale lavender,
with two outlined puffy clouds.

Keep the left third of the frame open where a standing figure will be drawn on
top. Keep the middle and right of the frame as open, gently sloping grass with
no bushes, rocks, trees or animals in it — objects will be placed there later.
The ground in the play area must be simple and uncluttered.

No characters in the foreground.
```

The distant flock is the other 99. It is scenery, not a game object — keep it small enough that no
child mistakes it for the sheep they are looking for.

#### Colour readability

| Must read apart | What carries it |
|---|---|
| **Sheep vs hiding spots** | Cream wool against sage bushes and dusty-rose rocks. The peek only works if a sliver of cream is unmistakable. |
| **Jesus vs bushes** | Seafoam skin sits close to sage foliage. He stands at the left edge, clear of the spots, and the white robe carries the silhouette. |
| Bush vs bush | Barely matters — two variants exist so the field does not look copy-pasted, not so they can be told apart. |

If Jesus disappears into the grass at sprite size, cool the bushes toward yellow-green before touching
his skin colour. Seafoam is the locked canonical design (Scene 6).

#### `lost_sheep` sprite

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

A small lost SHEEP, standing, full body, turned three-quarters toward the viewer.
- A round, puffy, cloud-like body of soft cream wool drawn as chunky scalloped
  bumps, with the same bold black outline.
- A soft dusty grey face and four short dusty grey legs.
- Large white oval eyes with big black pupils, soft pink blush on both cheeks,
  and a small hopeful expression. A little lonely, not frightened.
- Small rounded ears sticking out to the sides.
- No shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around the sheep.
```

#### `shepherd_search` sprite — JESUS as the shepherd (base pose)

Run this first; the other three poses are edits of it, one change per turn.

```
Now draw JESUS alone, in exactly the same art style, as a game sprite.

JESUS as a shepherd, searching. Full body, head to feet, facing right.
- Skin is a cool pale seafoam, roughly #B8E3D4 — a soft blue-green. It must
  read as distinctly BLUE-green, clearly cooler and bluer than the yellow-green
  mint used for the other characters. Never a realistic human skin tone.
- Soft brown shoulder-length hair and a short neat brown beard, drawn as chunky
  rounded shapes with the same bold black outline.
- Large white oval eyes with big black pupils and soft pink blush on both cheeks.
- A simple flowing white robe with a soft pale gold sash at the waist, and bare
  feet.
- He holds a tall wooden shepherd's crook in muted tan in one hand.
- The other hand is raised to shade his eyes as he looks into the distance,
  searching carefully. Calm and determined.
- A thin pale gold ring floats horizontally above his head.
- No glow, no light rays, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

#### Pose edits — same conversation, one per turn

| Asset | State | Edit turn |
|---|---|---|
| `shepherd_listen` | mid-win | "Same character and staff. Change only the pose: he leans forward slightly with one hand cupped to his ear, listening, with a small hopeful smile." |
| `shepherd_call` | mid-lose and lose-final | "Same character and staff. Change only the pose: one hand raised beside his mouth, calling out. Warm and patient, still hopeful, never sad." |
| `shepherd_found` | win-final | "Same character. Change only the pose: he carries the cream sheep across his shoulders, holding its legs gently, eyes closed in a big happy smile. The staff rests in the crook of one arm." |

`shepherd_found` must use the **same sheep design** as `lost_sheep` — generate it in the same
conversation, after the sheep, so the design carries forward.

#### Hiding-spot sprites

```
Now draw just one object from this scene, alone, as a game object.

- A single large, round, leafy BUSH in soft sage green with a bold black outline
  and a few simple curved leaf lines. Wider than it is tall, dense enough to hide
  a small sheep completely behind it.
- No ground, no grass, no shadow.
- Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
- Square 1:1 framing with an even magenta margin.
```

Then, as edit turns: **`hide_bush_b`** — "Same style. A second bush with a different, lumpier shape
and two small pink flowers on it." **`hide_rock`** — "Same framing. Replace the bush with a large
rounded boulder in dusty rose and muted tan, the same overall size."

#### Critter sprites

```
Now draw just one small animal in exactly the same art style, alone, as a game sprite.

- A small round BIRD in soft powder blue with a pale cream belly, wings spread
  as it flutters upward, big white eyes, pink blush, a surprised happy face.
- No shadow.
- Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
- Square 1:1 framing with an even magenta margin.
```

Edit turn for **`critter_rabbit`**: "Same framing. Replace the bird with a small round rabbit in soft
tan with long ears and a cream tail, mid-hop, surprised and happy."

---

### Scene 14: Samson and the Jawbone — *drag to bonk the Philistines (Judges 15:14-16)*

**Gameplay is specified in `biblical_game_design_doc.md` §14** — mechanic, win/lose conditions and
config. What follows here is art only.

In short: the player drags Samson around an open field. He swings a jawbone on a loop, and any
Philistine he touches gets bonked and tumbles away. The Philistines scatter when he gets close.

**Tone, stated once:** this is cartoon slapstick. The Philistines are mischievous troublemakers, not
soldiers, and a bonk sends them tumbling with stars over their heads. No weapons on them, no blood,
no one lying still. The jawbone is a smooth cartoon prop, not a skull fragment.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Open hillside field. Play area completely empty. |
| 1 | `philistine_a` / `_b` (+ `_run`, `_bonked`) | Spawned at edges, wander and flee. |
| 2 | `samson_swing_back` / `_swing_fwd` / `_victory` | Follows the player's drag, offset ~45px above the finger. |
| 3 | `samson_ropes` | Intro only. Samson bound, before the ropes drop. |

Bonk puffs, spinning stars and the "!" pop are **Phaser effects, not sprites** — same reason as the
Roll the Stone glow and the Jericho horn blast. Effects drawn onto magenta fringe badly when keyed.

#### Backdrop plate

```
Scene: An open hillside at Lehi, as a backdrop, seen from a slightly high angle.

Setting: A wide gently sloping field of pale sage and mint grass with simple
outlined contours, a few rounded pastel rocks in dusty rose and tan pushed to
the very edges and corners of the frame. Soft lavender-blue hills along the
top edge, and a strip of warm peach and pale gold sky with one outlined cloud.

Keep the whole centre and the middle of every edge completely open and flat —
no rocks, bushes, trees or animals anywhere characters will run. Characters
are drawn on top of this, so the ground must be simple and uncluttered.

No characters.
```

#### Colour readability

| Must read apart | What carries it |
|---|---|
| **Samson vs Philistines** | Samson is the only periwinkle figure and the only one with long hair and a jawbone. Philistines are mint and lavender with short hair. |
| **Philistines vs grass** | Bright tunics (mustard, dusty rose) carry them against the sage field. Mint skin alone would sink into the grass. |
| Philistine vs Philistine | Barely matters — two variants exist so the field does not look copy-pasted. |

Mint for the Philistines is deliberate: Goliath (Scene 12) is mint, so the Philistines read as his
people across the roster. The Angel is also mint, but never shares a screen with them.

#### `samson_swing_back` sprite — base pose

Run this first; the other Samson poses are edits of it, one change per turn.

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

SAMSON, mid-stride, in profile facing LEFT. Full body, head to feet.
- Periwinkle blue skin. Never a realistic human skin tone.
- Very long dark brown hair worn in seven thick rounded braids that swing out
  behind him — this is his defining feature, make it big and obvious.
- Chunky, broad, cheerful build. A simple short tan tunic with a rope belt,
  bare arms, sandals.
- Large white oval eyes with big black pupils, soft pink blush on both cheeks,
  and a big determined grin. Playful, not angry.
- In one hand he holds a DONKEY JAWBONE raised up behind his head, wound up to
  swing: a smooth curved cream bone like a big boomerang, with a row of small
  rounded blunt teeth along one edge. Cartoon prop, clean and simple.
- No shadow, no motion lines.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

| Asset | Edit turn |
|---|---|
| `samson_swing_fwd` | "Same character, same framing. Change only the pose: the jawbone is swung forward and down in front of him, arm extended, mid-swing." |
| `samson_victory` | "Same character. Change only the pose: standing, facing forward, holding the jawbone high over his head with both hands, eyes closed in a huge happy smile." |
| `samson_ropes` | "Same character, standing, facing forward. Thick tan ropes are wrapped around his arms and chest. He looks calm and confident, eyes looking up. No jawbone." |

#### `philistine_a` sprite — base pose

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

A PHILISTINE TROUBLEMAKER, mid-stride, in profile facing LEFT. Full body.
- Mint green skin. Never a realistic human skin tone.
- Short scruffy dark hair, no helmet, no armour, nothing in his hands.
- A simple short mustard yellow tunic with a sash, sandals.
- Large white oval eyes with big black pupils, soft pink blush, and a cheeky
  mischievous grin. A rascal, not a villain.
- Slightly smaller and rounder than Samson.
- No shadow, no motion lines.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

| Asset | Edit turn |
|---|---|
| `philistine_a_run` | "Same character, same framing. Change only the pose: running away fast, arms flailing, looking back over his shoulder with wide surprised eyes and an open-mouth 'uh oh' face." |
| `philistine_a_bonked` | "Same character. Change only the pose: tumbling backward head over heels, arms and legs out, eyes as dizzy swirls, a silly dazed smile. Funny, not hurt." |
| `philistine_b` | "Same style and pose as the original troublemaker. A different person: lavender skin, a dusty rose tunic, curly hair and a round belly." Then repeat the run and bonked edits for `_b`. |

**`_bonked` must stay comedic.** If a generation comes back looking injured — eyes closed flat,
lying still, anything red — reject it and repeat "funny, not hurt, eyes as dizzy swirls".

---

### Scene 15: Baby Moses in the Basket — *tilt to steer (Exodus 2:1-10)*

**Gameplay is specified in `biblical_game_design_doc.md` §15.** Art only below.

In short: a top-down river scrolls right to left, and the player tilts to steer a floating basket
past reeds, rocks and a hippo to Pharaoh's daughter.

#### Layering — read before generating anything

The river **scrolls**, so the water can't be one composed plate.

| Layer | Asset | Contents |
|---|---|---|
| 0 | `river_tile` | Water and both banks, top-down. Scrolled as a TileSprite. |
| 1 | `reed_clump`, `river_rock`, `hippo` | Obstacles, spawned from tier patterns. |
| 2 | `basket_moses` | The player. |
| 3 | `pharaoh_daughter` | Slides in on the bank at the end of the run. |

**Making the water scroll without a seam.** Gemini won't reliably produce a seamless tile. Generate
the plate, crop a vertical band from its middle, and tile it with **every other copy mirrored on X**.
Mirror-tiling hides the seam on organic textures like water and grass. Banks run horizontally along
the top and bottom, so they continue cleanly across mirrored copies.

#### `river_tile` plate

```
Scene: A gentle river seen from directly above, as a backdrop.

Setting: Calm water in soft powder blue and pale mint fills the middle of the
frame from the left edge to the right edge, with simple outlined ripple lines
running horizontally. A grassy bank in pale sage runs along the top edge and
another along the bottom edge, both perfectly straight and parallel, edged with
small tufts of grass and a few tiny pink flowers.

Nothing in the water — no reeds, no rocks, no animals, no boats. The water area
must be completely open.

No characters.
```

#### `basket_moses` sprite

```
Now draw a new object in exactly the same art style, alone, as a game sprite,
seen from directly above.

A small round woven reed BASKET in muted tan with a simple crosshatch weave and
a bold black outline. Inside, tucked in a soft cream blanket, a tiny BABY with
periwinkle blue skin, a round head, big white eyes, pink blush and a happy
gummy smile, one little hand waving.

No water, no shadow. Flat solid uniform magenta background (#FF00FF), no
gradient. Square 1:1 framing with an even magenta margin.
```

#### Obstacle and bank sprites

Generate each as an edit turn after the basket, same top-down view, same magenta framing:
- **`reed_clump`**: "A clump of tall sage green reeds seen from above, with a few cattail tops in muted tan."
- **`river_rock`**: "A round flat rock in dusty rose and grey poking out of the water, seen from above."
- **`hippo`**: "A sleepy friendly hippo in soft lavender-grey, only the top of its head, eyes and ears above the water, seen from above. Eyes half closed, content. Not menacing."

`pharaoh_daughter`, side view (generate as a fresh sprite, not top-down):

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

PHARAOH'S DAUGHTER, kneeling at a riverbank with both arms reaching forward to
lift something gently. Soft mauve skin, black hair in a straight bob with a
thin pale gold headband, a simple flowing white dress with a pale gold collar.
Big white eyes, pink blush, a warm surprised smile.

No water, no ground, no shadow. Flat solid uniform magenta background
(#FF00FF), no gradient. Square 1:1 framing with an even magenta margin.
```

**Mixed views are intentional.** The play layer is top-down; Pharaoh's daughter appears side-on at
the bank as an end-of-run character. If that reads oddly in playtest, regenerate her top-down.

### Scene 16: Peter Walks on Water — *hold on Jesus (Matthew 14:22-33)*

**Gameplay is specified in `biblical_game_design_doc.md` §16.** Art only below.

In short: Peter walks from a boat at the left toward Jesus at the right, but only while the
player's finger stays on Jesus.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Twilight sea. Walking lane across the middle kept clear. |
| 1 | `fishing_boat` | Left edge, static. |
| 2 | `peter_walk` / `_sink` / `_rescued` | Moves along the lane; sinking is a runtime crop. |
| 3 | `jesus_water` / `_reach` | Right side; drifts on MEDIUM and HARD. |
| 4 | `wave_sweep` | HARD only. Rolls across and briefly hides Jesus. |

#### Backdrop plate

```
Scene: The Sea of Galilee on a stormy evening, as a backdrop.

Setting: A choppy sea fills the lower two thirds of the frame, drawn as rows
of rounded outlined waves in powder blue, periwinkle and soft teal, with small
white foam curls on their tips. The sky is a twilight gradient from pale
lavender at the top to soft peach at the horizon, with three puffy outlined
clouds tinged dusty grey. A few small outlined raindrops slant across the sky.

Keep a clear horizontal band across the middle of the frame, from the left
edge to the right edge, where figures will walk on top of the water. Keep the
whole frame stylised and gentle — stormy, but never frightening.

No boats, no characters.
```

#### Colour readability

| Must read apart | What carries it |
|---|---|
| **Peter vs the sea** | Periwinkle skin sits close to the waves, so Peter wears a warm **dusty rose** tunic. The tunic carries him. |
| **Jesus vs the sea** | Seafoam skin and a white robe against blue water. The white robe does the work. |
| **Jesus vs the wave sweep** | The wave sweep is deliberately cooler and darker than the backdrop, so it reads as "in front". |

#### `peter_walk` sprite

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

PETER, a fisherman, walking carefully in profile facing RIGHT, full body.
- Periwinkle blue skin. Never a realistic human skin tone.
- Short curly dark brown hair and a short rounded beard.
- A warm dusty rose tunic with a rope belt, bare feet.
- Arms held slightly out for balance. Big white eyes fixed straight ahead,
  pink blush, a nervous but brave little smile.
- No water, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

| Asset | Edit turn |
|---|---|
| `peter_sink` | "Same character, same framing. Change only the pose: one arm reaching up and forward, eyes wide, mouth in a small 'oh!' — worried, not terrified." |
| `peter_rescued` | "Same character. Change only the pose: holding hands with someone just out of frame to the right, smiling with relief." |

#### `jesus_water` sprite

Use the canonical JESUS sprite prompt from **Scene 6**, changing only: *"Standing calmly, facing
LEFT, one hand held out toward the viewer's left, inviting."* Then an edit turn for **`jesus_reach`**:
"Same character. Change only the pose: leaning forward, reaching down with one hand to lift someone
up, kind and steady."

#### `fishing_boat` and `wave_sweep`

- **`fishing_boat`**: a small wooden boat in muted tan, side view, one furled sail, two disciples peeking over the side (mint and lavender skin), on magenta.
- **`wave_sweep`**: a single tall rolling wave in a slightly deeper periwinkle with a white foam curl, side view, on magenta. Generate wider than tall so it covers Jesus fully at the shared scale.

### Scene 17: Zacchaeus Climbs the Tree — *alternate taps to climb (Luke 19:1-10)*

**Gameplay is specified in `biblical_game_design_doc.md` §17.** Art only below.

In short: Zacchaeus climbs a big tree as the player alternates left and right taps, while Jesus
walks along the road toward the tree.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Jericho street with the sycamore tree on the right. |
| 1 | `crowd_strip` | A row of people along the road at the bottom. |
| 2 | `jesus_walk` | Walks left to right along the road. Diegetic timer. |
| 3 | `zacchaeus_climb_l` / `_climb_r` / `_slip` / `_wave` | Moves up the trunk. |

The tree is in the plate because it never changes. Zacchaeus' height is continuous, so the trunk
needs a long clear climbing line from the roots to the lookout branch.

#### Backdrop plate

```
Scene: A busy street in Jericho, as a backdrop.

Setting: A dusty road in pale tan runs across the bottom of the frame. On the
right side stands one very large sycamore-fig tree: a thick, chunky trunk in
muted brown with a bold black outline, rising almost the full height of the
frame, with a few sturdy low branches and a big rounded canopy of sage and
mint leaves at the top. Small flat-roofed houses in cream and dusty rose line
the background on the left. Warm pastel sky in peach and pale gold with one
outlined cloud.

Keep the front of the trunk clear and climbable from the roots to the canopy,
with one wide branch near the top where someone could sit. Keep the road open
across the whole width.

No people.
```

#### `zacchaeus_climb_l` sprite — base pose

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

ZACCHAEUS, a very short man, climbing — seen from behind and slightly to the
side, hugging an invisible tree trunk, left arm reaching up high and right
knee raised.
- Lavender skin. Never a realistic human skin tone.
- Noticeably short and round, with a big head. A small neat black beard.
- A mustard yellow robe with a dusty rose sash, and a small round cap.
- Looking up over his shoulder with big eager eyes, pink blush and a
  determined grin.
- No tree, no ground, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

| Asset | Edit turn |
|---|---|
| `zacchaeus_climb_r` | "Same character and framing. Mirror the limbs: right arm reaching up high, left knee raised." |
| `zacchaeus_slip` | "Same character. Change only the pose: both arms flailing, sliding down, eyes wide, mouth in a silly 'whoa!'" |
| `zacchaeus_wave` | "Same character. Change only the pose: sitting on a branch, waving down happily with one hand, huge smile." |

The two climb poses alternate on each tap, so the climb animates with the rhythm for free.

#### `jesus_walk` and `crowd_strip`

- **`jesus_walk`**: the canonical JESUS prompt from **Scene 6**, changing only *"walking in profile facing RIGHT, mid-stride."* Add an edit turn for **`jesus_lookup`**: "Same character, stopped, head tilted up, smiling and waving up at someone above."
- **`crowd_strip`**: "A wide row of six cheerful people seen from behind, shoulder to shoulder, mixed pastel skin (periwinkle, mint, mauve, lavender), cream and tan robes, some on tiptoe." Wide framing on magenta.

### Scene 18: Joseph's Coat of Many Colors — *repeat the pattern (Genesis 37:3)*

**Gameplay is specified in `biblical_game_design_doc.md` §18.** Art only below.

In short: the coat's stripes flash a color pattern, and the player repeats it by tapping dye pots.

#### Layering — read before generating anything

The stripe colors change every round, so **no stripe color can be baked into the art.**

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Jacob's tent. Centre and bottom strip clear. |
| 1 | `joseph_coat_base` | Joseph in a coat with five **white** stripe bands. |
| 2 | `stripe_1` … `stripe_5` | One mask per band, tinted at runtime. |
| 3 | `dye_pot` | One white pot, tinted and labelled with a symbol at runtime. |

**Cutting the stripe masks.** Generate the coat with five white bands, each fully enclosed by a black
outline. Then flood-fill each band in an image editor to export five masks aligned to the base
sprite. `key_sprites.py` won't do this for you; budget about 15 minutes once. In Phaser, each mask is
an image over the base, `setTint()` to the stripe color, and hidden until painted.

#### Backdrop plate

```
Scene: Inside a large tent in Canaan, as a backdrop.

Setting: The warm inside of a big desert tent. Draped fabric walls in cream
and soft tan with gentle outlined folds, a central wooden tent pole on the far
left, and a woven rug in muted rose and sage covering the floor. Soft light
comes in through an open tent flap on the right, showing a sliver of pale gold
sky.

Keep the centre of the frame open where a standing figure will be placed, and
keep a clear empty strip along the bottom of the frame for a row of objects.

No characters.
```

#### `joseph_coat_base` sprite

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

JOSEPH, a young man, standing proudly facing forward, full body, arms held
slightly out to show off his coat.
- Periwinkle blue skin. Never a realistic human skin tone.
- Short dark curly hair, big white eyes, pink blush, a big delighted smile.
- He wears a long robe-like coat that reaches his ankles, with long sleeves.
  The coat is divided horizontally into FIVE wide bands from the shoulders to
  the hem. Every band is PLAIN WHITE with no color, no pattern and no shading,
  and each band is separated from the next by a bold black outline line.
- Bare feet.
- No shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with a small even margin of magenta around him.
```

**The bands must come out white and fully outlined.** If Gemini colors them (it will want to — it's
the coat of many colors), repeat "every band is plain white, no color at all". Colored bands can't be
tinted.

Add an edit turn for **`joseph_twirl`**: "Same character and coat. Change only the pose: twirling,
coat flaring out, eyes closed in joy." The twirl needs its own five masks; cut them the same way.

#### `dye_pot` sprite

```
Now draw just one object in exactly the same art style, alone, as a game object.

A round clay pot with a wide mouth, in muted tan, filled to the brim with
liquid that is PLAIN WHITE with a simple outlined surface. No symbols, no
writing, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient. Square 1:1
framing with an even magenta margin.
```

Tint the liquid at runtime. The six symbols (dot, star, heart, wave, square, moon) are white UI
glyphs drawn over the liquid in Phaser, not generated art.

### Scene 19: Nehemiah Rebuilds the Wall — *drop the stones (Nehemiah 2-6)*

**Gameplay is specified in `biblical_game_design_doc.md` §19.** Art only below.

In short: a crane swings stone blocks over a gap in Jerusalem's wall, and the player taps to drop
each one into place.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Jerusalem's wall with a tall **empty** gap in the centre. |
| 1 | `wall_stone` | One stone, one size. Stacks in the gap. |
| 2 | `crane_rope` | Wooden crane arm across the top; the rope is drawn in Phaser. |
| 3 | `nehemiah_point` / `_cheer` | Left side. |

**The gap's size is a hard constraint.** It must be exactly one stone wide and eight stones tall at
the shared display scale. Generate `wall_stone` **first**, then judge the backdrop's gap against it
and regenerate until it fits. You can crop the plate; you can't resize the stone without stretching
its outline.

#### Backdrop plate

```
Scene: The broken walls of Jerusalem, as a backdrop.

Setting: A long city wall runs across the whole frame, built from large
rounded sandstone blocks in muted tan and dusty clay with bold black outlines
and square battlements along the top. In the exact centre there is one tall,
narrow, rectangular GAP in the wall, running from the ground all the way to
the top, completely empty — sky shows through it. A few loose blocks lie as
rubble at the base on either side of the gap. Small rooftops of the city peek
over the wall. Warm pastel sky in peach and pale gold with two outlined clouds.

The gap must be completely empty and clean-edged, with nothing inside it.

No characters.
```

#### `wall_stone`, `crane_rope` and Nehemiah

- **`wall_stone`**: "One large rectangular building block in muted tan sandstone with rounded corners, a bold black outline and two simple curved texture lines, seen face on. Slightly wider than tall." On magenta.
- **`crane_rope`**: "A simple wooden crane arm — one long horizontal beam in muted brown with a small pulley wheel at the end — seen from the side, no rope." On magenta. Draw the rope as a Phaser line from the pulley to the stone; a baked rope can't swing.
- **`nehemiah_point`**: "NEHEMIAH, standing in profile facing RIGHT, mint green skin, short beard, a cream robe with a dusty blue sash and a small round cap, pointing up and to the right with one hand, cheerful and confident." On magenta. Edit turn for **`nehemiah_cheer`**: "Same character, both arms raised in celebration, huge smile."

### Scene 20: Moses Parts the Red Sea — *spread to part (Exodus 14:21-22)*

**Gameplay is specified in `biblical_game_design_doc.md` §20.** Art only below.

In short: the player spreads two fingers to open a dry path through the sea, and people walk
across while it stays open.

#### Layering — read before generating anything

The sea has to open and close, so **the water can't be in the backdrop.**

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Two shores and a dry seabed across the middle. No water. |
| 1 | `crosser_a` / `_b` / `_c` | Walk left to right along the seabed. |
| 2 | `water_wall_top`, `water_wall_bottom` | Slide apart vertically to open the path. |
| 3 | `moses_staff` | Near shore, left. Static. |

The water walls slide; they never scale. Each must be tall enough to cover half the screen height
plus the full stroke of the slide, so no gap ever shows at the top or bottom edge.

#### Backdrop plate

```
Scene: The bed of the Red Sea, as a backdrop, seen from the side.

Setting: On the far left, a sandy shore in pale tan with a few rounded rocks.
On the far right, another sandy shore with soft sage bushes and a few palm
trees. Between them, across the whole middle of the frame, a flat dry seabed of
smooth damp sand in muted tan with a few small shells and pebbles. The sky is a
dramatic pastel gradient from pale gold at the horizon to soft lavender at the
top, with outlined clouds swirling gently.

There is NO water anywhere in this image. The seabed must be dry and open from
the left shore to the right shore.

No characters.
```

#### `water_wall_top` sprite

```
Now draw just one object in exactly the same art style, alone, as a game object.

A tall standing WALL OF SEA WATER, seen from the side, in layered bands of
powder blue, soft teal and periwinkle with simple outlined wave curls along its
BOTTOM edge, where it is held back. A few small cartoon fish visible inside the
water. The top, left and right edges run straight off the frame.

No ground, no shadow. Flat solid uniform magenta background (#FF00FF) only
along the bottom edge. Wide framing.
```

Generate `water_wall_bottom` as an edit turn: "Same object, flipped: the wave curls run along the
TOP edge, held back, and the water fills downward." Then crop both so the straight edges run off the
image.

#### `moses_staff`

Use **`moses.png`** as a character reference for this one sprite, in addition to the three style
references, so he matches the established design.

```
Now draw MOSES alone, in exactly the same art style, matching the attached
Moses reference character, as a game sprite.

Standing in profile facing RIGHT, full body, holding a tall wooden shepherd's
staff high above his head with one arm, the other hand stretched out forward
over the water. Calm, strong and trusting. No glow, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

**Pro caps style references at 3.** Attach `moses.png` as a *character* reference, not a style one;
Pro accepts up to 5 character refs alongside the 3 style refs.

#### Crossers

`crosser_a`: "A cheerful traveller walking in profile facing RIGHT, mint green skin, cream robe, carrying a bundle on a stick over one shoulder." Edit turns for `crosser_b` (lavender skin, dusty rose robe, holding a child's hand) and `crosser_c` (mauve skin, tan robe, leading a small cream goat on a rope). All on magenta.

### Scene 21: Feeding the 5,000 — *catch the bread and fish (John 6:1-13)*

**Gameplay is specified in `biblical_game_design_doc.md` §21.** Art only below.

In short: Jesus breaks bread at the top of the hill, food tumbles down, and the player drags the
boy's basket to catch it.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Grassy hillside with a crowd in the far background. Play area open. |
| 1 | `jesus_bless` | Top centre, static. |
| 2 | `bread_loaf`, `fish` | Fall from Jesus. |
| 3 | `boy_basket_empty` / `_half` / `_full` | Bottom, drags left and right. |

#### Backdrop plate

```
Scene: A grassy hillside by the Sea of Galilee, as a backdrop.

Setting: A wide sloping hillside of soft sage and mint grass rising toward the
top of the frame, with a small flat rock at the very top centre where someone
could stand. In the far background along the left and right edges, a large
gathered crowd drawn as small simple rounded figures in pastel robes, sitting
in groups. A sliver of pale blue lake and peach sky at the very top.

Keep the whole middle of the frame open grass from the top rock down to the
bottom edge — objects will fall through this area.

No characters in the foreground.
```

#### Sprites

- **`jesus_bless`**: the canonical JESUS prompt from **Scene 6**, changing only *"standing, facing forward, holding a round loaf of bread in both hands and breaking it in two, eyes closed in a warm smile, giving thanks."*
- **`boy_basket_empty`**: "A young boy, lavender skin, short tousled hair, cream tunic, standing facing forward, holding a wide round woven basket out in front of him with both hands, eager big smile." On magenta. Edit turns for **`_half`** ("Same, basket half full of round loaves and little fish") and **`_full`** ("Same, basket heaped and overflowing, boy beaming").
- **`bread_loaf`**: "One round puffy loaf of bread in golden tan with a bold black outline and two curved score lines." On magenta.
- **`fish`**: "One small chubby fish in soft dusty pink with a simple outlined tail, a big round eye and a little smile." On magenta.

**Readability:** Jesus' seafoam skin and the mint grass sit close. Jesus stands on the grey-tan rock
at the top, and his white robe carries the silhouette, same as the Lost Sheep fix. The boy is
lavender, not mint, so he never reads as part of the grass.

### Scene 22: Jonah and the Big Fish — *time the spit (Jonah 1-2)*

**Gameplay is specified in `biblical_game_design_doc.md` §22.** Art only below.

In short: a power meter swings, the player taps, and a big fish spits Jonah in an arc toward a
target zone on the beach.

#### Layering

| Layer | Asset | Contents |
|---|---|---|
| 0 | backdrop plate | Sea on the left, beach and palm trees on the right. |
| 1 | `big_fish_closed` / `_puff` / `_spit` | Left, in the water. Bobs on HARD. |
| 2 | `jonah_tumble` / `_landed` / `_palm` | Flies the arc, then lands. |

The beach target zone is drawn in Phaser (a soft gold oval on the sand), not in the plate, because
its width changes per tier.

#### Backdrop plate

```
Scene: A quiet shore after a storm, as a backdrop, seen from the side.

Setting: The left third of the frame is calm sea in powder blue and soft teal
with simple outlined ripples. The rest of the frame is a wide, flat sandy beach
in pale tan that slopes gently up from the waterline, with a few small shells.
On the far right, two tall rounded palm trees with sage green fronds. A warm
morning sky in peach and pale gold with a soft rising sun and one outlined
cloud.

Keep the beach open and flat from the waterline to the palm trees. Keep the
water area on the left clear.

No characters, no animals.
```

#### Big fish sprites

```
Now draw a new character in exactly the same art style, alone, as a game sprite.

A BIG FRIENDLY FISH, side view, facing RIGHT, as if rising up out of the water.
- A huge round body in warm dusty coral and peach with a pale cream belly, a
  big rounded tail, and simple outlined scales.
- A large white eye with a big black pupil, pink blush on the cheek, and a
  wide closed-mouth smile. Gentle and goofy, never scary — no teeth.
- No water, no shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

| Asset | Edit turn |
|---|---|
| `big_fish_puff` | "Same fish. Change only the face: cheeks puffed out wide, eyes squeezed shut, holding something in." |
| `big_fish_spit` | "Same fish. Change only the face: mouth open in a round 'O', eyes wide, as if it just spat something out. No teeth." |

**Warm fish, cool water.** Coral against blue is the readability call. A blue or grey whale would sink
into the sea. If the fish comes back with teeth, repeat "no teeth, gentle and goofy".

#### Jonah sprites

Use **`jonah.png`** as a character reference (same note as Moses in Scene 20: character slot, not
style slot).

```
Now draw JONAH alone, in exactly the same art style, matching the attached
Jonah reference character, as a game sprite.

Tumbling through the air head over heels, arms and legs out, a strand of green
seaweed draped over his head, eyes squeezed shut, a surprised 'whoa' mouth.
Funny, not hurt. No shadow.

Flat solid uniform magenta background (#FF00FF), no gradient, no shadow.
Square 1:1 framing with an even magenta margin.
```

| Asset | Edit turn |
|---|---|
| `jonah_landed` | "Same character. Change only the pose: sitting up on the ground, picking seaweed off his head, grinning and waving." |
| `jonah_palm` | "Same character. Change only the pose: hanging by both hands from something above him, feet dangling, seaweed on his head, sheepish grin." |

---

## Known risks

- **Style drift after 6–8 generations** in one conversation. Watch for thinning outlines and colours
  creeping toward saturated. Start a fresh chat and re-paste the STYLE LOCK with the three refs.
- **Scenes 1 and 8 are the hard pair** — both need a lighting effect (glow, flames) inside a style
  defined by flat fills and no rim lighting. Genuine tension in the prompt; budget extra turns.
- **Scenes 2, 11 and 13 are backdrops, not scenes.** Judge them on whether the working area stays clean.
- **Scenes 15 and 20 have hard geometry constraints.** The river must mirror-tile; the Red Sea walls
  must cover their full slide stroke. Check fit in Phaser before approving either set.
- **Scene 19's gap is sized to the stone.** Generate `wall_stone` first and regenerate the backdrop
  until the gap fits — not the other way round.
- **Scenes 20 and 22 use a character reference** (`moses.png`, `jonah.png`) on top of the three style
  refs. That's 4 images in the conversation; run them in a fresh chat so earlier scenes don't bleed in.
- **Scene 18's stripe masks are manual work** (~15 min per pose). Nothing else in the pipeline is.
- **Sprite isolation is the unreliable half** (~60% first-pass). Budget a manual cleanup per character.
- **SynthID** is embedded in every Google-generated image. Invisible, does not block commercial use,
  but provenance checkers will flag shipped art as AI-generated.

## Open decision — palette conflict

`COLORS` in `src/utils/constants.js` (SKY_BLUE `#4A90E2`, SUNSHINE_YELLOW `#FFD93D`, GRASS_GREEN
`#6BCF7F`, SUNSET_ORANGE `#FF9F43`) is a saturated primary palette. The reference art is desaturated
pastel. HUD chrome built from those constants will visually fight these art plates.

Two options, pick one **before** HUD work starts:
1. Desaturate the HUD constants toward the art palette
2. Deliberately keep the HUD high-saturation so it reads as a distinct overlay layer

See also: `art_plates_mockup.html` in the project root — hand-authored SVG plates for four games,
built before this pipeline. Useful for judging composition and staging; superseded for final art.

---

## Changelog

Started 2026-09-24. Not retroactive — changes made before this date are not listed. Newest first.

| Date | Change |
|---|---|
| 2026-10-13 | Scenes 15–22 added: Baby Moses, Peter Walks on Water, Zacchaeus, Joseph's Coat, Nehemiah's Wall, Red Sea, Feeding the 5,000, Jonah. Known risks updated for the new geometry and reference constraints. Gameplay in `biblical_game_design_doc.md` §15–22. |
| 2026-10-08 | Scene 14 added: Samson and the Jawbone — backdrop, Samson swing/victory/ropes poses, two Philistine troublemakers with run and bonked states. Gameplay in `biblical_game_design_doc.md` §14. |
| 2026-10-05 | Scene 10 rewritten for the Jericho redesign: centred city with four crack/fall states, four-soldier `phalanx`, horn-blower pair, `path_rock`. Gameplay in `biblical_game_design_doc.md` §11. |
| 2026-09-29 | Scene 13 added: Find the Lost Sheep — backdrop, layering, `lost_sheep`, four shepherd poses, hiding-spot and critter sprites. Gameplay in `biblical_game_design_doc.md` §13. |
| 2026-09-24 | Scene 8: gameplay mechanics, config and copy moved out to `biblical_game_design_doc.md` §6. This document is art only now. |
| 2026-09-24 | Scene 8: third boy's skin changed from mint green to soft mauve `#D8BEDD`, so the angel is the only green character on screen. Readability section rebuilt around it. |
| 2026-09-24 | Scene 8: delivered asset manifest added (`furnace background.jpg`, `furnace angel.jpg`, `furnace boys.jpg`). Angel sprite came back in profile, superseding the front-view prompt. |
| 2026-09-24 | Changelog started. |
