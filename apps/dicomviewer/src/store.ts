import { create } from 'zustand';
import type { Series, Study } from './lib/intake';
import type { ToolKey } from './lib/cs';

export interface Shot { url: string; caption: string }
interface State {
  studies: Study[]; active: Series | null; tool: ToolKey; volMode: 'mpr' | 'dental'; compare: Series | null; shots: Shot[]; aiOpen: boolean; view3d: 'volume' | 'mesh'; accepted: { key: string; text: string }[];
  busy: { label: string; pct: number | null } | null; toast: { msg: string; bad?: boolean } | null;
  addStudies: (s: Study[]) => void; open: (s: Series) => void; setTool: (t: ToolKey) => void;
  setVolMode: (m: 'mpr' | 'dental') => void; setCompare: (s: Series | null) => void; addShot: (s: Shot) => void; removeShot: (i: number) => void;
  setAiOpen: (b: boolean) => void; setAccepted: (a: { key: string; text: string }[]) => void; setView3d: (v: 'volume' | 'mesh') => void;
  setBusy: (b: State['busy']) => void; say: (msg: string, bad?: boolean) => void;
}
let toastTimer = 0;
export const useStore = create<State>((set, get) => ({
  studies: [], active: null, tool: 'wl', busy: null, toast: null, volMode: 'mpr', compare: null, shots: [], aiOpen: false, view3d: 'volume', accepted: [],
  setAccepted: (accepted) => set({ accepted }),
  setAiOpen: (aiOpen) => set({ aiOpen }), setView3d: (view3d) => set({ view3d }),
  setVolMode: (volMode) => set({ volMode }), setCompare: (compare) => set({ compare }),
  addShot: (s) => set({ shots: [...get().shots, s] }), removeShot: (i) => set({ shots: get().shots.filter((_, k) => k !== i) }),
  addStudies: (incoming) => {
    const studies = [...get().studies];
    for (const st of incoming) {
      const have = studies.find(s => s.uid === st.uid);
      if (have) have.series.push(...st.series.filter(n => !have.series.some(o => o.id === n.id))); else studies.push(st);
    }
    set({ studies });
  },
  open: (s) => set({ active: s, compare: null, view3d: 'volume', tool: s.kind === 'volume' ? 'cross' : 'wl' }),
  setTool: (tool) => set({ tool }),
  setBusy: (busy) => set({ busy }),
  say: (msg, bad) => { set({ toast: { msg, bad } }); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => set({ toast: null }), 7000); },
}));

// Test hook: lets the end-to-end test start each case from an empty viewer.
(window as unknown as { __reset: () => void }).__reset = () => useStore.setState({ studies: [], active: null, compare: null, shots: [], volMode: 'mpr', accepted: [], aiOpen: false });
