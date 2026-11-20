import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  Moon,
  Star,
  Sparkles,
  CheckCircle2,
  Calendar,
  Trash2,
  ShieldCheck,
  Clock,
} from 'lucide-react';

const SLEEP_TRACKER_KEY = 'ruang_cerita_sleep_tracker_v1';

interface SleepLogEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  durationHours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  updatedAt: string;
}

const QUALITY_LABELS: Record<number, string> = {
  1: 'Sangat Buruk',
  2: 'Kurang Nyenyak',
  3: 'Cukup',
  4: 'Nyenyak',
  5: 'Sangat Nyenyak',
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

function loadSleepLogs(): SleepLogEntry[] {
  try {
    const raw = localStorage.getItem(SLEEP_TRACKER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSleepLogs(entries: SleepLogEntry[]): void {
  try {
    localStorage.setItem(SLEEP_TRACKER_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export const SleepTracker: React.FC = () => {
  const todayKey = toLocalDateKey(new Date());
  const [logs, setLogs] = useState<SleepLogEntry[]>(() => loadSleepLogs());

  const todayLog = useMemo(
    () => logs.find((l) => l.dateKey === todayKey) || null,
    [logs, todayKey]
  );

  const [durationInput, setDurationInput] = useState<number>(
    () => todayLog?.durationHours ?? 7.5
  );
  const [qualityInput, setQualityInput] = useState<1 | 2 | 3 | 4 | 5>(
    () => todayLog?.quality ?? 4
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedDuration = Math.min(16, Math.max(1, Number(durationInput) || 7));
    const nowIso = new Date().toISOString();
    let updated: SleepLogEntry[];

    if (todayLog) {
      updated = logs.map((l) =>
        l.dateKey === todayKey
          ? { ...l, durationHours: clampedDuration, quality: qualityInput, updatedAt: nowIso }
          : l
      );
    } else {
      const next: SleepLogEntry = {
        id: `sleep-${Date.now()}`,
        dateKey: todayKey,
        durationHours: clampedDuration,
        quality: qualityInput,
        updatedAt: nowIso,
      };
      updated = [next, ...logs];
    }

    updated.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    setLogs(updated);
    saveSleepLogs(updated);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveSleepLogs(updated);
  };

  const { chartData, avgDuration, avgQuality } = useMemo(() => {
    const byDate: Record<string, SleepLogEntry> = {};
    logs.forEach((l) => {
      byDate[l.dateKey] = l;
    });

    const days: {
      dateKey: string;
      shortDate: string;
      durationHours: number;
      quality: number | null;
    }[] = [];

    const now = new Date();
    let durSum = 0;
    let qualSum = 0;
    let count = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = toLocalDateKey(d);
      const entry = byDate[key];
      if (entry) {
        durSum += entry.durationHours;
        qualSum += entry.quality;
        count += 1;
      }
      days.push({
        dateKey: key,
        shortDate: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
        }).format(d),
        durationHours: entry ? entry.durationHours : 0,
        quality: entry ? entry.quality : null,
      });
    }

    return {
      chartData: days,
      avgDuration: count > 0 ? (durSum / count).toFixed(1) : '0.0',
      avgQuality: count > 0 ? (qualSum / count).toFixed(1) : '0.0',
    };
  }, [logs]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-teal-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/10 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
              <Moon className="w-3.5 h-3.5 text-amber-200" />
              <span>Pelacak Tidur Harian (Sleep Tracker)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Pantau Pola &amp; Kualitas Tidurmu
            </h1>
            <p className="text-indigo-50/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              Tidur cukup 7–9 jam membantu menjaga konsentrasi belajar di madrasah serta kestabilan emosimu setiap hari.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <div className="bg-white/15 backdrop-blur-xs border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                Rata-rata
              </span>
              <span className="text-xl font-black text-white">{avgDuration}j</span>
              <span className="block text-[10px] text-indigo-100">Durasi</span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                Kualitas
              </span>
              <span className="text-xl font-black text-white">{avgQuality}/5</span>
              <span className="block text-[10px] text-indigo-100">7 Hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Catatan Pribadi:</strong> Data tidurmu tersimpan lokal di browser (<code className="text-[11px] bg-slate-100 px-1 rounded">localStorage</code>) untuk membantu refleksi kesehatanmu.
        </span>
      </div>

      {/* Sleep Logger Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Catat Tidur Hari Ini</span>
          </h2>
          {todayLog && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tercatat Hari Ini
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Durasi Tidur Semalam
              </label>
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-black">
                {durationInput} Jam
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={12}
              step={0.5}
              value={durationInput}
              onChange={(e) => setDurationInput(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
              <span>2 jam</span>
              <span>Ideal: 7–9 jam</span>
              <span>12 jam</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Kualitas Tidur (Skala 1–5)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((score) => {
                const isActive = qualityInput === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setQualityInput(score)}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 font-black text-sm">
                      <span>{score}</span>
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-center leading-tight">
                      {QUALITY_LABELS[score]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Sparkles className="w-4 h-4" />
                Catatan tidur hari ini berhasil disimpan!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Atur durasi dan kualitas tidurmu lalu tekan simpan.
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm cursor-pointer transition-colors"
            >
              {todayLog ? 'Perbarui Catatan Tidur' : 'Simpan Catatan Tidur'}
            </button>
          </div>
        </form>
      </div>

      {/* 7-Day Trend Chart (Recharts) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs mb-6">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Grafik Tren Tidur 7 Hari Terakhir
          </h3>
          <p className="text-xs text-slate-500">
            Batang menunjukkan durasi tidur (jam) dan garis menunjukkan skor kualitas tidur (1–5).
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 12]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: '#f59e0b' }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                yAxisId="left"
                y={8}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: 'Ideal 8j',
                  position: 'insideTopRight',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload as {
                    shortDate: string;
                    durationHours: number;
                    quality: number | null;
                  };
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-md text-xs">
                      <p className="font-bold text-slate-800 mb-1">{p.shortDate}</p>
                      {p.quality ? (
                        <>
                          <p className="text-indigo-700 font-semibold">
                            Durasi: {p.durationHours} jam
                          </p>
                          <p className="text-amber-600 font-semibold">
                            Kualitas: {p.quality}/5 ({QUALITY_LABELS[p.quality]})
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-400">Belum ada catatan</p>
                      )}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar
                yAxisId="left"
                dataKey="durationHours"
                name="Durasi (Jam)"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
                maxBarSize={36}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="quality"
                name="Kualitas (1-5)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                connectNulls
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep History */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Riwayat Catatan Tidur</span>
        </h3>

        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Belum ada catatan tidur. Mulai catat jam tidurmu hari ini di atas!
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-extrabold">
                    {entry.durationHours} Jam
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    {entry.quality}/5 • {QUALITY_LABELS[entry.quality]}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {entry.dateKey === todayKey ? 'Hari Ini' : formatDisplayDate(entry.dateKey)}
                  </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
