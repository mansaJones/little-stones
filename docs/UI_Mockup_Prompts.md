# UI Mockup Generation Prompts
**Project:** Biblical Mini-Games  
**Purpose:** Generate interactive HTML mockups using Claude Artifacts  
**When to Use:** When you're ready to visualize UI screens during development

---

## How to Use This Document

1. Copy a prompt from below
2. Paste it into a conversation with Claude
3. Claude will generate an interactive HTML artifact
4. Open the artifact in a browser to see it rendered
5. Screenshot or extract CSS values for Phaser implementation
6. Iterate by asking Claude to adjust colors, sizes, spacing, etc.

**Pro Tip:** Generate all screens in one session, then extract a unified design system (colors, fonts, spacing) to use across all your Phaser code.

---

## Screen 1: Home Screen

**Prompt:**
```
Create an interactive HTML artifact for the home screen of a Biblical mini-games mobile app targeting kids ages 6-12. 

Screen dimensions: 375px x 812px (iPhone X/11/12 size)

Include these elements:

HEADER:
- App logo/title: "Bible Adventures" or similar
- Subtitle: "Learn & Play with Scripture"

STATS BAR (horizontal row):
- Lives: Show 3 hearts (❤️❤️❤️)
- Score: Display number (e.g., 12,450)
- Level: Display number (e.g., Level 3)
- Streak: Show fire emoji + number (🔥 5)

PLAY BUTTON (primary CTA):
- Large, prominent button
- Text: "PLAY NOW" with play icon (▶️)
- Bright orange/red gradient
- Pulsing animation
- Should be the most eye-catching element

NAVIGATION GRID (2x3 grid of cards):
1. Levels - Icon: 🎯, Sublabel: "7 unlocked"
2. Challenges - Icon: ❓, Sublabel: "Quiz mode"
3. Videos - Icon: 📺, Sublabel: "Learn stories"
4. Achievements - Icon: 🏆, Sublabel: "12 earned"
5. Avatar - Icon: 👤, Sublabel: "Customize"
6. Stats - Icon: 📊, Sublabel: "View progress"

DAILY GOALS (bottom section):
- Header: "⭐ Daily Goals" with progress (2/3)
- 3 checkboxes showing completion status:
  * Play 3 games (✅ completed)
  * Win 2 games (✅ completed)
  * 5-game streak (⏸️ incomplete)

VISUAL STYLE:
- Color palette: Sky blue (#4A90E2), sunshine yellow (#FFD93D), grass green (#6BCF7F), sunset orange (#FF9F43)
- Gradient background: Sky blue to light yellow
- Rounded corners on all cards/buttons (16px radius minimum)
- Soft drop shadows for depth
- Decorative clouds floating in background
- Bright, cheerful, child-friendly aesthetic
- Large touch targets (minimum 44px)
- Bold, readable fonts

Make it interactive with hover effects on buttons and cards.
```

---

## Screen 2: In-Game HUD (Overlay)

**Prompt:**
```
Create an interactive HTML artifact for the in-game HUD overlay during mini-game play.

Screen dimensions: 375px x 667px (landscape game area with HUD overlay)

Include these elements:

TOP-LEFT:
- Lives remaining: 3 heart icons (❤️❤️❤️)
- Make hearts large and visible (24px size)

TOP-RIGHT:
- Timer countdown: Large numbers (e.g., "5.2s")
- Circular progress indicator around the timer
- Timer should be prominent (32px font size)

CENTER AREA:
- Leave this mostly empty (game content goes here)
- Show placeholder text: "[GAME AREA]"
- Optional: Game-specific UI like "Taps: 12/20" or progress bar

BOTTOM BAR:
- Left side: Streak counter (🔥 icon + number, e.g., "🔥 5")
- Right side: Current session score (e.g., "850")
- Background: Semi-transparent white bar

TOP-CENTER:
- Pause button (⏸️ icon)
- 44x44px minimum touch target
- Subtle background so it's always visible

VISUAL STYLE:
- Semi-transparent overlays (don't obscure game too much)
- High contrast text (white with dark outline or vice versa)
- Subtle drop shadows for readability
- Clean, minimal design that doesn't distract from gameplay
- Use same color palette as home screen

Make the pause button interactive with hover effect.
```

