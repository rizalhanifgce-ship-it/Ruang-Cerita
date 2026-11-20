import React, { useState } from 'react';
import { SessionSatisfaction, ServiceType } from '../types';
import {
  Star,
  Sparkles,
  CheckCircle2,
  Send,
  ShieldCheck,
  Smile,
  ThumbsUp,
} from 'lucide-react';

interface SessionSatisfactionSurveyProps {
  studentName: string;
  serviceType: ServiceType;
  teacherName: string;
  existingSatisfaction?: SessionSatisfaction;
  onSubmitSatisfaction: (satisfaction: SessionSatisfaction) => void;
}

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Sangat Kurang', color: 'text-rose-600' },
  2: { text: 'Kurang', color: 'text-orange-600' },
  3: { text: 'Cukup Baik', color: 'text-amber-600' },
  4: { text: 'Puas & Membantu', color: 'text-emerald-600' },
  5: { text: 'Sangat Puas!', color: 'text-emerald-700' },
};

const COMFORT_OPTIONS: SessionSatisfaction['comfortLevel'][] = [
  'Sangat Nyaman',
  'Nyaman',
  'Cukup',
  'Kurang Nyaman',
];

const EASE_OPTIONS: SessionSatisfaction['easeOfAccess'][] = [
  'Sangat Mudah',
  'Mudah',
  'Cukup',
  'Sulit',
];

export const SessionSatisfactionSurvey: React.FC<SessionSatisfactionSurveyProps> = ({
  studentName,
  serviceType,
  teacherName,
  existingSatisfaction,
  onSubmitSatisfaction,
}) => {
  const [rating, setRating] = useState<number>(existingSatisfaction?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comfortLevel, setComfortLevel] = useState<SessionSatisfaction['comfortLevel']>(
    existingSatisfaction?.comfortLevel || 'Sangat Nyaman'
  );
  const [easeOfAccess, setEaseOfAccess] = useState<SessionSatisfaction['easeOfAccess']>(
    existingSatisfaction?.easeOfAccess || 'Sangat Mudah'
  );
  const [feedback, setFeedback] = useState<string>(existingSatisfaction?.feedback || '');
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingSatisfaction));
  const [validationError, setValidationError] = useState<string>('');

  const activeRating = hoverRating || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setValidationError('Silakan pilih jumlah bintang penilaian terlebih dahulu (1–5).');
      return;
    }

    setValidationError('');
    const payload: SessionSatisfaction = {
      rating,
      comfortLevel,
      easeOfAccess,
      feedback: feedback.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    onSubmitSatisfaction(payload);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white rounded-3xl border-2 border-emerald-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <Sparkles className="w-3 h-3" />
              Survei Kepuasan Sesi Tersimpan
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Terima kasih atas masukanmu, {studentName}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Penilaianmu membantu layanan Bimbingan &amp; Konseling madrasah terus berkembang menjadi ruang yang lebih aman, ramah, dan responsif bagi seluruh siswa.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-emerald-200 font-bold text-amber-600">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="ml-1 text-slate-800">{rating}/5</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white border border-emerald-200 font-semibold text-slate-700">
                Kenyamanan: <strong className="text-emerald-800">{comfortLevel}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white border border-emerald-200 font-semibold text-slate-700">
                Akses: <strong className="text-emerald-800">{easeOfAccess}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
              <Sparkles className="w-3 h-3" />
              Survei Kepuasan Sesi (Session Satisfaction)
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Bagaimana Pengalamanmu Mengisi {serviceType === 'pengaduan' ? 'Pengaduan' : 'Konseling'} Ini?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bantu kami meningkatkan kualitas pelayanan Ruang Cerita madrasah bersama {teacherName}.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold shrink-0 self-start">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Opsional &amp; Rahasia
        </span>
      </div>

      {validationError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Star Rating */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            1. Penilaian Kepuasan Keseluruhan <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setValidationError('');
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 rounded-xl hover:bg-amber-50 transition-transform hover:scale-110 cursor-pointer focus:outline-hidden"
                    aria-label={`Beri ${star} bintang`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isActive
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {activeRating > 0 ? (
              <span
                className={`text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-white border border-slate-200 ${
                  RATING_LABELS[activeRating]?.color || 'text-slate-700'
                }`}
              >
                {activeRating}/5 — {RATING_LABELS[activeRating]?.text}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Klik bintang untuk memberi nilai
              </span>
            )}
          </div>
        </div>

        {/* 2. Comfort & Ease of Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kenyamanan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              2. Seberapa Nyaman Kamu Menyampaikan Cerita / Laporan?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMFORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setComfortLevel(opt)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    comfortLevel === opt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Kemudahan Akses */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              3. Kemudahan Mengakses Layanan Ruang Cerita
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EASE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEaseOfAccess(opt)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    easeOfAccess === opt
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Optional Feedback */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            4. Saran atau Masukan untuk Layanan BK Madrasah (Opsional)
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Contoh: Formulirnya mudah dipahami, responnya cepat, atau saran perbaikan lainnya..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span>Kirim Survei Kepuasan</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
