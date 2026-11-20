import React, { useMemo } from 'react';
import { VisitorRecord, ServiceType } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Inbox,
  HeartHandshake,
  ShieldAlert,
  Clock,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

interface DailyRequestsSummaryProps {
  records: VisitorRecord[];
  filterTodayOnly?: boolean;
  onFilterToday?: () => void;
  onFilterByService?: (serviceType: ServiceType | 'all') => void;
}

interface DayBucket {
  dateKey: string;
  shortDay: string;
  shortDate: string;
  konseling: number;
  pengaduan: number;
  total: number;
  isToday: boolean;
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export const DailyRequestsSummary: React.FC<DailyRequestsSummaryProps> = ({
  records,
  filterTodayOnly = false,
  onFilterToday,
  onFilterByService,
}) => {
  const summary = useMemo(() => {
    const now = new Date();
    const todayKey = toLocalDateKey(now);

    const buckets: DayBucket[] = [];
    const bucketMap = new Map<string, DayBucket>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = toLocalDateKey(d);
      const shortDay = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
      const shortDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);

      const bucket: DayBucket = {
        dateKey: key,
        shortDay,
        shortDate,
        konseling: 0,
        pengaduan: 0,
        total: 0,
        isToday: key === todayKey,
      };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    let todayKonseling = 0;
    let todayPengaduan = 0;
    let todayMenunggu = 0;
    let todayProses = 0;
    let todaySelesai = 0;

    records.forEach((rec) => {
      try {
        const d = new Date(rec.timestamp);
        if (Number.isNaN(d.getTime())) return;
        const key = toLocalDateKey(d);

        const bucket = bucketMap.get(key);
        if (bucket) {
          if (rec.serviceType === 'pengaduan') {
            bucket.pengaduan += 1;
          } else {
            bucket.konseling += 1;
          }
          bucket.total += 1;
        }

        if (key === todayKey) {
          if (rec.serviceType === 'pengaduan') {
            todayPengaduan += 1;
          } else {
            todayKonseling += 1;
          }

          if (rec.status === 'Selesai') {
            todaySelesai += 1;
          } else if (rec.status === 'Sedang Ditangani') {
            todayProses += 1;
          } else {
            todayMenunggu += 1;
          }
        }
      } catch {
        // Ignore malformed timestamps
      }
    });

    const todayTotal = todayKonseling + todayPengaduan;
    const weeklyTotal = buckets.reduce((acc, b) => acc + b.total, 0);
    const weeklyKonselingTotal = buckets.reduce((acc, b) => acc + b.konseling, 0);
    const weeklyPengaduanTotal = buckets.reduce((acc, b) => acc + b.pengaduan, 0);

    const weeklyAverage = weeklyTotal / 7;
    const weeklyKonselingAvg = weeklyKonselingTotal / 7;
    const weeklyPengaduanAvg = weeklyPengaduanTotal / 7;

    const diffFromAvg = todayTotal - weeklyAverage;
    const pctDiffFromAvg =
      weeklyAverage > 0
        ? Math.round(((todayTotal - weeklyAverage) / weeklyAverage) * 100)
        : todayTotal > 0
        ? 100
        : 0;

    const maxDailyCount = Math.max(
      1,
      ...buckets.map((b) => b.total),
      Math.ceil(weeklyAverage)
    );

    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    return {
      todayFormatted,
      todayTotal,
      todayKonseling,
      todayPengaduan,
      todayMenunggu,
      todayProses,
      todaySelesai,
      weeklyTotal,
      weeklyAverage,
      weeklyKonselingAvg,
      weeklyPengaduanAvg,
      diffFromAvg,
      pctDiffFromAvg,
      buckets,
      maxDailyCount,
    };
  }, [records]);

  const {
    todayFormatted,
    todayTotal,
    todayKonseling,
    todayPengaduan,
    todayMenunggu,
    todayProses,
    todaySelesai,
    weeklyTotal,
    weeklyAverage,
    weeklyKonselingAvg,
    weeklyPengaduanAvg,
    diffFromAvg,
    pctDiffFromAvg,
    buckets,
    maxDailyCount,
  } = summary;

  const isAboveAvg = diffFromAvg > 0.05;
  const isBelowAvg = diffFromAvg < -0.05;

  const konselingShare = todayTotal > 0 ? Math.round((todayKonseling / todayTotal) * 100) : 0;
  const pengaduanShare = todayTotal > 0 ? Math.round((todayPengaduan / todayTotal) * 100) : 0;

