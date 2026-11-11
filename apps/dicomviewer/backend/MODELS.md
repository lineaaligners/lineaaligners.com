# Modelet e AI

Backend-i kërkon modelet te `backend/models/<emri>/`. Pa asnjë model punon vetëm motori "Klasik" (pragje, jo AI).

## 1. DentalSegmentator (gati për përdorim)

- 5 struktura: kafka e sipërme/maxilla, mandibula, dhëmbët e sipërm, dhëmbët e poshtëm, kanali mandibular.
- Licenca e peshave: CC BY 4.0 (lejohet përdorimi me citim). Citimi: Dot G, et al. *DentalSegmentator: robust open source deep learning-based CT and CBCT image segmentation*. Journal of Dentistry (2024), dhe nnU-Net (Isensee et al., Nat Methods 2021).
- Shkarko `Dataset112_DentalSegmentator_v100.zip` nga https://zenodo.org/records/10829675 dhe shpaketoje te `backend/models/dentalsegmentator/`. Brenda duhet të gjendet një folder me `plans.json`, `dataset.json` dhe `fold_0/checkpoint_final.pth`.
- Dhëmbët i ndan dhe i numëron FDI një hap me rregulla pas modelit; kanalin e ndan majtas/djathtas sipas vijës së mesit. Këto duhen kontrollu nga dentisti.

## 2. ToothFairy2 (duhet trajnuar)

42 klasa: nofullat, kanalet alveolare majtas/djathtas, sinuset maksilare, faringu, ura, kurora, implante dhe secili dhëmb me numër FDI. Seti i trajnimit është nën CC BY-SA dhe kërkon regjistrim.

Në PC-në me RTX 4060 (8 GB):

```
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install nnunetv2
set nnUNet_raw=D:\nnunet\raw
set nnUNet_preprocessed=D:\nnunet\preprocessed
set nnUNet_results=D:\nnunet\results
```

1. Regjistrohu dhe shkarko setin nga https://ditto.ing.unimore.it/toothfairy2 . Vendose te `%nnUNet_raw%\Dataset112_ToothFairy2\` (`imagesTr`, `labelsTr`, `dataset.json`). Filet .mha i lexon nnU-Net direkt.
2. Përgatitja: `nnUNetv2_plan_and_preprocess -d 112 --verify_dataset_integrity`
3. Trajnimi: `nnUNetv2_train 112 3d_fullres all` . Konfigurimi standard është i menduar për rreth 8 GB VRAM. Prit 1 deri 3 ditë për 1000 epoka në 4060; `--c` e vazhdon një trajnim të ndërprerë.
   Ekipet më të mira në ToothFairy2 e fikën pasqyrimin majtas-djathtas gjatë trajnimit, sepse përndryshe modeli i ngatërron anët. Përdor trajnerin `nnUNetTrainerNoMirroring`: `nnUNetv2_train 112 3d_fullres all -tr nnUNetTrainerNoMirroring`
4. Kopjo folderin e rezultatit (`%nnUNet_results%\Dataset112_ToothFairy2\nnUNetTrainer...__nnUNetPlans__3d_fullres`) te `backend/models/toothfairy2/`.

Emrat e klasave lexohen nga `dataset.json` i modelit dhe përkthehen në skemën tonë (`app/labels.py`). Klasat pa vend te ne (faringu, urat, kurorat, implantet) hidhen. Pulpa dhe kaviteti nazal nuk janë në ToothFairy2.

## 3. Medident (ri-trajnim me rastet tona)

Çdo segmentim i korrigjuar ruhet te `backend/data/jobs/<id>/` si `image.nii.gz` + `labels.nii.gz`. Këto janë pa emër pacienti (NIfTI nuk mban tag-a DICOM).

```
python scripts/export_training_case.py data/jobs %nnUNet_raw%\Dataset500_Medident
```

Pastaj ri-trajno duke nisur nga pesha ekzistuese: `nnUNetv2_train 500 3d_fullres all -pretrained_weights <checkpoint_final.pth>` (planet duhet të jenë të njëjta me modelin bazë; shih dokumentimin e nnU-Net për "pretraining and finetuning"). Rezultatin vendose te `backend/models/medident/`.

## Si shtohet një model tjetër

Shto një rresht te `ENGINES` në `app/engines.py`. Çdo folder nnU-Net v2 punon nëse emrat e klasave njihen nga `labels.from_dataset_json`. Për një model jo nnU-Net, krijo një nënklasë të `Engine` me `predict()`.

# Modelet për radiografi 2D (Faza 3)

Asnjë model 2D nuk vjen me projektin. Pa model, paneli "AI" te radiografitë thotë se nuk ka model të instaluar.

## Formati i një modeli

Një folder te `backend/models/xray/<emri>/` me dy file:

- `model.onnx`: çfarëdo detektori i eksportuar në ONNX
- `model.json`:

```json
{"title": "Emri që shfaqet", "format": "yolo", "input_size": 640, "conf": 0.25, "iou": 0.5,
 "classes": ["tooth", "caries", "periapical lesion", "restoration", "root canal", "implant", "crown", "bone loss"]}
```

`format`: `"yolo"` (një dalje `(1, 4 + klasa, N)` me cx, cy, w, h) ose `"boxes"` (dalje `boxes`, `scores`, `labels`).
Emrat e klasave e japin kuptimin: `tooth_36` ose `36` është dhëmb me numër, `tooth` dhëmb pa numër, çdo emër tjetër është gjetje. Modeli ndërrohet duke ndërru folderin; kodi nuk preket.

Numërimi FDI: nëse modeli i jep numrat, përdoren ata. Nëse jep vetëm "tooth", në panoramike numërohen me rregull nga vija e mesit (duhen kontrollu; një dhëmb që mungon i zhvendos numrat pas tij). Në periapikale dhe bitewing nuk ka numërim pa model që e bën vetë.

## Çka ka të hapur për trajnim

- **DENTEX** (panoramike): kuadranti, numri i dhëmbit dhe katër diagnoza: karies, karies i thellë, lezion periapikal, dhëmb i impaktuar. Licenca është e paqartë: artikulli thotë CC-BY, kurse faqja e datasetit në Hugging Face thotë CC BY-NC-SA 4.0 (jo-komerciale). Sqaroje me autorët para përdorimit në klinikë.
- Mbushjet, mbushjet e kanalit, implantet, kurorat dhe niveli i humbjes së kockës nuk janë në DENTEX.
- Për periapikale dhe bitewing nga NanoPix nuk kam verifiku asnjë set të hapur me licencë të përshtatshme. Rruga realiste: etiketimi i imazheve të anonimizuara të Medident (p.sh. me CVAT ose Label Studio) dhe trajnimi i një detektori në RTX 4060.

Kujdes me licencën e mjetit të trajnimit: Ultralytics YOLO është AGPL-3.0. Për përdorim brenda klinikës zakonisht mjafton, por për produkt që shpërndahet duhet licencë komerciale ose një detektor tjetër (p.sh. torchvision Faster R-CNN ose RT-DETR me licencë lejuese), i eksportuar në ONNX.

`scripts/make_test_xray_model.py` krijon një "model" që kthen gjithmonë të njëjtat kuti. Është vetëm për teste.