---

## Screen 3: Educational Context Screen (Pre-Game)

**Prompt:**
```
Create an interactive HTML artifact for the educational context screen shown before each mini-game.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

TOP:
- Small Biblical reference text (e.g., "Genesis 1:3")
- Subtle, readable font (14px)
- Positioned near top, centered

CENTER:
- Large illustration placeholder area (300px x 300px)
- Placeholder text: "[Bible Scene Illustration]"
- Rounded corners (20px radius)
- Subtle border or shadow

MIDDLE:
- Story text (2-3 sentences):
  "In the fiery furnace, Shadrach, Meshach, and 
   Abednego trusted God. King Nebuchadnezzar made 
   the furnace extra hot, but God protected them!"
- Large, readable font (18px)
- Maximum 3 lines of text
- Centered alignment

BOTTOM:
- "Tap to continue" text or auto-advance indicator
- Small countdown: "Auto-continuing in 3..."
- Gentle, subtle text

TOP-RIGHT CORNER:
- Skip button (small "Skip →" text or × icon)
- 44x44px touch target minimum

VISUAL STYLE:
- Soft, gentle background (light gradient or solid color)
- Card-based design with rounded corners
- Warm, welcoming color palette
- Not too busy - focus on readability
- Child-friendly, educational feel
- Use same color palette as other screens

Make skip button interactive.
```

---

## Screen 4: Game Instructions Screen

**Prompt:**
```
Create an interactive HTML artifact for the game instructions screen shown before gameplay.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

CENTER-TOP:
- Simple icon or illustration showing the game mechanic
- Placeholder: "[Tap Gesture Icon]" or similar
- 150px x 150px size
- Can be animated (e.g., pulsing tap indicator)

CENTER:
- Large instruction text: "TAP TO MAKE THE FURNACE HOTTER!"
- Bold, prominent font (24px)
- All caps for emphasis
- Bright, attention-grabbing color

SUBTITLE:
- Secondary instruction: "Can they survive the heat?"
- Smaller font (16px)
- Encouraging tone

BOTTOM:
- Auto-advance indicator: "Starting in 2..."
- Or "Tap anywhere to begin"
- Small, subtle text

TOP-RIGHT:
- Skip button (small, unobtrusive)
- 44x44px touch target

VISUAL STYLE:
- Simple, clean design
- High contrast for readability
- Focus on the instruction (minimize distractions)
- Quick to read and understand
- Energetic, exciting feel
- Use bright colors from main palette

Keep it simple - kids should understand in 2 seconds.
```

---

## Screen 5: Success Feedback Screen

**Prompt:**
```
Create an interactive HTML artifact for the success feedback screen shown after winning a mini-game.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

BACKGROUND:
- Star burst or celebration visual
- Bright, energetic gradient (yellows, oranges, greens)
- Optional: Confetti or sparkle effects

CENTER-TOP:
- Large "AMAZING!" headline
- Or alternate: "GREAT JOB!", "PERFECT!", "AWESOME!"
- Bold, huge font (36px)
- Celebratory color (bright green or gold)

CENTER:
- Points earned display: "+200 POINTS"
- Very prominent (32px font)
- Animated (counts up or pops in)
- Bright color

MIDDLE:
- Streak indicator: "Streak: 🔥 6"
- Medium size (20px font)
- Show streak growing

LOWER-MIDDLE:
- Encouraging message: "God protected them!"
- Or: "You did it!", "Amazing work!"
- Friendly, warm tone (16px font)

BOTTOM:
- Bible reference: "Read more in Daniel 3:23"
- Smaller text (14px)
- Clickable/linked appearance
- Optional: Small book icon

BOTTOM-CENTER:
- Auto-continue indicator: "Next game in 2..."
- Or "Tap to continue" with skip button
- Small, subtle

VISUAL STYLE:
- Celebratory, exciting, positive
- Bright colors (greens, golds, yellows)
- Lots of energy and movement
- Reward feel (stars, sparkles, animations)
- Warm, encouraging tone

Add subtle animations (fade-in, scale-up, etc.).
```

