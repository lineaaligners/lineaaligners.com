import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cs, imageIdsFor, initCs } from '../lib/cs';
import type { Series } from '../lib/intake';
import { useStore } from '../store';

let queue: Promise<unknown> = Promise.resolve();
function Thumb({ series }: { series: Series }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    // one at a time, so thumbnails never compete with the image being opened
    queue = queue.then(async () => {
      await initCs();
      const ids = imageIdsFor(series);
      await cs.utilities.loadImageToCanvas({ canvas, imageId: ids[ids.length >> 1] } as never);
    }).catch(() => undefined);
  }, [series]);
  return <canvas ref={ref} width={64} height={64} className="h-14 w-14 shrink-0 rounded bg-black" />;
}
const fmtDate = (d: string) => (d.length === 8 ? `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}` : d);

export default function StudyList() {
  const { t } = useTranslation();
  const { studies, active, open, compare, setCompare } = useStore();
  if (!studies.length) return <p className="text-muted text-[13px]">{t('no_studies')}</p>;
  return (
    <ul className="flex flex-col gap-4">
      {studies.map(st => (
        <li key={st.uid}>
          <div className="font-medium break-words">{st.patient || t('unknown_patient')}</div>
          <div className="text-muted mb-1.5 text-xs">{[st.patientId, fmtDate(st.date), st.desc].filter(Boolean).join(' · ')}</div>
          <ul className="flex flex-col gap-1.5">
            {st.series.map(s => (
              <li key={s.id} className="flex flex-col gap-1">
                <button onClick={() => open(s)} className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left ${active?.id === s.id ? 'border-accent bg-[#10222c]' : 'border-line hover:border-muted'}`}>
                  <Thumb series={s} />
                  <span className="min-w-0">
                    <span className="block break-words">{s.label}</span>
                    <span className="text-muted block text-xs tabular-nums">
                      <span className={`mr-1 rounded px-1 font-mono text-[10px] ${s.kind === 'volume' ? 'bg-[#173a4c] text-accent' : 'bg-[#23323b]'}`}>{s.kind === 'volume' ? '3D' : s.modality || '2D'}</span>
                      {s.cols}×{s.rows}{s.count > 1 ? ` · ${s.count} ${t(s.kind === 'volume' ? 'slices' : 'images')}` : ''}
                    </span>
                  </span>
                </button>
                {active?.kind === 'stack' && s.kind === 'stack' && s.id !== active.id && (
                  <button className="btn self-start text-xs" aria-pressed={compare?.id === s.id} onClick={() => setCompare(compare?.id === s.id ? null : s)}>{t('compare')}</button>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
