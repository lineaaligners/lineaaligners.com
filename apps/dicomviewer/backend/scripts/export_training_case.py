"""Collects corrected Medident cases into an nnU-Net raw dataset for fine-tuning.

Every job folder holds image.nii.gz and labels.nii.gz (the dentist's corrected labels). This script
copies them as case_XXXX_0000.nii.gz / case_XXXX.nii.gz and writes dataset.json in our label scheme.

    python scripts/export_training_case.py data/jobs nnUNet_raw/Dataset500_Medident
"""
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import labels as L  # noqa: E402


def main(jobs: Path, out: Path) -> None:
    (out / "imagesTr").mkdir(parents=True, exist_ok=True)
    (out / "labelsTr").mkdir(parents=True, exist_ok=True)
    n = 0
    for job in sorted(jobs.iterdir()):
        if not (job / "labels.nii.gz").exists() or not (job / "image.nii.gz").exists():
            continue
        n += 1
        shutil.copy(job / "image.nii.gz", out / "imagesTr" / f"case_{n:04d}_0000.nii.gz")
        shutil.copy(job / "labels.nii.gz", out / "labelsTr" / f"case_{n:04d}.nii.gz")
    # nnU-Net wants consecutive label ids; remap.json records how to get back to our scheme
    ids = sorted(L.NAMES)
    remap = {old: new for new, old in enumerate(ids, start=1)}
    (out / "remap.json").write_text(json.dumps(remap))
    (out / "dataset.json").write_text(json.dumps({
        "channel_names": {"0": "CT"}, "labels": {"background": 0, **{L.NAMES[i]: remap[i] for i in ids}},
        "numTraining": n, "file_ending": ".nii.gz",
    }, indent=2))
    print(f"{n} cases written to {out}. Label values in labelsTr still use our scheme: apply remap.json before training.")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
