// ============================================
// FULLSCREEN — ask for it on a tap, and make the canvas actually use what it gets
// ============================================
//
// Two halves, and the second is the one that matters.
//
// 1. ASKING. The Fullscreen API needs transient user activation: a call on page load is rejected,
//    so it has to hang off a real tap. Phaser's scale manager wraps the vendor prefixes and
//    reports whether the device can do it at all, so nothing here sniffs a user agent.
//
//    iPhone Safari cannot. caniuse marks every iOS Safari from 12 to 27.x as partial support, and
//    for a non-video element the request fails silently. The only chrome-free view on an iPhone is
//    launching from the Home Screen, which index.html's apple-mobile-web-app-capable meta already
//    enables -- so on those devices this shows the hint instead of pretending to work.
//
// 2. REFLOWING. computeCanvasSize() runs once, in an IIFE in main.js, before Phaser reads the
//    config: the canvas aspect is frozen at whatever the viewport was at boot. Going fullscreen
//    CHANGES that aspect, because the browser chrome that was taking up height goes away. The
//    canvas keeps its old shape and Phaser.Scale.FIT letterboxes it -- which is the exact thing
//    the device-shaped-canvas design exists to prevent.
//
//    Measured, booting with chrome and then resizing to the fullscreen viewport:
//
//      Pixel 7 landscape        gains 36px of chrome -> 36px of letterbox bars   8.1% of screen
//      iPhone 14 Pro landscape  gains 37px           -> 37px of bars             8.6%
//      iPad Air landscape       gains 72px           -> 72px of bars             8.7%
//
//    Almost exactly a wash. Without the reflow, the fullscreen button is decoration.

// Phaser.Scale.Events.* survives minification as an object, but the literal strings are what the
// bundle actually contains, so they are used directly.
const FS_ENTER = 'enterfullscreen';
const FS_LEAVE = 'leavefullscreen';
const FS_UNSUPPORTED = 'fullscreenunsupported';

// Already launched from the Home Screen / installed: there is no chrome to escape, and offering
// to remove it would be nonsense.
function isStandaloneLaunch() {
  try {
    if (window.navigator && window.navigator.standalone === true) return true;   // iOS
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
  } catch (e) {
    return false;
  }
}

// Feature detection through Phaser, not a user-agent string. scale.fullscreen.available is false
// on exactly the devices where the request would fail.
function fullscreenAvailable(scene) {
  const fs = scene.scale && scene.scale.fullscreen;
  return !!(fs && fs.available);
}

function alreadyFullscreen(scene) {
  return !!(scene.scale && scene.scale.isFullscreen);
}

// Returns what happened, so a caller can decide whether to say anything:
//   'standalone'  — launched from the Home Screen, nothing to do
//   'already'     — already fullscreen
//   'entered'     — asked for it
//   'unavailable' — this device has no element fullscreen (iPhone Safari)
function requestGameFullscreen(scene) {
  if (isStandaloneLaunch()) return 'standalone';
  if (alreadyFullscreen(scene)) return 'already';
  if (!fullscreenAvailable(scene)) return 'unavailable';
  try {
    scene.scale.startFullscreen();
    return 'entered';
  } catch (e) {
    return 'unavailable';
  }
}

// Should the "add it to your Home Screen" line be shown at all?
function shouldOfferHomeScreen(scene) {
  return !isStandaloneLaunch() && !fullscreenAvailable(scene);
}

const HOME_SCREEN_HINT = 'For fullscreen: tap Share, then Add to Home Screen';

// ---------------------------------------------------------------------------
// Reflow
// ---------------------------------------------------------------------------

// Re-measure the viewport, rebuild the canvas around it, and put every live camera back where the
// stage now sits. Every coordinate in every game file is in stage space and the stage never
// changes size, so nothing in any scene has to know this happened -- only the camera scroll and
// the bleed behind it depend on where the stage sits inside the canvas.
function reflowCanvas(game) {
  if (!game || !game.scale) return;
  const el = document.getElementById('game-container');
  const box = el ? el.getBoundingClientRect() : null;
  const w = (box && box.width) || window.innerWidth;
  const h = (box && box.height) || window.innerHeight;

  const beforeW = CANVAS_WIDTH, beforeH = CANVAS_HEIGHT;
  computeCanvasSize(w, h);
  if (CANVAS_WIDTH === beforeW && CANVAS_HEIGHT === beforeH) return;   // nothing moved

  // setGameSize, not resize. ScaleManager.resize() is the call for Scale.RESIZE mode; under
  // Scale.FIT it updated the internal numbers and left the canvas element on its old aspect.
  // Measured while getting this wrong: CANVAS_WIDTH correctly became 766 and the canvas stayed
  // 915x411.9, which is the boot aspect of 2.221 against a container that was already 915x448.
  game.scale.setGameSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  game.scale.refresh();

  game.scene.scenes.forEach((s) => {
    if (!s.scene.isActive() || !s.cameras || !s.cameras.main) return;
    s.cameras.main.setScroll(-STAGE_X, -STAGE_Y);
    drawBackdropBleed(s);        // redraws; it destroys its own previous image
  });
}

// One place to install all of it. Called from main.js once the game exists.
function installFullscreenReflow(game) {
  let pending = null;
  const soon = () => {
    if (pending) clearTimeout(pending);
    // The viewport reports its old size for a frame or two while chrome animates away, on both
    // the fullscreen transition and an orientation change. Measuring immediately re-freezes the
    // wrong aspect, which looks identical to not having fixed anything.
    pending = setTimeout(() => { pending = null; reflowCanvas(game); }, 120);
  };

  game.scale.on(FS_ENTER, soon);
  game.scale.on(FS_LEAVE, soon);
  window.addEventListener('resize', soon);
  window.addEventListener('orientationchange', soon);
}
