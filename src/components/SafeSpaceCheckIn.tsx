import React, { useState } from 'react';
import {
  Users,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  MessageSquareHeart,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SAFE_SPACE_KEY = 'ruang_cerita_safe_space_checkins_v1';

interface SafeSpaceEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  connectionWith: string;
  interactionNote: string;
  needsFollowUp: boolean;
  followUpNote?: string;
  createdAt: string;
}

const CONNECTION_TYPES = [
  'Teman Sekelas',
  'Guru / Wali Kelas',
  'Orang Tua / Keluarga',
  'Sahabat / Kakak Kelas',
  'Lainnya',
];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(y, m - 1, d));
}

function loadSafeSpaceEntries(): SafeSpaceEntry[] {
  try {
    const raw = localStorage.getItem(SAFE_SPACE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSafeSpaceEntries(entries: SafeSpaceEntry[]): void {
  try {
    localStorage.setItem(SAFE_SPACE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export const SafeSpaceCheckIn: React.FC = () => {
  const todayKey = toLocalDateKey(new Date());
  const [entries, setEntries] = useState<SafeSpaceEntry[]>(() => loadSafeSpaceEntries());
  const [connectionWith, setConnectionWith] = useState(CONNECTION_TYPES[0]);
  const [interactionNote, setInteractionNote] = useState('');
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNote.trim()) return;

    const next: SafeSpaceEntry = {
      id: `safe-${Date.now()}`,
      dateKey: todayKey,
      connectionWith,
      interactionNote: interactionNote.trim(),
      needsFollowUp,
      followUpNote: needsFollowUp && followUpNote.trim() ? followUpNote.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [next, ...entries];
    setEntries(updated);
    saveSafeSpaceEntries(updated);

    setInteractionNote('');
    setNeedsFollowUp(false);
    setFollowUpNote('');
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((item) => item.id !== id);
    setEntries(updated);
    saveSafeSpaceEntries(updated);
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 border border-teal-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Check-In Ruang Aman (Safe Space)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                Koneksi Sosial Hari Ini
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Catat satu interaksi sosial atau dukungan positif yang kamu rasakan hari ini di madrasah maupun di rumah.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            Terhubung dengan:
          </span>
          {CONNECTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setConnectionWith(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                connectionWith === type
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            required
            value={interactionNote}
            onChange={(e) => setInteractionNote(e.target.value)}
            placeholder="Contoh: Tadi istirahat ngobrol santai dengan teman sekelas dan merasa lebih lega..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Optional Counselor Follow-up Toggle */}
        <div className="bg-white/90 rounded-xl p-3 border border-slate-200/80 space-y-2.5">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={needsFollowUp}
              onChange={(e) => setNeedsFollowUp(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-slate-800 block">
                Saya merasa perlu obrolan lanjutan dengan Guru BK (Opsional)
              </span>
              <span className="text-[11px] text-slate-500">
                Centang jika kamu ingin menandai catatan ini untuk dibahas saat sesi konseling.
              </span>
            </div>
          </label>

          {needsFollowUp && (
            <div className="pl-6 space-y-2">
              <input
                type="text"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Topik singkat yang ingin dibahas dengan Guru BK (opsional)..."
                className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-teal-50/40 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <p className="text-[11px] text-teal-800 font-semibold flex items-center gap-1.5">
                <MessageSquareHeart className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Setelah menyimpan, kamu juga bisa langsung mengisi Formulir Ruang Cerita di bawah ini untuk terhubung ke Guru BK.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Check-in ruang aman hari ini berhasil dicatat!
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-bold text-slate-600 hover:text-teal-700 flex items-center gap-1 self-start cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Riwayat Koneksi Positif ({entries.length})</span>
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={!interactionNote.trim()}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed self-end sm:self-auto"
          >
            Simpan Check-In
          </button>
        </div>
      </form>

      {showHistory && (
        <div className="mt-4 pt-3 border-t border-teal-200/60 space-y-2">
          {entries.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white/80 rounded-xl p-3 border border-slate-200/80">
              Belum ada catatan interaksi positif. Catat momen hangat pertamamu hari ini!
            </p>
          ) : (
            entries.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[10px]">
                      {item.connectionWith}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {item.dateKey === todayKey ? 'Hari Ini' : formatDisplayDate(item.dateKey)}
                    </span>
                    {item.needsFollowUp && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                        Perlu Ngobrol dengan BK
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{item.interactionNote}</p>
                  {item.followUpNote && (
                    <p className="text-[11px] text-teal-700 italic">
                      Catatan BK: &ldquo;{item.followUpNote}&rdquo;
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                  title="Hapus check-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
