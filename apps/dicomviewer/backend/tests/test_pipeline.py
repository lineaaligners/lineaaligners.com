"""End-to-end backend tests on a synthetic two-jaw CBCT written as real DICOM files."""
import gzip
import io
import time
import zipfile
from pathlib import Path

import numpy as np
import pydicom
import pytest
import SimpleITK as sitk
import trimesh
from fastapi.testclient import TestClient
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid

from app import labels as L
from app import meshes, pipeline, postprocess, volume

SP, N, NZ = 0.4, 220, 72
CX, Y0, HALF, DEPTH = 110, 30, 62, 115  # arch: parabola through the tooth centres, in voxels
SCALE = 0.92  # phantom arch is a little shorter than an adult one


def tooth_centres(jaw: str):
    """(fdi, x, y, radius) in voxels: teeth 1-7 per side laid out by arc length with real crown widths."""
    t = np.linspace(0, 1, 4000)
    x, y = t * HALF, DEPTH * t * t
    s = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(y)))]) * SP
    out, edge = [], 0.0
    for pos in range(1, 8):
        w = postprocess.WIDTH[jaw][pos - 1] * SCALE
        i = int(np.argmin(np.abs(s - (edge + w / 2))))
        edge += w
        for side in (-1, 1):  # -1: low x = patient right in LPS
            quad = {("upper", -1): 1, ("upper", 1): 2, ("lower", 1): 3, ("lower", -1): 4}[(jaw, side)]
            out.append((quad * 10 + pos, CX + side * x[i], Y0 + y[i], 0.43 * w / SP))
    return out