---

## Screen 6: Failure Feedback Screen

**Prompt:**
```
Create an interactive HTML artifact for the failure feedback screen shown after losing a mini-game.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

BACKGROUND:
- Gentle, soft colors (NOT dark or scary)
- Light blue or purple gradient
- Maybe a single broken heart visual (not dramatic)

CENTER-TOP:
- Headline: "TRY AGAIN!" or "OH NO!"
- Sympathetic, encouraging tone
- Bold font (32px)
- Warm color (soft orange or blue)

CENTER:
- Life lost indicator: "-1 LIFE" 
- With broken heart icon: 💔
- Medium prominence (24px font)
- Not overly dramatic

MIDDLE:
- Sympathetic message: "Practice makes perfect!"
- Or: "You'll get it next time!", "Almost there!"
- Friendly, encouraging (16px font)
- Warm, supportive tone

LOWER-MIDDLE:
- Optional: "Streak Reset" notification (if applicable)
- Small text (14px)
- Neutral color (gray)

BOTTOM:
- Auto-continue indicator: "Next game in 2..."
- Or "Tap to continue"
- Small, subtle

VISUAL STYLE:
- Sympathetic but not depressing
- Soft, gentle colors (no harsh reds or blacks)
- Encouraging, supportive tone
- Kid-friendly (failure is okay, try again!)
- NOT scary or punishing
- Still uses warm color palette

CRITICAL: Keep it gentle and encouraging - kids should feel motivated to try again, not discouraged.
```

---

## Screen 7: Out of Lives Screen

**Prompt:**
```
Create an interactive HTML artifact for the out-of-lives screen when player has no lives remaining.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

CENTER-TOP:
- Three broken hearts displayed: 💔 💔 💔
- Large, visible (48px size)
- Spaced out horizontally

HEADLINE:
- "OUT OF LIVES!" text
- Bold, prominent (32px font)
- Neutral color (not angry red, maybe blue)

MIDDLE:
- Explanatory text: "Watch a short video to continue?"
- Friendly, optional tone (16px font)

BUTTONS (vertical stack):
1. Primary Button: "WATCH AD (+1❤️)"
   - Large (60px tall)
   - Bright, positive color (green or blue)
   - Shows benefit clearly
   
2. Secondary Button: "END RUN"
   - Large (60px tall)
   - Muted color (gray)
   - Less prominent than primary

BOTTOM:
- Ad counter: "Ads remaining: 2/3"
- Small text (12px)
- Gray color
- Informational only

OPTIONAL:
- Third button: "BUY LIVES" (if IAP enabled)
- Same style as secondary button

VISUAL STYLE:
- Clear decision point (watch ad vs end run)
- Not punishing or negative
- Primary button should be most attractive option
- Clean, simple layout
- Easy to understand choices
- Uses warm color palette

Make both buttons interactive with hover states.
```

---

## Screen 8: End of Run Stats Screen

**Prompt:**
```
Create an interactive HTML artifact for the end-of-run stats screen.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

HEADER:
- Celebration emoji/icon: 🎉
- Headline: "RUN COMPLETE!"
- Subheadline: "Great job!" or similar
- Bold, celebratory (28px font)

STATS SECTION (2-column grid):
- Games Played: 12
- Games Won: 10
- Win Rate: 83%
- Best Streak: 7
- Points Earned: 2,450 (highlighted, larger)
- Total Score: 14,900

Each stat should have:
- Label (small, gray, 12px)
- Value (large, colored, 20px)

ACHIEVEMENTS SECTION:
- Header: "NEW ACHIEVEMENTS"
- 2-3 badge icons with names:
  * 🏆 "First Streak of 5"
  * 🏆 "Win 10 Games"
- Icon + text layout
- Celebratory colors

BUTTONS (bottom):
1. Primary: "PLAY AGAIN"
   - Large, prominent
   - Bright color (orange/red)
   - 60px tall
   
2. Secondary: "HOME"
   - Medium size
   - Muted color
   - 50px tall

TOP-RIGHT:
- Share button (icon only)
- 44x44px touch target
- Subtle but visible

VISUAL STYLE:
- Celebratory, positive energy
- Clear data visualization
- Hierarchy: Points Earned is most important
- Use gradient backgrounds or cards
- Bright, warm colors
- Professional but fun

Make all buttons interactive.
```

