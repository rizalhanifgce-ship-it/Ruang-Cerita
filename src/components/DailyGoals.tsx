import React, { useState, useMemo } from 'react';
import { Check, Edit3, Target, Sparkles } from 'lucide-react';

const DAILY_GOALS_KEY = 'ruang_cerita_weekly_micro_goals_v1';

interface MicroGoalItem {
  id: string;
  title: string;
  completedDates: string[]; // YYYY-MM-DD
}

const DEFAULT_GOALS: MicroGoalItem[] = [
  { id: 'mg-1', title: 'Tidur cukup 8 jam malam ini', completedDates: [] },
  { id: 'mg-2', title: 'Mengobrol hangat dengan teman atau keluarga', completedDates: [] },
  { id: 'mg-3', title: 'Jeda tanpa gawai 30 menit sebelum tidur', completedDates: [] },
];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentWeekDays(): { key: string; label: string; shortDate: string; isToday: boolean }[] {
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const dayOfWeek = now.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return labels.map((label, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const key = toLocalDateKey(d);
    return {
      key,
      label,
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      isToday: key === todayKey,
    };
  });
}

function loadGoals(): MicroGoalItem[] {
  try {
    const raw = localStorage.getItem(DAILY_GOALS_KEY);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.map((g, idx) => ({
        id: g.id || `mg-${idx + 1}`,
        title: typeof g.title === 'string' && g.title.trim() ? g.title : DEFAULT_GOALS[idx].title,
        completedDates: Array.isArray(g.completedDates) ? g.completedDates : [],
      }));
    }
    return DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals: MicroGoalItem[]): void {
  try {
    localStorage.setItem(DAILY_GOALS_KEY, JSON.stringify(goals));
  } catch {
    // ignore storage errors
  }
}

export const DailyGoals: React.FC = () => {
  const [goals, setGoals] = useState<MicroGoalItem[]>(() => loadGoals());
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitles, setDraftTitles] = useState<string[]>(() => loadGoals().map((g) => g.title));

  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const weekKeySet = useMemo(() => new Set(weekDays.map((d) => d.key)), [weekDays]);

  const weeklyCompletedCount = useMemo(() => {
    return goals.reduce(
      (sum, g) => sum + g.completedDates.filter((d) => weekKeySet.has(d)).length,
      0
    );
  }, [goals, weekKeySet]);

  const weeklyTotalPossible = goals.length * 7; // 21
  const weeklyPct = Math.round((weeklyCompletedCount / weeklyTotalPossible) * 100);

  const toggleGoalDay = (goalId: string, dateKey: string) => {
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const exists = g.completedDates.includes(dateKey);
      return {
        ...g,
        completedDates: exists
          ? g.completedDates.filter((d) => d !== dateKey)
          : [...g.completedDates, dateKey],
      };
    });
    setGoals(updated);
    saveGoals(updated);
  };

  const handleSaveTitles = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = goals.map((g, idx) => ({
      ...g,
      title: draftTitles[idx]?.trim() || DEFAULT_GOALS[idx].title,
    }));
    setGoals(updated);
    saveGoals(updated);
    setIsEditing(false);
  };

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                3 Target Mikro Mingguan (Daily Goals)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold">
                <Sparkles className="w-3 h-3" />
                {weeklyCompletedCount} / {weeklyTotalPossible} Minggu Ini ({weeklyPct}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Centang 3 langkah kecil untuk menjaga kesehatan mentalmu sepanjang minggu ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setDraftTitles(goals.map((g) => g.title));
            setIsEditing(!isEditing);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center cursor-pointer transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Tutup Editor' : 'Atur 3 Target'}</span>
        </button>
      </div>

      {/* Weekly Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${weeklyPct}%` }}
        />
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveTitles} className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {goals.map((g, idx) => (
            <div key={g.id}>
              <label className="block font-bold text-slate-700 mb-1">
                Target Mikro #{idx + 1}
              </label>
              <input
                type="text"
                value={draftTitles[idx] || ''}
                onChange={(e) => {
                  const next = [...draftTitles];
                  next[idx] = e.target.value;
                  setDraftTitles(next);
                }}
                placeholder={DEFAULT_GOALS[idx].title}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
            >
              Simpan Target
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2.5 overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Header Row */}
            <div className="grid grid-cols-[1fr_repeat(7,36px)] gap-1.5 items-center pb-1.5 text-[10px] font-bold text-slate-400">
              <span>Target Kebaikan Diri</span>
              {weekDays.map((d) => (
                <div
                  key={d.key}
                  className={`text-center leading-tight ${
                    d.isToday ? 'text-emerald-700 font-extrabold' : ''
                  }`}
                >
                  <div>{d.label}</div>
                  <div className="text-[9px] opacity-75">{d.shortDate}</div>
                </div>
              ))}
            </div>

            {/* Goal Rows */}
            <div className="divide-y divide-slate-100">
              {goals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className="grid grid-cols-[1fr_repeat(7,36px)] gap-1.5 items-center py-2.5"
                >
                  <div className="flex items-center gap-2 pr-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {goal.title}
                    </span>
                  </div>

                  {weekDays.map((d) => {
                    const isDone = goal.completedDates.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleGoalDay(goal.id, d.key)}
                        className={`w-8 h-8 mx-auto rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : d.isToday
                            ? 'bg-emerald-50/70 border-emerald-300 border-dashed text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300'
                        }`}
                        title={`${goal.title} — ${d.label} (${d.shortDate})`}
                      >
                        {isDone && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
