# Bible Adventures - Setup Guide

## Quick Start

**Windows — just double-click `start-server.bat`.**

It serves this folder on port 8080 and opens your browser. Leave the window open
while you play; Ctrl+C stops it. It finds whichever runtime you have (py launcher,
real Python, or Node) on its own.

### Why not `python3`?

`python3` is a Mac/Linux command. On Windows it usually does not exist, and a bare
`python` is often an **App Execution Alias** that silently opens the Microsoft Store
instead of running anything. If you are typing commands by hand on Windows, use:

```bat
py -3 -m http.server 8080
```

If `py` is not recognised either, Python is not installed — get it from
https://www.python.org/downloads/ and **tick "Add python.exe to PATH"** on the first
installer screen.

### Mac / Linux

```bash
python3 -m http.server 8080
# or
npx http-server -p 8080
```

### Then

1. Open `http://localhost:8080` in Chrome
2. DevTools (F12) → Toggle Device Toolbar → iPhone SE or similar

**You cannot open `index.html` directly.** A `file://` page cannot load the game's
images — Phaser fetches them over HTTP. It has to be served.

## Adding Capacitor (Mobile Builds)

```bash
# 1. Initialize npm in this folder
npm init -y

# 2. Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init "Bible Adventures" "com.yourcompany.bibleadventures" --web-dir "."

# 3. Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# 4. Optional plugins
npm install @capacitor/haptics        # Vibration feedback
npm install @capacitor/screen-reader  # Accessibility
# npm install @capacitor-community/admob  # Ads (add later)

# 5. Sync and open
npx cap sync
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

## Project Structure

```
biblical-mini-games/
├── index.html              # Entry point
├── docs/
│   ├── SETUP.md            # This file
│   ├── biblical_game_design_doc.md  # CANONICAL spec for all 13 mini-games
│   ├── Art_Plate_Prompts.md         # Art generation prompts, per scene
│   ├── UI_Mockup_Prompts.md         # HTML/CSS screen and HUD mockups
│   └── art_plates_mockup.html       # Superseded hand-authored SVG plates
├── src/
│   ├── main.js             # Phaser game config & launch
│   ├── utils/
│   │   └── constants.js    # Global constants, colors, fonts
│   ├── systems/
│   │   ├── gameConfig.js   # Difficulty parameters (tweak these!)
│   │   ├── dataManager.js  # LocalStorage persistence
│   │   └── sessionManager.js # Play session tracking
│   ├── scenes/
│   │   ├── BootScene.js    # Texture generation
│   │   ├── PreloadScene.js # Asset loading (placeholder for now)
│   │   ├── OnboardingScene.js # First-launch experience
│   │   ├── MenuScene.js    # Home screen
│   │   ├── StoryScene.js   # Pre-game biblical context
│   │   ├── InstructionScene.js # How-to-play screen
│   │   ├── GameLoopScene.js # Win/loss transition handler
│   │   └── ResultScene.js  # Session end stats
│   └── games/
│       ├── LetThereBeLightGame.js  # Reaction speed
│       ├── NoahsArkGame.js         # Memory matching
│       └── TowerOfBabelGame.js     # Tap to destroy
└── assets/games/<slug>/     # Art plates per game (bg.jpg + keyed PNGs)
```

## Tuning Difficulty

All game parameters are in `src/systems/gameConfig.js`. Adjust values there
and refresh the browser — no build step needed.

## Key Files to Know

- **gameConfig.js** — Every difficulty number lives here
- **sessionManager.js** — Lives, scoring, combo logic
- **dataManager.js** — Save/load game progress
- **constants.js** — Colors, fonts, game dimensions
