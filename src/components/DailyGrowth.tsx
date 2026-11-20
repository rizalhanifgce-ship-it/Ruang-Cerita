import React, { useState, useMemo } from 'react';
import { Sprout, Flame, Check, Edit3 } from 'lucide-react';

const DAILY_GROWTH_KEY = 'ruang_cerita_daily_growth_v1';

interface DailyGrowthState {
  habitTitle: string;
  completedDates: string[]; // YYYY-MM-DD
}

const PRESET_HABITS = [
  'Minum 6–8 gelas air putih',
  'Menulis jurnal perasaan singkat',
  'Jalan kaki / peregangan 15 menit',
  'Latihan napas tenang 5 menit',
  'Tidur sebelum pukul 22.00',
];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadDailyGrowth(): DailyGrowthState {
  try {
    const raw = localStorage.getItem(DAILY_GROWTH_KEY);
    if (!raw) {
      return {
        habitTitle: PRESET_HABITS[0],
        completedDates: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<DailyGrowthState>;
    return {
      habitTitle:
        typeof parsed.habitTitle === 'string' && parsed.habitTitle.trim()
          ? parsed.habitTitle
          : PRESET_HABITS[0],
      completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
    };
  } catch {
    return {
      habitTitle: PRESET_HABITS[0],
      completedDates: [],
    };
  }
}

function saveDailyGrowth(state: DailyGrowthState): void {
  try {
    localStorage.setItem(DAILY_GROWTH_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function calculateStreak(completedDates: string[]): number {
  const set = new Set(completedDates);
  const today = new Date();
  let streak = 0;

  // Start from today if completed, otherwise check yesterday to preserve active streak
  const startOffset = set.has(toLocalDateKey(today)) ? 0 : 1;

  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (set.has(toLocalDateKey(d))) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export const DailyGrowth: React.FC = () => {
  const [growth, setGrowth] = useState<DailyGrowthState>(() => loadDailyGrowth());
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [habitInput, setHabitInput] = useState(() => loadDailyGrowth().habitTitle);

  const todayKey = toLocalDateKey(new Date());
  const isDoneToday = growth.completedDates.includes(todayKey);
  const streak = useMemo(() => calculateStreak(growth.completedDates), [growth.completedDates]);

  const last7Days = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const completedSet = new Set(growth.completedDates);
    const items: { key: string; label: string; done: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      items.push({
        key,
        label: dayNames[d.getDay()],
        done: completedSet.has(key),
        isToday: i === 0,
      });
    }
    return items;
  }, [growth.completedDates]);

  const toggleToday = () => {
    const nextDates = isDoneToday
      ? growth.completedDates.filter((d) => d !== todayKey)
      : [...growth.completedDates, todayKey];
    const next: DailyGrowthState = { ...growth, completedDates: nextDates };
    setGrowth(next);
    saveDailyGrowth(next);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = habitInput.trim();
    if (!cleaned) return;
    const next: DailyGrowthState = { ...growth, habitTitle: cleaned };
    setGrowth(next);
    saveDailyGrowth(next);
    setIsEditingHabit(false);
  };

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Pertumbuhan Harian (Daily Growth)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                <Flame className="w-3 h-3 text-amber-500" />
                {streak} Hari Beruntun
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Kebiasaan baikmu: <strong className="text-emerald-800">{growth.habitTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setHabitInput(growth.habitTitle);
              setIsEditingHabit(!isEditingHabit);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ubah kebiasaan baik yang ingin dilacak"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingHabit ? 'Tutup' : 'Ganti Kebiasaan'}</span>
          </button>

          <button
            type="button"
            onClick={toggleToday}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDoneToday
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isDoneToday ? 'Selesai Hari Ini' : 'Tandai Hari Ini'}</span>
          </button>
        </div>
      </div>

      {/* 7-Day Streak Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-slate-500">
          Catatan 7 hari terakhir (satu langkah kecil setiap hari):
        </span>
        <div className="flex items-center gap-2">
          {last7Days.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors ${
                  day.done
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : day.isToday
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 border-dashed'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                {day.done ? <Check className="w-3.5 h-3.5" /> : day.label[0]}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  day.isToday ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Habit Form */}
      {isEditingHabit && (
        <form onSubmit={handleSaveHabit} className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_HABITS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setHabitInput(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                  habitInput === preset
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={habitInput}
              onChange={(e) => setHabitInput(e.target.value)}
              placeholder="Tulis kebiasaan positif kecilmu hari ini..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!habitInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
