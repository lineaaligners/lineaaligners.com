"""DICOM -> NIfTI -> isotropic volume -> engine -> rule-based post-processing -> labels on the original grid."""
import json
import time
from pathlib import Path

import numpy as np
import SimpleITK as sitk

from . import labels as L
from . import postprocess, volume
from .engines import ENGINES, Progress

ISO_MM = 0.3


def run(dicom_dir: Path, out_dir: Path, engine_name: str, progress: Progress) -> dict:
    t0 = time.perf_counter()
    engine = ENGINES[engine_name]
    ok, why = engine.available()
    if not ok:
        raise RuntimeError(why)
    progress("reading DICOM", 0.02)
    img = volume.read_dicom(dicom_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    sitk.WriteImage(img, str(out_dir / "image.nii.gz"))
    progress("resampling to 0.3 mm", 0.08)
    iso = volume.resample_iso(img, ISO_MM)
    t1 = time.perf_counter()
    lab, conf, device = engine.predict(iso, lambda stage, f: progress(stage, 0.1 + 0.7 * f))
    infer_s = time.perf_counter() - t1
    progress("teeth and canals", 0.82)
    x_left = iso.GetDirection()[0] >= 0  # LPS: +x is the patient's left
    postprocess.split_canals(lab, x_left)
    if (lab == L.UPPER_TEETH).any() or (lab == L.LOWER_TEETH).any():
        teeth, missing = postprocess.number_teeth(lab, ISO_MM, x_left)
        numbering = "rule-based"
    else:
        teeth, missing = postprocess.missing_from_labels(lab, ISO_MM)
        numbering = "model"
    progress("back to original grid", 0.9)
    full = volume.labels_to_grid(lab, iso, img)
    save_labels(out_dir, full, img)
    world = lambda zyx: volume.index_to_world(iso, zyx) if zyx else None  # noqa: E731
    vox_mm3 = float(np.prod(img.GetSpacing()))
    ids, counts = np.unique(full, return_counts=True)
    meta = {
        "engine": engine.name, "engine_title": engine.title, "is_ai": engine.is_ai, "device": device,
        "seconds": round(time.perf_counter() - t0, 1), "inference_seconds": round(infer_s, 1),
        "geometry": volume.geometry(img), "numbering": numbering,
        "structures": [{"label": int(i), "name": L.NAMES.get(int(i), str(i)), "volume_mm3": round(float(c) * vox_mm3, 1), "confidence": conf.get(int(i))} for i, c in zip(ids, counts) if i],
        "teeth": [{"fdi": t["fdi"], "world": world(t["zyx"])} for t in sorted(teeth, key=lambda t: t["fdi"])],
        "missing": [{"fdi": m["fdi"], "world": world(m["zyx"]), "gap_mm": m["gap_mm"]} for m in sorted(missing, key=lambda m: m["fdi"])],
    }
    (out_dir / "meta.json").write_text(json.dumps(meta))
    progress("done", 1.0)
    return meta


def save_labels(out_dir: Path, full: np.ndarray, img: sitk.Image) -> None:
    np.save(out_dir / "labels.npy", full.astype(np.uint8))
    lab_img = sitk.GetImageFromArray(full.astype(np.uint8))
    lab_img.CopyInformation(img)
    sitk.WriteImage(lab_img, str(out_dir / "labels.nii.gz"))  # image.nii.gz + labels.nii.gz = one nnU-Net training case
    for f in out_dir.glob("mesh_*"):
        f.unlink()
