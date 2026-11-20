import React, { useState, useEffect, useRef } from 'react';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  MessageSquareHeart,
  HeartPulse,
} from 'lucide-react';

interface GuidedBreathingProps {
  onGoToForm: () => void;
  onGoToAssessment: () => void;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'completed';

interface PhaseConfig {
  id: Exclude<BreathPhase, 'idle' | 'completed'>;
  label: string;
  instruction: string;
  durationSec: number;
  ringColor: string;
  orbBg: string;
  badgeClass: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: 'inhale',
    label: 'Tarik Napas',
    instruction: 'Tarik napas perlahan melalui hidung...',
    durationSec: 4,
    ringColor: '#10b981', // emerald-500
    orbBg: 'from-emerald-400 via-teal-500 to-cyan-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'hold',
    label: 'Tahan Napas',
    instruction: 'Tahan napas dengan lembut, bahu tetap rileks...',
    durationSec: 7,
    ringColor: '#0ea5e9', // sky-500
    orbBg: 'from-teal-500 via-cyan-500 to-sky-500',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'exhale',
    label: 'Hembuskan Perlahan',
    instruction: 'Hembuskan perlahan lewat mulut, lepaskan ketegangan...',
    durationSec: 8,
    ringColor: '#14b8a6', // teal-500
    orbBg: 'from-cyan-400 via-teal-400 to-emerald-400',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
];

export const GuidedBreathing: React.FC<GuidedBreathingProps> = ({
  onGoToForm,
  onGoToAssessment,
}) => {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [phaseElapsedMs, setPhaseElapsedMs] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [targetCycles, setTargetCycles] = useState(4);

  const lastTickRef = useRef<number | null>(null);

  const activeConfig =
    phase === 'inhale'
      ? PHASES[0]
      : phase === 'hold'
      ? PHASES[1]
      : phase === 'exhale'
      ? PHASES[2]
      : null;

  useEffect(() => {
    if (!isRunning || phase === 'idle' || phase === 'completed') {
      lastTickRef.current = null;
      return undefined;
    }

    lastTickRef.current = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = lastTickRef.current ? now - lastTickRef.current : 50;
      lastTickRef.current = now;

      setPhaseElapsedMs((prev) => {
        const next = prev + delta;
        const durationMs =
          (phase === 'inhale' ? 4 : phase === 'hold' ? 7 : 8) * 1000;

        if (next >= durationMs) {
          if (phase === 'inhale') {
            setPhase('hold');
          } else if (phase === 'hold') {
            setPhase('exhale');
          } else if (phase === 'exhale') {
            if (currentCycle >= targetCycles) {
              setPhase('completed');
              setIsRunning(false);
            } else {
              setCurrentCycle((c) => c + 1);
              setPhase('inhale');
            }
          }
          return 0;
        }
        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isRunning, phase, currentCycle, targetCycles]);

  const handleStartOrToggle = () => {
    if (phase === 'idle' || phase === 'completed') {
      setCurrentCycle(1);
      setPhaseElapsedMs(0);
      setPhase('inhale');
      setIsRunning(true);
      return;
    }
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('idle');
    setPhaseElapsedMs(0);
    setCurrentCycle(1);
  };

  // Compute smooth visual scale (0.72 -> 1.12)
  let orbScale = 0.85;
  let remainingSec = 0;
  let progressRatio = 0;

  if (activeConfig) {
    const durationMs = activeConfig.durationSec * 1000;
    progressRatio = Math.min(1, phaseElapsedMs / durationMs);
    remainingSec = Math.max(1, Math.ceil((durationMs - phaseElapsedMs) / 1000));

    if (phase === 'inhale') {
      orbScale = 0.72 + 0.4 * progressRatio;
    } else if (phase === 'hold') {
      orbScale = 1.12;
    } else if (phase === 'exhale') {
      orbScale = 1.12 - 0.4 * progressRatio;
    }
  } else if (phase === 'completed') {
    orbScale = 0.92;
    progressRatio = 1;
  }

  const circleRadius = 112;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
            <Wind className="w-3.5 h-3.5 text-cyan-200" />
            <span>Teknik Relaksasi 4-7-8</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Latihan Napas Tenang (Guided Breathing)
          </h1>
          <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed max-w-2xl">
            Saat merasa cemas, gugup, atau kewalahan di madrasah, ikuti lingkaran napas 4-7-8 di bawah ini untuk membantu menenangkan detak jantung dan pikiranmu.
          </p>
        </div>
      </div>

      {/* Main Interactive Breathing Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg shadow-slate-200/40 flex flex-col items-center text-center">
        {/* Target Cycles Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-500 mr-1">Jumlah Siklus:</span>
          {[2, 4, 6].map((cnt) => (
            <button
              key={cnt}
              type="button"
              disabled={isRunning}
              onClick={() => {
                setTargetCycles(cnt);
                if (phase === 'completed') {
                  setPhase('idle');
                  setCurrentCycle(1);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                targetCycles === cnt
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cnt} Siklus
            </button>
          ))}
        </div>

        {/* Phase Pill */}
        <div className="mb-4 min-h-[28px]">
          {activeConfig ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border ${activeConfig.badgeClass}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {activeConfig.label} • Siklus {currentCycle} / {targetCycles}
            </span>
          ) : phase === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-100 text-emerald-800 border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Latihan Selesai ({targetCycles} Siklus)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
              Pola: 4 dtk Tarik • 7 dtk Tahan • 8 dtk Hembuskan
            </span>
          )}
        </div>

        {/* Animated Breathing Orb with SVG Progress Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2 select-none">
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 256 256"
          >
            <circle
              cx="128"
              cy="128"
              r={circleRadius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r={circleRadius}
              fill="none"
              stroke={activeConfig?.ringColor || '#10b981'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Outer Soft Aura */}
          <div
            className="absolute w-44 h-44 rounded-full bg-emerald-400/20 blur-xl pointer-events-none transition-transform duration-100"
            style={{ transform: `scale(${orbScale * 1.15})` }}
          />

          {/* Main Expanding/Contracting Orb */}
          <div
            className={`w-44 h-44 rounded-full bg-gradient-to-br ${
              activeConfig?.orbBg || 'from-emerald-500 via-teal-500 to-cyan-500'
            } shadow-xl shadow-emerald-600/25 flex flex-col items-center justify-center text-white transition-transform duration-100`}
            style={{ transform: `scale(${orbScale})` }}
          >
            {activeConfig ? (
              <>
                <span className="text-4xl sm:text-5xl font-black tabular-nums leading-none">
                  {remainingSec}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider mt-1.5 opacity-95">
                  {activeConfig.label}
                </span>
              </>
            ) : phase === 'completed' ? (
              <>
                <CheckCircle2 className="w-10 h-10 mb-1" />
                <span className="text-sm font-extrabold">Lebih Tenang</span>
              </>
            ) : (
              <>
                <Wind className="w-10 h-10 mb-1.5 opacity-95" />
                <span className="text-sm font-extrabold">Siap Mulai</span>
              </>
            )}
          </div>
        </div>

        {/* Instruction Text */}
        <p className="text-sm sm:text-base font-semibold text-slate-700 max-w-md min-h-[44px] flex items-center justify-center mt-2">
          {activeConfig
            ? activeConfig.instruction
            : phase === 'completed'
            ? 'Bagus sekali! Kamu baru saja memberi jeda yang menenangkan untuk tubuh dan pikiranmu.'
            : 'Cari posisi duduk yang nyaman, rilekskan bahu, lalu tekan tombol Mulai Latihan.'}
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={handleStartOrToggle}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>
                  {phase === 'idle' || phase === 'completed' ? 'Mulai Latihan' : 'Lanjutkan'}
                </span>
              </>
            )}
          </button>

          {phase !== 'idle' && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi</span>
            </button>
          )}
        </div>
      </div>

      {/* Supportive Follow-up Actions */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-600">
          Masih merasa berat atau butuh teman bicara setelah latihan napas?
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onGoToAssessment}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Cek Refleksi Diri</span>
          </button>
          <button
            type="button"
            onClick={onGoToForm}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Cerita ke Guru BK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
