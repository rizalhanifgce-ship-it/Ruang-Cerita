import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  BookOpen,
  MessageSquareHeart,
  HeartPulse,
  Wind,
  Sun,
  AlertCircle,
} from 'lucide-react';

interface SelfAssessmentProps {
  onGoToForm: () => void;
  onGoToLibrary: () => void;
}

interface QuizQuestion {
  id: string;
  text: string;
  hint: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'Dalam 2 minggu terakhir, seberapa sering kamu merasa cemas, gugup, atau khawatir berlebihan tentang tugas atau ujian di madrasah?',
    hint: 'Termasuk rasa deg-degan atau sulit berhenti memikirkan nilai/tugas.',
  },
  {
    id: 'q2',
    text: 'Seberapa sering kamu merasa sulit untuk rileks atau menenangkan pikiran setelah pulang dari madrasah?',
    hint: 'Pikiran terasa penuh meski sedang beristirahat.',
  },
  {
    id: 'q3',
    text: 'Seberapa sering kamu mengalami gangguan tidur (sulit tidur, sering terbangun, atau masih merasa lelah saat bangun pagi)?',
    hint: 'Kualitas tidur sangat memengaruhi suasana hati dan konsentrasi.',
  },
  {
    id: 'q4',
    text: 'Seberapa sering kamu merasa mudah tersinggung, kesal, atau ingin marah karena hal-hal kecil?',
    hint: 'Emosi terasa lebih sensitif dari biasanya.',
  },
  {
    id: 'q5',
    text: 'Seberapa sering kamu merasa sulit berkonsentrasi saat guru menjelaskan pelajaran atau saat belajar mandiri?',
    hint: 'Pikiran mudah melayang atau cepat merasa kewalahan.',
  },
  {
    id: 'q6',
    text: 'Seberapa sering kamu merasakan keluhan fisik seperti sakit kepala, perut mulas, atau bahu/leher tegang saat sedang banyak pikiran?',
    hint: 'Stres emosional sering muncul lewat sinyal tubuh.',
  },
  {
    id: 'q7',
    text: 'Seberapa sering kamu merasa kehilangan semangat atau kewalahan menghadapi rutinitas harian dan pergaulan di madrasah?',
    hint: 'Merasa lelah secara mental atau ingin menarik diri.',
  },
];

const SCALE_OPTIONS = [
  { value: 0, label: 'Tidak Pernah', short: '0' },
  { value: 1, label: 'Beberapa Hari', short: '1' },
  { value: 2, label: 'Cukup Sering', short: '2' },
  { value: 3, label: 'Hampir Setiap Hari', short: '3' },
];

type ResultLevel = 'rendah' | 'sedang' | 'tinggi';

interface ResultGuidance {
  level: ResultLevel;
  title: string;
  subtitle: string;
  badgeText: string;
  cardClass: string;
  badgeClass: string;
  iconBgClass: string;
  tips: { title: string; detail: string }[];
  recommendCounselor: boolean;
}

function getResultGuidance(score: number): ResultGuidance {
  if (score <= 6) {
    return {
      level: 'rendah',
      title: 'Tingkat Stres & Cemas Terkendali',
      subtitle:
        'Kondisi emosionalmu saat ini tergolong stabil dan seimbang. Terus jaga kebiasaan positif yang sudah kamu lakukan!',
      badgeText: 'Zona Hijau • Terkendali',
      cardClass: 'bg-emerald-50/70 border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBgClass: 'bg-emerald-600 text-white',
      recommendCounselor: false,
      tips: [
        {
          title: 'Pertahankan Rutinitas Tidur & Istirahat',
          detail: 'Tidur cukup 7–8 jam setiap malam membantu menjaga fokus belajar dan kestabilan emosi.',
        },
        {
          title: 'Luangkan Waktu untuk Hobi & Ibadah',
          detail: 'Aktivitas yang kamu sukai serta doa/dzikir harian membantu hati tetap tenang menghadapi tantangan.',
        },
        {
          title: 'Jadilah Teman yang Suportif',
          detail: 'Energi positifmu bisa menjadi penguat bagi teman sekelas yang mungkin sedang butuh didengarkan.',
        },
      ],
    };
  }

  if (score <= 13) {
    return {
      level: 'sedang',
      title: 'Stres / Cemas Tingkat Sedang — Saatnya Jeda Sejenak',
      subtitle:
        'Kamu sedang memikul cukup banyak tekanan akhir-akhir ini. Kondisi ini sangat wajar dialami pelajar, dan ada beberapa langkah sederhana untuk meredakannya.',
      badgeText: 'Zona Kuning • Perlu Perhatian',
      cardClass: 'bg-amber-50/70 border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBgClass: 'bg-amber-500 text-white',
      recommendCounselor: true,
      tips: [
        {
          title: 'Praktikkan Teknik Pernapasan 4-7-8',
          detail: 'Tarik napas 4 detik, tahan 7 detik, lalu hembuskan perlahan 8 detik. Ulangi 3–4 kali saat pikiran terasa penuh.',
        },
        {
          title: 'Pecah Tugas Belajar Jadi Bagian Kecil',
          detail: 'Gunakan teknik 25 menit fokus lalu 5 menit istirahat agar tugas tidak terasa menumpuk sekaligus.',
        },
        {
          title: 'Ceritakan ke Orang Terpercaya atau Guru BK',
          detail: 'Berbagi cerita sebelum beban menumpuk bisa membuat pikiran jauh lebih lega dan terarah.',
        },
      ],
    };
  }

  return {
    level: 'tinggi',
    title: 'Tingkat Stres / Cemas Cukup Tinggi — Kamu Tidak Sendirian',
    subtitle:
      'Sepertinya beberapa minggu terakhir terasa berat bagimu. Terima kasih sudah berani mengenali perasaanmu hari ini. Sangat disarankan untuk tidak memendamnya sendirian.',
    badgeText: 'Zona Perhatian • Butuh Dukungan',
    cardClass: 'bg-rose-50/70 border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    iconBgClass: 'bg-rose-600 text-white',
    recommendCounselor: true,
    tips: [
      {
        title: 'Lakukan Grounding 5-4-3-2-1 Saat Cemas Datang',
        detail: 'Sebutkan dalam hati 5 benda yang terlihat, 4 yang bisa disentuh, 3 suara yang terdengar, 2 aroma, dan 1 hal yang disyukuri.',
      },
      {
        title: 'Kurangi Beban Sementara & Utamakan Istirahat',
        detail: 'Beri izin pada dirimu untuk beristirahat sejenak, kurangi paparan media sosial berlebih, dan penuhi kebutuhan minum air putih.',
      },
      {
        title: 'Ngobrol dengan Guru BK Ruang Cerita',
        detail: 'Guru BK madrasah siap mendengarkan ceritamu secara rahasia, tanpa menghakimi, dan membantu mencari jalan keluar bersama.',
      },
    ],
  };
}

