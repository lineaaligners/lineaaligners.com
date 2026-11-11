"""2D X-ray analysis: tooth detection, FDI numbering and findings, always as suggestions.

The model module is swappable: an engine is a folder MODELS_DIR/xray/<name>/ with
  model.onnx   any detector exported to ONNX
  model.json   {"format": "yolo" | "boxes", "input_size": 640, "classes": [...], "conf": 0.25, "iou": 0.5,
                "title": "...", "views": ["pano", "intraoral"]}
"yolo":  one output (1, 4 + classes, N) or (1, N, 4 + classes) with cx, cy, w, h in input pixels.
"boxes": outputs boxes (N, 4 as x0, y0, x1, y1 in input pixels), scores (N), labels (N).
Class names decide the meaning: "tooth_36" or "36" is a numbered tooth, "tooth" an unnumbered one,
anything else a finding (caries, periapical_lesion, restoration, root_canal_filling, implant, crown, bone_loss ...).
"""
import json
import time
from pathlib import Path

import numpy as np

from .engines import MODELS_DIR
from .labels import FDI

ALIASES = {"periapical lesion": "periapical_lesion", "periapical lesions": "periapical_lesion", "deep caries": "deep_caries", "filling": "restoration",
           "fillings": "restoration", "restorations": "restoration", "root canal": "root_canal_filling", "rct": "root_canal_filling",
           "root canal treatment": "root_canal_filling", "implants": "implant", "crowns": "crown", "impacted": "impacted_tooth", "bone loss": "bone_loss"}


def parse_class(name: str) -> tuple[str, int | None]:
    n = name.strip().lower().replace("-", " ").replace("_", " ")
    digits = "".join(c for c in n if c.isdigit())
    if digits and int(digits) in FDI and (n == digits or "tooth" in n or "fdi" in n):
        return "tooth", int(digits)
    if n in ("tooth", "teeth"):
        return "tooth", None
    return ALIASES.get(n, n.replace(" ", "_")), None


def letterbox(img: np.ndarray, size: int) -> tuple[np.ndarray, float, int, int]:
    h, w = img.shape
    s = min(size / h, size / w)
    nh, nw = max(1, round(h * s)), max(1, round(w * s))
    ys = (np.arange(nh) / s).astype(int).clip(0, h - 1)
    xs = (np.arange(nw) / s).astype(int).clip(0, w - 1)
    canvas = np.full((size, size), 114, np.uint8)
    top, left = (size - nh) // 2, (size - nw) // 2
    canvas[top:top + nh, left:left + nw] = img[ys][:, xs]
    return canvas, s, left, top


def iou(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    x0, y0 = np.maximum(a[0], b[:, 0]), np.maximum(a[1], b[:, 1])
    x1, y1 = np.minimum(a[2], b[:, 2]), np.minimum(a[3], b[:, 3])
    inter = np.clip(x1 - x0, 0, None) * np.clip(y1 - y0, 0, None)
    return inter / ((a[2] - a[0]) * (a[3] - a[1]) + (b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1]) - inter + 1e-9)


def nms(boxes: np.ndarray, scores: np.ndarray, thr: float) -> list[int]:
    order, keep = list(np.argsort(-scores)), []
    while order:
        i = order.pop(0)
        keep.append(i)
        if order:
            rest = np.array(order)
            order = list(rest[iou(boxes[i], boxes[rest]) < thr])
    return keep


