"""Segmentation engines. Each one takes the isotropic volume and returns labels in our scheme.

Add a model by subclassing Engine; nothing else in the pipeline or the viewer has to change.
"""
import json
import os
import time
from pathlib import Path
from typing import Callable

import numpy as np
import SimpleITK as sitk

from . import labels as L

MODELS_DIR = Path(os.environ.get("MODELS_DIR", Path(__file__).resolve().parent.parent / "models"))
Progress = Callable[[str, float], None]


class Engine:
    name = ""
    title = ""
    is_ai = False

    def available(self) -> tuple[bool, str]:
        return True, ""

    def predict(self, img: sitk.Image, progress: Progress) -> tuple[np.ndarray, dict, str]:
        """Returns (labels zyx uint8 in our scheme, confidence per label or {}, device used)."""
        raise NotImplementedError


class ClassicalEngine(Engine):
    """Threshold-based fallback without any model: bone and teeth only, split into jaws at the bite.

    It exists so the whole workflow can be exercised without a GPU or weights. It is not AI and finds
    no canals, sinuses or pulp.
    """
    name, title = "classical", "Klasik (pa AI): kockë dhe dhëmbë"

    def predict(self, img, progress):
        a = sitk.GetArrayViewFromImage(img)
        progress("thresholds", 0.2)
        sample = a[::3, ::3, ::3]
        t_teeth = float(np.percentile(sample, 99.3))
        tissue = sample[(sample > sample.min() + 200) & (sample < t_teeth)]
        t_bone = float(sitk.GetArrayViewFromImage(img).mean()) if tissue.size < 100 else float(_otsu(tissue))
        t_bone = min(max(t_bone, np.percentile(sample, 90)), t_teeth - 1)
        teeth = a >= t_teeth
        bone = (a >= t_bone) & ~teeth
        progress("jaws", 0.6)
        per_slice = teeth.reshape(teeth.shape[0], -1).sum(1).astype(float)
        split = _bite_plane(per_slice)
        up = img.GetDirection()[8] >= 0  # index z grows towards the head
        upper = np.zeros(a.shape[0], bool)
        upper[split:] = True
        if not up:
            upper = ~upper
        out = np.zeros(a.shape, np.uint8)
        u = upper[:, None, None]
        out[bone & u], out[bone & ~u] = L.MAXILLA, L.MANDIBLE
        out[teeth & u], out[teeth & ~u] = L.UPPER_TEETH, L.LOWER_TEETH
        return out, {}, "cpu"


def _otsu(v: np.ndarray) -> float:
    hist, edges = np.histogram(v, 256)
    p = hist / hist.sum()
    w = np.cumsum(p)
    mids = (edges[:-1] + edges[1:]) / 2
    mu = np.cumsum(p * mids)
    with np.errstate(divide="ignore", invalid="ignore"):
        var = (mu[-1] * w - mu) ** 2 / (w * (1 - w))
    return float(mids[np.nanargmax(var)])


def _bite_plane(per_slice: np.ndarray) -> int:
    """Slice between the jaws: the emptiest slice inside the tooth-bearing range, else its middle."""
    if per_slice.max() <= 0:
        return len(per_slice) // 2
    idx = np.where(per_slice > per_slice.max() * 0.25)[0]
    a, b = int(idx[0]), int(idx[-1])
    if b - a < 6:
        return (a + b) // 2
    k = max(1, (b - a) // 5)
    inner = per_slice[a + k:b - k + 1]
    gap = int(np.argmin(inner)) + a + k
    return gap if inner.min() < per_slice.max() * 0.35 else (a + b) // 2


class NnUNetEngine(Engine):
    """Runs a trained nnU-Net v2 model folder found under MODELS_DIR/<folder>.

    Works with any model whose dataset.json label names can be mapped by labels.from_dataset_json:
    DentalSegmentator out of the box, a ToothFairy2-trained model once you have trained one.
    """
    is_ai = True

    def __init__(self, name: str, title: str, folder: str):
        self.name, self.title, self.folder = name, title, folder
        self._predictor = None

    def _model_dir(self) -> Path | None:
        root = MODELS_DIR / self.folder
        hits = sorted(p.parent for p in root.rglob("plans.json") if (p.parent / "dataset.json").exists()) if root.exists() else []
        return hits[0] if hits else None

    def available(self):
        if self._model_dir() is None:
            return False, f"Model folder missing: {MODELS_DIR / self.folder}"
        try:
            import nnunetv2  # noqa: F401
            import torch  # noqa: F401
        except ImportError as e:
            return False, f"Missing Python package: {e.name}"
        return True, ""

    def predict(self, img, progress):
        import torch
        from nnunetv2.inference.predict_from_raw_data import nnUNetPredictor

        folder = self._model_dir()
        cuda = torch.cuda.is_available()
        device = torch.device("cuda" if cuda else "cpu")
        if self._predictor is None:
            progress("loading model", 0.05)
            p = nnUNetPredictor(tile_step_size=0.5, use_gaussian=True, use_mirroring=False, perform_everything_on_device=cuda,
                                device=device, verbose=False, verbose_preprocessing=False, allow_tqdm=False)
            folds = [d.name.replace("fold_", "") for d in sorted(folder.glob("fold_*")) if (d / "checkpoint_final.pth").exists()]
            folds = tuple("all" if f == "all" else int(f) for f in folds) or (0,)
            p.initialize_from_trained_model_folder(str(folder), use_folds=folds[:1] if not cuda else folds, checkpoint_name="checkpoint_final.pth")
            self._predictor = p
        p = self._predictor
        arr = sitk.GetArrayFromImage(img)[None].astype(np.float32)
        props = {"spacing": list(img.GetSpacing())[::-1]}
        # nnU-Net reports no per-patch progress through this call; the bar moves on elapsed time instead.
        progress("inference on " + device.type, 0.15)
        want_probs = arr.size < 60_000_000 and os.environ.get("CONFIDENCE", "1") == "1"
        res = p.predict_single_npy_array(arr, props, None, None, want_probs)
        seg, probs = (res if want_probs else (res, None))
        mapping = L.from_dataset_json(json.loads((folder / "dataset.json").read_text())["labels"])
        out = np.zeros(seg.shape, np.uint8)
        conf: dict[int, float] = {}
        for src, dst in mapping.items():
            m = seg == src
            if not m.any():
                continue
            out[m] = dst
            if probs is not None:
                conf[dst] = round(float(probs[src][m].mean()), 3)
        return out, conf, device.type


ENGINES: dict[str, Engine] = {e.name: e for e in [
    NnUNetEngine("dentalsegmentator", "DentalSegmentator (nnU-Net, 5 struktura)", "dentalsegmentator"),
    NnUNetEngine("toothfairy2", "ToothFairy2 (nnU-Net, dhëmbë FDI, kanale, sinuse)", "toothfairy2"),
    NnUNetEngine("medident", "Medident (i ri-trajnuar)", "medident"),
    ClassicalEngine(),
]}


def timed(fn, *a):
    t = time.perf_counter()
    r = fn(*a)
    return r, time.perf_counter() - t