export const SelfAssessment: React.FC<SelfAssessmentProps> = ({
  onGoToForm,
  onGoToLibrary,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const totalScore = useMemo(() => {
    return QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  }, [answers]);

  const guidance = useMemo(() => getResultGuidance(totalScore), [totalScore]);

  const handleSelect = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span>100% Anonim &amp; Privasi Terjaga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Refleksi Diri: Cek Stres &amp; Kecemasan
          </h1>
          <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed max-w-2xl">
            Jawab 7 pertanyaan singkat berikut untuk memahami kondisi stres atau kecemasanmu dalam 2 minggu terakhir. Jawaban tidak disimpan ke database maupun dikirim ke siapa pun.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">Catatan Penting:</strong> Kuis ini merupakan alat refleksi awal untuk membantu siswa madrasah mengenali kondisi emosionalnya, bukan diagnosis medis atau psikologis resmi.
        </p>
      </div>

      {!showResult ? (
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs sticky top-20 z-20">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Progres Pengisian Refleksi
              </span>
              <span className="text-emerald-700">
                {answeredCount} / {QUESTIONS.length} Pertanyaan
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / QUESTIONS.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          {QUESTIONS.map((q, idx) => {
            const selectedVal = answers[q.id];
            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
                  selectedVal !== undefined ? 'border-emerald-200' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                      selectedVal !== undefined
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {q.text}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{q.hint}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SCALE_OPTIONS.map((opt) => {
                    const isSelected = selectedVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(q.id, opt.value)}
                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                            : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {allAnswered
                ? 'Semua pertanyaan sudah terjawab. Klik tombol di samping untuk melihat hasil & saran.'
                : `Jawab ${QUESTIONS.length - answeredCount} pertanyaan lagi untuk melihat hasil refleksimu.`}
            </p>
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => {
                setShowResult(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lihat Hasil &amp; Tips</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* RESULT & IMMEDIATE HELPFUL TIPS */
        <div className="space-y-6">
          <div className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${guidance.cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${guidance.iconBgClass}`}
                >
                  {guidance.level === 'rendah' ? (
                    <Sun className="w-6 h-6" />
                  ) : (
                    <Wind className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border mb-2 ${guidance.badgeClass}`}
                  >
                    {guidance.badgeText}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {guidance.title}
                  </h2>
                </div>
              </div>

              <div className="bg-white/90 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-center shrink-0 self-start">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Skor Refleksi
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {totalScore}
                  <span className="text-xs font-semibold text-slate-400"> / 21</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {guidance.subtitle}
            </p>
          </div>

          {/* Actionable Tips */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Langkah Praktis yang Bisa Kamu Lakukan Sekarang</span>
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              {guidance.tips.map((tip, index) => (
                <div
                  key={tip.title}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                >
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{tip.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {tip.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps CTA */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Refleksi</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={onGoToLibrary}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Baca Pustaka Kesehatan Mental</span>
              </button>
              <button
                type="button"
                onClick={onGoToForm}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors ${
                  guidance.recommendCounselor
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                <MessageSquareHeart className="w-4 h-4" />
                <span>Cerita ke Guru BK Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
