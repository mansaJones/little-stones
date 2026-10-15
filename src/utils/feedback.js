// ============================================
// FEEDBACK BUTTON — a persistent link to the playtest form
// ============================================
//
// A DOM element, not a Phaser object, and deliberately so. A Phaser button would have to be
// re-created by all 27 scenes or live in an always-on overlay scene fighting 21 games for depth;
// a DOM node sits outside the canvas entirely, is always on top, and being a real <a> it opens in
// a new tab so the round keeps running behind it rather than being abandoned.
//
// It lives INSIDE #game-container, which matters twice:
//   - index.html hides that container in portrait to show the rotate prompt, so the button
//     correctly disappears along with it instead of floating over the prompt.
//   - Phaser's fullscreen sends ONE element fullscreen. main.js points fullscreenTarget at the
//     container, so the button goes fullscreen with the canvas. Left at the default, Phaser
//     creates its own wrapper div, moves only the canvas into it, and the button vanishes the
//     moment a tester taps START PLAYING -- which is exactly when they start having opinions.

// ---------------------------------------------------------------------------
// CONFIGURE ME  — the only part that needs editing
// ---------------------------------------------------------------------------
//
// 1. Open the form, Send -> link, and copy the /viewform URL into `url`.
// 2. For each prefill field: in the form editor, the three-dot menu -> "Get pre-filled link",
//    put any placeholder text in the boxes, Get link, Copy link. The copied URL contains
//    entry.123456=placeholder for each one. Paste those entry IDs below.
//
// Leave `url` empty and the button does not render at all, so a half-configured build ships
// without a dead link in the corner.
// The RESOLVED /viewform URL, deliberately, not the forms.gle short link it came from. A short
// link answers with a 302 to this address, and query parameters appended to the short form are not
// reliably carried across that redirect -- so the moment a prefill field is configured below, a
// forms.gle URL would silently drop it and every response would arrive with the context blank.
// Resolved once here so nobody has to rediscover that.
const FEEDBACK_FORM = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSctlnjSd0QoX4BZycQTd-mVyEtprNbcJbxGWeB8ByK5Toqs3A/viewform',

  // Still empty, so nothing is prefilled yet and the button simply opens the form.
  //
  // The live form asks four questions -- platform, bugs, suggestions, new game ideas -- and none
  // of them records WHICH mini-game the tester was playing. Across 21 games that is the one thing
  // a bug report is useless without, and the one thing a tester will not reliably remember by the
  // time they are typing.
  //
  // Adding a single short-answer question, e.g. "Build info (leave this as it is)", and pasting
  // its entry ID into `game` below is enough: the game, difficulty, outcome, device and version
  // all arrive in that one field without the tester touching it. `platform` could be auto-filled
  // the same way from the existing multiple-choice question.
  fields: {
    game: '',                     // e.g. 'entry.123456789'
    difficulty: '',
    result: '',
    device: '',
    version: '',
  },
};

const FEEDBACK_VERSION = 'v1.0.0-prototype';

// ---------------------------------------------------------------------------

// What was the tester looking at when they tapped? Read live rather than tracked, so nothing has
// to be kept in sync as scenes come and go.
function feedbackContext() {
  const ctx = { game: '', difficulty: '', result: '' };
  const g = window.__LS_GAME;
  if (!g || !g.scene) return ctx;

  const live = g.scene.scenes.filter(s => s.scene.isActive());
  // Prefer a game scene over an interstitial: during a round only the game is active, but the
  // result page is a scene of its own that carries the key it is reporting on.
  const gameScene = live.find(s => typeof GAME_NAMES !== 'undefined' && GAME_NAMES[s.scene.key]);
  const scene = gameScene || live[live.length - 1];
  if (!scene) return ctx;

  const key = (gameScene && gameScene.scene.key) || scene.gameKey || '';
  if (key && typeof GAME_NAMES !== 'undefined' && GAME_NAMES[key]) {
    ctx.game = GAME_NAMES[key];                       // the readable name, not the class name
  } else {
    ctx.game = scene.scene.key;                       // a menu or picker: report the screen
  }
  if (scene.difficulty) ctx.difficulty = String(scene.difficulty);
  else if (typeof session !== 'undefined' && session && session.difficulty) {
    ctx.difficulty = String(session.difficulty);
  }
  if (scene.outcome) ctx.result = scene.outcome;      // 'win' | 'loss', set by every game scene
  return ctx;
}

function feedbackDevice() {
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  // The user agent is recorded as-is rather than parsed into a guess at the device name. A
  // tester's bug is usually "it did X on MY phone", and a wrong name is worse than a raw string.
  return (navigator.userAgent || 'unknown').slice(0, 180) + '  |  ' +
         w + 'x' + h + ' @' + dpr + 'x';
}

function feedbackUrl() {
  if (!FEEDBACK_FORM.url) return '';
  const ctx = feedbackContext();
  const values = {
    game: ctx.game,
    difficulty: ctx.difficulty,
    result: ctx.result,
    device: feedbackDevice(),
    version: FEEDBACK_VERSION,
  };
  const parts = [];
  Object.keys(FEEDBACK_FORM.fields).forEach((k) => {
    const entry = FEEDBACK_FORM.fields[k];
    if (entry && values[k]) parts.push(entry + '=' + encodeURIComponent(values[k]));
  });
  if (!parts.length) return FEEDBACK_FORM.url;
  const join = FEEDBACK_FORM.url.indexOf('?') === -1 ? '?' : '&';
  return FEEDBACK_FORM.url + join + 'usp=pp_url&' + parts.join('&');
}

function installFeedbackButton() {
  if (!FEEDBACK_FORM.url) {
    console.info('[Feedback] no form URL configured — button not shown. See src/utils/feedback.js');
    return null;
  }
  const host = document.getElementById('game-container');
  if (!host || document.getElementById('feedback-btn')) return null;

  // The container is a flex box that centres the canvas; without a positioning context the
  // absolute offsets below would be measured against the page instead.
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  const a = document.createElement('a');
  a.id = 'feedback-btn';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'Send feedback');
  a.title = 'Send feedback';
  a.textContent = '💬';
  a.style.cssText = [
    'position:absolute', 'top:4px', 'right:4px',
    'width:26px', 'height:26px', 'line-height:26px',
    'text-align:center', 'font-size:14px',
    'border-radius:8px', 'text-decoration:none',
    'background:rgba(20,22,40,0.55)', 'color:#fff',
    'border:1px solid rgba(255,255,255,0.22)',
    'opacity:0.55', 'z-index:50',
    // The page sets touch-action:none globally to stop the game scrolling. That also kills the
    // tap on this link, so it is re-enabled here and nowhere else.
    'touch-action:manipulation', '-webkit-tap-highlight-color:transparent',
    'transition:opacity 120ms ease',
  ].join(';');

  const wake = () => { a.style.opacity = '1'; };
  const rest = () => { a.style.opacity = '0.55'; };
  a.addEventListener('pointerenter', wake);
  a.addEventListener('pointerleave', rest);
  a.addEventListener('touchstart', wake, { passive: true });

  // The href is rebuilt at the moment of the tap, not when the button was created, so it carries
  // the scene the tester is looking at now rather than the one that was up at boot.
  const refresh = () => { a.href = feedbackUrl(); };
  a.addEventListener('pointerdown', refresh);
  a.addEventListener('touchstart', refresh, { passive: true });
  a.addEventListener('click', refresh);
  refresh();

  host.appendChild(a);
  return a;
}
