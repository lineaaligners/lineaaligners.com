"""Inbox watcher and patient library."""
import importlib
import io
import shutil
import sys
import zipfile
from pathlib import Path

import numpy as np
import pydicom
import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_pipeline import N, NZ, phantom, write_series  # noqa: E402

from app.library import UNASSIGNED, Library  # noqa: E402


@pytest.fixture()
def lib(tmp_path):
    return Library(tmp_path / "data", tmp_path / "inbox")


def export(lib, name="CBCT"):
    write_series(lib.inbox / name / "DICOMRM", phantom()[:12])
    (lib.inbox / name / "DICOMDIR").write_bytes(b"\0" * 300)


def test_export_is_filed_under_the_patient_and_inbox_is_emptied(lib):
    export(lib)
    assert lib.scan_once(settle_seconds=0) == 12
    (p,) = lib.patients()
    assert p["name"] == "Fantom Dentar" and p["pid"] == "F1" and p["exams"] == 1
    (e,) = lib.exams(p["id"])
    assert e["kind"] == "volume" and e["n_files"] == 12 and e["modality"] == "CT" and (e["rows"], e["cols"]) == (N, N)
    assert lib.status()["waiting"] == 0
    assert (lib.inbox / "_ignored" / "CBCT" / "DICOMDIR").exists()  # set aside, not deleted
    with zipfile.ZipFile(io.BytesIO(lib.series_zip(e["id"]))) as z:
        assert len(z.namelist()) == 12
        assert pydicom.dcmread(io.BytesIO(z.read(z.namelist()[0]))).Rows == N


def test_files_still_being_written_wait_for_the_next_scan(lib):
    export(lib)
    assert lib.scan_once(settle_seconds=3600) == 0 and lib.patients() == []
    assert lib.scan_once(settle_seconds=0) == 12


def test_second_exam_joins_the_same_patient_and_slices_arriving_later_join_their_series(lib):
    vol = phantom()[:10]
    write_series(lib.inbox / "a", vol)
    files = sorted((lib.inbox / "a").iterdir())
    late = lib.inbox.parent / "late"
    late.mkdir()
    for f in files[6:]:
        shutil.move(str(f), late / f.name)
    assert lib.scan_once(0) == 6
    for f in late.iterdir():
        shutil.move(str(f), lib.inbox / f.name)
    assert lib.scan_once(0) == 4
    write_series(lib.inbox / "b", vol[:3])  # new study and series UIDs, same patient ID
    lib.scan_once(0)
    (p,) = lib.patients()
    assert sorted(e["n_files"] for e in lib.exams(p["id"])) == [3, 10]


def test_patients_without_id_match_on_name_and_birth_date(lib):
    for i, (name, birth) in enumerate([("Gashi^Arta", "19900101"), ("Gashi^Arta", "19900101"), ("Gashi^Arta", "19850505")]):
        write_series(lib.inbox / f"s{i}", phantom()[:1])
        f = next((lib.inbox / f"s{i}").iterdir())
        ds = pydicom.dcmread(f)
        ds.PatientID, ds.PatientName, ds.PatientBirthDate = "", name, birth
        ds.save_as(f)
    lib.scan_once(0)
    assert sorted(p["exams"] for p in lib.patients("Gashi")) == [1, 2]


def test_png_export_lands_under_unassigned_and_can_be_moved(lib):
    export(lib)
    Image.fromarray(np.zeros((20, 30), np.uint8)).save(lib.inbox / "rvg_36.png")
    lib.scan_once(0)
    by = {p["name"]: p for p in lib.patients()}
    (img,) = lib.exams(by[UNASSIGNED]["id"])
    assert img["modality"] == "IMG" and img["description"] == "rvg_36.png" and img["kind"] == "image"
    assert lib.assign(img["id"], by["Fantom Dentar"]["id"]) and not lib.assign(img["id"], 999)
    assert len(lib.exams(by["Fantom Dentar"]["id"])) == 2 and UNASSIGNED not in {p["name"] for p in lib.patients()}


def test_api(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("INBOX_DIR", str(tmp_path / "inbox"))
    monkeypatch.setenv("WATCH_INBOX", "0")
    from app import main
    importlib.reload(main)
    write_series(tmp_path / "inbox" / "x", phantom()[:9])
    main.LIB.scan_once(0)
    client = TestClient(main.app)
    (p,) = client.get("/api/library/patients?q=fantom").json()["patients"]
    (e,) = client.get(f"/api/library/patients/{p['id']}/exams").json()["exams"]
    assert e["kind"] == "volume"
    assert client.get(f"/api/library/series/{e['id']}/zip").content[:2] == b"PK"
    assert client.get("/api/library/series/999/zip").status_code == 404
    assert client.get("/api/library/status").json()["waiting"] == 0
    assert NZ > 9
