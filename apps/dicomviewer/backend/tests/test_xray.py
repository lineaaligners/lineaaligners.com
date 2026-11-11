"""2D pipeline tests with a fixed-output ONNX file: exercises loading, letterboxing, decoding, NMS, numbering, API."""
import importlib
import io
import sys
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from make_test_xray_model import build  # noqa: E402


@pytest.fixture()
def xr(tmp_path, monkeypatch):
    monkeypatch.setenv("MODELS_DIR", str(tmp_path / "models"))
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    build(tmp_path / "models" / "xray" / "test-fixed")
    from app import engines, main, xray
    for m in (engines, xray, main):
        importlib.reload(m)
    return xray, TestClient(main.app)


def test_class_names():
    from app.xray import parse_class
    assert parse_class("tooth_36") == ("tooth", 36) and parse_class("11") == ("tooth", 11) and parse_class("Tooth") == ("tooth", None)
    assert parse_class("Periapical Lesion") == ("periapical_lesion", None) and parse_class("Deep Caries") == ("deep_caries", None)
    assert parse_class("RCT") == ("root_canal_filling", None) and parse_class("99") == ("99", None)


def test_boxes_come_back_in_image_pixels_and_findings_get_a_tooth(xr):
    xray, _ = xr
    img = np.zeros((500, 1000), np.uint8)  # letterboxed to 640 x 320, 160 px padding above and below
    r = xray.analyze(img, "test-fixed", "pano")
    teeth = [f for f in r["findings"] if f["kind"] == "tooth"]
    assert len(teeth) == 8  # the overlapping duplicate is suppressed, the low-confidence box dropped
    assert {f["kind"] for f in r["findings"]} == {"tooth", "caries", "periapical_lesion", "restoration"}
    first = min(teeth, key=lambda t: (t["box"][1], t["box"][0]))
    s = 0.64
    assert first["box"] == pytest.approx([(120 - 30) / s, (250 - 55 - 160) / s, (120 + 30) / s, (250 + 55 - 160) / s], abs=0.2)
    # six upper teeth: three on each side of the midline, counted outwards; image left is patient right
    upper = sorted((t for t in teeth if t["box"][1] < 200), key=lambda t: t["box"][0])
    assert [t["fdi"] for t in upper] == [13, 12, 11, 21, 22, 23] and r["numbering"] == "rule-based"
    assert sorted(t["fdi"] for t in teeth if t["box"][1] > 200) == [31, 41]
    by = {f["kind"]: f for f in r["findings"] if f["kind"] != "tooth"}
    assert by["caries"]["fdi"] == 12 and by["restoration"]["fdi"] == 21 and by["periapical_lesion"]["fdi"] == 22
    assert by["caries"]["confidence"] == pytest.approx(0.81, abs=0.001)


def test_intraoral_images_are_not_numbered_by_rule(xr):
    xray, _ = xr
    r = xray.analyze(np.zeros((500, 1000), np.uint8), "test-fixed", "intraoral")
    assert r["numbering"] == "none" and all(f["fdi"] is None for f in r["findings"])


def test_api(xr):
    _, client = xr
    assert [e["name"] for e in client.get("/api/xray/engines").json()["engines"]] == ["test-fixed"]
    buf = io.BytesIO()
    Image.fromarray(np.zeros((500, 1000), np.uint8)).save(buf, "PNG")
    r = client.post("/api/xray/analyze?engine=test-fixed&view=pano", files={"file": ("x.png", buf.getvalue())})
    assert r.status_code == 200 and len(r.json()["findings"]) == 11 and r.json()["seconds"] >= 0
    assert client.post("/api/xray/analyze?engine=nope", files={"file": ("x.png", buf.getvalue())}).status_code == 400
