import React, { useState, useEffect, useMemo } from 'react';
import { Award, Lock, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const GRATITUDE_KEY = 'ruang_cerita_daily_gratitude_v1';
const MOOD_TRACKER_KEY = 'ruang_cerita_student_mood_tracker_v1';
const SLEEP_TRACKER_KEY = 'ruang_cerita_sleep_tracker_v1';
const DAILY_GROWTH_KEY = 'ruang_cerita_daily_growth_v1';

interface MilestoneStats {
  gratitudeDays: number;
  moodDays: number;
  sleepDays: number;
  growthDays: number;
}

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  current: number;
  target: number;
  unit: string;
  unlocked: boolean;
}

function readArrayCount(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function readGrowthCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_GROWTH_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { completedDates?: unknown };
    return Array.isArray(parsed?.completedDates) ? parsed.completedDates.length : 0;
  } catch {
    return 0;
  }
}

function loadStats(): MilestoneStats {
  return {
    gratitudeDays: readArrayCount(GRATITUDE_KEY),
    moodDays: readArrayCount(MOOD_TRACKER_KEY),
    sleepDays: readArrayCount(SLEEP_TRACKER_KEY),
    growthDays: readGrowthCount(),
  };
}

export const BadgesMilestones: React.FC = () => {
  const [stats, setStats] = useState<MilestoneStats>(() => loadStats());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => setStats(loadStats());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const badges: BadgeDef[] = useMemo(() => {
    const allThreeStarted =
      (stats.gratitudeDays >= 1 ? 1 : 0) +
      (stats.moodDays >= 1 ? 1 : 0) +
      (stats.sleepDays >= 1 ? 1 : 0);

    return [
      {
        id: 'b-grat-1',
        title: 'Langkah Pertama Syukur',
        description: 'Catat 1 hari Jurnal Syukur',
        emoji: '🌱',
        current: Math.min(1, stats.gratitudeDays),
        target: 1,
        unit: 'hari',
        unlocked: stats.gratitudeDays >= 1,
      },
      {
        id: 'b-grat-5',
        title: 'Hati yang Bersyukur',
        description: 'Catat 5 hari Jurnal Syukur',
        emoji: '💛',
        current: Math.min(5, stats.gratitudeDays),
        target: 5,
        unit: 'hari',
        unlocked: stats.gratitudeDays >= 5,
      },
      {
        id: 'b-mood-1',
        title: 'Pengamat Emosi',
        description: 'Catat 1 hari di Pelacak Mood',
        emoji: '😊',
        current: Math.min(1, stats.moodDays),
        target: 1,
        unit: 'hari',
        unlocked: stats.moodDays >= 1,
      },
      {
        id: 'b-mood-7',
        title: 'Konsisten Jaga Mood',
        description: 'Catat 7 hari di Pelacak Mood',
        emoji: '🌈',
        current: Math.min(7, stats.moodDays),
        target: 7,
        unit: 'hari',
        unlocked: stats.moodDays >= 7,
      },
      {
        id: 'b-sleep-1',
        title: 'Pencatat Tidur Sehat',
        description: 'Catat 1 hari di Pelacak Tidur',
        emoji: '🌙',
        current: Math.min(1, stats.sleepDays),
        target: 1,
        unit: 'hari',
        unlocked: stats.sleepDays >= 1,
      },
      {
        id: 'b-sleep-7',
        title: 'Pola Istirahat Teratur',
        description: 'Catat 7 hari di Pelacak Tidur',
        emoji: '⭐',
        current: Math.min(7, stats.sleepDays),
        target: 7,
        unit: 'hari',
        unlocked: stats.sleepDays >= 7,
      },
      {
        id: 'b-growth-3',
        title: 'Pejuang Kebiasaan Baik',
        description: 'Selesaikan 3 hari Pertumbuhan Harian',
        emoji: '🔥',
        current: Math.min(3, stats.growthDays),
        target: 3,
        unit: 'hari',
        unlocked: stats.growthDays >= 3,
      },
      {
        id: 'b-balance-all',
        title: 'Penjaga Keseimbangan',
        description: 'Coba Syukur, Mood, dan Tidur',
        emoji: '🏆',
        current: allThreeStarted,
        target: 3,
        unit: 'fitur',
        unlocked: allThreeStarted === 3,
      },
    ];
  }, [stats]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const visibleBadges = isExpanded ? badges : badges.slice(0, 4);

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Lencana &amp; Pencapaian (Badges &amp; Milestones)
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                <Sparkles className="w-3 h-3" />
                {unlockedCount} / {badges.length} Terbuka
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Apresiasi untuk konsistensimu dalam menulis Jurnal Syukur, Pelacak Mood, dan Pelacak Tidur.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 self-start sm:self-center cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Ringkas' : `Lihat Semua (${badges.length})`}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {visibleBadges.map((b) => {
          const pct = Math.round((b.current / b.target) * 100);
          return (
            <div
              key={b.id}
              className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                b.unlocked
                  ? 'bg-gradient-to-br from-emerald-50/70 to-amber-50/50 border-emerald-200 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200/80 opacity-85'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-2xl leading-none ${b.unlocked ? '' : 'grayscale opacity-60'}`}>
                  {b.emoji}
                </span>
                {b.unlocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3" />
                    Tercapai
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-bold">
                    <Lock className="w-2.5 h-2.5" />
                    {b.current}/{b.target} {b.unit}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                  {b.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{b.description}</p>
              </div>

              <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    b.unlocked ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