---

## Screen 9: Level Select Screen

**Prompt:**
```
Create an interactive HTML artifact for the level select screen.

Screen dimensions: 375px x 812px (scrollable)

Include these elements:

HEADER:
- Title: "Levels"
- Current points available: "Your Points: 12,450"
- Small text explaining: "Unlock new levels to play more games!"

LEVEL GRID (2 columns, scrollable):
Each level card shows:
- Level number (large): "1", "2", "3"...
- Lock icon 🔒 (if locked) or Checkmark ✓ (if unlocked)
- Points to unlock: "1,000 points" (if locked)
- OR completion: "7/7 games unlocked" (if unlocked)
- Mini preview: Small icons of games in that level
- Background: Locked levels are grayed out, unlocked are colorful

Current level should be highlighted/glowing.

CARD STATES:
1. Locked: Gray background, lock icon, points required
2. Unlocked: Colorful background, checkmark, games shown
3. Current: Unlocked + glowing border/highlight

EXAMPLE LAYOUT:
┌──────┐ ┌──────┐
│ Lvl 1│ │ Lvl 2│
│  ✓   │ │  ✓   │
│ 3/3  │ │ 5/5  │
└──────┘ └──────┘
┌──────┐ ┌──────┐
│ Lvl 3│ │ Lvl 4│
│  ✓   │ │ 🔒   │
│ 7/7  │ │1000pt│
└──────┘ └──────┘

VISUAL STYLE:
- Clear locked vs unlocked states
- Progress indicators for each level
- Colorful, inviting design
- Uses warm color palette
- Progression feels rewarding

Make unlocked levels clickable with hover effects.
```

---

## Screen 10: Pause Menu

**Prompt:**
```
Create an interactive HTML artifact for the pause menu overlay.

Screen dimensions: 375px x 812px (modal overlay)

Include these elements:

BACKGROUND:
- Semi-transparent dark overlay (rgba(0,0,0,0.6))
- Blurs the game behind it

MENU CARD (centered white card):
- Rounded corners (20px)
- White background
- Drop shadow
- 320px wide

MENU OPTIONS (vertical list, large touch targets):
1. ▶️ Resume
2. 🔄 Restart Game (show "Costs 1 life" warning)
3. 📖 View Tutorial
4. 🏁 End Run (show "Keeps points" note)
5. ⚙️ Settings

Each option:
- Icon + text
- 60px tall minimum
- Hover effect
- Clear separation between items

TOP-RIGHT OF CARD:
- Close button (X icon)
- 44x44px touch target
- Closes menu = resume

WARNINGS:
- "Restart Game" shows small red text: "Costs 1 ❤️"
- "End Run" shows small green text: "Keep all points earned"

VISUAL STYLE:
- Clean, simple menu
- Clear hierarchy (Resume is most prominent)
- High contrast against dark overlay
- Large, easy to tap options
- Professional but simple

Make all menu items interactive with hover states.
```

---

## Screen 11: Settings Screen

**Prompt:**
```
Create an interactive HTML artifact for the settings screen.

Screen dimensions: 375px x 812px (full screen)

Include these elements:

HEADER:
- Back button (← icon) in top-left
- Title: "Settings" centered
- 44x44px touch targets

SETTINGS SECTIONS:

AUDIO:
- "Music" toggle switch (ON/OFF)
  - Volume slider when ON (0-100%)
- "Sound Effects" toggle switch (ON/OFF)
  - Volume slider when ON (0-100%)
- "Haptic Feedback" toggle switch (ON/OFF)

ACCOUNT (if applicable):
- "Restore Purchases" button
- "Sign Out" button

LEGAL:
- "Privacy Policy" link
- "Terms of Service" link
- "Contact Support" button

APP INFO:
- Version number (small, gray)
- Copyright text (small, gray)

TOGGLE SWITCHES:
- Large, easy to tap (60px wide minimum)
- Clear ON/OFF states
- Green when ON, gray when OFF
- Animated transition

SLIDERS:
- Large touch target for slider handle
- Show current value (e.g., "75%")
- Smooth animation

VISUAL STYLE:
- Clean, organized sections
- Clear labels for all controls
- Generous spacing
- Easy to read and use
- Professional appearance
- Uses app color palette

PARENTAL GATE:
- Simple math problem before accessing external links
- Example: "What is 5 + 3?" with number input

Make all interactive elements functional with proper states.
```

