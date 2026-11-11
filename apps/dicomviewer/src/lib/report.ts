// PDF report: clinic header with logo, patient block, notes, then one captured view per block.
import { jsPDF } from 'jspdf';

export interface ReportInput {
  clinic: string; logo?: string; title: string; disclaimer: string;
  patient: [string, string][]; notesLabel: string; notes: string; findingsLabel?: string; findings?: string[];
  shots: { url: string; caption: string; w: number; h: number }[];
}
export function buildReport(r: ReportInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }), W = 210, H = 297, M = 15;
  let y = M;
  const footer = () => { doc.setFontSize(8); doc.setTextColor(120); doc.text(r.disclaimer, M, H - 8); doc.text(String(doc.getNumberOfPages()), W - M, H - 8, { align: 'right' }); doc.setTextColor(0); };
  const room = (need: number) => { if (y + need > H - 14) { footer(); doc.addPage(); y = M; } };
  if (r.logo) { try { const p = doc.getImageProperties(r.logo), h = 16, w = Math.min(50, (p.width / p.height) * h); doc.addImage(r.logo, W - M - w, y, w, h); } catch { /* unreadable logo: leave it out */ } }
  doc.setFontSize(16); doc.text(r.clinic || r.title, M, y + 7);
  doc.setFontSize(11); doc.setTextColor(90); if (r.clinic) doc.text(r.title, M, y + 13); doc.setTextColor(0);
  y += 22; doc.setDrawColor(200); doc.line(M, y, W - M, y); y += 7;
  doc.setFontSize(10);
  for (const [k, v] of r.patient) { if (!v) continue; doc.setTextColor(110); doc.text(k, M, y); doc.setTextColor(0); doc.text(v, M + 32, y); y += 5.5; }
  if (r.notes.trim()) {
    y += 3; doc.setFontSize(11); doc.text(r.notesLabel, M, y); y += 6; doc.setFontSize(10);
    for (const line of doc.splitTextToSize(r.notes, W - 2 * M) as string[]) { room(5); doc.text(line, M, y); y += 5; }
  }
  if (r.findings?.length) {
    y += 3; room(12); doc.setFontSize(11); doc.text(r.findingsLabel || '', M, y); y += 6; doc.setFontSize(10);
    for (const f of r.findings) for (const line of doc.splitTextToSize('- ' + f, W - 2 * M) as string[]) { room(5); doc.text(line, M, y); y += 5; }
  }
  y += 4;
  for (const s of r.shots) {
    const w = W - 2 * M, h = Math.min((s.h / s.w) * w, 120), ww = (s.w / s.h) * h;
    room(h + 10);
    doc.addImage(s.url, 'JPEG', M + (w - ww) / 2, y, ww, h); y += h + 4;
    doc.setFontSize(9); doc.setTextColor(90); doc.text(s.caption, M, y); doc.setTextColor(0); y += 7;
  }
  footer();
  return doc;
}
