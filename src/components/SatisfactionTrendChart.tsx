import React, { useMemo, useState } from 'react';
import { VisitorRecord } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Star, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface SatisfactionTrendChartProps {
  records: VisitorRecord[];
}

interface SatisfactionDayPoint {
  dateKey: string;
  shortDate: string;
  label: string;
  avgRating: number | null;
  avgRatingBar: number;
  responses: number;
  positiveRate: number;
}

export const SatisfactionTrendChart: React.FC<SatisfactionTrendChartProps> = ({ records }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { chartData, totalResponses, avgOverall, highSatisfactionPct } = useMemo(() => {
    const days: SatisfactionDayPoint[] = [];
    const now = new Date();
    const grouped: Record<string, { sum: number; count: number; positive: number }> = {};

    records.forEach((r) => {
      if (!r.satisfaction) return;
      const dt = new Date(r.satisfaction.submittedAt || r.timestamp);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0, positive: 0 };
      grouped[key].sum += r.satisfaction.rating;
      grouped[key].count += 1;
      if (r.satisfaction.rating >= 4) grouped[key].positive += 1;
    });

    let totalSum = 0;
    let totalCount = 0;
    let totalPositive = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const shortDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);
      const label = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);

      const entry = grouped[dateKey];
      const avg = entry && entry.count > 0 ? Number((entry.sum / entry.count).toFixed(2)) : null;
      const positiveRate =
        entry && entry.count > 0 ? Math.round((entry.positive / entry.count) * 100) : 0;

      if (entry) {
        totalSum += entry.sum;
        totalCount += entry.count;
        totalPositive += entry.positive;
      }

      days.push({
        dateKey,
        shortDate,
        label,
        avgRating: avg,
        avgRatingBar: avg ?? 0,
        responses: entry?.count || 0,
        positiveRate,
      });
    }

    return {
      chartData: days,
      totalResponses: totalCount,
      avgOverall: totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '0.0',
      highSatisfactionPct: totalCount > 0 ? Math.round((totalPositive / totalCount) * 100) : 0,
    };
  }, [records]);

  return (
    <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Tren Skor Kepuasan Layanan (7 Hari Terakhir)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                Rata-rata: {avgOverall} / 5.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Memantau pola kualitas layanan konseling madrasah berdasarkan penilaian siswa ({totalResponses} responden • {highSatisfactionPct}% puas ≥4★).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tren</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
            title={isCollapsed ? 'Tampilkan grafik' : 'Sembunyikan grafik'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-5 sm:p-6">
          {totalResponses === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Belum ada data survei kepuasan siswa dalam 7 hari terakhir.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
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
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      y={4}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Target 4.0★',
                        position: 'insideTopRight',
                        fill: '#059669',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const point = payload[0].payload as SatisfactionDayPoint;
                        return (
                          <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-3 shadow-lg text-xs">
                            <p className="font-extrabold text-slate-900 mb-1">{point.label}</p>
                            {point.responses > 0 ? (
                              <div className="space-y-0.5 text-slate-600">
                                <p>
                                  Rata-rata Skor:{' '}
                                  <strong className="text-amber-600">{point.avgRating} / 5.0 ★</strong>
                                </p>
                                <p>
                                  Jumlah Responden: <strong className="text-slate-800">{point.responses} siswa</strong>
                                </p>
                                <p>
                                  Kepuasan ≥4★: <strong className="text-emerald-700">{point.positiveRate}%</strong>
                                </p>
                              </div>
                            ) : (
                              <p className="text-slate-400">Belum ada survei di hari ini</p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRating"
                      name="Skor Rata-rata"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fill="url(#satisfactionGradient)"
                      connectNulls
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine y={4} stroke="#10b981" strokeDasharray="4 4" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const point = payload[0].payload as SatisfactionDayPoint;
                        return (
                          <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-3 shadow-lg text-xs">
                            <p className="font-extrabold text-slate-900 mb-1">{point.label}</p>
                            {point.responses > 0 ? (
                              <div className="space-y-0.5 text-slate-600">
                                <p>
                                  Rata-rata Skor:{' '}
                                  <strong className="text-amber-600">{point.avgRating} / 5.0 ★</strong>
                                </p>
                                <p>
                                  Jumlah Responden: <strong className="text-slate-800">{point.responses} siswa</strong>
                                </p>
                              </div>
                            ) : (
                              <p className="text-slate-400">Belum ada survei di hari ini</p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="avgRatingBar"
                      name="Skor Rata-rata"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
