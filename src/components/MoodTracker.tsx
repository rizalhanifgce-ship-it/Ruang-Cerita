import React, { useState, useMemo } from 'react';
import { StudentMood } from '../types';
import { STUDENT_MOODS, getMoodMeta } from '../data/moods';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  SmilePlus,
  Sparkles,
  CheckCircle2,
  Calendar,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

const MOOD_TRACKER_KEY = 'ruang_cerita_student_mood_tracker_v1';

interface MoodLogEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  mood: StudentMood;
  note?: string;
  updatedAt: string;
}

const MOOD_SCORE: Record<StudentMood, number> = {
  senang: 5,
  tenang: 4,
  bingung: 3,
  cemas: 2,
  sedih: 2,
  marah: 1,
};

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
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

function loadMoodLogs(): MoodLogEntry[] {
  try {
    const raw = localStorage.getItem(MOOD_TRACKER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMoodLogs(entries: MoodLogEntry[]): void {
  try {
    localStorage.setItem(MOOD_TRACKER_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export const MoodTracker: React.FC = () => {
  const todayKey = toLocalDateKey(new Date());
  const [logs, setLogs] = useState<MoodLogEntry[]>(() => loadMoodLogs());

  const todayLog = useMemo(
    () => logs.find((l) => l.dateKey === todayKey) || null,
    [logs, todayKey]
  );

  const [selectedMood, setSelectedMood] = useState<StudentMood | ''>(
    () => todayLog?.mood || ''
  );
  const [noteInput, setNoteInput] = useState(() => todayLog?.note || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    const nowIso = new Date().toISOString();
    let updated: MoodLogEntry[];

    if (todayLog) {
      updated = logs.map((l) =>
        l.dateKey === todayKey
          ? { ...l, mood: selectedMood, note: noteInput.trim() || undefined, updatedAt: nowIso }
          : l
      );
    } else {
      const next: MoodLogEntry = {
        id: `mood-${Date.now()}`,
        dateKey: todayKey,
        mood: selectedMood,
        note: noteInput.trim() || undefined,
        updatedAt: nowIso,
      };
      updated = [next, ...logs];
    }

    updated.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    setLogs(updated);
    saveMoodLogs(updated);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveMoodLogs(updated);
    if (todayLog?.id === id) {
      setSelectedMood('');
      setNoteInput('');
    }
  };

  const { last7Days, chartData, topMood } = useMemo(() => {
    const byDate: Record<string, MoodLogEntry> = {};
    const counts: Record<string, number> = {};

    logs.forEach((l) => {
      byDate[l.dateKey] = l;
      counts[l.mood] = (counts[l.mood] || 0) + 1;
    });

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const days: {
      dateKey: string;
      dayLabel: string;
      shortDate: string;
      moodMeta: ReturnType<typeof getMoodMeta>;
      score: number | null;
      isToday: boolean;
    }[] = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = toLocalDateKey(d);
      const entry = byDate[key];
      const meta = entry ? getMoodMeta(entry.mood) : undefined;
      days.push({
        dateKey: key,
        dayLabel: dayNames[d.getDay()],
        shortDate: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
        }).format(d),
        moodMeta: meta,
        score: entry ? MOOD_SCORE[entry.mood] : null,
        isToday: i === 0,
      });
    }

    let bestMoodId: StudentMood | null = null;
    let bestCount = 0;
    (Object.keys(counts) as StudentMood[]).forEach((m) => {
      if (counts[m] > bestCount) {
        bestCount = counts[m];
        bestMoodId = m;
      }
    });

    return {
      last7Days: days,
      chartData: days.map((d) => ({
        shortDate: d.shortDate,
        score: d.score,
        moodLabel: d.moodMeta?.label || '-',
        moodEmoji: d.moodMeta?.emoji || '',
      })),
      topMood: bestMoodId ? getMoodMeta(bestMoodId) : undefined,
    };
  }, [logs]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
              <SmilePlus className="w-3.5 h-3.5 text-amber-200" />
              <span>Pelacak Suasana Hati (Mood Tracker)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Bagaimana Perasaanmu Hari Ini?
            </h1>
            <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              Catat emosi harianmu dengan cepat menggunakan skala emoji untuk melihat pola suasana hatimu selama seminggu terakhir.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xs border border-white/20 rounded-2xl px-4 py-3 text-center shrink-0 self-start sm:self-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Total Catatan
            </span>
            <span className="text-2xl font-black text-white">{logs.length}</span>
            <span className="block text-[11px] font-semibold text-emerald-100">Hari</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Privasi Pribadi:</strong> Catatan suasana hatimu hanya tersimpan di perangkatmu sendiri (<code className="text-[11px] bg-slate-100 px-1 rounded">localStorage</code>).
        </span>
      </div>

      {/* Daily Emoji Logger */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            Pilih Emoji Suasana Hatimu Hari Ini
          </h2>
          {todayLog && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sudah Dicatat Hari Ini
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {STUDENT_MOODS.map((m) => {
              const isActive = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-600/15 scale-105'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl leading-none" role="img" aria-label={m.label}>
                    {m.emoji}
                  </span>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Singkat <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Apa yang membuatmu merasa seperti itu hari ini?"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Sparkles className="w-4 h-4" />
                Suasana hatimu hari ini berhasil disimpan!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Pilih satu emoji di atas lalu tekan simpan.
              </span>
            )}
            <button
              type="submit"
              disabled={!selectedMood}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {todayLog ? 'Perbarui Mood Hari Ini' : 'Simpan Mood Hari Ini'}
            </button>
          </div>
        </form>
      </div>

      {/* 7-Day Visual Strip & Recharts Pattern */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs mb-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Pola Suasana Hati 7 Hari Terakhir
            </h3>
            <p className="text-xs text-slate-500">
              Ringkasan emoji harian dan grafik keseimbangan emosimu.
            </p>
          </div>
          {topMood && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${topMood.badgeClass}`}>
              <span>{topMood.emoji}</span>
              <span>Terbanyak: {topMood.label}</span>
            </span>
          )}
        </div>

        {/* 7-Day Emoji Strip */}
        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((d) => (
            <div
              key={d.dateKey}
              className={`rounded-2xl p-2.5 border text-center flex flex-col items-center justify-center gap-1 ${
                d.isToday
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <span className={`text-[10px] font-bold ${d.isToday ? 'text-emerald-700' : 'text-slate-500'}`}>
                {d.dayLabel}
              </span>
              <span className="text-xl leading-none">
                {d.moodMeta ? d.moodMeta.emoji : '·'}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-full">
                {d.moodMeta ? d.moodMeta.label : d.shortDate}
              </span>
            </div>
          ))}
        </div>

        {/* Recharts Area Chart */}
        {logs.length > 0 && (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studentMoodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload as {
                      shortDate: string;
                      score: number | null;
                      moodLabel: string;
                      moodEmoji: string;
                    };
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-md text-xs">
                        <p className="font-bold text-slate-800">{p.shortDate}</p>
                        {p.score ? (
                          <p className="text-emerald-700 font-semibold mt-0.5">
                            {p.moodEmoji} {p.moodLabel}
                          </p>
                        ) : (
                          <p className="text-slate-400">Belum dicatat</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#studentMoodGrad)"
                  connectNulls
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Riwayat Catatan Mood</span>
        </h3>

        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Belum ada catatan suasana hati. Mulai catat perasaanmu hari ini di atas!
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((entry) => {
              const meta = getMoodMeta(entry.mood);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{meta?.emoji || '🙂'}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            meta?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {meta?.label || entry.mood}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {entry.dateKey === todayKey ? 'Hari Ini' : formatDisplayDate(entry.dateKey)}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-600 mt-1 truncate">{entry.note}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
