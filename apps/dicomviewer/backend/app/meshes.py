"""Surface meshes per structure: marching cubes, Taubin smoothing, decimation, GLB in patient (LPS) millimetres."""
import numpy as np
import SimpleITK as sitk
import trimesh
from skimage import measure

MAX_FACES = 60_000


def mesh_for(lab: np.ndarray, label: int, ref: sitk.Image) -> trimesh.Trimesh | None:
    mask = lab == label
    if mask.sum() < 30:
        return None
    zs, ys, xs = np.nonzero(mask)
    lo = np.maximum([zs.min() - 2, ys.min() - 2, xs.min() - 2], 0)
    hi = np.minimum([zs.max() + 3, ys.max() + 3, xs.max() + 3], mask.shape)
    sub = np.pad(mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]].astype(np.float32), 1)
    try:
        v, f, _, _ = measure.marching_cubes(sub, 0.5)
    except (ValueError, RuntimeError):
        return None
    m = trimesh.Trimesh(v, f, process=True)
    trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=12)
    if len(m.faces) > MAX_FACES:
        try:
            import fast_simplification
            v2, f2 = fast_simplification.simplify(m.vertices, m.faces, target_reduction=1 - MAX_FACES / len(m.faces))
            m = trimesh.Trimesh(v2, f2, process=False)
        except Exception:  # decimation is an optimisation; keep the full mesh if it fails
            pass
    # voxel index (z, y, x) of the crop -> full index (x, y, z) -> patient millimetres
    idx = (m.vertices - 1 + lo)[:, ::-1]
    d = np.array(ref.GetDirection()).reshape(3, 3)
    m.vertices = (idx * np.array(ref.GetSpacing())) @ d.T + np.array(ref.GetOrigin())
    if np.linalg.det(d) * 1 > 0:  # index order flip (zyx -> xyz) mirrors the winding
        m.invert()
    m.fix_normals()
    return m


def glb(mesh: trimesh.Trimesh) -> bytes:
    return mesh.export(file_type="glb")


def stl(mesh: trimesh.Trimesh) -> bytes:
    return mesh.export(file_type="stl")
