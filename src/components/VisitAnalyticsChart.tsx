import React, { useState, useMemo } from 'react';
import { VisitorRecord } from '../types';
import { ALL_CLASSES, findCounselorByClass } from '../data/counselors';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

interface VisitAnalyticsChartProps {
  records: VisitorRecord[];
  onSelectClass?: (className: string) => void;
}

type ChartType = 'classes' | 'timeline' | 'grade';

export const VisitAnalyticsChart: React.FC<VisitAnalyticsChartProps> = ({
  records,
  onSelectClass,
}) => {
  const [chartType, setChartType] = useState<ChartType>('classes');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showZeroVisits, setShowZeroVisits] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 1. DATA: Distribution Across Different Classes
  const classDistributionData = useMemo(() => {
    // Map class data
    const map: Record<string, { konseling: number; pengaduan: number; teacher: string }> = {};

    ALL_CLASSES.forEach((cls) => {
      const counselor = findCounselorByClass(cls);
      map[cls] = {
        konseling: 0,
        pengaduan: 0,
        teacher: counselor ? counselor.name : 'Guru BK',
      };
    });

    records.forEach((r) => {
      if (map[r.studentClass]) {
        if (r.serviceType === 'pengaduan') {
          map[r.studentClass].pengaduan += 1;
        } else {
          map[r.studentClass].konseling += 1;
        }
      }
    });

    return ALL_CLASSES.filter((cls) => {
      // Grade filter
      if (selectedGrade !== 'all' && !cls.startsWith(selectedGrade)) return false;
      // Show only classes with visits or all
      const total = map[cls].konseling + map[cls].pengaduan;
      if (!showZeroVisits && total === 0) return false;
      return true;
    }).map((cls) => ({
      name: cls,
      label: `Kelas ${cls}`,
      Konseling: map[cls].konseling,
      Pengaduan: map[cls].pengaduan,
      Total: map[cls].konseling + map[cls].pengaduan,
      GuruBK: map[cls].teacher,
    }));
  }, [records, selectedGrade, showZeroVisits]);

  // 2. DATA: Visits Over Time (Timeline Trend)
  const timelineData = useMemo(() => {
    if (records.length === 0) return [];

    // Group records by YYYY-MM-DD
    const dateMap: Record<
      string,
      {
        konseling: number;
        pengaduan: number;
        total: number;
        classes: Set<string>;
      }
    > = {};

    records.forEach((r) => {
      try {
        const d = new Date(r.timestamp);
        // Format YYYY-MM-DD
        const dateKey = d.toISOString().slice(0, 10);
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { konseling: 0, pengaduan: 0, total: 0, classes: new Set() };
        }
        if (r.serviceType === 'pengaduan') {
          dateMap[dateKey].pengaduan += 1;
        } else {
          dateMap[dateKey].konseling += 1;
        }
        dateMap[dateKey].total += 1;
        dateMap[dateKey].classes.add(r.studentClass);
      } catch (e) {
        console.error('Invalid timestamp in record:', r);
      }
    });

    // Sort by date key ascending
    const sortedKeys = Object.keys(dateMap).sort();

    return sortedKeys.map((key) => {
      const parts = key.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const displayLabel = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);

      return {
        dateKey: key,
        Tanggal: displayLabel,
        Konseling: dateMap[key].konseling,
        Pengaduan: dateMap[key].pengaduan,
        Total: dateMap[key].total,
        KelasTerlibat: Array.from(dateMap[key].classes).join(', '),
      };
    });
  }, [records]);

  // 3. DATA: Distribution by Grade (Kelas 7 vs 8 vs 9)
  const gradeDistributionData = useMemo(() => {
    const grades = [
      { name: 'Kelas 7', key: '7', Konseling: 0, Pengaduan: 0, Total: 0, color: '#10b981' },
      { name: 'Kelas 8', key: '8', Konseling: 0, Pengaduan: 0, Total: 0, color: '#0ea5e9' },
      { name: 'Kelas 9', key: '9', Konseling: 0, Pengaduan: 0, Total: 0, color: '#8b5cf6' },
    ];

    records.forEach((r) => {
      const match = grades.find((g) => r.studentClass.startsWith(g.key));
      if (match) {
        if (r.serviceType === 'pengaduan') {
          match.Pengaduan += 1;
        } else {
          match.Konseling += 1;
        }
        match.Total += 1;
      }
    });

    return grades;
  }, [records]);

  // Custom Tooltip for Class Bar Chart
  const CustomClassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-4 border-b border-slate-700/80 pb-1.5 font-bold">
            <span className="text-emerald-400 font-extrabold text-sm">{dataItem.label}</span>
            <span className="text-slate-400 text-[11px]">{dataItem.GuruBK}</span>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Konseling:
              </span>
              <strong className="text-white">{dataItem.Konseling} siswa</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Pengaduan:
              </span>
              <strong className="text-white">{dataItem.Pengaduan} laporan</strong>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700/60 font-black">
              <span className="text-slate-300">Total Kunjungan:</span>
              <span className="text-emerald-400">{dataItem.Total} siswa</span>
            </div>
          </div>
          {onSelectClass && (
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
              💡 Klik batang untuk filter tabel kelas ini
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Timeline Area Chart
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-1.5">
            <span className="font-extrabold text-sm text-cyan-300">{dataItem.Tanggal}</span>
            <span className="text-[11px] text-slate-400 font-mono">{dataItem.dateKey}</span>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Konseling:
              </span>
              <strong className="text-white">{dataItem.Konseling} sesi</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Pengaduan:
              </span>
              <strong className="text-white">{dataItem.Pengaduan} kasus</strong>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700/60 font-black">
              <span className="text-slate-300">Total Hari Itu:</span>
              <span className="text-cyan-400">{dataItem.Total} siswa</span>
            </div>
            {dataItem.KelasTerlibat && (
              <div className="text-[10px] text-slate-400 pt-1">
                Kelas: {dataItem.KelasTerlibat}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 no-print transition-all">
      {/* Top Header of the Chart Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Visualisasi Distribusi & Tren Kunjungan
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Recharts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis sebaran permohonan bimbingan konseling dan pengaduan siswa antar kelas dan tren waktu
          </p>
        </div>

        {/* View mode buttons & Collapse toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setChartType('classes');
                setIsCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'classes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Distribusi per Kelas"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Per Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChartType('timeline');
                setIsCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Tren Kunjungan dari Waktu ke Waktu"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
              <span>Tren Waktu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChartType('grade');
                setIsCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'grade'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Perbandingan per Tingkat (7, 8, 9)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Per Tingkat</span>
            </button>
          </div>

          {/* Collapse/Expand Section Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title={isCollapsed ? 'Tampilkan grafik visualisasi' : 'Sembunyikan grafik'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Sub Controls for Class Chart */}
          {chartType === 'classes' && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              {/* Grade Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Filter Tingkat:
                </span>
                <div className="flex items-center gap-1">
                  {['all', '7', '8', '9'].map((gr) => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => setSelectedGrade(gr)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        selectedGrade === gr
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {gr === 'all' ? 'Semua Kelas' : `Tingkat ${gr}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle to show/hide classes with 0 visits */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showZeroVisits}
                    onChange={(e) => setShowZeroVisits(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <span>Tampilkan juga kelas yang 0 kunjungan</span>
                </label>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-semibold">
                  Menampilkan <strong>{classDistributionData.length}</strong> kelas
                </span>
              </div>
            </div>
          )}

          {/* Sub Controls for Timeline */}
          {chartType === 'timeline' && (
            <div className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-cyan-600" />
                <span>
                  Grafik memperlihatkan dinamika jumlah siswa yang berkonsultasi seiring berjalannya waktu.
                </span>
              </div>
              <span className="text-slate-500 font-semibold">
                {timelineData.length} rentang tanggal tercatat
              </span>
            </div>
          )}

          {/* CHART 1: Bar Chart per Class */}
          {chartType === 'classes' && (
            <div className="w-full h-72 sm:h-80 pt-2">
              {classDistributionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Tidak ada kelas yang memenuhi kriteria filter. Centang "Tampilkan juga kelas 0 kunjungan" untuk melihat seluruh kelas.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classDistributionData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    onClick={(e) => {
                      if (e && e.activeLabel && onSelectClass) {
                        onSelectClass(String(e.activeLabel));
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomClassTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="Konseling"
                      stackId="a"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="Pengaduan"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* CHART 2: Timeline Area Chart Over Time */}
          {chartType === 'timeline' && (
            <div className="w-full h-72 sm:h-80 pt-2">
              {timelineData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Belum ada data kunjungan untuk menampilkan tren waktu.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 10, right: 15, left: -15, bottom: 15 }}
                  >
                    <defs>
                      <linearGradient id="colorKonseling" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPengaduan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="Tanggal"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area
                      type="monotone"
                      dataKey="Konseling"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorKonseling)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Pengaduan"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPengaduan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* CHART 3: Grade Distribution Comparison */}
          {chartType === 'grade' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {gradeDistributionData.map((gr) => {
                const total = gr.Total;
                const konselingPct = total > 0 ? Math.round((gr.Konseling / total) * 100) : 0;
                const pengaduanPct = total > 0 ? Math.round((gr.Pengaduan / total) * 100) : 0;

                return (
                  <div
                    key={gr.name}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-slate-500" />
                          {gr.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white">
                          {gr.Total} Siswa
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            Konseling:
                          </span>
                          <strong className="text-slate-800">
                            {gr.Konseling} ({konselingPct}%)
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            Pengaduan:
                          </span>
                          <strong className="text-slate-800">
                            {gr.Pengaduan} ({pengaduanPct}%)
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                        {total > 0 ? (
                          <>
                            <div
                              style={{ width: `${konselingPct}%` }}
                              className="h-full bg-emerald-500"
                              title={`Konseling: ${gr.Konseling}`}
                            />
                            <div
                              style={{ width: `${pengaduanPct}%` }}
                              className="h-full bg-amber-500"
                              title={`Pengaduan: ${gr.Pengaduan}`}
                            />
                          </>
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart Summary Footer / Insight */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Grafik diperbarui secara otomatis setiap ada pengisian formulir siswa baru atau perubahan status.
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              Klik pada batang kelas di grafik untuk memfilter tabel di bawah
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
