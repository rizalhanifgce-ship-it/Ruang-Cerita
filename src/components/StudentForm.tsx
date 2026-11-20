import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ServiceType, SessionSatisfaction, StudentMood, StudentRosterEntry, TeacherBK, VisitorRecord } from '../types';
import { COUNSELORS, ALL_CLASSES, findCounselorByClass, buildWhatsAppLink } from '../data/counselors';
import { STUDENT_MOODS, getMoodMeta } from '../data/moods';
import { saveVisitorRecord, updateVisitorRecord, getStudentRoster, getDailyCounselingGoal } from '../utils/storage';
import { createVisitorInFirestore, updateVisitorInFirestore } from '../utils/firestoreSync';
import { SessionSatisfactionSurvey } from './SessionSatisfactionSurvey';
import { AppointmentCountdown } from './AppointmentCountdown';
import { DailyGrowth } from './DailyGrowth';
import { DailyAffirmation } from './DailyAffirmation';
import { DailyGoals } from './DailyGoals';
import { SafeSpaceCheckIn } from './SafeSpaceCheckIn';
import { BadgesMilestones } from './BadgesMilestones';
import {
  ShieldAlert,
  HeartHandshake,
  User,
  GraduationCap,
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Lock,
  Camera,
  RefreshCw,
  Trash2,
  SwitchCamera,
  Target,
  CalendarClock,
  Sprout,
  Award,
  ChevronDown,
} from 'lucide-react';

interface StudentFormProps {
  onRecordCreated: (newRecord: VisitorRecord) => void;
  onRecordsUpdated?: (updatedRecords: VisitorRecord[]) => void;
  onViewTeacherDirectory: () => void;
}

const FORM_DRAFT_KEY = 'ruang_cerita_student_form_draft_v1';

interface StudentFormDraft {
  studentName?: string;
  selectedClass?: string;
  serviceType?: ServiceType;
  studentWhatsapp?: string;
  notes?: string;
  selectedMood?: StudentMood | '';
  savedAt?: string;
}