def phantom() -> np.ndarray:
    """Two jaws with bone around the arch; tooth 16 is absent."""
    v = np.full((NZ, N, N), -1000, np.int16)
    yy, xx = np.mgrid[:N, :N]
    v[:, ((xx - CX) / 100) ** 2 + ((yy - 115) / 105) ** 2 < 1] = 40
    for jaw, bone_z, tooth_z in (("lower", (6, 30), (10, 34)), ("upper", (44, 68), (40, 64))):
        cs = tooth_centres(jaw)
        bone = np.zeros((N, N), bool)
        for _, cx, cy, r in cs:
            bone |= (xx - cx) ** 2 + (yy - cy) ** 2 <= (r + 5) ** 2
        v[bone_z[0]:bone_z[1], bone] = 900
        for fdi, cx, cy, r in cs:
            if fdi != 16:
                v[tooth_z[0]:tooth_z[1], (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r] = 2600
    return v


def write_series(folder: Path, vol: np.ndarray) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    study, series = generate_uid(), generate_uid()
    for k in range(vol.shape[0]):
        fm = FileMetaDataset()
        fm.MediaStorageSOPClassUID = "1.2.840.10008.5.1.4.1.1.2"
        fm.MediaStorageSOPInstanceUID = generate_uid()
        fm.TransferSyntaxUID = ExplicitVRLittleEndian
        ds = FileDataset("x", {}, file_meta=fm, preamble=b"\0" * 128)
        ds.SOPClassUID, ds.SOPInstanceUID = fm.MediaStorageSOPClassUID, fm.MediaStorageSOPInstanceUID
        ds.StudyInstanceUID, ds.SeriesInstanceUID, ds.Modality, ds.PatientName, ds.PatientID = study, series, "CT", "Fantom^Dentar", "F1"
        ds.SeriesDescription = "Fantom nofulle"
        ds.Rows, ds.Columns, ds.SamplesPerPixel, ds.PhotometricInterpretation = N, N, 1, "MONOCHROME2"
        ds.BitsAllocated, ds.BitsStored, ds.HighBit, ds.PixelRepresentation = 16, 16, 15, 1
        ds.PixelSpacing, ds.SliceThickness, ds.RescaleSlope, ds.RescaleIntercept = [SP, SP], SP, 1, 0
        ds.ImagePositionPatient, ds.ImageOrientationPatient, ds.InstanceNumber = [10.0, 20.0, 30.0 + k * SP], [1, 0, 0, 0, 1, 0], k + 1
        ds.WindowCenter, ds.WindowWidth = 800, 4000
        ds.PixelData = vol[k].tobytes()
        ds.save_as(folder / f"s{(k * 37) % vol.shape[0]:03d}.dcm", enforce_file_format=True)


@pytest.fixture(scope="module")
def result(tmp_path_factory):
    root = tmp_path_factory.mktemp("case")
    write_series(root / "dicom", phantom())
    stages = []
    meta = pipeline.run(root / "dicom", root / "out", "classical", lambda s, f: stages.append((s, f)))
    return root, meta, stages


def test_reads_series_in_position_order(result):
    root, _, _ = result
    img = volume.read_dicom(root / "dicom")
    assert img.GetSize() == (N, N, NZ) and img.GetSpacing() == pytest.approx((SP, SP, SP))
    assert img.GetOrigin() == pytest.approx((10, 20, 30))
    assert sitk.GetArrayViewFromImage(img)[20].max() > 2000 and sitk.GetArrayViewFromImage(img)[37].max() < 1000


def test_isotropic_resampling():
    img = sitk.GetImageFromArray(np.zeros((10, 20, 30), np.float32))
    img.SetSpacing((0.6, 0.3, 0.9))
    iso = volume.resample_iso(img, 0.3)
    assert iso.GetSpacing() == (0.3, 0.3, 0.3) and iso.GetSize() == (60, 20, 30)


def test_labels_return_on_original_grid(result):
    root, meta, stages = result
    lab = np.load(root / "out" / "labels.npy")
    assert lab.shape == (NZ, N, N) and meta["geometry"]["size"] == [N, N, NZ]
    assert stages[-1] == ("done", 1.0) and [f for _, f in stages] == sorted(f for _, f in stages)
    names = {s["name"] for s in meta["structures"]}
    assert {"maxilla", "mandible"} <= names
    # jaws on the right side of the bite, in the original slice order
    assert (lab[50] == L.MAXILLA).sum() > 500 and (lab[20] == L.MANDIBLE).sum() > 500
    assert (lab[20] == L.MAXILLA).sum() == 0
    assert (root / "out" / "labels.nii.gz").exists() and (root / "out" / "image.nii.gz").exists()


def test_teeth_numbered_fdi_and_gap_reported(result):
    _, meta, _ = result
    found = {t["fdi"] for t in meta["teeth"]}
    lower = {q * 10 + p for q in (3, 4) for p in range(1, 8)}
    assert lower <= found, sorted(lower - found)
    assert {21, 22, 23, 24, 25, 26, 27} <= found and {11, 12, 13, 14, 15, 17} <= found
    assert 16 not in found
    assert [m["fdi"] for m in meta["missing"]] == [16]
    # the reported implant site is where the tooth was left out
    _, cx, cy, _ = next(c for c in tooth_centres("upper") if c[0] == 16)
    wx, wy, wz = meta["missing"][0]["world"]
    assert abs(wx - (10 + cx * SP)) < 3.5 and abs(wy - (20 + cy * SP)) < 3.5 and 30 + 38 * SP < wz < 30 + NZ * SP
    # every tooth centre is close to where the phantom put it
    by = {t["fdi"]: t["world"] for t in meta["teeth"]}
    for jaw in ("upper", "lower"):
        for fdi, cx, cy, _ in tooth_centres(jaw):
            if fdi != 16:
                assert abs(by[fdi][0] - (10 + cx * SP)) < 1.5 and abs(by[fdi][1] - (20 + cy * SP)) < 1.5, fdi
    # patient-left teeth sit at higher x
    by = {t["fdi"]: t["world"] for t in meta["teeth"]}
    assert by[26][0] > by[11][0] > by[14][0] and by[36][0] > by[46][0]


def test_canal_split_left_right():
    lab = np.zeros((4, 4, 20), np.uint8)
    lab[:, :, 2:5] = L.CANAL_L
    lab[:, :, 15:18] = L.CANAL_L
    lab[:, :, 9:11] = L.MANDIBLE
    postprocess.split_canals(lab, x_grows_left=True)
    assert (lab[:, :, 2:5] == L.CANAL_R).all() and (lab[:, :, 15:18] == L.CANAL_L).all()


def test_model_label_names_map_to_our_scheme():
    ds = {"background": 0, "Upper Skull": 1, "Mandible": 2, "Upper Teeth": 3, "Lower Teeth": 4, "Mandibular canal": 5}
    assert L.from_dataset_json(ds) == {1: L.MAXILLA, 2: L.MANDIBLE, 3: L.UPPER_TEETH, 4: L.LOWER_TEETH, 5: L.CANAL_L}
    tf = {"background": 0, "Lower Jawbone": 1, "Upper Jawbone": 2, "Left Inferior Alveolar Canal": 3, "Right Inferior Alveolar Canal": 4,
          "Left Maxillary Sinus": 5, "Right Maxillary Sinus": 6, "Pharynx": 7, "Bridge": 8, "Crown": 9, "Implant": 10, "Upper Right Central Incisor": 11, "Tooth 36": 36}
    m = L.from_dataset_json(tf)
    assert m[1] == L.MANDIBLE and m[2] == L.MAXILLA and m[3] == L.CANAL_L and m[4] == L.CANAL_R and m[5] == L.SINUS_L and m[6] == L.SINUS_R
    assert m[36] == 36 and 7 not in m and 10 not in m


def test_mesh_is_closed_and_in_patient_millimetres(result):
    root, meta, _ = result
    lab = np.load(root / "out" / "labels.npy")
    img = sitk.ReadImage(str(root / "out" / "image.nii.gz"))
    m = meshes.mesh_for(lab, 36, img)
    assert m is not None and m.is_watertight and len(m.faces) <= meshes.MAX_FACES
    world = next(t["world"] for t in meta["teeth"] if t["fdi"] == 36)
    assert np.linalg.norm(m.centroid - np.array(world)) < 1.5
    voxel_mm3 = (lab == 36).sum() * SP ** 3
    assert abs(m.volume - voxel_mm3) / voxel_mm3 < 0.15
    assert m.volume > 0  # outward-facing normals
    back = trimesh.load(io.BytesIO(meshes.glb(m)), file_type="glb", force="mesh")
    assert len(back.faces) == len(m.faces)


def test_api_roundtrip_with_edit(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    import importlib

    from app import main
    importlib.reload(main)
    client = TestClient(main.app)
    names = {e["name"]: e for e in client.get("/api/engines").json()["engines"]}
    assert names["classical"]["available"] and not names["dentalsegmentator"]["available"]
    write_series(tmp_path / "dicom", phantom())
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for f in (tmp_path / "dicom").iterdir():
            z.write(f, f.name)
    job = client.post("/api/segment?engine=classical", files={"file": ("s.zip", buf.getvalue())}).json()["id"]
    for _ in range(600):
        st = client.get(f"/api/jobs/{job}").json()
        if st["status"] in ("done", "error"):
            break
        time.sleep(0.1)
    assert st["status"] == "done", st
    meta = client.get(f"/api/jobs/{job}/meta").json()
    assert meta["seconds"] > 0 and meta["device"] == "cpu" and meta["is_ai"] is False
    lab = np.frombuffer(gzip.decompress(client.get(f"/api/jobs/{job}/labels").content), np.uint8).reshape(NZ, N, N)
    assert (lab == 36).sum() > 1000
    assert client.get(f"/api/jobs/{job}/mesh/36.glb").content[:4] == b"glTF"
    assert client.get(f"/api/jobs/{job}/mesh/99.glb").status_code == 404
    edited = lab.copy()
    edited[edited == 36] = 0
    assert client.put(f"/api/jobs/{job}/labels", content=gzip.compress(edited.tobytes())).json() == {"ok": True}
    assert client.get(f"/api/jobs/{job}/mesh/36.glb").status_code == 404  # mesh cache follows the edit
    assert client.put(f"/api/jobs/{job}/labels", content=gzip.compress(b"123")).status_code == 400
    assert not (tmp_path / "data" / "jobs" / job / "dicom").exists()  # uploaded DICOM is removed after processing
    assert client.get("/api/jobs/../etc").status_code in (400, 404)
