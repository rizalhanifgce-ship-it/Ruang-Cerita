import React, { useMemo, useState } from 'react';
import { VisitorRecord } from '../types';
import { STUDENT_MOODS } from '../data/moods';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { SmilePlus, BarChart3, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface MoodTrendChartProps {
  records: VisitorRecord[];
}

interface MoodDayPoint {
  dateKey: string;
  shortDate: string;
  label: string;
  senang: number;
  tenang: number;
  bingung: number;
  cemas: number;
  sedih: number;
  marah: number;
  totalMoods: number;
}

const MOOD_COLORS: Record<string, string> = {
  senang: '#10b981', // emerald-500
  tenang: '#14b8a6', // teal-500
  bingung: '#f59e0b', // amber-500
  cemas: '#f97316', // orange-500
  sedih: '#0ea5e9', // sky-500
  marah: '#f43f5e', // rose-500
};

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ records }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { chartData, totalMoodEntries, topMood } = useMemo(() => {
    const days: MoodDayPoint[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const shortDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);
      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);

      days.push({
        dateKey,
        shortDate: i === 0 ? `Hari Ini` : `${dayName} ${shortDate}`,
        label: i === 0 ? `Hari Ini (${shortDate})` : `${dayName}, ${shortDate}`,
        senang: 0,
        tenang: 0,
        bingung: 0,
        cemas: 0,
        sedih: 0,
        marah: 0,
        totalMoods: 0,
      });
    }

    const moodTotals: Record<string, number> = {
      senang: 0,
      tenang: 0,
      bingung: 0,
      cemas: 0,
      sedih: 0,
      marah: 0,
    };

    let totalEntries = 0;

    records.forEach((rec) => {
      if (!rec.mood) return;
      try {
        const rDate = new Date(rec.timestamp);
        const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(
          rDate.getDate()
        ).padStart(2, '0')}`;
        const day = days.find((d) => d.dateKey === rKey);
        if (day && rec.mood in moodTotals) {
          day[rec.mood] += 1;
          day.totalMoods += 1;
          moodTotals[rec.mood] += 1;
          totalEntries += 1;
        }
      } catch {
        // Ignore invalid dates
      }
    });

    let bestMoodId: string | null = null;
    let bestCount = 0;
    Object.entries(moodTotals).forEach(([id, count]) => {
      if (count > bestCount) {
        bestCount = count;
        bestMoodId = id;
      }
    });

    const bestMood = bestMoodId ? STUDENT_MOODS.find((m) => m.id === bestMoodId) || null : null;

    return {
      chartData: days,
      totalMoodEntries: totalEntries,
      topMood: bestMood ? { ...bestMood, count: bestCount } : null,
    };
  }, [records]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <SmilePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Visualisasi Tren Suasana Hati Harian (7 Hari Terakhir)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {totalMoodEntries} entri suasana hati
              </span>
              {topMood && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${topMood.badgeClass}`}>
                  {topMood.emoji} Dominan 7 Hari: {topMood.label} ({topMood.count})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan kondisi emosional siswa per hari untuk membantu Guru BK memantau kesejahteraan psikologis siswa madrasah.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Batang</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garis</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
            title={isCollapsed ? 'Tampilkan Grafik' : 'Sembunyikan Grafik'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart Area */}
      {!isCollapsed && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                {STUDENT_MOODS.map((m) => (
                  <Bar
                    key={m.id}
                    dataKey={m.id}
                    name={`${m.emoji} ${m.label}`}
                    stackId="moods"
                    fill={MOOD_COLORS[m.id]}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                {STUDENT_MOODS.map((m) => (
                  <Line
                    key={m.id}
                    type="monotone"
                    dataKey={m.id}
                    name={`${m.emoji} ${m.label}`}
                    stroke={MOOD_COLORS[m.id]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
