"""One label scheme for every engine, so the viewer never depends on a particular model.

1-10 are anatomical structures; a single tooth is stored under its FDI number (11-48).
"""
MAXILLA, MANDIBLE, CANAL_L, CANAL_R, SINUS_L, SINUS_R, NASAL, PULP, UPPER_TEETH, LOWER_TEETH = range(1, 11)

NAMES = {
    MAXILLA: "maxilla", MANDIBLE: "mandible", CANAL_L: "canal_left", CANAL_R: "canal_right",
    SINUS_L: "sinus_left", SINUS_R: "sinus_right", NASAL: "nasal_cavity", PULP: "pulp",
    UPPER_TEETH: "upper_teeth", LOWER_TEETH: "lower_teeth",
}
FDI = [q * 10 + t for q in (1, 2, 3, 4) for t in range(1, 9)]
for _f in FDI:
    NAMES[_f] = f"tooth_{_f}"


def is_tooth(label: int) -> bool:
    return label in FDI


def from_dataset_json(labels: dict) -> dict:
    """Maps a model's own label ids to ours using the names in its nnU-Net dataset.json.

    Works for DentalSegmentator (5 classes) and ToothFairy2-style models (FDI teeth, canals, sinuses).
    Classes we have no slot for (pharynx, bridges, crowns, implants) are dropped.
    """
    out = {}
    for name, idx in labels.items():
        if isinstance(idx, (list, tuple)):
            continue
        n, idx = name.lower().replace("_", " "), int(idx)
        left, right = "left" in n, "right" in n
        if idx == 0 or "background" in n:
            continue
        if "canal" in n or "alveolar" in n or "nerve" in n:
            out[idx] = CANAL_L if left else CANAL_R if right else CANAL_L  # unsplit canals are divided later
        elif "sinus" in n:
            out[idx] = SINUS_L if left else SINUS_R
        elif "nasal" in n:
            out[idx] = NASAL
        elif "pulp" in n:
            out[idx] = PULP
        elif "upper teeth" in n:
            out[idx] = UPPER_TEETH
        elif "lower teeth" in n:
            out[idx] = LOWER_TEETH
        elif "mandible" in n or "lower jaw" in n:
            out[idx] = MANDIBLE
        elif "maxilla" in n or "upper jaw" in n or "upper skull" in n:
            out[idx] = MAXILLA
        else:
            digits = "".join(c for c in n if c.isdigit())
            if ("tooth" in n or "teeth" in n or n.strip().isdigit()) and digits and int(digits) in FDI:
                out[idx] = int(digits)
            elif idx in FDI and ("fdi" in n or "tooth" in n):
                out[idx] = idx
    return out
