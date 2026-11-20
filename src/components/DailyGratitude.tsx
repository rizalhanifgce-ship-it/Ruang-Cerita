import React, { useState, useMemo } from 'react';
import {
  Heart,
  Sparkles,
  CheckCircle2,
  Calendar,
  Trash2,
  ShieldCheck,
  Sun,
} from 'lucide-react';

const GRATITUDE_KEY = 'ruang_cerita_daily_gratitude_v1';

interface GratitudeEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  items: [string, string, string];
  updatedAt: string;
}

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

function loadGratitudeEntries(): GratitudeEntry[] {
  try {
    const raw = localStorage.getItem(GRATITUDE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGratitudeEntries(entries: GratitudeEntry[]): void {
  try {
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export const DailyGratitude: React.FC = () => {
  const todayKey = toLocalDateKey(new Date());
  const [entries, setEntries] = useState<GratitudeEntry[]>(() => loadGratitudeEntries());

  const todayEntry = useMemo(
    () => entries.find((e) => e.dateKey === todayKey) || null,
    [entries, todayKey]
  );

  const [item1, setItem1] = useState(() => todayEntry?.items[0] || '');
  const [item2, setItem2] = useState(() => todayEntry?.items[1] || '');
  const [item3, setItem3] = useState(() => todayEntry?.items[2] || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: [string, string, string] = [item1.trim(), item2.trim(), item3.trim()];
    if (!cleaned[0] || !cleaned[1] || !cleaned[2]) return;

    const nowIso = new Date().toISOString();
    let updated: GratitudeEntry[];

    if (todayEntry) {
      updated = entries.map((entry) =>
        entry.dateKey === todayKey
          ? { ...entry, items: cleaned, updatedAt: nowIso }
          : entry
      );
    } else {
      const nextEntry: GratitudeEntry = {
        id: `grat-${Date.now()}`,
        dateKey: todayKey,
        items: cleaned,
        updatedAt: nowIso,
      };
      updated = [nextEntry, ...entries];
    }

    updated.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    setEntries(updated);
    saveGratitudeEntries(updated);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveGratitudeEntries(updated);
    if (todayEntry?.id === id) {
      setItem1('');
      setItem2('');
      setItem3('');
    }
  };

  const canSubmit = Boolean(item1.trim() && item2.trim() && item3.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
              <Sun className="w-3.5 h-3.5 text-amber-200" />
              <span>Jurnal Syukur Harian (Daily Gratitude)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              3 Hal yang Kamu Syukuri Hari Ini
            </h1>
            <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              Meluangkan 2 menit untuk menuliskan hal-hal baik setiap hari membantu melatih pikiran lebih tenang, positif, dan tangguh menghadapi keseharian di madrasah.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xs border border-white/20 rounded-2xl px-4 py-3 text-center shrink-0 self-start sm:self-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Total Catatan
            </span>
            <span className="text-2xl font-black text-white">{entries.length}</span>
            <span className="block text-[11px] font-semibold text-emerald-100">Hari</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Catatan Pribadimu:</strong> Jurnal syukur ini tersimpan aman hanya di perangkatmu (<code className="text-[11px] bg-slate-100 px-1 rounded">localStorage</code>) dan tidak dibagikan ke siapa pun.
        </span>
      </div>

      {/* Today's 3-Item Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span>Catatan Hari Ini</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{formatDisplayDate(todayKey)}</p>
          </div>

          {todayEntry && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sudah Tercatat Hari Ini
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {[
            {
              num: 1,
              value: item1,
              setter: setItem1,
              placeholder: 'Contoh: Hari ini bisa belajar dengan tenang bersama teman sebangku...',
            },
            {
              num: 2,
              value: item2,
              setter: setItem2,
              placeholder: 'Contoh: Bersyukur masih diberi kesehatan dan sarapan hangat tadi pagi...',
            },
            {
              num: 3,
              value: item3,
              setter: setItem3,
              placeholder: 'Contoh: Guru atau teman memberikan senyuman dan semangat hari ini...',
            },
          ].map((field) => (
            <div key={field.num}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hal yang Disyukuri #{field.num} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                  {field.num}
                </span>
                <input
                  type="text"
                  required
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          ))}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Sparkles className="w-4 h-4" />
                Alhamdulillah! 3 hal baik hari ini berhasil disimpan.
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Isi ketiga kolom di atas dengan hal sederhana yang kamu syukuri.
              </span>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
            >
              {todayEntry ? 'Perbarui Catatan Hari Ini' : 'Simpan Jurnal Syukur'}
            </button>
          </div>
        </form>
      </div>

      {/* Gratitude History */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Riwayat Hal Baik yang Telah Kamu Catat</span>
        </h3>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Belum ada catatan jurnal syukur. Yuk mulai catat 3 hal baik pertamamu hari ini!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {entry.dateKey === todayKey ? 'Hari Ini' : formatDisplayDate(entry.dateKey)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus catatan ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <ul className="space-y-2">
                  {entry.items.map((text, idx) => (
                    <li
                      key={`${entry.id}-${idx}`}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
