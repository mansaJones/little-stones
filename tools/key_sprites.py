"""Little Pebbles art-plate prep: key Gemini sprites (magenta or baked-in checkerboard) and crop
scene plates to the stage.

Usage
  python key_sprites.py sprite <in.jpg|png> <out.png> [--scale 0.5] [--margin 8] [--key auto|magenta|checker]
  python key_sprites.py sprite <in1> <in2> ... --out-dir DIR [--align] [--scale] [--margin] [--key]
  python key_sprites.py bg     <in.jpg>     <out.jpg> [--horizon-y N] [--horizon-frac 0.41] [--width 1334]

Needs: pip install numpy pillow scipy

sprite  Keys the background out and writes a 256-colour palette PNG cropped to the alpha bbox.
        Keep --scale identical for every sprite of one game so a single display scale in Phaser
        fits them all (0.5 for 2048px sources, 1.0 for 1024px sources of the same game).
        --out-dir keys several sources in one go (<name>.png each); add --align to crop them all
        to the UNION of their bboxes so they share one coordinate frame (pose swaps / overlays
        line up pixel-for-pixel — e.g. a water vase and its wine twin, or a character's moods).
        --key auto (default) sniffs the border: magenta-ish -> magenta key, two neutral tones ->
        checkerboard key.
bg      Crops the plate to the 667x375 stage aspect and resizes to --width (default 1334 = 2x).
        A wider-than-16:9 source is cropped horizontally (centred); a taller one vertically, with
        the row --horizon-y landing --horizon-frac of the way down the frame.

Keying model (both keys): every background-family pixel is  bg * (1 - s) + black * s
  (s = shadow strength) -> alpha = s, colour = black. Pure bg gives s ~ 0 (transparent); the flat
  cast-shadow ellipse gives s ~ 0.3 (30% black); black-outline edge pixels blended with the
  background give whatever fraction of black they actually are. One rule covers all three.
Magenta: bg is one flat colour sampled from the border. Coloured edge pixels (rare — every
  silhouette edge in this style is a black outline) get a G-channel decontamination pass inside a
  2px band around the keyed background.
Checkerboard ("transparency" pattern baked into a JPG): the grid is a regular lattice (Gemini
  draws W/40 px cells starting at 0,0) with two neutral tones sampled from the border, so the
  expected bg colour is known per pixel and s falls out the same way. Only the background-family
  region CONNECTED TO THE IMAGE BORDER is keyed (flood fill), so enclosed whites/greys — eyes,
  teeth, vase highlights — survive. The 1-2px JPEG blur along each cell edge is inpainted from its
  neighbours so the shadow crosses grid lines smoothly.
"""
import argparse, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.cluster.vq import kmeans2, vq

GAME_W, GAME_H = 667, 375


# --------------------------------------------------------------------------- sprites

def border_ring(im, w=24):
    return np.concatenate([im[:w].reshape(-1, 3), im[-w:].reshape(-1, 3),
                           im[:, :w].reshape(-1, 3), im[:, -w:].reshape(-1, 3)])


def sniff_key(im):
    """'magenta' if the border is one saturated colour, 'checker' if it is two neutral tones."""
    ring = border_ring(im)
    med = np.median(ring, axis=0)
    if med.max() - med.min() > 60:
        return 'magenta'
    return 'checker'


def key_image(path, key='auto'):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    if key == 'auto':
        key = sniff_key(im)
    if key == 'checker':
        return key_checker(im) + ('checker',)
    return key_magenta(im) + ('magenta',)


def finish_alpha(rgb, alpha):
    """Shared clean-up: kill isolated specks, then smooth only the soft (shadow) alpha."""
    solid = alpha > 0.5
    lab, n = ndimage.label(solid)
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    small = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz < 120])
    alpha[small] = 0
    rgb[small] = 0
    med = ndimage.median_filter(alpha, size=3)
    alpha = np.where(alpha < 0.5, med, alpha)
    return rgb, alpha


# ---- checkerboard key ------------------------------------------------------

