# Medident DICOM Viewer

Viewer dentar për radiografi 2D dhe CBCT. Punon në browser; filet e pacientëve nuk largohen nga kompjuteri.

**Jo për përdorim diagnostik. Prototip për hulumtim.**

## Si niset

Duhet [Node.js 20 ose më i ri](https://nodejs.org).

```
npm install
npm run dev
```

Hape adresën që shfaqet (zakonisht http://localhost:5173) në Chrome ose Edge.

## Testet

```
npm test                         # 19 teste: leximi i formateve, panoramiku, anonimizimi, TIFF, PDF
npm run e2e                      # hap secilin shembull në Chrome dhe provon secilën veçori
node tests/perf.mjs <folder>     # kohët e ngarkimit për një CBCT të madhe
```

`npm run e2e` dhe `perf.mjs` kërkojnë Chrome; rruga jepet me `CHROME=...` nëse nuk është te `/usr/bin/google-chrome`.

## Faza 1: çka përmban

Hapja
- file, folder, ZIP, eksport me DICOMDIR, multi-frame, PNG, JPG, TIFF (edhe 16-bit), me tërheqje ose me butona
- grupimi sipas studimit dhe serisë, lista e pacientëve me miniatura
- kodekët: JPEG, JPEG Lossless, JPEG-LS, JPEG 2000, RLE, big endian

2D
- kontrast, zoom, lëvizje, rrotullim, pasqyrim, negativ, mprehje
- gjatësi në mm, kënd, dendësi, shënim me tekst
- krahasim i dy imazheve krah për krah (butoni Krahaso te lista)

CBCT (MPR + 3D)
- aksial, sagital, koronal me kryq të sinkronizuar
- shtresë MIP ose mesatare, dritare kockë / ind i butë / smalt
- pamje 3D me tri paracaktime dhe prerje me kuti (Prerja 3D)

Pamja dentare
- kurba e harkut: automatike, me pika që tërhiqen, ose e vizatuar me 5 deri 10 klikime
- panoramik i rindërtuar me trashësi 0 deri 30 mm, mesatare ose MIP
- prerje tërthore me hap 0.5 deri 2 mm dhe trashësi 0 deri 3 mm, vizore në mm, L dhe B të shënuara
- ndarja maxilla / mandibula, secila me kurbën e vet
- matje gjatësie, mjeti Kocka G × L (gjerësi dhe lartësi), vlera nën kursor
- numërimi i dhëmbëve FDI ose Universal: zgjidh numrin, kliko dhëmbin në panoramik; klikimi i një numri të vendosur të çon te ai dhëmb

Eksporti
- pamja si PNG, raport PDF me logo, të dhëna të pacientit, shënime dhe pamjet e zgjedhura
- seria e anonimizuar si ZIP
- shfletuesi i tag-ave DICOM

Shqip dhe anglisht kudo. Shiriti "Jo për përdorim diagnostik" është gjithmonë i dukshëm.

## Shpejtësia

CBCT sintetike 512 × 512 × 500 (252 MB), Chrome pa kartelë grafike: 5.3 s deri te pamja, 46 ms për prerje gjatë lëvizjes, pamja dentare hapet për 0.7 s, rreth 800 MB memorie. Me kartelë grafike lëvizja pritet më e shpejtë.

## Kufizime të njohura

- E testuar me file të gjeneruara dhe me shembujt e pydicom, jo me file reale nga Orthophos SL ose NanoPix.
- Numrat e dhëmbëve vendosen me dorë; njohja automatike vjen me AI në Fazën 2.
- Kurba automatike mund të dalë keq kur ka metal ose kockë të dendur jashtë harkut; atëherë vizatohet me dorë.
- Pamja dentare supozon skanim të drejtë sipas boshteve, siç i eksportojnë aparatet CBCT.
- Matjet e pamjes dentare dhe numrat e dhëmbëve humben kur mbyllet seria; matjet e pamjeve tjera ruhen sa është hapur faqja.
- Radiografitë pa madhësi pikseli në file i shfaqin matjet në piksela. Ato me madhësi vetëm në sensor shfaqen në mm me shënimin "Proj" (pa korrigjim zmadhimi).
- Vlerat e CBCT nuk janë HU të kalibruara; paracaktimet e dritares janë orientuese.
- Anonimizimi i zbraz tag-at e pacientit, klinikës dhe stafit në nivelin e parë; UID-të dhe datat mbesin, sekuencat e brendshme nuk preken.
- Shënimi me tekst përdor dritaren e thjeshtë të browser-it.
- Viewer-i vetë nuk ruan asgjë mes sesioneve përveç emrit të klinikës, logos dhe gjuhës; segmentimet ruhen te backend-i.

## Faza 2: segmentimi me AI (CBCT)

Backend-i (Python) punon në të njëjtin kompjuter; të dhënat mbesin te `backend/data`.

```
cd backend
pip install -r requirements.txt            # mjafton për motorin "Klasik" dhe për testet
pip install -r requirements-ai.txt         # nnU-Net; së pari PyTorch me CUDA, shih file-in
uvicorn app.main:app --port 8000
```

Në një dritare tjetër `npm run dev`; viewer-i i dërgon kërkesat `/api` te porta 8000. Ose krejt me Docker: `npm run build`, pastaj `docker compose up --build` dhe hap http://localhost:8000 .

Modelet dhe licencat: `backend/MODELS.md` (DentalSegmentator gati për shkarkim, ToothFairy2 me udhëzim trajnimi për RTX 4060, ri-trajnimi me rastet e Medident).

Çka bën
- DICOM → NIfTI → 0.3 mm izotropik → modeli → maska kthehet në rrjetën origjinale
- butoni **AI** te pamja MPR: zgjedh modelin, Segmento, shiriti i progresit me hapin dhe kohën
- strukturat mbi prerjet MPR me ngjyra, ndezje/fikje për secilën dhe tejdukshmëri; vëllimi dhe besueshmëria (kur modeli e jep)
- modele 3D sipërfaqësore për secilën strukturë (marching cubes, lëmim, reduktim), eksport STL për nofullat
- korrigjimi: furça, goma, rritja e regjionit, kanali me pika (spline me rreze), ndërrimi i numrit të dhëmbit; "Ruaj korrigjimet" i ruan dhe i rindërton modelet 3D
- lista e pozicioneve pa dhëmbë; klikimi të çon te vendi
- çdo rast i korrigjuar ruhet si çift NIfTI për ri-trajnim

Testet: `cd backend && python -m pytest tests` (8 teste) dhe `npm run e2e:ai` (nis backend-in, segmenton fantomin përmes UI-së, provon secilin mjet).

Kufizime të njohura të Fazës 2
- Rruga nnU-Net (DentalSegmentator, ToothFairy2) nuk është ekzekutuar ende: ambienti i zhvillimit nuk ka GPU dhe nuk arrin te Zenodo. Kodi ndjek API-në e nnU-Net v2, por prova e parë e vërtetë bëhet në PC-në e klinikës. Krejt pjesa tjetër është testuar me motorin "Klasik" mbi një fantom sintetik.
- Koha nën 2 minuta në GPU është synim i pamatur ende.
- Me DentalSegmentator: dhëmbët ndahen dhe numërohen me rregulla (luginat e vëllimit përgjatë harkut, gjerësitë mesatare të kurorave). Dhëmbë të ngjitur, të rrotulluar ose ura mund të numërohen gabim; korrigjohen me "Ndrysho numrin". Lista e pozicioneve pa dhëmbë vjen nga i njëjti rregull.
- Sinuset, kaviteti nazal dhe pulpa nuk dalin nga DentalSegmentator. Sinuset vijnë me ToothFairy2; për pulpën dhe kavitetin nazal duhet një model tjetër. Deri atëherë vizatohen me furçë ose me rritje regjioni.
- Besueshmëria shfaqet vetëm për modelet nnU-Net dhe vetëm për volume nën 60 milionë voksela (kursim memorie); përndryshe del "—".
- Shiriti i progresit gjatë inferencës nuk lëviz hap pas hapi (nnU-Net nuk e raporton); shfaqet koha e kaluar.
- Furça punon në rreth mbi një prerje. Rritja e regjionit ndalet te 400 000 voksela.
- Mbivendosjet shfaqen në MPR, jo në pamjen dentare (panoramik).
- Një segmentim në të njëjtën kohë.

## Faza 3: AI për radiografi 2D

Butoni **AI** te një radiografi 2D hap panelin: zgjedh modelin dhe llojin e imazhit (panoramike ose intraorale), shtyp "Analizo".

- dhëmbët e gjetur vizatohen me kuti dhe numër FDI; gjetjet (karies, lezion periapikal, humbje kocke, mbushje, mbushje kanali, implant, kurorë) me kuti me vija të ndërprera dhe besueshmëri
- çdo gjetje është sugjerim: dentisti shtyp "Prano" ose "Refuzo". Të pranuarat hyjnë te raporti PDF si "Gjetjet e pranuara"; të refuzuarat zhduken nga imazhi
- kutitë e ndjekin imazhin gjatë zoom-it, lëvizjes dhe rrotullimit
- moduli i modelit është i ndarë: një folder me `model.onnx` + `model.json` (shih `backend/MODELS.md`)

Testet: `python -m pytest tests` te backend (12 teste gjithsej) dhe `npm run e2e:xray`.

Kufizime të njohura të Fazës 3
- Nuk ka asnjë model të vërtetë. Krejt rruga është testuar me një file ONNX që kthen kuti fikse, jo me detektim real. Pa një model të trajnuar, paneli nuk gjen asgjë.
- Cilat gjetje dalin varet tërësisht nga klasat e modelit që instalon.
- Vetëm kuti, jo maska. Niveli i humbjes së kockës shfaqet si kuti, pa matje në mm.
- Analizohet imazhi i parë i serisë; rezultatet nuk ruhen kur mbyllet seria (gjetjet e pranuara mbesin për raportin).
- Numërimi me rregull punon vetëm për panoramike.

## Struktura

- `src/lib/intake.ts` leximi i header-ave, ZIP, grupimi (pa DOM, testohet në Node)
- `src/lib/dicomWrite.ts` mbështjell PNG / JPG / TIFF si DICOM
- `src/lib/cs.ts` Cornerstone3D: motori, mjetet, ngarkimi i volumit, prerja 3D
- `src/lib/pano.ts` kurba e harkut, panoramiku, prerjet tërthore, FDI
- `src/lib/dental.ts` pamja dentare (kanavacë)
- `src/lib/anonymize.ts`, `report.ts`, `capture.ts` eksportet
- `src/components/` Viewer, DentalView, Toolbar, StudyList, TagBrowser, ReportDialog
- `src/lib/ai.ts`, `src/components/AiPanel.tsx`, `MeshView.tsx` segmentimi, korrigjimi, modelet 3D
- `backend/app/` pipeline, motorët, numërimi i dhëmbëve, rrjetat, API; `xray.py` moduli 2D
- `src/components/XrayPanel.tsx` sugjerimet 2D
- `src/i18n.ts` të gjitha tekstet, shqip dhe anglisht
- `testdata/` shembuj për secilin format
