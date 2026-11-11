"""Writes a tiny ONNX "detector" that always returns the same boxes. For tests of the 2D pipeline only: it is not a model.

    python scripts/make_test_xray_model.py <models dir>
"""
import json
import sys
from pathlib import Path

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

CLASSES = ["tooth", "caries", "periapical lesion", "restoration", "root canal", "implant", "crown", "bone loss"]
# cx, cy, w, h in a 640 x 640 letterboxed input, then class index and score
BOXES = [(120, 250, 60, 110, 0, 0.92), (200, 250, 60, 110, 0, 0.90), (280, 250, 60, 110, 0, 0.91), (360, 250, 60, 110, 0, 0.89), (440, 250, 60, 110, 0, 0.93), (520, 250, 60, 110, 0, 0.88),
         (160, 390, 60, 110, 0, 0.90), (480, 390, 60, 110, 0, 0.87), (204, 252, 58, 108, 0, 0.55),  # duplicate tooth: removed by NMS
         (205, 225, 26, 24, 1, 0.81), (440, 300, 30, 28, 2, 0.64), (365, 230, 34, 30, 3, 0.77), (300, 300, 5, 5, 1, 0.10)]  # last one is below the confidence limit


def build(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    out = np.zeros((1, 4 + len(CLASSES), len(BOXES)), np.float32)
    for i, (cx, cy, w, h, c, s) in enumerate(BOXES):
        out[0, :4, i] = (cx, cy, w, h)
        out[0, 4 + c, i] = s
    node = helper.make_node("Constant", [], ["output0"], value=numpy_helper.from_array(out))
    graph = helper.make_graph([node], "fixed", [helper.make_tensor_value_info("images", TensorProto.FLOAT, [1, 3, 640, 640])], [helper.make_tensor_value_info("output0", TensorProto.FLOAT, list(out.shape))])
    onnx.save(helper.make_model(graph, opset_imports=[helper.make_opsetid("", 13)], ir_version=8), folder / "model.onnx")
    (folder / "model.json").write_text(json.dumps({"title": "TEST: kuti fikse (jo model)", "format": "yolo", "input_size": 640, "classes": CLASSES, "conf": 0.25, "iou": 0.5}))


if __name__ == "__main__":
    build(Path(sys.argv[1]) / "xray" / "test-fixed")