def checker_grid(lum):
    """Pitch (px) and phase of the baked-in checker lattice, read off the image border."""
    H, W = lum.shape

    def transitions(line):
        thr = (line.max() + line.min()) / 2
        hi = line > thr
        return np.where(hi[1:] != hi[:-1])[0] + 1

    tx = transitions(lum[2, :])
    ty = transitions(lum[:, 2])
    if len(tx) < 3 or len(ty) < 3:
        raise SystemExit('checker key: no lattice found along the border')
    raw = np.median(np.concatenate([np.diff(tx), np.diff(ty)]))
    pitch = W / round(W / raw)                       # snap to an integer cell count
    ox = tx[0] - pitch * round(tx[0] / pitch)        # phase (0 for Gemini output)
    oy = ty[0] - pitch * round(ty[0] / pitch)
    return pitch, ox, oy


def key_checker(im):
    H, W, _ = im.shape
    lum = im.mean(axis=2)
    pitch, ox, oy = checker_grid(lum)

    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    fx = (xs - ox) / pitch
    fy = (ys - oy) / pitch
    cx = np.clip(np.floor(fx).astype(int), 0, None)
    cy = np.clip(np.floor(fy).astype(int), 0, None)
    par = (cx + cy) & 1                                                # 0/1 cell parity

    # the two tones, sampled from the border ring per parity
    w = 24
    ring_mask = np.zeros((H, W), bool)
    ring_mask[:w] = ring_mask[-w:] = True
    ring_mask[:, :w] = ring_mask[:, -w:] = True
    tone = np.stack([np.median(im[ring_mask & (par == p)], axis=0) for p in (0, 1)])   # 2x3
    tone_lum = tone.mean(axis=1)
    lo, hi = tone_lum.min(), tone_lum.max()
    mean_tone = tone.mean(axis=0)
    ratios_m = im / np.maximum(mean_tone, 1)
    dev_m = ratios_m.max(axis=2) - ratios_m.min(axis=2)

    # JPEG-blurred cell edges: a band 2.5px either side of every grid line, where a pixel mixes
    # both tones. Excluded from the level estimates below; its alpha is inpainted at the end.
    dgx = np.abs(fx - np.round(fx)) * pitch
    dgy = np.abs(fy - np.round(fy)) * pitch
    band = (dgx < 2.5) | (dgy < 2.5)

    # Pass 1 — connectivity. Everything neutral-ish and not outline-black that is connected to
    # the image border is background (checker, its shadow, the outline's anti-aliased fringe).
    # Sprite interiors are fenced off by their black outlines, so enclosed neutrals — eye
    # whites, teeth, highlights — are not reached. Enclosed regions come back in below only
    # if they visibly ARE checkerboard.
    like = (dev_m < 0.10) & (lum > 0.08 * lo) & (lum < 1.15 * hi)
    lab, n = ndimage.label(like)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    edge_labels = edge_labels[edge_labels > 0]
    idx = np.arange(1, n + 1)
    sizes = ndimage.sum(like, lab, idx)
    big = np.isin(lab, idx[sizes >= 0.5 * pitch * pitch])            # anything cell-sized+
    bg = np.isin(lab, edge_labels)

    # Pass 2 — per-cell background level. Gemini's checker is not a perfect lattice: the odd
    # cell is drawn in the wrong tone and the tones drift ~20 levels across the image, while
    # the cast shadow is one flat level. So each cell's plateau (robust max of its background
    # pixels) is matched to the nearest of {lo, hi, lo*(1-s*), hi*(1-s*)}, s* being the shadow
    # level read off the histogram; cells with no clean plateau fall back to lattice parity.
    ncx, ncy = cx.max() + 1, cy.max() + 1
    cell = cy * ncx + cx
    cidx = np.arange(1, ncx * ncy + 1)
    pred = ((cidx - 1) // ncx + (cidx - 1) % ncx) & 1
    smooth = ndimage.median_filter(lum, size=5)
    sample = big & ~band
    with np.errstate(invalid='ignore', divide='ignore'):
        plateau = ndimage.maximum(smooth, np.where(sample, cell + 1, 0), cidx)
        cnt = ndimage.sum(sample, np.where(sample, cell + 1, 0), cidx)
    plateau = np.nan_to_num(plateau, nan=-1e9)
    lo_tone, hi_tone = int(tone_lum.argmin()), int(tone_lum.argmax())

    def assign(s_star):
        """Match each cell's plateau to the nearest candidate level -> (tone, level, ok)."""
        cands = [lo, hi] + ([lo * (1 - s_star), hi * (1 - s_star)] if s_star else [])
        cands = np.array(cands)
        cand_tone = np.array([lo_tone, hi_tone] * (len(cands) // 2))
        cand_shadowed = np.array([0, 0, 1, 1][:len(cands)])
        dist = np.abs(plateau[:, None] - cands[None, :])
        best = dist.argmin(axis=1)
        ok = (cnt >= 0.1 * pitch * pitch) & (dist[np.arange(len(best)), best] < 22)
        cell_tone = np.where(ok, cand_tone[best], pred)
        cell_lum = np.where(ok & (cand_shadowed[best] == 0), plateau, tone_lum[cell_tone])
        return cell_tone, cell_lum, ok

    # Round 1 (no shadow candidates) already fixes wrong-tone and drifted cells, so the
    # histogram of what is left darker than its plateau is the cast shadow itself; its peak is
    # the flat shadow level s*. Round 2 then lets fully-shadowed cells match lo/hi*(1-s*).
    cell_tone, cell_lum, ok = assign(0.0)
    s1 = 1.0 - lum / cell_lum[cell]
    sv = s1[bg & ~band & (s1 > 0.12) & (s1 < 0.7)]
    s_star = 0.0
    if sv.size > 0.004 * H * W:
        hist, edges = np.histogram(sv, bins=29, range=(0.12, 0.7))
        s_star = float(edges[hist.argmax()] + (edges[1] - edges[0]) / 2)
        if min(abs(hi * (1 - s_star) - lo), abs(lo * (1 - s_star) - hi)) < 22:
            s_star = 0.0                             # would collide with a tone: not usable
    if s_star:
        cell_tone, cell_lum, ok = assign(s_star)
    fixed = int((ok & (cell_tone != pred)).sum())
    print(f'  checker: pitch {pitch:.1f}px tones {lo:.0f}/{hi:.0f} shadow {s_star:.2f}; '
          f'{fixed} cell(s) drawn in the wrong tone, corrected')
    tone_map = cell_tone[cell]                                        # HxW tone index
    base_lum = cell_lum[cell]                                         # HxW expected bg level

    s = 1.0 - lum / base_lum

    # enclosed checkerboard (a handle hole, the gap between arm and body): unshadowed pixels of
    # BOTH tones in one enclosed blob. An eye white or a highlight is one tone, so it stays.
    clean = np.abs(s) < 0.08
    n0 = ndimage.sum(clean & (tone_map == 0), lab, idx)
    n1 = ndimage.sum(clean & (tone_map == 1), lab, idx)
    hole_labels = idx[(n0 >= 200) & (n1 >= 200)]
    hole_labels = np.setdiff1d(hole_labels, edge_labels)
    if hole_labels.size:
        bg |= np.isin(lab, hole_labels)

    alpha = np.ones((H, W), np.float32)
    rgb = im.copy()
    s_a = np.clip((s - 0.06) / (1 - 0.06), 0, 1)

    # band pixels away from any sprite edge: inpaint from their non-band neighbours
    near_sprite = ndimage.binary_dilation(~bg, iterations=3)
    fill = bg & band & ~near_sprite
    src = (bg & ~band).astype(np.float32)
    num = ndimage.uniform_filter(s_a * src, size=9)
    den = ndimage.uniform_filter(src, size=9)
    filled = np.where(den > 1e-3, num / np.maximum(den, 1e-3), 0)
    s_a = np.where(fill, filled, s_a)
    # band pixels next to a sprite edge keep their own s, judged against the lighter tone so an
    # unshadowed half-and-half mix reads as s = 0 rather than as a faint grid line
    edge_band = bg & band & near_sprite
    s_alt = np.clip((1.0 - lum / hi - 0.06) / (1 - 0.06), 0, 1)
    s_a = np.where(edge_band, np.minimum(s_a, s_alt), s_a)

    alpha[bg] = s_a[bg]
    rgb[bg] = 0.0
    rgb, alpha = finish_alpha(rgb, alpha)
    return rgb, alpha, tone.mean(axis=0)


# ---- magenta key -------------------------------------------------------------

def key_magenta(im):
    H, W, _ = im.shape
    bg = np.median(border_ring(im), axis=0)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]

    s = 1.0 - (R + B) / (bg[0] + bg[2])                       # shadow strength
    ratio_dev = np.abs(R / max(bg[0], 1) - B / max(bg[2], 1))
    g_frac = G / np.maximum(R + B, 1)
    bg_gfrac = bg[1] / (bg[0] + bg[2])
    mag = (ratio_dev < 0.14) & (g_frac < bg_gfrac + 0.08) & (s > -0.2) & (s < 0.92)

    alpha = np.ones((H, W), np.float32)
    rgb = im.copy()

    # 1) magenta family -> black at alpha s (noise floor 0.06 killed)
    s_a = np.clip((s - 0.06) / (1 - 0.06), 0, 1)
    alpha[mag] = s_a[mag]
    rgb[mag] = 0.0

    # 2) coloured fringe decontamination in a band around pure background
    pure_bg = mag & (s < 0.06)
    band = ndimage.binary_dilation(pure_bg, iterations=2) & ~mag
    denom = max(min(bg[0], bg[2]) - bg[1], 1)
    f = np.clip((np.minimum(R, B) - G) / denom, 0, 0.9)
    fb = f[band]
    alpha[band] = 1 - fb
    rgb[band] = np.clip((im[band] - fb[:, None] * bg[None, :]) / (1 - fb)[:, None], 0, 255)

    # 3) kill isolated specks (JPEG noise that dodged the key), 4) smooth the soft alpha only
    rgb, alpha = finish_alpha(rgb, alpha)
    return rgb, alpha, bg


def quantize_rgba(img, colors=256, seed=0):
    """Alpha-aware 256-colour palette: index 0 = transparent, the rest k-means in RGBA.
    (PIL's own octree quantiser drops the semi-transparent shadow, hence this one.)"""
    arr = np.asarray(img.convert('RGBA')).astype(np.float32)
    H, W, _ = arr.shape
    px = arr.reshape(-1, 4)
    visible = px[:, 3] > 0
    data = px[visible]
    rng = np.random.default_rng(seed)
    sample = data[rng.choice(len(data), min(120000, len(data)), replace=False)]
    wa = np.array([1, 1, 1, 1.5], np.float32)          # alpha weighted so edge/shadow levels cluster
    centers, _ = kmeans2(sample * wa, colors - 1, minit='++', seed=seed, iter=25)
    idx, _ = vq(data * wa, centers)
    pal = np.zeros((colors, 4), np.float32)
    pal[1:] = centers / wa
    out_idx = np.zeros(len(px), np.uint8)
    out_idx[visible] = (idx + 1).astype(np.uint8)
    pal = np.clip(np.round(pal), 0, 255).astype(np.uint8)
    p = Image.fromarray(out_idx.reshape(H, W), 'P')
    p.putpalette(pal[:, :3].flatten().tolist())
    p.info['transparency'] = bytes(pal[:, 3].tolist())
    return p


def alpha_bbox(alpha, margin):
    ys, xs = np.where(alpha > 0.1)
    y0, y1 = max(ys.min() - margin, 0), min(ys.max() + margin + 1, alpha.shape[0])
    x0, x1 = max(xs.min() - margin, 0), min(xs.max() + margin + 1, alpha.shape[1])
    return x0, y0, x1, y1


def crop_and_resize(rgb, alpha, scale, margin, bbox=None):
    x0, y0, x1, y1 = bbox if bbox is not None else alpha_bbox(alpha, margin)
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    h, w = alpha.shape
    if scale < 1.0:
        # premultiplied resize so transparent black never bleeds into colour
        pre = np.dstack([rgb * alpha[..., None], alpha[..., None] * 255]).astype(np.float32)
        pil = Image.fromarray(np.clip(pre, 0, 255).astype(np.uint8), 'RGBA')
        pil = pil.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        arr = np.asarray(pil).astype(np.float32)
        a = arr[..., 3] / 255.0
        rgb = np.where(a[..., None] > 0, arr[..., :3] / np.maximum(a[..., None], 1e-3), 0)
        alpha = a
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), (x0, y0, x1, y1)


def save_sprite(out, rgb, alpha, bg, mode, scale, margin, bbox=None):
    img, bbox = crop_and_resize(rgb, alpha, scale, margin, bbox)
    pal = quantize_rgba(img)
    pal.save(out, optimize=True, transparency=pal.info['transparency'])
    print(f'{os.path.basename(out)}: {mode} bg={bg.astype(int)} bbox={tuple(int(v) for v in bbox)} '
          f'-> {img.size} {os.path.getsize(out) // 1024} KB')


def cmd_sprite(args):
    if args.out_dir:
        srcs, outs = args.paths, [os.path.join(args.out_dir, os.path.splitext(os.path.basename(p))[0] + '.png')
                                  for p in args.paths]
        os.makedirs(args.out_dir, exist_ok=True)
    else:
        if len(args.paths) != 2:
            raise SystemExit('sprite: give <in> <out.png>, or several inputs with --out-dir')
        srcs, outs = args.paths[:1], args.paths[1:]
        os.makedirs(os.path.dirname(os.path.abspath(outs[0])), exist_ok=True)

    keyed = [key_image(p, args.key) for p in srcs]
    bbox = None
    if args.align:
        boxes = np.array([alpha_bbox(a, args.margin) for _, a, _, _ in keyed])
        bbox = (boxes[:, 0].min(), boxes[:, 1].min(), boxes[:, 2].max(), boxes[:, 3].max())
        print(f'aligned crop {tuple(int(v) for v in bbox)}')
    for out, (rgb, alpha, bg, mode) in zip(outs, keyed):
        save_sprite(out, rgb, alpha, bg, mode, args.scale, args.margin, bbox)


# --------------------------------------------------------------------------- backgrounds

def cmd_bg(args):
    im = Image.open(args.src).convert('RGB')
    W, H = im.size
    target = GAME_W / GAME_H
    if W / H >= target:                      # too wide: crop columns, centred
        cw = round(H * target)
        x0 = (W - cw) // 2
        box = (x0, 0, x0 + cw, H)
        note = f'crop x={x0}..{x0 + cw}'
    else:                                    # too tall: crop rows around the horizon
        ch = round(W / target)
        hy = args.horizon_y if args.horizon_y is not None else H // 2
        y0 = int(round(hy - args.horizon_frac * ch))
        y0 = max(0, min(y0, H - ch))
        box = (0, y0, W, y0 + ch)
        note = f'crop y={y0}..{y0 + ch}; horizon at stage y={(hy - y0) / ch * GAME_H:.0f}'
    out_w = args.width
    out_h = round(out_w * GAME_H / GAME_W)
    crop = im.crop(box).resize((out_w, out_h), Image.LANCZOS)
    crop.save(args.out, quality=90, optimize=True, subsampling=0)
    print(f'{os.path.basename(args.out)}: {W}x{H} {note} -> {crop.size} '
          f'{os.path.getsize(args.out) // 1024} KB')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sp = sub.add_parser('sprite'); sp.add_argument('paths', nargs='+')
    sp.add_argument('--out-dir', default=None); sp.add_argument('--align', action='store_true')
    sp.add_argument('--key', choices=['auto', 'magenta', 'checker'], default='auto')
    sp.add_argument('--scale', type=float, default=0.5); sp.add_argument('--margin', type=int, default=8)
    sp.set_defaults(fn=cmd_sprite)
    bp = sub.add_parser('bg'); bp.add_argument('src'); bp.add_argument('out')
    bp.add_argument('--horizon-y', type=int, default=None); bp.add_argument('--horizon-frac', type=float, default=0.41)
    bp.add_argument('--width', type=int, default=1334)
    bp.set_defaults(fn=cmd_bg)
    args = ap.parse_args(argv)
    if getattr(args, 'out', None):
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    args.fn(args)


if __name__ == '__main__':
    main()
