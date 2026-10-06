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
tightest possible style anchor. Confirm the style holds before running the other twelve.

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

## The remaining 12 scene blocks

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

## Known risks

- **Style drift after 6–8 generations** in one conversation. Watch for thinning outlines and colours
  creeping toward saturated. Start a fresh chat and re-paste the STYLE LOCK with the three refs.
- **Scenes 1 and 8 are the hard pair** — both need a lighting effect (glow, flames) inside a style
  defined by flat fills and no rim lighting. Genuine tension in the prompt; budget extra turns.
- **Scenes 2, 11 and 13 are backdrops, not scenes.** Judge them on whether the working area stays clean.
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

See also: `docs/art_plates_mockup.html` — hand-authored SVG plates for four games,
built before this pipeline. Useful for judging composition and staging; superseded for final art.

---

## Changelog

Started 2026-09-24. Not retroactive — changes made before this date are not listed. Newest first.

| Date | Change |
|---|---|
| 2026-10-06 | Scene 10 art delivered as one labelled contact sheet and split into nine plates — backdrop, four city states, `phalanx`, `path_rock`, `horn_ready`, `horn_blow` — into `assets/games/jericho/`. The march path ellipse is measured off the backdrop plate rather than chosen, and the city had to be held under ~270px wide so the phalanx is never hidden behind it. Captions were cut from the sheet automatically; keying, export and layout notes are in that folder's `ASSETS.md`. |
| 2026-10-06 | Scene 7 art delivered — den backdrop plus Daniel and the lion on a two-figure sheet — into `assets/games/lions-den/`. The backdrop needed cropping to its lower 55% before the game was playable: this prompt asks for "a clear band of open sand across the lower third", and what came back put the floor in the bottom 20% — a 75px band on a 375px stage, which is not a dodging game with four lions in it. The arena ellipse is measured off that crop. The win beat borrows `assets/games/fiery-furnace/angel.png` rather than a den angel of its own; same errand and same style lock, but a purpose-drawn one would be better. Keying, export and balance notes in that folder's `ASSETS.md`. |
| 2026-10-05 | Scene 10 rewritten for the Jericho redesign: centred city with four crack/fall states, four-soldier `phalanx`, horn-blower pair, `path_rock`. Gameplay in `biblical_game_design_doc.md` §11. |
| 2026-10-03 | Scene 13 backdrop **replaced**. The first plate came back with forest down the middle and a shrub cluster at the right edge, leaving one cramped band of usable meadow; the second is the open pasture the prompt asks for, with the distant sheepfold and the other ninety-nine on the far hill. Hiding-spot slot table re-measured against it — three rows now spread across the lower two thirds of the stage, and the shepherd stands on clean grass. HUD and outcome text switched to dark-on-light, because this sky is pale and white text vanished into it. This also retires the backdrop horizon constraint noted on 2026-10-02. |
| 2026-10-03 | Scene 13 art delivered and wired in — backdrop, `lost_sheep`, `hide_bush_b`, `hide_rock`, all four shepherd poses, `critter_rabbit`. **Still outstanding: `hide_bush_a` (the plain bush) and `critter_bird`**; both are drop-in, and the game runs without them — bush A borrows bush B mirrored, and the rabbit covers for the bird. Two problems to avoid next time: the 4-up pose sheet cropped the top-row figures at the quadrant boundary, slicing their robe hems flat with no outline, and the backdrop came back with forest down the middle instead of the open grass the prompt asks for. Keying and export notes are in `assets/games/lost-sheep/ASSETS.md`. |
| 2026-10-02 | Scene 13 **not yet generated** — the game shipped against runtime placeholders. Filenames the code expects are in `assets/games/lost-sheep/ASSETS.md`; drop the real plates in under those names and they take over with no code change. The four shepherd poses must come back at the same frame height, or the shepherd jumps as he changes pose. *(A backdrop horizon constraint recorded here was retired when the plate was replaced on 2026-10-03 — see that entry.)* |
| 2026-09-29 | Scene 13 added: Find the Lost Sheep — backdrop, layering, `lost_sheep`, four shepherd poses, hiding-spot and critter sprites. Gameplay in `biblical_game_design_doc.md` §13. |
| 2026-09-24 | Scene 8: gameplay mechanics, config and copy moved out to `biblical_game_design_doc.md` §6. This document is art only now. |
| 2026-09-24 | Scene 8: third boy's skin changed from mint green to soft mauve `#D8BEDD`, so the angel is the only green character on screen. Readability section rebuilt around it. |
| 2026-09-24 | Scene 8: delivered asset manifest added (`furnace background.jpg`, `furnace angel.jpg`, `furnace boys.jpg`). Angel sprite came back in profile, superseding the front-view prompt. |
| 2026-09-24 | Changelog started. |
