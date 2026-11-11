"""Volume I/O: DICOM -> SimpleITK image, isotropic resampling, label maps back to the original grid."""
from pathlib import Path

import numpy as np
import SimpleITK as sitk


def read_dicom(folder: Path) -> sitk.Image:
    """Reads the largest image series under `folder` (multi-file or one multi-frame file)."""
    reader = sitk.ImageSeriesReader()
    best: list[str] = []
    for d in [folder, *[p for p in folder.rglob("*") if p.is_dir()]]:
        for uid in reader.GetGDCMSeriesIDs(str(d)) or []:
            names = reader.GetGDCMSeriesFileNames(str(d), uid)
            if len(names) > len(best):
                best = list(names)
    if not best:
        raise ValueError("No DICOM image series found")
    if len(best) == 1:
        img = sitk.ReadImage(best[0])
    else:
        reader.SetFileNames(best)
        img = reader.Execute()
    if img.GetDimension() != 3 or min(img.GetSize()) < 8:
        raise ValueError("The series is not a 3D volume")
    return sitk.Cast(img, sitk.sitkFloat32)


def resample_iso(img: sitk.Image, spacing_mm: float = 0.3) -> sitk.Image:
    size = [max(1, int(round(n * s / spacing_mm))) for n, s in zip(img.GetSize(), img.GetSpacing())]
    air = float(sitk.GetArrayViewFromImage(img).min())
    return sitk.Resample(img, size, sitk.Transform(), sitk.sitkLinear, img.GetOrigin(), [spacing_mm] * 3, img.GetDirection(), air, sitk.sitkFloat32)


def labels_to_grid(labels: np.ndarray, like: sitk.Image, target: sitk.Image) -> np.ndarray:
    """Label array on the grid of `like` -> uint8 array (z, y, x) on the grid of `target`, nearest neighbour."""
    lab = sitk.GetImageFromArray(labels.astype(np.uint8))
    lab.CopyInformation(like)
    out = sitk.Resample(lab, target, sitk.Transform(), sitk.sitkNearestNeighbor, 0, sitk.sitkUInt8)
    return sitk.GetArrayFromImage(out)


def geometry(img: sitk.Image) -> dict:
    return {"size": list(img.GetSize()), "spacing": list(img.GetSpacing()), "origin": list(img.GetOrigin()), "direction": list(img.GetDirection())}


def index_to_world(img: sitk.Image, zyx) -> list[float]:
    return list(img.TransformContinuousIndexToPhysicalPoint([float(zyx[2]), float(zyx[1]), float(zyx[0])]))
