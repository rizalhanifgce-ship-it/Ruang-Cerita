import React, { useState, useMemo } from 'react';
import { VisitorRecord } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  CalendarDays,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  BarChart3,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  CalendarCheck2,
} from 'lucide-react';

export interface DayDataPoint {
  dateKey: string;
  dayName: string;
  shortDate: string;
  label: string;
  Konseling: number;
  Pengaduan: number;
  Total: number;
  isToday: boolean;
  rawDate: Date;
}

interface Last7DaysFrequencyChartProps {
  records: VisitorRecord[];
  onSelectDate?: (dateKey: string | null) => void;
  selectedDateFilter?: string | null;
}

export const Last7DaysFrequencyChart: React.FC<Last7DaysFrequencyChartProps> = ({
  records,
  onSelectDate,
  selectedDateFilter,
}) => {
  const [chartView, setChartView] = useState<'bar' | 'area'>('bar');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Compute 7-day data
  const { last7DaysData, peakDay, total7Days, avgPerDay, lowestDay } = useMemo<{
    last7DaysData: DayDataPoint[];
    peakDay: DayDataPoint | null;
    total7Days: number;
    avgPerDay: string;
    lowestDay: DayDataPoint | null;
  }>(() => {
    const days: DayDataPoint[] = [];

    const now = new Date();
    // Build array for last 7 days (index 6 down to 0)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
      const shortDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);

      days.push({
        dateKey,
        dayName,
        shortDate,
        label: i === 0 ? `Hari Ini (${shortDate})` : `${dayName}, ${shortDate}`,
        Konseling: 0,
        Pengaduan: 0,
        Total: 0,
        isToday: i === 0,
        rawDate: d,
      });
    }

    // Populate data from records
    records.forEach((r) => {
      try {
        const rDate = new Date(r.timestamp);
        const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(
          rDate.getDate()
        ).padStart(2, '0')}`;

        const foundDay = days.find((d) => d.dateKey === rKey);
        if (foundDay) {
          if (r.serviceType === 'pengaduan') {
            foundDay.Pengaduan += 1;
          } else {
            foundDay.Konseling += 1;
          }
          foundDay.Total += 1;
        }
      } catch (err) {
        console.error('Error parsing record timestamp:', err);
      }
    });

    // Find peak day (highest total frequency)
    let maxVisits = -1;
    let peak: DayDataPoint | null = null;
    let minVisits = Infinity;
    let lowest: DayDataPoint | null = null;
    let sum = 0;

    days.forEach((d) => {
      sum += d.Total;
      if (d.Total > maxVisits) {
        maxVisits = d.Total;
        peak = d;
      }
      if (d.Total < minVisits) {
        minVisits = d.Total;
        lowest = d;
      }
    });

    const average = days.length > 0 ? (sum / days.length).toFixed(1) : '0';

    return {
      last7DaysData: days,
      peakDay: peak,
      total7Days: sum,
      avgPerDay: average,
      lowestDay: lowest,
    };
  }, [records]);

  // Custom Recharts Tooltip
  const Custom7DaysTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const isPeak = peakDay && dataItem.dateKey === peakDay.dateKey && dataItem.Total > 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 z-50 min-w-[200px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5 font-bold">
            <span className="text-white text-sm flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
              {dataItem.label}
            </span>
            {isPeak && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                <Flame className="w-3 h-3 fill-current" />
                Periode Puncak
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Layanan Konseling:
              </span>
              <strong className="text-white font-extrabold">{dataItem.Konseling} siswa</strong>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Layanan Pengaduan:
              </span>
              <strong className="text-white font-extrabold">{dataItem.Pengaduan} kasus</strong>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-700/60 font-black text-sm">
              <span className="text-slate-300">Total Pengajuan:</span>
              <span className="text-emerald-400 font-extrabold">{dataItem.Total} siswa</span>
            </div>
          </div>

          {onSelectDate && (
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
              💡 Klik batang untuk memfilter tabel ke tanggal ini
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all no-print">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Frekuensi Pengajuan 7 Hari Terakhir & Periode Puncak
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-current" />
                Peak Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi tren kedatangan siswa per hari untuk memetakan jam & hari paling padat di ruang BK
            </p>
          </div>
        </div>

        {/* Action Controls & Collapse */}
        <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto justify-between md:justify-end">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartView('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                chartView === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                chartView === 'area'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Kurva Tren</span>
            </button>
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Buka grafik 7 hari' : 'Tutup grafik 7 hari'}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* 4 Quick Stat Metric Cards for 7 Days */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Peak Day Highlight */}
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-rose-800 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600 fill-current" />
                  Hari Puncak (Peak Day)
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  Tertinggi
                </span>
              </div>
              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-black text-rose-950">
                  {peakDay && peakDay.Total > 0 ? peakDay.dayName : 'Belum Ada'}
                </div>
                <div className="text-xs text-rose-700 font-semibold mt-0.5">
                  {peakDay && peakDay.Total > 0 ? (
                    <>
                      <strong>{peakDay.Total} pengajuan</strong> ({peakDay.Konseling} konseling,{' '}
                      {peakDay.Pengaduan} pengaduan)
                    </>
                  ) : (
                    'Tidak ada kunjungan'
                  )}
                </div>
              </div>
            </div>

            {/* 2. Total 7 Days */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  Total 7 Hari Terakhir
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">1 Pekan</span>
              </div>
              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-black text-emerald-950">
                  {total7Days} <span className="text-xs font-semibold text-emerald-700">siswa</span>
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Dari total {records.length} seluruh data
                </div>
              </div>
            </div>

            {/* 3. Average per day */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-sky-800 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  Rata-Rata Kedatangan
                </span>
                <span className="text-[10px] text-sky-600 font-bold">Per Hari</span>
              </div>
              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-black text-sky-950">
                  {avgPerDay} <span className="text-xs font-semibold text-sky-700">siswa/hari</span>
                </div>
                <div className="text-xs text-sky-700 font-semibold mt-0.5">
                  Rata-rata frekuensi harian
                </div>
              </div>
            </div>

            {/* 4. Active Date Filter Indicator */}
            <div
              className={`border rounded-2xl p-3.5 flex flex-col justify-between transition-all ${
                selectedDateFilter
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Filter Tanggal
                </span>
                {selectedDateFilter && onSelectDate && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(null)}
                    className="text-[10px] text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="mt-1">
                <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {selectedDateFilter ? (
                    (() => {
                      const found = last7DaysData.find((d) => d.dateKey === selectedDateFilter);
                      return found ? found.label : selectedDateFilter;
                    })()
                  ) : (
                    'Semua Hari'
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedDateFilter
                    ? 'Tabel difilter ke tanggal ini'
                    : 'Klik batang untuk memfilter'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="h-[270px] sm:h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'bar' ? (
                <BarChart
                  data={last7DaysData}
                  margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length && onSelectDate) {
                      const clickedDateKey = e.activePayload[0].payload.dateKey;
                      onSelectDate(
                        selectedDateFilter === clickedDateKey ? null : clickedDateKey
                      );
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<Custom7DaysTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                    iconType="circle"
                  />
                  {peakDay && peakDay.Total > 0 && (
                    <ReferenceLine
                      y={peakDay.Total}
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                      label={{
                        value: `Puncak: ${peakDay.Total} Siswa`,
                        fill: '#e11d48',
                        fontSize: 11,
                        fontWeight: 'bold',
                        position: 'top',
                      }}
                    />
                  )}
                  <Bar
                    dataKey="Konseling"
                    name="Layanan Konseling"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                    cursor="pointer"
                  />
                  <Bar
                    dataKey="Pengaduan"
                    name="Layanan Pengaduan"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                  >
                    {last7DaysData.map((entry) => {
                      const isPeak =
                        peakDay && entry.dateKey === peakDay.dateKey && entry.Total > 0;
                      const isSelected = selectedDateFilter === entry.dateKey;
                      return (
                        <Cell
                          key={entry.dateKey}
                          stroke={isPeak ? '#e11d48' : isSelected ? '#047857' : undefined}
                          strokeWidth={isPeak || isSelected ? 2 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart
                  data={last7DaysData}
                  margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length && onSelectDate) {
                      const clickedDateKey = e.activePayload[0].payload.dateKey;
                      onSelectDate(
                        selectedDateFilter === clickedDateKey ? null : clickedDateKey
                      );
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorKonseling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorPengaduan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<Custom7DaysTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                    iconType="circle"
                  />
                  {peakDay && peakDay.Total > 0 && (
                    <ReferenceLine
                      y={peakDay.Total}
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                      label={{
                        value: `Puncak: ${peakDay.Total} Siswa`,
                        fill: '#e11d48',
                        fontSize: 11,
                        fontWeight: 'bold',
                        position: 'top',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Konseling"
                    name="Layanan Konseling"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorKonseling)"
                    cursor="pointer"
                  />
                  <Area
                    type="monotone"
                    dataKey="Pengaduan"
                    name="Layanan Pengaduan"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPengaduan)"
                    cursor="pointer"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Peak Period BK Teacher Actionable Insight Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black shrink-0 mt-0.5">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-2">
                  <span>Wawasan Periode Puncak BK</span>
                  {peakDay && peakDay.Total > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-bold">
                      {peakDay.dayName} Tertinggi
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {peakDay && peakDay.Total > 0 ? (
                    <>
                      Frekuensi kunjungan tertinggi terjadi pada <strong>{peakDay.dayName}</strong> ({peakDay.shortDate}) sebanyak <strong>{peakDay.Total} siswa</strong> ({peakDay.Konseling} konseling, {peakDay.Pengaduan} pengaduan). Guru BK dianjurkan memaksimalkan ketersediaan di ruang BK pada hari tersebut.
                    </>
                  ) : (
                    'Belum ada data kunjungan pada 7 hari terakhir. Data akan otomatis terupdate saat siswa mengisi formulir.'
                  )}
                </p>
              </div>
            </div>

            {peakDay && peakDay.Total > 0 && onSelectDate && (
              <button
                type="button"
                onClick={() => onSelectDate(selectedDateFilter === peakDay.dateKey ? null : peakDay.dateKey)}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Lihat Siswa {peakDay.dayName}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
