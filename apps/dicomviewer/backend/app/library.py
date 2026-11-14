"""Patient library: watches an inbox folder where Sidexis and NanoPix export, files new studies under the right patient.

Mental model for the viewer: patient -> timeline of exams -> open exam. Files are moved out of the inbox once
handled, so an empty inbox means everything has been imported.
"""
import io
import os
import shutil
import sqlite3
import threading
import time
import zipfile
from pathlib import Path

import pydicom

RASTER = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
UNASSIGNED = "Pa pacient"


class Library:
    def __init__(self, data: Path, inbox: Path | None = None):
        self.data, self.inbox, self.store = data, inbox or data / "inbox", data / "library"
        for d in (self.inbox, self.store):
            d.mkdir(parents=True, exist_ok=True)
        self.last_scan, self.lock = 0.0, threading.Lock()
        with self.db() as c:
            c.execute("CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY, pid TEXT, name TEXT, birth TEXT, UNIQUE(pid, name, birth))")
            c.execute("""CREATE TABLE IF NOT EXISTS series (id INTEGER PRIMARY KEY, patient_id INTEGER, study_uid TEXT, series_uid TEXT, date TEXT,
                         modality TEXT, description TEXT, rows INTEGER, cols INTEGER, frames INTEGER, n_files INTEGER DEFAULT 0, path TEXT, imported REAL,
                         UNIQUE(series_uid, rows, cols))""")

    def db(self):
        c = sqlite3.connect(self.data / "medident.sqlite")
        c.row_factory = sqlite3.Row
        return c

    # ---- import ----
    def _patient(self, c, pid: str, name: str, birth: str) -> int:
        name = " ".join(name.replace("^", " ").split())
        # same ID means same patient; without an ID, the name and birth date together have to match
        row = c.execute("SELECT id FROM patients WHERE pid = ? AND pid != ''", (pid,)).fetchone() if pid else \
            c.execute("SELECT id FROM patients WHERE pid = '' AND name = ? AND birth = ?", (name, birth)).fetchone()
        if row:
            return row["id"]
        return c.execute("INSERT INTO patients (pid, name, birth) VALUES (?, ?, ?)", (pid, name or UNASSIGNED, birth)).lastrowid

    def _add_file(self, c, f: Path, patient: int, study: str, series: str, date: str, modality: str, desc: str, rows: int, cols: int, frames: int) -> None:
        row = c.execute("SELECT id, path FROM series WHERE series_uid = ? AND rows = ? AND cols = ?", (series, rows, cols)).fetchone()
        if row:
            sid, folder = row["id"], Path(row["path"])
        else:
            sid = c.execute("INSERT INTO series (patient_id, study_uid, series_uid, date, modality, description, rows, cols, frames, path, imported) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                            (patient, study, series, date, modality, desc, rows, cols, frames, "", time.time())).lastrowid
            folder = self.store / str(patient) / str(sid)
            folder.mkdir(parents=True, exist_ok=True)
            c.execute("UPDATE series SET path = ? WHERE id = ?", (str(folder), sid))
        n = c.execute("SELECT n_files FROM series WHERE id = ?", (sid,)).fetchone()["n_files"]
        shutil.move(str(f), folder / f"{n:06d}{f.suffix.lower() if f.suffix.lower() in RASTER else '.dcm'}")
        c.execute("UPDATE series SET n_files = n_files + 1 WHERE id = ?", (sid,))

    def scan_once(self, settle_seconds: float = 2.0) -> int:
        """Imports every file in the inbox that has stopped changing. Returns how many image files were filed."""
        done = 0
        with self.lock, self.db() as c:
            for f in sorted(p for p in self.inbox.rglob("*") if p.is_file() and "_ignored" not in p.parts):
                if time.time() - f.stat().st_mtime < settle_seconds:
                    continue  # still being written by the exporting program
                try:
                    if f.suffix.lower() in RASTER:
                        st = f.stat()
                        pat = self._patient(c, "", UNASSIGNED, "")
                        self._add_file(c, f, pat, f"img-{f.name}-{st.st_size}", f"img-{f.name}-{st.st_size}-{st.st_mtime_ns}", time.strftime("%Y%m%d", time.localtime(st.st_mtime)), "IMG", f.name, 0, 0, 1)
                        done += 1
                        continue
                    ds = pydicom.dcmread(f, stop_before_pixels=True)
                    if "Rows" not in ds or "SeriesInstanceUID" not in ds:
                        raise ValueError("no image")  # DICOMDIR, reports
                    pat = self._patient(c, str(ds.get("PatientID", "")).strip(), str(ds.get("PatientName", "")), str(ds.get("PatientBirthDate", "")))
                    self._add_file(c, f, pat, str(ds.get("StudyInstanceUID", "")), str(ds.SeriesInstanceUID), str(ds.get("StudyDate", "") or ds.get("ContentDate", "")),
                                   str(ds.get("Modality", "")), str(ds.get("SeriesDescription", "") or ds.get("StudyDescription", "")), int(ds.Rows), int(ds.Columns), int(ds.get("NumberOfFrames", 1) or 1))
                    done += 1
                except Exception:  # not an image we can file: set aside so the inbox stays clean and nothing is lost
                    target = self.inbox / "_ignored" / f.relative_to(self.inbox)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), target)
            for d in sorted((p for p in self.inbox.rglob("*") if p.is_dir() and "_ignored" not in p.parts), reverse=True):
                if not any(d.iterdir()):
                    d.rmdir()
        self.last_scan = time.time()
        return done

    def watch(self, every: float = 3.0) -> None:
        def loop():
            while True:
                try:
                    self.scan_once()
                except Exception:  # the watcher must survive a bad file or a locked folder
                    pass
                time.sleep(every)
        threading.Thread(target=loop, daemon=True).start()

    # ---- queries ----
    def patients(self, q: str = "") -> list[dict]:
        with self.db() as c:
            rows = c.execute("""SELECT p.id, p.pid, p.name, p.birth, COUNT(s.id) AS exams, MAX(s.date) AS last FROM patients p JOIN series s ON s.patient_id = p.id
                                WHERE p.name LIKE ? OR p.pid LIKE ? GROUP BY p.id ORDER BY MAX(s.imported) DESC""", (f"%{q}%", f"%{q}%")).fetchall()
        return [dict(r) for r in rows]

    def exams(self, patient_id: int) -> list[dict]:
        with self.db() as c:
            rows = c.execute("SELECT id, study_uid, series_uid, date, modality, description, rows, cols, frames, n_files FROM series WHERE patient_id = ? ORDER BY date DESC, id DESC", (patient_id,)).fetchall()
        return [{**dict(r), "kind": "volume" if r["n_files"] >= 8 or r["frames"] >= 8 else "image"} for r in rows]

    def series_zip(self, series_id: int) -> bytes | None:
        with self.db() as c:
            row = c.execute("SELECT path FROM series WHERE id = ?", (series_id,)).fetchone()
        if not row:
            return None
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
            for f in sorted(Path(row["path"]).iterdir()):
                z.write(f, f.name)
        return buf.getvalue()

    def assign(self, series_id: int, patient_id: int) -> bool:
        with self.db() as c:
            ok = c.execute("SELECT 1 FROM patients WHERE id = ?", (patient_id,)).fetchone()
            if not ok:
                return False
            c.execute("UPDATE series SET patient_id = ? WHERE id = ?", (patient_id, series_id))
        return True

    def status(self) -> dict:
        waiting = sum(1 for p in self.inbox.rglob("*") if p.is_file() and "_ignored" not in p.parts)
        return {"inbox": str(self.inbox), "waiting": waiting, "last_scan": self.last_scan}
