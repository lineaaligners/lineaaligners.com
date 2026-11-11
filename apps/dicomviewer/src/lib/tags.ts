import dicomParser from 'dicom-parser';

// Names for the tags a dentist or engineer most often needs; unknown tags show by number.
const NAMES: Record<string, string> = {
  x00020010: 'TransferSyntaxUID', x00080008: 'ImageType', x00080016: 'SOPClassUID', x00080018: 'SOPInstanceUID', x00080020: 'StudyDate', x00080030: 'StudyTime',
  x00080060: 'Modality', x00080070: 'Manufacturer', x00080080: 'InstitutionName', x00081030: 'StudyDescription', x0008103e: 'SeriesDescription', x00081090: 'ManufacturerModelName',
  x00100010: 'PatientName', x00100020: 'PatientID', x00100030: 'PatientBirthDate', x00100040: 'PatientSex',
  x00180050: 'SliceThickness', x00180060: 'KVP', x00180088: 'SpacingBetweenSlices', x00181020: 'SoftwareVersions', x00181150: 'ExposureTime', x00181151: 'XRayTubeCurrent', x00181164: 'ImagerPixelSpacing',
  x0020000d: 'StudyInstanceUID', x0020000e: 'SeriesInstanceUID', x00200011: 'SeriesNumber', x00200013: 'InstanceNumber', x00200032: 'ImagePositionPatient', x00200037: 'ImageOrientationPatient', x00200052: 'FrameOfReferenceUID',
  x00280002: 'SamplesPerPixel', x00280004: 'PhotometricInterpretation', x00280008: 'NumberOfFrames', x00280010: 'Rows', x00280011: 'Columns', x00280030: 'PixelSpacing',
  x00280100: 'BitsAllocated', x00280101: 'BitsStored', x00280102: 'HighBit', x00280103: 'PixelRepresentation', x00281050: 'WindowCenter', x00281051: 'WindowWidth', x00281052: 'RescaleIntercept', x00281053: 'RescaleSlope',
  x7fe00010: 'PixelData',
};
export interface TagRow { tag: string; name: string; vr: string; value: string }

export async function listTags(blob: Blob): Promise<TagRow[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const ds = dicomParser.parseDicom(bytes, { untilTag: 'x7fe00010' });
  const rows: TagRow[] = [];
  for (const key of Object.keys(ds.elements).sort()) {
    const e = ds.elements[key];
    const vr = e.vr || '';
    let value = '';
    if (e.items) value = `[${e.items.length}]`;
    else if (key === 'x7fe00010') value = `${e.length} B`;
    else if (vr === 'US') value = String(ds.uint16(key));
    else if (vr === 'UL') value = String(ds.uint32(key));
    else if (vr === 'SS') value = String(ds.int16(key));
    else if (vr === 'FD') value = String(ds.double(key));
    else if (vr === 'FL') value = String(ds.float(key));
    else if (e.length > 256 || /^(OB|OW|UN|OF)$/.test(vr)) value = `${e.length} B`;
    else if (!vr && (key === 'x00280010' || key === 'x00280011' || /^x002801/.test(key) || key === 'x00280002')) value = String(ds.uint16(key));
    else value = (ds.string(key) || '').slice(0, 200);
    rows.push({ tag: `(${key.slice(1, 5)},${key.slice(5)})`.toUpperCase(), name: NAMES[key] || '', vr, value });
  }
  return rows;
}