---

## Design System Extraction Guide

After generating all screens, extract these values to create a consistent Phaser design system:

### Colors to Extract:
```
Primary Blue: #4A90E2
Primary Yellow: #FFD93D
Primary Green: #6BCF7F
Primary Orange: #FF9F43
White: #FFFFFF
Light Gray: #E0E0E0
Dark Gray: #666666
Text Primary: #2C5AA0
Text Secondary: #5A7BA6
```

### Typography to Extract:
```
Display (Headlines): 28-36px, bold
Body Large: 18-24px, semibold
Body: 14-16px, regular
Small: 11-12px, regular
```

### Spacing to Extract:
```
Extra Small: 4px
Small: 8px
Medium: 12px
Large: 16px
Extra Large: 20px
XXL: 30px
```

### Border Radius:
```
Small: 8px
Medium: 16px
Large: 20px
Extra Large: 25px
```

### Shadows:
```
Small: 0 2px 4px rgba(0,0,0,0.1)
Medium: 0 4px 12px rgba(0,0,0,0.1)
Large: 0 8px 20px rgba(0,0,0,0.15)
```

---

## How to Adapt HTML/CSS to Phaser

Once you have the HTML mockups:

1. **Extract layout values** - Use browser DevTools to inspect exact positions, sizes
2. **Convert to Phaser coordinates** - HTML uses top-left origin, Phaser uses various anchor points
3. **Recreate visual hierarchy** - What's on top in HTML should layer correctly in Phaser
4. **Match colors exactly** - Copy hex codes from CSS
5. **Replicate spacing** - Use same padding/margin values in Phaser positioning
6. **Rebuild interactions** - Hover effects become pointer events in Phaser
7. **Optimize for performance** - HTML can be inefficient; Phaser needs optimization

**Example Translation:**
```javascript
// HTML CSS:
// background: #4A90E2;
// border-radius: 16px;
// padding: 20px;
// font-size: 24px;

// Phaser equivalent:
const button = this.add.rectangle(x, y, width, height, 0x4A90E2);
button.setRoundedRectangle(16); // Border radius
const text = this.add.text(x, y, 'PLAY NOW', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#FFFFFF'
});
// Padding handled through positioning
```

---

## Usage Tips

1. **Generate in order** - Start with Home Screen, then work through gameplay screens
2. **Keep consistent** - Use same colors, fonts, spacing across all screens
3. **Iterate quickly** - Don't be precious, ask Claude to change things freely
4. **Screenshot everything** - Save PNGs of final versions for reference
5. **Extract once** - Create a design tokens file and reuse values everywhere
6. **Test on device** - Open HTML files on your phone to see actual mobile sizing

---

## Next Steps After Generation

1. Generate all 11 screens using these prompts
2. Extract design system (colors, fonts, spacing) into a reference doc
3. Create Phaser style constants file with extracted values
4. Build one screen in Phaser to validate the design system works
5. Iterate on design if needed
6. Build remaining screens using established patterns

**Remember:** These are mockups for reference, not production code. Use them to establish visual direction, then build properly in Phaser with performance in mind.

---

## See Also

**`Art_Plate_Prompts.md`** — prompts for generating the actual painted artwork (backgrounds,
characters, sprites) with Google Gemini 3 Pro Image, matching the locked reference style in
`H:\My Drive\bible game\sprite samples`.

This document covers **screen and HUD mockups** built as HTML/CSS. That one covers **art assets**.
Two different jobs, two different tools — don't cross the streams.

**`art_plates_mockup.html`** — hand-authored SVG art plates for four games. Superseded for final
art, still useful for judging composition and staging.
