"""Local API for the viewer. Patient data stays in DATA_DIR on this machine; nothing is sent elsewhere."""
import gzip
import io
import json
import os
import shutil
import sqlite3
import threading
import time
import uuid
import zipfile
from pathlib import Path

import numpy as np
import SimpleITK as sitk
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import meshes, pipeline, xray
from .engines import ENGINES

DATA = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DATA.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="Medident AI")
# The hosted viewer (a web page) may call this backend on the same PC; nothing else may.
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("ALLOWED_ORIGINS", "https://lineaaligners.com,https://www.lineaaligners.com,http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])
JOBS: dict[str, dict] = {}
LOCK = threading.Lock()  # one segmentation at a time: a second one would not fit in 8 GB of GPU memory


def db():
    c = sqlite3.connect(DATA / "medident.sqlite")
    c.execute("CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, created REAL, engine TEXT, status TEXT, seconds REAL, device TEXT, error TEXT)")
    return c


def record(job_id: str, **kw):
    with db() as c:
        c.execute("INSERT OR IGNORE INTO jobs (id, created) VALUES (?, ?)", (job_id, time.time()))
        for k, v in kw.items():
            c.execute(f"UPDATE jobs SET {k} = ? WHERE id = ?", (v, job_id))


def job_dir(job_id: str) -> Path:
    if not job_id.isalnum():
        raise HTTPException(400, "bad id")
    d = DATA / "jobs" / job_id
    if not d.exists():
        raise HTTPException(404, "unknown job")
    return d


@app.get("/api/engines")
def engines():
    out = []
    for e in ENGINES.values():
        ok, why = e.available()
        out.append({"name": e.name, "title": e.title, "is_ai": e.is_ai, "available": ok, "reason": why})
    gpu = None
    try:
        import torch
        gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    except ImportError:
        pass
    return {"engines": out, "gpu": gpu}


@app.post("/api/segment")
async def segment(file: UploadFile, engine: str = "classical"):
    if engine not in ENGINES:
        raise HTTPException(400, "unknown engine")
    job_id = uuid.uuid4().hex
    d = DATA / "jobs" / job_id
    (d / "dicom").mkdir(parents=True)
    with zipfile.ZipFile(io.BytesIO(await file.read())) as z:
        for i, info in enumerate(z.infolist()):
            if not info.is_dir():
                (d / "dicom" / f"{i:06d}.dcm").write_bytes(z.read(info))  # neutral names: nothing from the archive reaches the file system
    JOBS[job_id] = {"status": "queued", "stage": "queued", "progress": 0.0, "started": time.time()}
    record(job_id, engine=engine, status="queued")

    def work():
        with LOCK:
            j = JOBS[job_id]
            j.update(status="running", started=time.time())
            try:
                meta = pipeline.run(d / "dicom", d, engine, lambda stage, f: j.update(stage=stage, progress=round(f, 3)))
                j.update(status="done", progress=1.0)
                record(job_id, status="done", seconds=meta["seconds"], device=meta["device"])
            except Exception as e:  # reported to the viewer; the server keeps running
                j.update(status="error", error=str(e))
                record(job_id, status="error", error=str(e))
            finally:
                shutil.rmtree(d / "dicom", ignore_errors=True)

    threading.Thread(target=work, daemon=True).start()
    return {"id": job_id}


@app.get("/api/jobs/{job_id}")
def status(job_id: str):
    j = JOBS.get(job_id)
    if not j:
        d = job_dir(job_id)
        return {"status": "done" if (d / "meta.json").exists() else "error", "progress": 1.0, "stage": "", "elapsed": 0}
    return {**j, "elapsed": round(time.time() - j["started"], 1)}


@app.get("/api/jobs/{job_id}/meta")
def meta(job_id: str):
    return json.loads((job_dir(job_id) / "meta.json").read_text())


@app.get("/api/jobs/{job_id}/labels")
def get_labels(job_id: str):
    """uint8 labels, gzip, C order (z, y, x) on the grid described by meta.geometry."""
    return Response(gzip.compress(np.load(job_dir(job_id) / "labels.npy").tobytes(), 1), media_type="application/octet-stream")


@app.put("/api/jobs/{job_id}/labels")
async def put_labels(job_id: str, request: Request):
    """Stores the dentist's edited labels; meshes are rebuilt on the next request."""
    d = job_dir(job_id)
    img = sitk.ReadImage(str(d / "image.nii.gz"))
    raw = np.frombuffer(gzip.decompress(await request.body()), np.uint8)
    shape = img.GetSize()[::-1]
    if raw.size != int(np.prod(shape)):
        raise HTTPException(400, "label size does not match the volume")
    pipeline.save_labels(d, raw.reshape(shape), img)
    return {"ok": True}


@app.get("/api/jobs/{job_id}/mesh/{label}.{ext}")
def mesh(job_id: str, label: int, ext: str):
    d = job_dir(job_id)
    if ext not in ("glb", "stl"):
        raise HTTPException(400, "glb or stl")
    cache = d / f"mesh_{label}.{ext}"
    if not cache.exists():
        m = meshes.mesh_for(np.load(d / "labels.npy"), label, sitk.ReadImage(str(d / "image.nii.gz")))
        if m is None:
            raise HTTPException(404, "structure is empty")
        cache.write_bytes(meshes.glb(m) if ext == "glb" else meshes.stl(m))
    return Response(cache.read_bytes(), media_type="model/gltf-binary" if ext == "glb" else "model/stl")


@app.get("/api/xray/engines")
def xray_engines():
    return {"engines": [{"name": e.name, "title": e.title, "classes": e.cfg["classes"], "views": e.cfg.get("views", ["pano", "intraoral"])} for e in xray.engines().values()]}


@app.post("/api/xray/analyze")
async def xray_analyze(file: UploadFile, engine: str, view: str = "intraoral"):
    """Takes an 8-bit greyscale PNG of the radiograph; box coordinates in the answer are pixels of that image."""
    from PIL import Image
    if engine not in xray.engines():
        raise HTTPException(400, "unknown engine")
    img = np.asarray(Image.open(io.BytesIO(await file.read())).convert("L"))
    return xray.analyze(img, engine, view)


_dist = Path(os.environ.get("FRONTEND_DIST", Path(__file__).resolve().parent.parent.parent / "dist"))
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")
