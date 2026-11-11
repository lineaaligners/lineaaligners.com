import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listTags, type TagRow } from '../lib/tags';
import type { Series } from '../lib/intake';

export default function TagBrowser({ series, onClose }: { series: Series; onClose: () => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<TagRow[]>([]); const [q, setQ] = useState('');
  useEffect(() => { listTags(series.instances[0].blob).then(setRows).catch(() => setRows([])); }, [series]);
  const shown = rows.filter(r => !q || (r.tag + r.name + r.value).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-panel/95 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold">{t('tags')}</h2>
        <input id="tagq" aria-label={t('filter')} placeholder={t('filter')} value={q} onChange={e => setQ(e.target.value)} className="border-line ml-auto rounded border bg-bg px-2 py-1" />
        <button className="btn" onClick={onClose}>{t('close')}</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="text-muted sticky top-0 bg-panel text-left"><tr><th className="py-1 pr-3">{t('tag')}</th><th className="pr-3">VR</th><th className="pr-3">{t('name')}</th><th>{t('value')}</th></tr></thead>
          <tbody>{shown.map(r => <tr key={r.tag} className="border-line border-t align-top"><td className="py-1 pr-3 font-mono">{r.tag}</td><td className="pr-3 font-mono">{r.vr}</td><td className="pr-3">{r.name}</td><td className="break-all">{r.value}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