function loadStudentFormDraft(): StudentFormDraft | null {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentFormDraft;
    if (
      parsed &&
      (parsed.studentName ||
        parsed.selectedClass ||
        parsed.studentWhatsapp ||
        parsed.notes ||
        parsed.selectedMood)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export const StudentForm: React.FC<StudentFormProps> = ({
  onRecordCreated,
  onRecordsUpdated,
  onViewTeacherDirectory,
}) => {
  const initialDraftRef = useRef<StudentFormDraft | null>(loadStudentFormDraft());

  // Step state: 1 = Form Entry, 2 = WhatsApp Direct Connect
  const [step, setStep] = useState<1 | 2>(1);

  // Form states (hydrated from auto-saved draft if present)
  const [studentName, setStudentName] = useState(() => initialDraftRef.current?.studentName || '');
  const [selectedClass, setSelectedClass] = useState(() => initialDraftRef.current?.selectedClass || '');
  const [serviceType, setServiceType] = useState<ServiceType>(
    () => initialDraftRef.current?.serviceType || 'konseling'
  );
  const [studentWhatsapp, setStudentWhatsapp] = useState(
    () => initialDraftRef.current?.studentWhatsapp || ''
  );
  const [notes, setNotes] = useState(() => initialDraftRef.current?.notes || '');
  const [selectedMood, setSelectedMood] = useState<StudentMood | ''>(
    () => initialDraftRef.current?.selectedMood || ''
  );

  // Selected counselor for WA contact (defaults to the class counselor or chosen one)
  const [activeCounselor, setActiveCounselor] = useState<TeacherBK | null>(null);
  const [savedRecord, setSavedRecord] = useState<VisitorRecord | null>(null);

  // UI state
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [roster, setRoster] = useState<StudentRosterEntry[]>([]);
  const [showRosterSuggestions, setShowRosterSuggestions] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => Boolean(initialDraftRef.current));
  const [draftSavedAt, setDraftSavedAt] = useState<string>(
    () => initialDraftRef.current?.savedAt || ''
  );
  const [dailyFocus, setDailyFocus] = useState(() => getDailyCounselingGoal());
  const [activeWidgetTab, setActiveWidgetTab] = useState<
    'none' | 'jadwal' | 'growth' | 'goals' | 'badges' | 'checkin'
  >('none');
  const submitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const syncFocus = () => setDailyFocus(getDailyCounselingGoal());
    window.addEventListener('storage', syncFocus);
    window.addEventListener('ruang-cerita-daily-goal-updated', syncFocus);
    return () => {
      window.removeEventListener('storage', syncFocus);
      window.removeEventListener('ruang-cerita-daily-goal-updated', syncFocus);
    };
  }, []);

  // Camera & Photo states (Optional)
  const [studentPhoto, setStudentPhoto] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const startCamera = useCallback(
    async (mode: 'user' | 'environment' = facingMode) => {
      setCameraError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Browser atau perangkat tidak mendukung akses kamera langsung. Gunakan tombol Unggah / Kamera Perangkat di bawah.');
        return;
      }

      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setIsCameraOpen(true);
        // Attach stream on next tick after video element mounts
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')) {
          setCameraError('Izin kamera ditolak. Aktifkan izin kamera di browser atau gunakan tombol Kamera Perangkat.');
        } else {
          setCameraError('Kamera tidak dapat diakses saat ini. Anda tetap bisa mengirim formulir tanpa foto atau gunakan tombol Kamera Perangkat.');
        }
        setIsCameraOpen(false);
      }
    },
    [facingMode]
  );

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 360;
    const maxWidth = 480;
    const scale = vw > maxWidth ? maxWidth / vw : 1;
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setStudentPhoto(dataUrl);
    stopCamera();
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraOpen) {
      startCamera(nextMode);
    }
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const maxWidth = 480;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setStudentPhoto(canvas.toDataURL('image/jpeg', 0.75));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    setRoster(getStudentRoster());
  }, [step]);

  // Auto-save form inputs to localStorage while student is typing on step 1
  useEffect(() => {
    if (step !== 1 || isSubmitSuccess) return;
    const hasAnyInput =
      studentName.trim() ||
      selectedClass ||
      studentWhatsapp.trim() ||
      notes.trim() ||
      selectedMood;

    const timer = window.setTimeout(() => {
      try {
        if (!hasAnyInput && serviceType === 'konseling') {
          localStorage.removeItem(FORM_DRAFT_KEY);
          setDraftSavedAt('');
          return;
        }
        const nowIso = new Date().toISOString();
        const draft: StudentFormDraft = {
          studentName,
          selectedClass,
          serviceType,
          studentWhatsapp,
          notes,
          selectedMood,
          savedAt: nowIso,
        };
        localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(nowIso);
      } catch {
        // Ignore storage quota errors
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [step, isSubmitSuccess, studentName, selectedClass, serviceType, studentWhatsapp, notes, selectedMood]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // Filter roster suggestions based on typed name (and optionally selected class)
  const rosterSuggestions =
    studentName.trim().length >= 1 && roster.length > 0
      ? roster
          .filter((entry) => entry.name.toLowerCase().includes(studentName.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  // Detect counselor when class changes
  const classCounselor = selectedClass ? findCounselorByClass(selectedClass) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitSuccess) return;
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('Silakan masukkan nama lengkap atau panggilan Anda.');
      return;
    }

    if (!selectedClass) {
      setErrorMsg('Silakan pilih kelas Anda terlebih dahulu.');
      return;
    }

    // Determine assigned counselor (falls back to Bu Chol if not matched)
    const targetCounselor = classCounselor || COUNSELORS[0];
    setActiveCounselor(targetCounselor);

    // Stop camera if still open
    stopCamera();

    // Save record to local storage for Guru BK recap
    const newRecord = saveVisitorRecord({
      studentName: studentName.trim(),
      studentClass: selectedClass,
      serviceType,
      studentWhatsapp: studentWhatsapp.trim(),
      assignedTeacherId: targetCounselor.id,
      assignedTeacherName: targetCounselor.name,
      notes: notes.trim(),
      studentPhoto: studentPhoto || undefined,
      mood: selectedMood || undefined,
    });

    setSavedRecord(newRecord);
    onRecordCreated(newRecord);
    createVisitorInFirestore(newRecord).catch(() => {});
    setIsSubmitSuccess(true);

    // Clear auto-saved draft upon successful submission
    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch {
      // Ignore
    }
    setDraftRestored(false);
    setDraftSavedAt('');

    submitTimerRef.current = window.setTimeout(() => {
      setIsSubmitSuccess(false);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  const handleClearDraftAndResetFields = () => {
    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch {
      // Ignore
    }
    setStudentName('');
    setSelectedClass('');
    setNotes('');
    setStudentWhatsapp('');
    setSelectedMood('');
    setServiceType('konseling');
    setDraftRestored(false);
    setDraftSavedAt('');
  };

  const handleReset = () => {
    stopCamera();
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch {
      // Ignore
    }
    setIsSubmitSuccess(false);
    setDraftRestored(false);
    setDraftSavedAt('');
    setStep(1);
    setStudentName('');
    setSelectedClass('');
    setNotes('');
    setStudentWhatsapp('');
    setStudentPhoto('');
    setSelectedMood('');
    setCameraError('');
    setServiceType('konseling');
    setActiveCounselor(null);
    setSavedRecord(null);
    setErrorMsg('');
  };

  // Group classes by grade for easy selection tabs
  const grade7 = ALL_CLASSES.filter((c) => c.startsWith('7'));
  const grade8 = ALL_CLASSES.filter((c) => c.startsWith('8'));
  const grade9 = ALL_CLASSES.filter((c) => c.startsWith('9'));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white p-6 sm:p-10 mb-8 shadow-xl shadow-emerald-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Layanan Bimbingan & Konseling Madrasah
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white mb-3">
            Selamat Datang di Ruang Cerita
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed mb-6">
            Setiap masalah punya jalan keluar, dan kamu tidak sendirian. Ruang Cerita hadir sebagai wadah aman, nyaman, dan rahasia bagi siswa untuk bercerita, berkonsultasi, maupun mengadukan kendala di madrasah.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
              <Lock className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Privasi Terjaga & Aman</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
              <HeartHandshake className="w-4 h-4 text-pink-300 shrink-0" />
              <span>9 Guru BK Siap Mendengar</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
              <Send className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Langsung Terhubung ke WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Affirmation Greeting */}
      <DailyAffirmation />

      {/* Daily Counseling Focus Banner — Compact */}
      {dailyFocus.themeTitle && (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200/80 px-4 py-3 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Fokus Hari Ini:
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {dailyFocus.themeTitle}
              </span>
            </div>
            {dailyFocus.focusNotes && (
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                {dailyFocus.focusNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Compact Tabbed Strip for Daily Wellness & Reminders */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50/70">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap px-1">
            Aktivitas &amp; Pengingat Harian
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'jadwal', label: 'Jadwal', icon: CalendarClock },
                { id: 'growth', label: 'Pertumbuhan', icon: Sprout },
                { id: 'goals', label: '3 Target', icon: Target },
                { id: 'badges', label: 'Lencana', icon: Award },
                { id: 'checkin', label: 'Check-In', icon: HeartHandshake },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeWidgetTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWidgetTab(isActive ? 'none' : tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isActive ? 'rotate-180 text-white' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {activeWidgetTab !== 'none' && (
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-white [&>*]:!mb-0">
            {activeWidgetTab === 'jadwal' && <AppointmentCountdown />}
            {activeWidgetTab === 'growth' && <DailyGrowth />}
            {activeWidgetTab === 'goals' && <DailyGoals />}
            {activeWidgetTab === 'badges' && <BadgesMilestones />}
            {activeWidgetTab === 'checkin' && <SafeSpaceCheckIn />}
          </div>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step === 1 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              1
            </span>
            <span>Identitas & Keperluan</span>
          </div>

          <div className="w-8 h-px bg-slate-200" />

          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step === 2 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              2
            </span>
            <span>Hubungi WhatsApp Guru BK</span>
          </div>
        </div>
      </div>

      {/* STEP 1: FORM PENGUNJUNG SISWA */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg shadow-slate-200/50">
          <div className="mb-8 border-b border-slate-100 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Formulir Kunjungan Ruang Cerita
              </h2>
              {draftSavedAt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold self-start sm:self-auto">
                  <Check className="w-3 h-3" />
                  <span>Draf tersimpan otomatis</span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Isi data diri di bawah ini. Data kamu akan dicatat dalam rekapan khusus Guru BK dan langsung disambungkan ke kontak WhatsApp guru yang mendampingi kelasmu.
            </p>
          </div>

          {draftRestored && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Draf sebelumnya dipulihkan otomatis.</strong> Kamu bisa melanjutkan menulis tanpa takut data hilang.
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearDraftAndResetFields}
                className="px-3 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-emerald-200 hover:border-rose-200 font-bold text-[11px] shrink-0 self-start sm:self-auto cursor-pointer transition-colors"
              >
                Hapus Draf
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Mohon lengkapi formulir</p>
                <p className="text-xs text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Nama Siswa */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-800">
                  1. Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                {roster.length > 0 && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-fill Daftar Siswa Aktif ({roster.length})
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={studentName}
                  onFocus={() => setShowRosterSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRosterSuggestions(false), 180)}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setShowRosterSuggestions(true);
                  }}
                  placeholder={
                    roster.length > 0
                      ? 'Ketik nama kamu untuk isi otomatis nama & kelas...'
                      : 'Contoh: Muhammad Farhan / Siti Aisyah'
                  }
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />

                {/* Autocomplete Dropdown from Local Student Roster */}
                {showRosterSuggestions && rosterSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100">
                    <div className="px-3.5 py-1.5 bg-emerald-50/80 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                      <span>Pilih nama dari daftar siswa madrasah:</span>
                      <span>Klik untuk isi otomatis</span>
                    </div>
                    {rosterSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setStudentName(item.name);
                          setSelectedClass(item.studentClass);
                          setShowRosterSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-emerald-50/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold shrink-0">
                          Kelas {item.studentClass}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Pilihan Kelas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-800">
                  2. Pilih Kelas <span className="text-rose-500">*</span>
                </label>
                {selectedClass && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Kelas Terpilih: {selectedClass}
                  </span>
                )}
              </div>

              {/* Class Selector with Tabs for Grade 7, 8, 9 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                {/* Kelas 7 */}
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Kelas 7 (Tingkat VII)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grade7.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedClass === c
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kelas 8 */}
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Kelas 8 (Tingkat VIII)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grade8.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedClass === c
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kelas 9 */}
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Kelas 9 (Tingkat IX)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grade9.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedClass === c
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Match Indicator + Direct Chat with BK */}
              {classCounselor && (
                <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-emerald-800">Guru BK Pendamping Kelas {selectedClass}: </span>
                      <strong className="text-slate-900">{classCounselor.name}</strong> ({classCounselor.phoneDisplay})
                    </div>
                  </div>
                  <a
                    href={buildWhatsAppLink({
                      teacher: classCounselor,
                      studentName: studentName.trim() || 'Siswa Madrasah',
                      studentClass: selectedClass,
                      serviceType,
                      notes: notes.trim(),
                      studentWhatsapp: studentWhatsapp.trim(),
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    title={`Buka WhatsApp langsung dengan ${classCounselor.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    <span>Chat dengan BK</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* 3. Pilihan Keperluan: Pengaduan atau Konseling */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                3. Pilih Keperluan Layanan <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Pilih jenis layanan yang sesuai agar guru BK dapat memberikan respon dan penanganan terbaik:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opsi Konseling */}
                <div
                  onClick={() => setServiceType('konseling')}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative select-none ${
                    serviceType === 'konseling'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        serviceType === 'konseling'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {serviceType === 'konseling' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">
                    Layanan Konseling
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Curhat atau konsultasi mengenai masalah belajar, kecemasan, rasa percaya diri, hubungan pertemanan, keluarga, atau rencana masa depan.
                  </p>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    Empatik & Rahasia Terjamin
                  </span>
                </div>

                {/* Opsi Pengaduan */}
                <div
                  onClick={() => setServiceType('pengaduan')}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative select-none ${
                    serviceType === 'pengaduan'
                      ? 'border-amber-600 bg-amber-50/50 shadow-md shadow-amber-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        serviceType === 'pengaduan'
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {serviceType === 'pengaduan' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">
                    Layanan Pengaduan
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Melaporkan tindakan perundungan (bullying), ancaman, pemalakan, tindak kekerasan fisik/verbal, ketidaknyamanan, atau pelanggaran di lingkungan madrasah.
                  </p>
                  <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    Perlindungan Siswa & Tanggap Cepat
                  </span>
                </div>
              </div>
            </div>

            {/* Suasana Hati Saat Ini (Emoji Mood Selector) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-800">
                  Bagaimana Perasaanmu Saat Ini? <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                {selectedMood && (
                  <button
                    type="button"
                    onClick={() => setSelectedMood('')}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Hapus Pilihan
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Pilih emoji yang paling menggambarkan suasana hatimu hari ini agar Guru BK bisa memahamimu lebih baik:
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {STUDENT_MOODS.map((m) => {
                  const isActive = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(isActive ? '' : m.id)}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                        isActive
                          ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-600/15 scale-105'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl leading-none" role="img" aria-label={m.label}>
                        {m.emoji}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isActive ? 'text-emerald-800' : 'text-slate-600'
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Nomor WhatsApp Siswa (Opsional) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                4. Nomor WhatsApp Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Diisi jika ingin guru BK bisa membalas atau menghubungi kembali via WhatsApp.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={studentWhatsapp}
                  onChange={(e) => setStudentWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 5. Catatan / Topik Pembicaraan */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                5. Ceritakan Singkat Hal yang Ingin Disampaikan <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Tuliskan gambaran singkat apa yang sedang kamu rasakan atau alami agar guru BK mendapatkan gambaran awal.
              </p>
              <div className="relative">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan di sini... Contoh: Saya merasa bingung membagi waktu belajar, atau saya ingin melapor kejadian di kelas..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 6. Foto Identitas Siswa (Opsional - Kamera Perangkat) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                6. Foto Diri / Identitas Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Ambil foto singkat menggunakan kamera perangkatmu agar Guru BK lebih mudah mengenali kamu saat sesi layanan. Foto bersifat rahasia dan hanya tampil di Portal Guru BK.
              </p>

              {/* Hidden canvas & fallback file input */}
              <canvas ref={canvasRef} className="hidden" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileFallback}
                className="hidden"
              />

              {cameraError && (
                <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {!isCameraOpen && !studentPhoto && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Belum ada foto terlampir
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Kamu boleh langsung lewati langkah ini jika tidak ingin mengambil foto.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Buka Kamera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Kamera Perangkat / Pilih Foto
                    </button>
                  </div>
                </div>
              )}

              {isCameraOpen && (
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 p-3 space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-72 mx-auto flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ambil Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                      <span>Balik Kamera</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {studentPhoto && !isCameraOpen && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={studentPhoto}
                    alt="Pratinjau Foto Siswa"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
                      <Check className="w-3 h-3" />
                      Foto Siap Disertakan
                    </div>
                    <p className="text-xs text-slate-600">
                      Foto ini akan disimpan bersama data kunjunganmu untuk membantu identifikasi oleh Guru BK.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Foto Ulang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentPhoto('')}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Jaminan Kerahasiaan Info Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Prinsip Asas Kerahasiaan BK:</strong> Data identitas dan cerita yang kamu masukkan tersimpan di rekap khusus Guru BK dan tidak akan disebarluaskan ke pihak lain tanpa persetujuanmu.
              </div>
            </div>

            {/* Submit & Direct Chat with BK Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitSuccess}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 transform ${
                  isSubmitSuccess
                    ? 'bg-emerald-500 text-white shadow-emerald-500/35 ring-4 ring-emerald-200 scale-[1.01] cursor-default'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isSubmitSuccess ? (
                  <>
                    <span className="w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center animate-check-pop shadow-xs">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M5 13l4 4L19 7" className="animate-check-draw" />
                      </svg>
                    </span>
                    <span>Data Berhasil Disimpan!</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut &amp; Hubungkan ke Guru BK</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {classCounselor && !isSubmitSuccess && (
                <a
                  href={buildWhatsAppLink({
                    teacher: classCounselor,
                    studentName: studentName.trim() || 'Siswa Madrasah',
                    studentClass: selectedClass,
                    serviceType,
                    notes: notes.trim(),
                    studentWhatsapp: studentWhatsapp.trim(),
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 transition-all shrink-0"
                  title={`Langsung chat WhatsApp dengan ${classCounselor.name}`}
                >
                  <MessageSquare className="w-5 h-5 fill-current" />
                  <span>Chat dengan {classCounselor.name}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: PILIHAN NOMOR GURU BK & AKSES WHATSAPP */}
      {step === 2 && savedRecord && activeCounselor && (
        <div className="space-y-8">
          {/* Success Notification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {savedRecord.studentPhoto ? (
              <img
                src={savedRecord.studentPhoto}
                alt={savedRecord.studentName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                  Data Pengunjung Berhasil Direkap di Sistem BK
                </div>
                {savedRecord.mood && (() => {
                  const moodMeta = getMoodMeta(savedRecord.mood);
                  if (!moodMeta) return null;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${moodMeta.badgeClass}`}>
                      <span>{moodMeta.emoji}</span>
                      <span>Suasana Hati: {moodMeta.label}</span>
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                Terima kasih, {savedRecord.studentName}!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Identitasmu dari kelas <strong>{savedRecord.studentClass}</strong> untuk keperluan{' '}
                <strong className="capitalize text-emerald-800">{savedRecord.serviceType}</strong> telah tercatat di buku rekap Ruang Cerita.
                Sekarang, silakan klik tombol hijau di bawah untuk langsung terhubung ke WhatsApp Guru BK pendampingmu!
              </p>
            </div>
          </div>

          {/* Featured Counselor Card (Matched with student's class) */}
          <div className="bg-white rounded-3xl border-2 border-emerald-500/80 p-6 sm:p-8 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Guru BK Pendamping Kelas {savedRecord.studentClass}
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-3">
              {/* Avatar Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/25 shrink-0">
                {activeCounselor.name.replace(/^(Bu|Pak)\s+/i, '').substring(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {activeCounselor.gender === 'female' ? 'Ibu Guru BK' : 'Bapak Guru BK'}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {activeCounselor.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeCounselor.title} • No: {activeCounselor.phoneDisplay}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 italic">
                  "{activeCounselor.motto}"
                </p>

                {/* Classes Badge */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-500 mb-1.5">
                    Kelas yang Diampu:
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                    {activeCounselor.classes.map((cls) => (
                      <span
                        key={cls}
                        className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                          cls === savedRecord.studentClass
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={buildWhatsAppLink({
                  teacher: activeCounselor,
                  studentName: savedRecord.studentName,
                  studentClass: savedRecord.studentClass,
                  serviceType: savedRecord.serviceType,
                  notes: savedRecord.notes,
                  studentWhatsapp: savedRecord.studentWhatsapp,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99]"
              >
                <MessageSquare className="w-6 h-6 fill-current" />
                <span>Buka WhatsApp & Chat {activeCounselor.name}</span>
                <ExternalLink className="w-5 h-5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  const link = buildWhatsAppLink({
                    teacher: activeCounselor,
                    studentName: savedRecord.studentName,
                    studentClass: savedRecord.studentClass,
                    serviceType: savedRecord.serviceType,
                    notes: savedRecord.notes,
                    studentWhatsapp: savedRecord.studentWhatsapp,
                  });
                  // Extract decoded text from url
                  const urlObj = new URL(link);
                  const msgText = urlObj.searchParams.get('text') || '';
                  navigator.clipboard.writeText(msgText);
                  setCopiedMessage(true);
                  setTimeout(() => setCopiedMessage(false), 2500);
                }}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                title="Salin isi pesan chat"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>

            {/* Chat Preview Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Pesan WhatsApp otomatis yang telah disiapkan untukmu:
              </div>
              <p className="whitespace-pre-line text-slate-600 italic font-mono bg-white p-3 rounded-xl border border-slate-200">
                {`Assalamualaikum wr. wb. / Halo ${activeCounselor.name}, perkenalkan saya ${savedRecord.studentName} dari kelas ${savedRecord.studentClass}. Saya baru saja mengisi Ruang Cerita dengan keperluan: ${savedRecord.serviceType.toUpperCase()}.${savedRecord.notes ? ` Catatan: "${savedRecord.notes}"` : ''} Mohon izin berkonsultasi nggih. Terima kasih banyak.`}
              </p>
            </div>
          </div>

          {/* Survei Kepuasan Sesi (Session Satisfaction Survey) */}
          <SessionSatisfactionSurvey
            studentName={savedRecord.studentName}
            serviceType={savedRecord.serviceType}
            teacherName={activeCounselor.name}
            existingSatisfaction={savedRecord.satisfaction}
            onSubmitSatisfaction={(satisfaction: SessionSatisfaction) => {
              const updatedList = updateVisitorRecord(savedRecord.id, { satisfaction });
              setSavedRecord({ ...savedRecord, satisfaction });
              updateVisitorInFirestore(savedRecord.id, { satisfaction }).catch(() => {});
              if (onRecordsUpdated) {
                onRecordsUpdated(updatedList);
              }
            }}
          />

          {/* Pilihan Guru BK Lainnya (Jika ingin menghubungi guru lain) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ingin Menghubungi Guru BK Lainnya?
                </h3>
                <p className="text-xs text-slate-500">
                  Kamu bebas memilih dan berkonsultasi dengan salah satu dari 9 Guru BK di bawah ini:
                </p>
              </div>
              <button
                onClick={onViewTeacherDirectory}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                Lihat Jadwal & Info Lengkap
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {COUNSELORS.map((c) => {
                const isSelected = activeCounselor.id === c.id;
                const isClassCounselor = classCounselor?.id === c.id;

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {c.name}
                        </span>
                        {isClassCounselor && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Kelasmu
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        {c.phoneDisplay}
                      </p>
                      <div className="text-[11px] text-slate-600 mb-3">
                        <span className="font-semibold text-slate-700">Ampu:</span>{' '}
                        {c.classes.join(', ')}
                      </div>
                    </div>

                    <a
                      href={buildWhatsAppLink({
                        teacher: c,
                        studentName: savedRecord.studentName,
                        studentClass: savedRecord.studentClass,
                        serviceType: savedRecord.serviceType,
                        notes: savedRecord.notes,
                        studentWhatsapp: savedRecord.studentWhatsapp,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>Chat WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset / New Entry Action */}
          <div className="text-center pt-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Selesai / Isi Formulir Pengunjung Baru</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
