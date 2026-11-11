"""Rule-based steps after the model: split canals left/right, separate and number teeth, find gaps.

These are heuristics, not AI. Every result stays editable in the viewer.
"""
import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.signal import find_peaks
from scipy.spatial import cKDTree

from . import labels as L

# Average mesio-distal crown widths in mm, central incisor to third molar.
WIDTH = {"upper": [8.5, 6.5, 7.5, 7.0, 6.5, 10.0, 9.5, 8.5], "lower": [5.0, 5.5, 7.0, 7.0, 7.0, 11.0, 10.5, 10.0]}


def split_canals(lab: np.ndarray, x_grows_left: bool) -> None:
    """Models that give one canal class: divide it at the image midline into patient left and right."""
    m = (lab == L.CANAL_L) | (lab == L.CANAL_R)
    if not m.any() or ((lab == L.CANAL_L).any() and (lab == L.CANAL_R).any()):
        return
    xs = np.where(m.any(axis=(0, 1)))[0]
    mid = lab.shape[2] // 2 if xs.size == 0 else int(np.median(np.where((lab > 0).any(axis=(0, 1)))[0]))
    left = np.zeros(lab.shape[2], bool)
    left[mid:] = True
    if not x_grows_left:
        left = ~left
    lab[m & left[None, None, :]] = L.CANAL_L
    lab[m & ~left[None, None, :]] = L.CANAL_R


def _arch(xy_mm: np.ndarray):
    """Parabola y = f(x) through the tooth footprint, sampled densely with arc length."""
    c = np.polyfit(xy_mm[:, 0], xy_mm[:, 1], 2)
    x = np.linspace(xy_mm[:, 0].min() - 2, xy_mm[:, 0].max() + 2, 2000)
    y = np.polyval(c, x)
    s = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(y)))])
    apex = -c[1] / (2 * c[0]) if abs(c[0]) > 1e-9 else x.mean()
    return x, y, s, float(np.interp(apex, x, s))


def number_teeth(lab: np.ndarray, spacing: float, x_grows_left: bool) -> tuple[list[dict], list[dict]]:
    """Replaces the unsplit tooth classes by one label per tooth (FDI) and lists edentulous positions.

    Teeth are separated where the tooth volume along the arch has a valley, then numbered outwards
    from the midline. A gap wider than about half a tooth advances the numbering and is reported.
    Returns (teeth, missing): dicts with fdi and a centre in voxel index (z, y, x).
    """
    teeth: list[dict] = []
    missing: list[dict] = []
    for jaw, src in (("upper", L.UPPER_TEETH), ("lower", L.LOWER_TEETH)):
        zz, yy, xx = np.nonzero(lab == src)
        if zz.size < 200:
            continue
        xy = np.c_[xx, yy] * spacing
        foot = np.unique(np.round(xy / spacing).astype(int), axis=0) * spacing
        if np.ptp(foot[:, 0]) < 10:
            continue
        cx, cy, cs, s_mid = _arch(foot)
        _, nearest = cKDTree(np.c_[cx, cy]).query(xy)
        s = cs[nearest]
        step = 0.3
        bins = np.arange(s.min(), s.max() + step, step)
        if bins.size < 8:
            continue
        hist = np.histogram(s, bins)[0].astype(float)
        smooth = gaussian_filter1d(hist, 0.9 / step)
        valleys, _ = find_peaks(-smooth, distance=int(3.0 / step), prominence=smooth.max() * 0.04)
        empty = smooth < smooth.max() * 0.03
        mid_bin = int(np.clip((s_mid - bins[0]) / step, 0, len(hist) - 1))  # central incisors touch: always cut at the midline
        cuts = sorted(set(valleys.tolist()) | set(np.where(np.diff(empty.astype(int)) != 0)[0].tolist()) | {mid_bin})
        edges = [0, *cuts, len(hist)]
        segs = []
        for a, b in zip(edges[:-1], edges[1:]):
            if b - a < 2 or hist[a:b].sum() < 150 or smooth[a:b].max() < smooth.max() * 0.15:
                continue
            segs.append((bins[a], bins[min(b, len(bins) - 1)]))
        z_mean = float(zz.mean())
        for side in ("low", "high"):  # arc length below / above the midline
            mine = [g for g in segs if ((g[0] + g[1]) / 2 < s_mid) == (side == "low")]
            mine.sort(key=lambda g: abs((g[0] + g[1]) / 2 - s_mid))
            # low arc length = low x. With x growing to the patient's left that is the patient's right side.
            right_side = (side == "low") == x_grows_left
            quad = {("upper", True): 1, ("upper", False): 2, ("lower", False): 3, ("lower", True): 4}[(jaw, right_side)]
            pos, edge = 1, s_mid
            for g in mine:
                near, far = (g[1], g[0]) if side == "low" else (g[0], g[1])
                gap = abs(near - edge)
                while pos <= 8 and gap > WIDTH[jaw][pos - 1] * 0.55 + 1.0:
                    w = WIDTH[jaw][pos - 1]
                    centre = edge + (w / 2) * (-1 if side == "low" else 1)
                    i = int(np.argmin(np.abs(cs - centre)))
                    if pos <= 7:
                        missing.append({"fdi": quad * 10 + pos, "zyx": [z_mean, cy[i] / spacing, cx[i] / spacing], "gap_mm": round(float(gap), 1)})
                    edge, gap, pos = edge + w * (-1 if side == "low" else 1), gap - w, pos + 1
                if pos > 8:
                    break
                fdi = quad * 10 + pos
                sel = (s >= min(g)) & (s < max(g))
                lab[zz[sel], yy[sel], xx[sel]] = fdi
                teeth.append({"fdi": fdi, "zyx": [float(zz[sel].mean()), float(yy[sel].mean()), float(xx[sel].mean())], "voxels": int(sel.sum())})
                edge, pos = far, pos + 1
        lab[lab == src] = 0  # slivers that belonged to no tooth
    return teeth, missing


def missing_from_labels(lab: np.ndarray, spacing: float) -> tuple[list[dict], list[dict]]:
    """For models that already label each tooth: list what is present and what is absent (1-7 per quadrant)."""
    teeth, present = [], set()
    for fdi in L.FDI:
        zz, yy, xx = np.nonzero(lab == fdi)
        if zz.size * spacing ** 3 < 20:  # under 20 mm3 is noise, not a tooth
            continue
        present.add(fdi)
        teeth.append({"fdi": fdi, "zyx": [float(zz.mean()), float(yy.mean()), float(xx.mean())], "voxels": int(zz.size)})
    centre = {t["fdi"]: np.array(t["zyx"]) for t in teeth}
    missing = []
    for fdi in L.FDI:
        if fdi in present or fdi % 10 == 8:
            continue
        q, p = divmod(fdi, 10)
        near = [centre[q * 10 + k] for k in (p - 1, p + 1) if q * 10 + k in centre]
        if p == 1 and {1: 21, 2: 11, 3: 41, 4: 31}[q] in centre:
            near.append(centre[{1: 21, 2: 11, 3: 41, 4: 31}[q]])
        zyx = np.mean(near, axis=0).tolist() if len(near) >= 2 else (near[0].tolist() if near else None)
        missing.append({"fdi": fdi, "zyx": zyx, "gap_mm": None})
    return teeth, missing