class OnnxDetector:
    def __init__(self, folder: Path):
        self.folder, self.name = folder, folder.name
        self.cfg = json.loads((folder / "model.json").read_text())
        self.title = self.cfg.get("title", self.name)
        self._session = None

    def detect(self, img: np.ndarray) -> list[dict]:
        import onnxruntime as ort
        if self._session is None:
            self._session = ort.InferenceSession(str(self.folder / "model.onnx"), providers=[p for p in ("CUDAExecutionProvider", "CPUExecutionProvider") if p in ort.get_available_providers()])
        size, classes = int(self.cfg.get("input_size", 640)), self.cfg["classes"]
        lb, s, left, top = letterbox(img, size)
        x = np.repeat(lb[None, None].astype(np.float32) / 255, 3, axis=1)
        out = self._session.run(None, {self._session.get_inputs()[0].name: x})
        if self.cfg.get("format", "yolo") == "boxes":
            boxes, scores, cls = np.asarray(out[0], float).reshape(-1, 4), np.asarray(out[1], float).ravel(), np.asarray(out[2]).ravel().astype(int)
        else:
            p = np.asarray(out[0], float)[0]
            if p.shape[0] < p.shape[1]:
                p = p.T
            cls, scores = p[:, 4:].argmax(1), p[:, 4:].max(1)
            boxes = np.c_[p[:, 0] - p[:, 2] / 2, p[:, 1] - p[:, 3] / 2, p[:, 0] + p[:, 2] / 2, p[:, 1] + p[:, 3] / 2]
        ok = scores >= float(self.cfg.get("conf", 0.25))
        boxes, scores, cls = boxes[ok], scores[ok], cls[ok]
        found = []
        for c in np.unique(cls):  # suppression per class: a caries box may sit inside a tooth box
            idx = np.where(cls == c)[0]
            for k in nms(boxes[idx], scores[idx], float(self.cfg.get("iou", 0.5))):
                b = boxes[idx][k]
                box = [(b[0] - left) / s, (b[1] - top) / s, (b[2] - left) / s, (b[3] - top) / s]
                box = [float(np.clip(box[0], 0, img.shape[1])), float(np.clip(box[1], 0, img.shape[0])), float(np.clip(box[2], 0, img.shape[1])), float(np.clip(box[3], 0, img.shape[0]))]
                kind, fdi = parse_class(classes[int(c)])
                found.append({"kind": kind, "fdi": fdi, "box": [round(v, 1) for v in box], "confidence": round(float(scores[idx][k]), 3)})
        return found


def engines() -> dict[str, OnnxDetector]:
    root = MODELS_DIR / "xray"
    return {d.name: OnnxDetector(d) for d in sorted(root.iterdir()) if (d / "model.onnx").exists() and (d / "model.json").exists()} if root.exists() else {}


def number_panoramic(teeth: list[dict], width: int) -> None:
    """Rule-based FDI for unnumbered tooth boxes on a panoramic image: rows by height, counted outwards from the midline.

    The image's left side is the patient's right. A missing tooth shifts every number behind it, so the
    dentist has to check the result; it is reported as rule-based.
    """
    if len(teeth) < 4:
        return
    cy = np.array([(t["box"][1] + t["box"][3]) / 2 for t in teeth])
    split = (cy.min() + cy.max()) / 2
    for upper in (True, False):
        row = [t for t, y in zip(teeth, cy) if (y < split) == upper]
        for right in (True, False):  # patient right = image left
            side = sorted((t for t in row if ((t["box"][0] + t["box"][2]) / 2 < width / 2) == right), key=lambda t: abs((t["box"][0] + t["box"][2]) / 2 - width / 2))
            quad = {(True, True): 1, (True, False): 2, (False, False): 3, (False, True): 4}[(upper, right)]
            for pos, t in enumerate(side[:8], start=1):
                t["fdi"] = quad * 10 + pos


def analyze(img: np.ndarray, engine_name: str, view: str) -> dict:
    t0 = time.perf_counter()
    found = engines()[engine_name].detect(img)
    teeth = [f for f in found if f["kind"] == "tooth"]
    numbering = "model" if any(t["fdi"] for t in teeth) else "none"
    if teeth and numbering == "none" and view == "pano":
        number_panoramic(teeth, img.shape[1])
        numbering = "rule-based"
    if teeth:  # a finding belongs to the tooth it overlaps most
        tb = np.array([t["box"] for t in teeth], float)
        for f in found:
            if f["kind"] == "tooth":
                continue
            b = np.array(f["box"], float)
            inter = np.clip(np.minimum(b[2], tb[:, 2]) - np.maximum(b[0], tb[:, 0]), 0, None) * np.clip(np.minimum(b[3], tb[:, 3]) - np.maximum(b[1], tb[:, 1]), 0, None)
            share = inter / max(1e-9, (b[2] - b[0]) * (b[3] - b[1]))
            if share.max() > 0.2:
                f["fdi"] = teeth[int(share.argmax())]["fdi"]
    for i, f in enumerate(found):
        f["id"] = i
    return {"engine": engine_name, "seconds": round(time.perf_counter() - t0, 2), "numbering": numbering, "findings": found}