  return (
    <section
      aria-label="Ringkasan Permintaan Masuk Harian"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print"
    >
      {/* Top Header Strip */}
      <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
              Ringkasan Permintaan Masuk Harian
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {todayFormatted} <span aria-hidden="true">·</span> Perbandingan hari ini terhadap rata-rata 7 hari terakhir
            </p>
          </div>
        </div>

        {onFilterToday && (
          <button
            type="button"
            onClick={onFilterToday}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              filterTodayOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{filterTodayOnly ? 'Menampilkan Hari Ini' : 'Lihat Data Hari Ini'}</span>
            {!filterTodayOnly && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
          </button>
        )}
      </div>

      {/* Main Content Grid: Left = Today vs Weekly Avg, Middle = Breakdown, Right = 7-Day Rhythm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Zone 1: Today vs Weekly Average Comparison */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500">
                Total Masuk Hari Ini
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                  {todayTotal}
                </span>
                <span className="text-xs font-medium text-slate-500">pengajuan</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">
                Rata-Rata Mingguan
              </span>
              <div className="mt-1 flex items-baseline justify-end gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 tabular-nums tracking-tight">
                  {weeklyAverage.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-500">/ hari</span>
              </div>
            </div>
          </div>

          {/* Comparative Delta Indicator */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isAboveAvg ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isBelowAvg ? (
                <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Minus className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span
                className={`text-xs font-bold tabular-nums ${
                  isAboveAvg
                    ? 'text-emerald-700'
                    : isBelowAvg
                    ? 'text-amber-700'
                    : 'text-slate-600'
                }`}
              >
                {isAboveAvg
                  ? `+${pctDiffFromAvg}% di atas rata-rata mingguan`
                  : isBelowAvg
                  ? `${pctDiffFromAvg}% di bawah rata-rata mingguan`
                  : 'Sejalan dengan rata-rata mingguan'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums whitespace-nowrap">
              {weeklyTotal} total 7 hr
            </span>
          </div>
        </div>

        {/* Zone 2: Today's Incoming Breakdown (Service Type & Status) */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Rincian Layanan Hari Ini
              </span>
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                {todayTotal > 0 ? `${konselingShare}% Konseling / ${pengaduanShare}% Pengaduan` : 'Belum ada data hari ini'}
              </span>
            </div>

            {/* Proportional Split Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              {todayTotal > 0 ? (
                <>
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${konselingShare}%` }}
                    title={`Konseling: ${todayKonseling}`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${pengaduanShare}%` }}
                    title={`Pengaduan: ${todayPengaduan}`}
                  />
                </>
              ) : null}
            </div>

            {/* Two-row Service Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onFilterByService && onFilterByService('konseling')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 transition-colors text-left cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Konseling</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    Avg {weeklyKonselingAvg.toFixed(1)}/hr
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-700 tabular-nums pl-2">
                  {todayKonseling}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onFilterByService && onFilterByService('pengaduan')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 transition-colors text-left cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pengaduan</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    Avg {weeklyPengaduanAvg.toFixed(1)}/hr
                  </div>
                </div>
                <span className="text-lg font-black text-amber-700 tabular-nums pl-2">
                  {todayPengaduan}
                </span>
              </button>
            </div>
          </div>

          {/* Status Summary Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                <strong className="text-slate-900">{todayMenunggu}</strong> menunggu
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>
              <strong className="text-slate-900">{todayProses}</strong> diproses
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong className="text-slate-900">{todaySelesai}</strong> selesai
              </span>
            </span>
          </div>
        </div>

        {/* Zone 3: 7-Day Daily Volume vs Weekly Average Sparkbar */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Ritme 7 Hari Terakhir
            </span>
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
              Garis rata-rata: {weeklyAverage.toFixed(1)}
            </span>
          </div>

          {/* Mini 7-day stacked bar comparison */}
          <div className="relative h-24 pt-2 flex items-end justify-between gap-2">
            {/* Average reference line aligned to h-14 (56px) bar track above 14px day label */}
            {weeklyAverage > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-slate-400/80 pointer-events-none z-10"
                style={{
                  bottom: `${14 + Math.min(56, Math.round((weeklyAverage / maxDailyCount) * 56))}px`,
                }}
                title={`Rata-rata mingguan: ${weeklyAverage.toFixed(1)} / hari`}
              />
            )}

            {buckets.map((day) => {
              const totalPct = Math.round((day.total / maxDailyCount) * 100);
              const konselingPct = day.total > 0 ? (day.konseling / day.total) * 100 : 0;
              const pengaduanPct = day.total > 0 ? (day.pengaduan / day.total) * 100 : 0;

              return (
                <div
                  key={day.dateKey}
                  className="flex-1 flex flex-col items-center gap-1 min-w-0 group"
                  title={`${day.shortDay}, ${day.shortDate}: ${day.total} pengajuan (${day.konseling} konseling, ${day.pengaduan} pengaduan)`}
                >
                  <span
                    className={`text-[10px] font-bold tabular-nums leading-none ${
                      day.isToday ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {day.total}
                  </span>
                  <div className="w-full max-w-[26px] h-14 bg-slate-100 rounded-md overflow-hidden flex flex-col justify-end">
                    {day.total > 0 && (
                      <div
                        className={`w-full flex flex-col transition-all duration-300 ${
                          day.isToday ? 'ring-1 ring-emerald-700/40' : ''
                        }`}
                        style={{ height: `${Math.max(12, totalPct)}%` }}
                      >
                        {day.pengaduan > 0 && (
                          <div
                            className="w-full bg-amber-500"
                            style={{ height: `${pengaduanPct}%` }}
                          />
                        )}
                        {day.konseling > 0 && (
                          <div
                            className="w-full bg-emerald-600"
                            style={{ height: `${konselingPct}%` }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold truncate ${
                      day.isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {day.isToday ? 'Hari Ini' : day.shortDay}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" />
                Konseling
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" />
                Pengaduan
              </span>
            </div>
            <span className="tabular-nums">
              {records.length} arsip total
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
