import React, { useState, useRef, useEffect } from 'react';
import { VisitorRecord, ServiceType, VisitorStatus, LetterheadConfig, StudentRosterEntry, DailyCounselingGoal } from '../types';
import { COUNSELORS, ALL_CLASSES, findCounselorByClass } from '../data/counselors';
import { STUDENT_MOODS, getMoodMeta } from '../data/moods';
import { VisitAnalyticsChart } from './VisitAnalyticsChart';
import { Last7DaysFrequencyChart } from './Last7DaysFrequencyChart';
import { MoodTrendChart } from './MoodTrendChart';
import { SatisfactionTrendChart } from './SatisfactionTrendChart';
import { DailyRequestsSummary } from './DailyRequestsSummary';
import {
  getTeacherPin,
  setTeacherPin,
  updateVisitorRecord,
  deleteVisitorRecord,
  saveVisitorRecord,
  exportRecordsToCSV,
  exportRecordsToExcel,
  formatIndonesianDate,
  formatShortDate,
  resetToSampleRecords,
  generatePrintableHTML,
  downloadPrintableHTML,
  openPrintWindow,
  getLetterheadConfig,
  saveLetterheadConfig,
  resetLetterheadConfig,
  getStudentRoster,
  saveStudentRoster,
  clearStudentRoster,
  parseRosterCSV,
  downloadRosterTemplateCSV,
  getVisitorRecords,
  downloadDatabaseBackup,
  restoreDatabaseBackup,
  getDailyCounselingGoal,
  saveDailyCounselingGoal,
  QRCodeSettings,
  getQRSettings,
  saveQRSettings,
  resetQRSettings,
  getDefaultQRUrl,
} from '../utils/storage';
import {
  createVisitorInFirestore,
  updateVisitorInFirestore,
  deleteVisitorInFirestore,
  saveSettingToFirestore,
  signInAdminWithGoogle,
  signOutAdminFromFirebase,
} from '../utils/firestoreSync';
import { auth } from '../firebase';
import { downloadRecordsAsPDF } from '../utils/pdfExport';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageSquare,
  Edit3,
  Trash2,
  Key,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  RotateCcw,
  GraduationCap,
  Sparkles,
  Layers,
  LayoutList,
  FilterX,
  Users2,
  CalendarDays,
  HeartHandshake,
  ShieldAlert,
  TrendingUp,
  Check,
  ArrowRight,
  Activity,
  Star,
  ImagePlus,
  Settings2,
  FileDown,
  Loader2,
  Upload,
  Database,
  Target,
  QrCode,
  AlertTriangle,
} from 'lucide-react';

interface AdminPortalProps {
  records: VisitorRecord[];
  onRecordsChange: (records: VisitorRecord[]) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  records,
  onRecordsChange,
  isAuthenticated,
  setIsAuthenticated,
}) => {
  // Login PIN & Google Auth states
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinHint, setShowPinHint] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterTodayOnly, setFilterTodayOnly] = useState<boolean>(false);
  const [filterFollowUpOnly, setFilterFollowUpOnly] = useState<boolean>(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<VisitorRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printScope, setPrintScope] = useState<'current' | 'all'>('current');
  const [letterhead, setLetterhead] = useState<LetterheadConfig>(() => getLetterheadConfig());
  const [isEditingKop, setIsEditingKop] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Student Roster CSV state
  const [roster, setRoster] = useState<StudentRosterEntry[]>(() => getStudentRoster());
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterImportMode, setRosterImportMode] = useState<'merge' | 'replace'>('merge');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFeedback, setRosterFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Database Backup & Restore state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupRestoreMode, setBackupRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [backupFeedback, setBackupFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Header dropdown menus
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isQrSettingsModalOpen, setIsQrSettingsModalOpen] = useState(false);
  const [qrSettingsDraft, setQrSettingsDraft] = useState<QRCodeSettings>(() => getQRSettings());
  const [qrSavedFeedback, setQrSavedFeedback] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
        setIsSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Daily Counseling Goal / Theme state
  const [dailyGoal, setDailyGoal] = useState<DailyCounselingGoal>(() => getDailyCounselingGoal());
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [goalThemeInput, setGoalThemeInput] = useState(() => getDailyCounselingGoal().themeTitle);
  const [goalNotesInput, setGoalNotesInput] = useState(() => getDailyCounselingGoal().focusNotes);
  const [goalTargetInput, setGoalTargetInput] = useState(() => getDailyCounselingGoal().targetSessions);

  // Follow-up edit state
  const [editStatus, setEditStatus] = useState<VisitorStatus>('Menunggu');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editCounselorNotes, setEditCounselorNotes] = useState('');

  // Add Manual Record State
  const [manualName, setManualName] = useState('');
  const [manualClass, setManualClass] = useState('7A');
  const [manualService, setManualService] = useState<ServiceType>('konseling');
  const [manualPhone, setManualPhone] = useState('');
  const [manualTeacher, setManualTeacher] = useState(COUNSELORS[0].id);
  const [manualNotes, setManualNotes] = useState('');

  // Change PIN State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: '', isError: false });

  // Handle Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = getTeacherPin();
    if (pinInput.trim() === currentPin) {
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('PIN salah. Silakan coba lagi atau lihat petunjuk PIN default.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setPinError('');
    try {
      await signInAdminWithGoogle();
      setIsAuthenticated(true);
    } catch (err) {
      setPinError(
        err instanceof Error
          ? `Gagal login Google: ${err.message}`
          : 'Gagal login dengan Google. Silakan coba lagi.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    signOutAdminFromFirebase().catch(() => {});
  };

  // Quick Status change from table
  const handleStatusChange = (id: string, newStatus: VisitorStatus) => {
    const handledAt = new Date().toISOString();
    const updated = updateVisitorRecord(id, {
      status: newStatus,
      handledAt,
    });
    onRecordsChange(updated);
    if (auth.currentUser) {
      updateVisitorInFirestore(id, { status: newStatus, handledAt }).catch(() => {});
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (record: VisitorRecord) => {
    setSelectedRecord(record);
    setEditStatus(record.status);
    setEditFollowUp(record.followUpNotes || '');
    setEditCounselorNotes(record.counselorNotes || '');
    setIsDetailModalOpen(true);
  };

  // Save Detail Follow-Up
  const handleSaveFollowUp = () => {
    if (!selectedRecord) return;
    const handledAt = new Date().toISOString();
    const updated = updateVisitorRecord(selectedRecord.id, {
      status: editStatus,
      followUpNotes: editFollowUp,
      counselorNotes: editCounselorNotes,
      handledAt,
    });
    onRecordsChange(updated);
    if (auth.currentUser) {
      updateVisitorInFirestore(selectedRecord.id, {
        status: editStatus,
        followUpNotes: editFollowUp,
        counselorNotes: editCounselorNotes,
        handledAt,
      }).catch(() => {});
    }
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  // Delete Record
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data kunjungan siswa "${name}"?`)) {
      const updated = deleteVisitorRecord(id);
      onRecordsChange(updated);
      if (auth.currentUser) {
        deleteVisitorInFirestore(id).catch(() => {});
      }
    }
  };

  // Reset to Sample Records
  const handleResetData = () => {
    if (confirm('Kembalikan data ke contoh rekapan sampel awal?')) {
      const sample = resetToSampleRecords();
      onRecordsChange(sample);
    }
  };

  // Submit Manual Record
  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const teacher = COUNSELORS.find((c) => c.id === manualTeacher) || COUNSELORS[0];
    const newRec = saveVisitorRecord({
      studentName: manualName.trim(),
      studentClass: manualClass,
      serviceType: manualService,
      studentWhatsapp: manualPhone.trim(),
      assignedTeacherId: teacher.id,
      assignedTeacherName: teacher.name,
      notes: manualNotes.trim(),
    });

    onRecordsChange([newRec, ...records]);
    if (auth.currentUser) {
      createVisitorInFirestore(newRec).catch(() => {});
    }
    setIsAddModalOpen(false);
    // Reset form
    setManualName('');
    setManualNotes('');
    setManualPhone('');
  };

  // Handle PIN Change
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getTeacherPin();
    if (currentPinInput !== storedPin) {
      setPinChangeMsg({ text: 'PIN lama yang Anda masukkan tidak sesuai.', isError: true });
      return;
    }
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: 'PIN baru minimal 4 karakter / angka.', isError: true });
      return;
    }

    setTeacherPin(newPinInput.trim());
    setPinChangeMsg({ text: 'PIN Guru BK berhasil diperbarui!', isError: false });
    setTimeout(() => {
      setIsPinModalOpen(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setPinChangeMsg({ text: '', isError: false });
    }, 1500);
  };

  // Open Print Preview Modal
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  // Letterhead handlers
  const handleUpdateLetterhead = (field: keyof LetterheadConfig, value: string) => {
    setLetterhead((prev) => {
      const next = { ...prev, [field]: value };
      saveLetterheadConfig(next);
      return next;
    });
  };

  const handleLogoUpload = (side: 'leftLogoUrl' | 'rightLogoUrl', file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2 MB agar tetap ringan saat dicetak.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateLetterhead(side, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLetterhead = () => {
    const def = resetLetterheadConfig();
    setLetterhead(def);
  };

  // Direct print execution with fallback
  const handleExecuteBrowserPrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print() failed, opening printable window instead:', e);
      const dataToPrint = printScope === 'current' ? filteredRecords : records;
      const desc = printScope === 'current' ? getFilterDescription() : 'Semua Data';
      openPrintWindow(dataToPrint, desc, letterhead);
    }
  };

  // Open in separate window/tab for printing without iframe sandbox
  const handleOpenPrintTab = () => {
    const dataToPrint = printScope === 'current' ? filteredRecords : records;
    const desc = printScope === 'current' ? getFilterDescription() : 'Semua Data';
    openPrintWindow(dataToPrint, desc, letterhead);
  };

  // Download standalone HTML print document
  const handleDownloadPrintFile = () => {
    const dataToPrint = printScope === 'current' ? filteredRecords : records;
    const desc = printScope === 'current' ? getFilterDescription() : 'Semua Data';
    downloadPrintableHTML(dataToPrint, desc, letterhead);
  };

  // Download as PDF using print-friendly CSS styles
  const handleDownloadPDF = async (scopeOverride?: 'current' | 'all') => {
    const activeScope = scopeOverride ?? printScope;
    const dataToPrint = activeScope === 'current' ? filteredRecords : records;
    if (dataToPrint.length === 0) {
      alert('Tidak ada data rekapan yang dapat diunduh ke PDF.');
      return;
    }
    const desc = activeScope === 'current' ? getFilterDescription() : 'Semua Data';
    const suffix = activeScope === 'current' && filteredRecords.length !== records.length ? 'terfilter' : 'semua';

    setIsGeneratingPdf(true);
    try {
      await downloadRecordsAsPDF(dataToPrint, desc, letterhead, suffix);
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Terjadi kendala saat membuat file PDF. Silakan gunakan tombol Cetak / Buka Jendela Cetak.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Student Roster CSV handlers
  const handleRosterFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const { entries, skippedCount } = parseRosterCSV(reader.result);
      if (entries.length === 0) {
        setRosterFeedback({
          text: 'Tidak ada data siswa yang valid ditemukan di file CSV. Pastikan format kolom: Nama Siswa, Kelas.',
          isError: true,
        });
        return;
      }

      let nextRoster: StudentRosterEntry[];
      if (rosterImportMode === 'replace') {
        nextRoster = entries;
      } else {
        const existingMap = new Map<string, StudentRosterEntry>();
        roster.forEach((item) => {
          existingMap.set(`${item.name.toLowerCase()}__${item.studentClass}`, item);
        });
        entries.forEach((item) => {
          existingMap.set(`${item.name.toLowerCase()}__${item.studentClass}`, item);
        });
        nextRoster = Array.from(existingMap.values());
      }

      nextRoster.sort(
        (a, b) =>
          a.studentClass.localeCompare(b.studentClass, undefined, { numeric: true }) ||
          a.name.localeCompare(b.name, 'id')
      );

      saveStudentRoster(nextRoster);
      setRoster(nextRoster);
      setRosterFeedback({
        text: `Berhasil mengimpor ${entries.length} data siswa${
          skippedCount > 0 ? ` (${skippedCount} baris dilewati)` : ''
        }. Total database siswa sekarang: ${nextRoster.length} siswa.`,
        isError: false,
      });
    };
    reader.readAsText(file);
  };

  const handleDeleteRosterEntry = (id: string) => {
    const next = roster.filter((r) => r.id !== id);
    saveStudentRoster(next);
    setRoster(next);
  };

  const handleClearRoster = () => {
    if (confirm('Hapus seluruh daftar siswa lokal? Fitur auto-fill di formulir siswa akan dinonaktifkan hingga Anda mengunggah CSV baru.')) {
      clearStudentRoster();
      setRoster([]);
      setRosterFeedback({ text: 'Database daftar siswa berhasil dikosongkan.', isError: false });
    }
  };

  // Helper to check if a date string is today
  const isToday = (isoString: string) => {
    try {
      const recDate = new Date(isoString);
      const now = new Date();
      return (
        recDate.getFullYear() === now.getFullYear() &&
        recDate.getMonth() === now.getMonth() &&
        recDate.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  // Helper to check if a record has had no status update for > 7 days
  const getFollowUpStatus = (rec: VisitorRecord): { needed: boolean; daysStale: number } => {
    if (rec.status === 'Selesai') return { needed: false, daysStale: 0 };
    try {
      const lastActivity = rec.handledAt || rec.timestamp;
      const diffMs = Date.now() - new Date(lastActivity).getTime();
      const daysStale = Math.floor(diffMs / (24 * 3600 * 1000));
      return { needed: daysStale > 7, daysStale };
    } catch {
      return { needed: false, daysStale: 0 };
    }
  };

  // Filter records
  const filteredRecords = records.filter((rec) => {
    // Filter Today Only
    if (filterTodayOnly && !isToday(rec.timestamp)) return false;

    // Filter Follow-up Needed (>7 days without status update)
    if (filterFollowUpOnly && !getFollowUpStatus(rec).needed) return false;

    // Filter by Specific Date Key (e.g. from 7-day chart click)
    if (selectedDateFilter) {
      try {
        const rDate = new Date(rec.timestamp);
        const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(
          rDate.getDate()
        ).padStart(2, '0')}`;
        if (rKey !== selectedDateFilter) return false;
      } catch {
        return false;
      }
    }

    // Search
    const searchLower = searchTerm.toLowerCase().trim();
    const searchMatch =
      !searchLower ||
      rec.studentName.toLowerCase().includes(searchLower) ||
      rec.studentClass.toLowerCase().includes(searchLower) ||
      `kelas ${rec.studentClass.toLowerCase()}`.includes(searchLower) ||
      rec.notes.toLowerCase().includes(searchLower) ||
      rec.assignedTeacherName.toLowerCase().includes(searchLower) ||
      (rec.studentWhatsapp && rec.studentWhatsapp.includes(searchLower));

    if (!searchMatch) return false;

    // Type
    if (filterType !== 'all' && rec.serviceType !== filterType) return false;

    // Counseling Topic
    if (filterTopic !== 'all') {
      const combinedText = `${rec.notes} ${rec.followUpNotes || ''}`.toLowerCase();
      const topicKeywords: Record<string, string[]> = {
        akademik: ['belajar', 'ujian', 'nilai', 'tryout', 'asesmen', 'pelajaran', 'matematika', 'buku', 'mengantuk', 'tugas'],
        perundungan: ['bully', 'perundung', 'ejek', 'pengucilan', 'ancam', 'palak', 'kekerasan', 'senior', 'antrean', 'hilang', 'kehilangan'],
        sosial: ['teman', 'pertemanan', 'grup', 'konflik', 'ekstrakurikuler', 'osis', 'adaptasi', 'sebaya', 'kelas'],
        emosi: ['cemas', 'tertekan', 'stres', 'percaya diri', 'gemetar', 'presentasi', 'takut', 'sedih', 'bingung', 'mental'],
        keluarga: ['orang tua', 'keluarga', 'berjualan', 'rumah', 'ekonomi'],
        karier: ['jurusan', 'sma', 'smk', 'man', 'masa depan', 'minat', 'bakat', 'robotik', 'cita-cita', 'kuliah'],
      };
      const keywords = topicKeywords[filterTopic] || [];
      if (!keywords.some((kw) => combinedText.includes(kw))) return false;
    }

    // Status
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false;

    // Teacher
    if (filterTeacher !== 'all' && rec.assignedTeacherId !== filterTeacher) return false;

    // Grade
    if (filterGrade !== 'all' && !rec.studentClass.startsWith(filterGrade)) return false;

    // Specific Class Filter
    if (filterClass !== 'all' && rec.studentClass !== filterClass) return false;

    return true;
  });

  // Calculate count of records per class
  const classCountMap: Record<string, number> = {};
  records.forEach((r) => {
    classCountMap[r.studentClass] = (classCountMap[r.studentClass] || 0) + 1;
  });

  // Selected teacher object
  const selectedTeacherObj = COUNSELORS.find((c) => c.id === filterTeacher);

  // Filtered classes for pill selector
  const displayedClasses = ALL_CLASSES.filter((cls) => {
    if (filterGrade !== 'all' && !cls.startsWith(filterGrade)) return false;
    if (selectedTeacherObj && !selectedTeacherObj.classes.includes(cls)) return false;
    return true;
  });

  // Group filtered records by studentClass
  const groupedByClass = filteredRecords.reduce<Record<string, VisitorRecord[]>>((acc, rec) => {
    if (!acc[rec.studentClass]) {
      acc[rec.studentClass] = [];
    }
    acc[rec.studentClass].push(rec);
    return acc;
  }, {});

  // Sorted list of class keys for grouping
  const sortedClassKeys = Object.keys(groupedByClass).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true });
  });

  // Collapse/Expand handlers
  const toggleGroupCollapse = (cls: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [cls]: !prev[cls],
    }));
  };

  const handleExpandAll = () => setCollapsedGroups({});
  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sortedClassKeys.forEach((cls) => {
      allCollapsed[cls] = true;
    });
    setCollapsedGroups(allCollapsed);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterTodayOnly(false);
    setFilterFollowUpOnly(false);
    setSelectedDateFilter(null);
    setSearchTerm('');
    setFilterType('all');
    setFilterTopic('all');
    setFilterStatus('all');
    setFilterTeacher('all');
    setFilterGrade('all');
    setFilterClass('all');
  };

  const hasActiveFilters =
    filterTodayOnly ||
    filterFollowUpOnly ||
    Boolean(selectedDateFilter) ||
    filterClass !== 'all' ||
    filterGrade !== 'all' ||
    filterTeacher !== 'all' ||
    filterType !== 'all' ||
    filterTopic !== 'all' ||
    filterStatus !== 'all' ||
    searchTerm.trim().length > 0;

  // Case management pipeline counts
  const countPending = records.filter((r) => r.status === 'Menunggu').length;
  const countProcessed = records.filter((r) => r.status === 'Sedang Ditangani').length;
  const countClosed = records.filter((r) => r.status === 'Selesai').length;
  const countFollowUpNeeded = records.filter((r) => getFollowUpStatus(r).needed).length;

  const TOPIC_LABELS: Record<string, string> = {
    akademik: 'Belajar & Akademik',
    perundungan: 'Perundungan / Bullying',
    sosial: 'Pertemanan & Sosial',
    emosi: 'Emosi, Cemas & Percaya Diri',
    keluarga: 'Keluarga & Ekonomi',
    karier: 'Karier & Masa Depan',
  };

  // Generate human-readable filter criteria for Excel export
  const getFilterDescription = () => {
    const parts: string[] = [];
    if (filterTodayOnly) parts.push('Hari Ini');
    if (filterFollowUpOnly) parts.push('Perlu Tindak Lanjut (>7 Hari)');
    if (selectedDateFilter) parts.push(`Tanggal: ${selectedDateFilter}`);
    if (filterGrade !== 'all') parts.push(`Tingkat ${filterGrade}`);
    if (filterClass !== 'all') parts.push(`Kelas ${filterClass}`);
    if (filterType !== 'all') parts.push(`Keperluan: ${filterType === 'pengaduan' ? 'Pengaduan' : 'Konseling'}`);
    if (filterTopic !== 'all') parts.push(`Topik: ${TOPIC_LABELS[filterTopic] || filterTopic}`);
    if (filterStatus !== 'all') {
      const statusLabel =
        filterStatus === 'Menunggu'
          ? 'Menunggu (Pending)'
          : filterStatus === 'Sedang Ditangani'
          ? 'Sedang Ditangani (Processed)'
          : 'Selesai (Closed)';
      parts.push(`Status: ${statusLabel}`);
    }
    if (filterTeacher !== 'all') {
      const counselor = COUNSELORS.find((c) => c.id === filterTeacher);
      if (counselor) parts.push(`Guru BK: ${counselor.name}`);
    }
    if (searchTerm.trim()) parts.push(`Pencarian: "${searchTerm.trim()}"`);
    return parts.length > 0 ? parts.join(', ') : 'Semua Rekapan (Tanpa Filter)';
  };

  // Execute export based on format and scope
  const handleExecuteExport = () => {
    const dataToExport = exportScope === 'current' ? filteredRecords : records;
    if (dataToExport.length === 0) {
      alert('Tidak ada data rekapan yang dapat diekspor.');
      return;
    }

    const filterDesc = exportScope === 'current' ? getFilterDescription() : 'Semua Data';
    const suffix = exportScope === 'current' ? 'terfilter' : 'semua_data';

    if (exportFormat === 'excel') {
      exportRecordsToExcel(dataToExport, filterDesc, suffix);
    } else {
      exportRecordsToCSV(dataToExport, suffix);
    }

    setIsExportModalOpen(false);
  };

  // Highlight search term in student name or class
  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <span>
        {text.substring(0, idx)}
        <mark className="bg-amber-200 text-amber-950 font-black rounded-xs px-1 py-0.5 shadow-xs">
          {text.substring(idx, idx + q.length)}
        </mark>
        {text.substring(idx + q.length)}
      </span>
    );
  };

  // KPI calculations (All-Time)
  const totalVisitors = records.length;
  const totalKonseling = records.filter((r) => r.serviceType === 'konseling').length;
  const totalPengaduan = records.filter((r) => r.serviceType === 'pengaduan').length;
  const totalSelesai = records.filter((r) => r.status === 'Selesai').length;
  const totalMenunggu = records.filter((r) => r.status === 'Menunggu').length;

  // Daily KPI calculations (Hari Ini)
  const todayRecords = records.filter((r) => isToday(r.timestamp));
  const todayTotal = todayRecords.length;
  const todayKonseling = todayRecords.filter((r) => r.serviceType === 'konseling').length;
  const todayPengaduan = todayRecords.filter((r) => r.serviceType === 'pengaduan').length;
  const todaySelesai = todayRecords.filter((r) => r.status === 'Selesai').length;
  const todayMenunggu = todayRecords.filter((r) => r.status === 'Menunggu').length;
  const todayProses = todayRecords.filter((r) => r.status === 'Sedang Ditangani').length;

  const todayKonselingPct = todayTotal > 0 ? Math.round((todayKonseling / todayTotal) * 100) : 0;
  const todayPengaduanPct = todayTotal > 0 ? Math.round((todayPengaduan / todayTotal) * 100) : 0;
  const todayResolutionPct = todayTotal > 0 ? Math.round((todaySelesai / todayTotal) * 100) : 0;

  const todayFormattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Daily Mood Trends calculations (Hari Ini)
  const todayMoodRecords = todayRecords.filter((r) => Boolean(r.mood));
  const todayMoodCounts = STUDENT_MOODS.map((m) => {
    const count = todayMoodRecords.filter((r) => r.mood === m.id).length;
    const pct = todayMoodRecords.length > 0 ? Math.round((count / todayMoodRecords.length) * 100) : 0;
    return { ...m, count, pct };
  });
  const dominantMoodToday =
    todayMoodRecords.length > 0
      ? [...todayMoodCounts].sort((a, b) => b.count - a.count)[0]
      : null;

  // Service Quality / Session Satisfaction Metrics
  const satisfactionRecords = records.filter((r) => Boolean(r.satisfaction));
  const satisfactionCount = satisfactionRecords.length;
  const avgSatisfaction =
    satisfactionCount > 0
      ? (
          satisfactionRecords.reduce((sum, r) => sum + (r.satisfaction?.rating || 0), 0) /
          satisfactionCount
        ).toFixed(1)
      : '0.0';
  const positiveSatisfactionCount = satisfactionRecords.filter(
    (r) => (r.satisfaction?.rating || 0) >= 4
  ).length;
  const positiveSatisfactionPct =
    satisfactionCount > 0 ? Math.round((positiveSatisfactionCount / satisfactionCount) * 100) : 0;
  const comfortableCount = satisfactionRecords.filter(
    (r) =>
      r.satisfaction?.comfortLevel === 'Sangat Nyaman' ||
      r.satisfaction?.comfortLevel === 'Nyaman'
  ).length;
  const comfortablePct =
    satisfactionCount > 0 ? Math.round((comfortableCount / satisfactionCount) * 100) : 0;

  // 1. PIN GATE SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 no-print">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-slate-900/20">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Area Khusus Tenaga Pendidik
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 mb-2">
            Portal Rekapitulasi Guru BK
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            Data identitas siswa, catatan masalah, serta pengaduan bersifat konfidensial dan hanya dapat diakses oleh Guru Bimbingan & Konseling.
          </p>

          {pinError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-4 disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google (Cloud Firestore)'}</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              atau gunakan PIN
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={10}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN Guru BK"
                className="w-full px-4 py-3 text-center text-xl tracking-widest font-mono bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 placeholder:text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Portal Rekap BK</span>
            </button>
          </form>

          {/* Helper hint */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPinHint(!showPinHint)}
              className="text-xs text-slate-400 hover:text-emerald-700 font-medium transition-colors"
            >
              {showPinHint ? 'Sembunyikan Petunjuk' : 'Lupa atau Butuh PIN Default?'}
            </button>
            {showPinHint && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                PIN default awal adalah: <strong className="text-slate-900 font-mono">1234</strong>. Anda dapat mengganti PIN ini kapan saja di dalam dashboard.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED BK DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print-only mb-6 pb-2 print-avoid-break">
        <div className="flex items-center justify-between gap-4">
          {(letterhead.leftLogoUrl || letterhead.rightLogoUrl) && (
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {letterhead.leftLogoUrl && (
                <img src={letterhead.leftLogoUrl} alt="Logo Kiri" className="max-h-16 max-w-16 object-contain" />
              )}
            </div>
          )}
          <div className="flex-1 text-center space-y-0.5">
            {letterhead.line1 && (
              <p className="text-[10pt] font-semibold tracking-wider uppercase text-slate-800">
                {letterhead.line1}
              </p>
            )}
            {letterhead.line2 && (
              <p className="text-[9.5pt] font-medium tracking-wide uppercase text-slate-700">
                {letterhead.line2}
              </p>
            )}
            {letterhead.line3 && (
              <p className="text-[12pt] font-black tracking-wide uppercase text-slate-900">
                {letterhead.line3}
              </p>
            )}
            {letterhead.line4 && (
              <p className="text-[9pt] font-extrabold text-emerald-800 tracking-wide uppercase">
                {letterhead.line4}
              </p>
            )}
            {letterhead.line5 && (
              <p className="text-[8pt] text-slate-500 italic">
                {letterhead.line5}
              </p>
            )}
          </div>
          {(letterhead.leftLogoUrl || letterhead.rightLogoUrl) && (
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {letterhead.rightLogoUrl && (
                <img src={letterhead.rightLogoUrl} alt="Logo Kanan" className="max-h-16 max-w-16 object-contain" />
              )}
            </div>
          )}
        </div>

        {/* Double Border Separator Khas Kop Surat Dinas */}
        <div className="mt-2.5 mb-3 border-t-2 border-b border-black h-1" />

        <div className="text-center space-y-1">
          <h1 className="text-[12pt] font-black uppercase tracking-wide text-slate-900">
            {letterhead.docTitle}
          </h1>
          <div className="flex justify-between items-center text-[8pt] text-slate-700 px-1 pt-1 border-b border-slate-300 pb-1.5">
            <span>
              <strong>Tanggal Cetak:</strong> {formatIndonesianDate(new Date().toISOString())}
            </span>
            <span>
              <strong>Jumlah Siswa Terdata:</strong> {filteredRecords.length} siswa ({records.length} total)
            </span>
            <span>
              <strong>Kriteria Laporan:</strong> {getFilterDescription()}
            </span>
          </div>
        </div>
      </div>

      {/* Top Bar with Actions — Modern Single-Row SaaS Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 px-5 py-4 sm:px-6 shadow-xs no-print">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
              Rekap Data Pengunjung BK
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
              <span>Laporan identitas, konsultasi &amp; pengaduan siswa</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700 tabular-nums">{records.length} total data</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-700">
                {auth.currentUser ? `Cloud Firestore (${auth.currentUser.email})` : 'Mode Lokal (PIN)'}
              </span>
            </div>
          </div>
        </div>

        {/* Streamlined Action Toolbar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Tambah Kunjungan</span>
          </button>

          {/* Ekspor & Cetak Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsExportMenuOpen((prev) => !prev);
                setIsSettingsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ekspor &amp; Cetak</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg p-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    if (filteredRecords.length === 0) return;
                    exportRecordsToCSV(filteredRecords, 'tampilan_saat_ini');
                    setIsExportMenuOpen(false);
                  }}
                  disabled={filteredRecords.length === 0}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unduh CSV Langsung</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 tabular-nums">{filteredRecords.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ekspor Excel / CSV...</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPDF('current');
                    setIsExportMenuOpen(false);
                  }}
                  disabled={isGeneratingPdf}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
                  ) : (
                    <FileDown className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh Dokumen PDF'}</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    handlePrint();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Cetak Rekap Resmi</span>
                </button>
              </div>
            )}
          </div>

          {/* Kelola Data & Pengaturan Dropdown */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsSettingsMenuOpen((prev) => !prev);
                setIsExportMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Kelola Data</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSettingsMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg p-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setRosterFeedback(null);
                    setIsRosterModalOpen(true);
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Data Siswa (CSV)</span>
                  </span>
                  {roster.length > 0 && (
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">{roster.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackupFeedback(null);
                    setIsBackupModalOpen(true);
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Backup &amp; Restore DB</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setQrSettingsDraft(getQRSettings());
                    setQrSavedFeedback(false);
                    setIsQrSettingsModalOpen(true);
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(true);
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Ganti PIN Guru BK</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            title="Keluar / Log Out dari Portal Admin BK"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Permintaan Masuk Harian (Hari Ini vs Rata-Rata Mingguan) */}
      <DailyRequestsSummary
        records={records}
        filterTodayOnly={filterTodayOnly}
        onFilterToday={() => {
          setFilterTodayOnly((prev) => !prev);
          const el = document.getElementById('visitor-records-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onFilterByService={(service) => {
          setFilterTodayOnly(true);
          setFilterType(service);
          const el = document.getElementById('visitor-records-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Ringkasan Statistik Kunjungan Harian (Pengaduan vs Konseling Hari Ini) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 no-print">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Statistik Kunjungan Hari Ini
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan jumlah laporan pengaduan vs permohonan konseling siswa per <strong className="text-slate-800">{todayFormattedDate}</strong>
            </p>
          </div>

          {/* Quick Toggle Filter for Today's Records */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterTodayOnly(!filterTodayOnly)}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTodayOnly
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Klik untuk memfilter tabel menampilkan kunjungan hari ini saja"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{filterTodayOnly ? '✓ Menampilkan Hari Ini Saja' : 'Filter Tabel: Hari Ini'}</span>
            </button>
          </div>
        </div>

        {/* 4 Daily Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Kunjungan Hari Ini */}
          <div
            onClick={() => setFilterTodayOnly(true)}
            className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform"
            title="Klik untuk filter rekapan hari ini"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Total Siswa Hari Ini
              </span>
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <Users2 className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black">{todayTotal}</span>
              <span className="text-xs text-slate-300">siswa berkunjung</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Status respon:</span>
              <span className="font-bold text-emerald-300">
                {todayMenunggu > 0 ? `${todayMenunggu} menunggu respon` : 'Semua direspon'}
              </span>
            </div>
          </div>

          {/* 2. Layanan Konseling Hari Ini */}
          <div
            onClick={() => {
              setFilterTodayOnly(true);
              setFilterType('konseling');
            }}
            className="bg-emerald-50/70 border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group"
            title="Klik untuk memfilter Konseling Hari Ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Konseling Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-200 text-emerald-900">
                {todayKonselingPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-900">
                {todayKonseling}
              </span>
              <span className="text-xs text-emerald-700 font-medium">kasus/sesi</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-2 leading-tight">
              Curhat masalah belajar, pertemanan, motivasi & masa depan
            </p>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>Porsi Konseling:</span>
              <span>{todayKonseling} dari {todayTotal} kunjungan</span>
            </div>
          </div>

          {/* 3. Layanan Pengaduan Hari Ini */}
          <div
            onClick={() => {
              setFilterTodayOnly(true);
              setFilterType('pengaduan');
            }}
            className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-amber-500 hover:bg-amber-50 transition-all cursor-pointer group"
            title="Klik untuk memfilter Pengaduan Hari Ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Pengaduan Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-200 text-amber-950">
                {todayPengaduanPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-900">
                {todayPengaduan}
              </span>
              <span className="text-xs text-amber-800 font-medium">laporan masuk</span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-2 leading-tight">
              Laporan perundungan/bullying, konflik, ketidaknyamanan
            </p>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-semibold text-amber-900">
              <span>Porsi Pengaduan:</span>
              <span>{todayPengaduan} dari {todayTotal} kunjungan</span>
            </div>
          </div>

          {/* 4. Tindak Lanjut & Resolusi Hari Ini */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tindak Lanjut Hari Ini
                </span>
                <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                  {todayResolutionPct}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {todaySelesai} / {todayTotal}
                </span>
                <span className="text-xs text-slate-500 font-semibold">selesai</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {todayProses} sedang diproses • {todayMenunggu} menunggu
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-3 pt-2">
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${todayTotal > 0 ? (todaySelesai / todayTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Mood Trends Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span role="img" aria-label="mood">🎭</span>
                <span>Tren Suasana Hati Siswa Hari Ini</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Ringkasan kondisi emosional siswa yang berkunjung hari ini ({todayMoodRecords.length} dari {todayTotal} siswa mengisi suasana hati)
              </p>
            </div>
            {dominantMoodToday && dominantMoodToday.count > 0 && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${dominantMoodToday.badgeClass}`}>
                <span>{dominantMoodToday.emoji}</span>
                <span>Dominan: {dominantMoodToday.label} ({dominantMoodToday.pct}%)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {todayMoodCounts.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border transition-all ${
                  m.count > 0
                    ? `${m.badgeClass} shadow-2xs`
                    : 'bg-white border-slate-200/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl leading-none" role="img" aria-label={m.label}>
                    {m.emoji}
                  </span>
                  <span className="text-xs font-black">
                    {m.count} <span className="text-[10px] font-semibold opacity-75">({m.pct}%)</span>
                  </span>
                </div>
                <div className="text-[11px] font-bold mb-1.5">{m.label}</div>
                <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${m.barClass}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Counseling Goal & Theme Card */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Tema &amp; Target Konseling Harian
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {dailyGoal.completedSessions >= dailyGoal.targetSessions ? 'Target Tercapai ✓' : 'Sedang Berjalan'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  {dailyGoal.themeTitle}
                </h3>
                {dailyGoal.focusNotes && (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {dailyGoal.focusNotes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setGoalThemeInput(dailyGoal.themeTitle);
                  setGoalNotesInput(dailyGoal.focusNotes);
                  setGoalTargetInput(dailyGoal.targetSessions);
                  setIsEditingGoal(!isEditingGoal);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEditingGoal ? 'Tutup Editor' : 'Atur Tema & Target'}</span>
              </button>
            </div>
          </div>

          {/* Progress Tracker Bar */}
          <div className="bg-white/90 rounded-xl p-3 border border-emerald-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">
                  Progres Sesi Fokus:
                </span>
                <span className="font-black text-emerald-700">
                  {dailyGoal.completedSessions} / {dailyGoal.targetSessions} sesi
                </span>
                <span className="text-[11px] text-slate-400">
                  ({Math.min(100, Math.round((dailyGoal.completedSessions / Math.max(1, dailyGoal.targetSessions)) * 100))}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = saveDailyCounselingGoal({
                      ...dailyGoal,
                      completedSessions: Math.max(0, dailyGoal.completedSessions - 1),
                    });
                    setDailyGoal(next);
                  }}
                  disabled={dailyGoal.completedSessions <= 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-40"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = saveDailyCounselingGoal({
                      ...dailyGoal,
                      completedSessions: dailyGoal.completedSessions + 1,
                    });
                    setDailyGoal(next);
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  +1 Sesi Selesai
                </button>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((dailyGoal.completedSessions / Math.max(1, dailyGoal.targetSessions)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Inline Goal Editor */}
          {isEditingGoal && (
            <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Contoh Tema Cepat:</span>
                {[
                  'Pekan Anti-Perundungan (Anti-Bullying Week)',
                  'Fokus Manajemen Stres & Persiapan Ujian',
                  'Bimbingan Karier & Pemilihan Jurusan',
                  'Adaptasi Sosial & Pertemanan Sehat',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGoalThemeInput(preset)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Judul Tema / Fokus Harian
                  </label>
                  <input
                    type="text"
                    value={goalThemeInput}
                    onChange={(e) => setGoalThemeInput(e.target.value)}
                    placeholder="Contoh: Pekan Anti-Perundungan..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Jumlah Sesi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={goalTargetInput}
                    onChange={(e) => setGoalTargetInput(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Fokus / Panduan Sesi Guru BK
                </label>
                <input
                  type="text"
                  value={goalNotesInput}
                  onChange={(e) => setGoalNotesInput(e.target.value)}
                  placeholder="Catatan singkat fokus pendampingan hari ini..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!goalThemeInput.trim()) return;
                    const updated = saveDailyCounselingGoal({
                      ...dailyGoal,
                      dateKey: new Date().toISOString().slice(0, 10),
                      themeTitle: goalThemeInput.trim(),
                      focusNotes: goalNotesInput.trim(),
                      targetSessions: Math.max(1, goalTargetInput),
                    });
                    setDailyGoal(updated);
                    setIsEditingGoal(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Simpan Tema &amp; Target
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Ratio Bar: Pengaduan vs Konseling Hari Ini */}
        <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 font-bold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">Perbandingan Hari Ini:</span>
              <span className="text-emerald-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Konseling ({todayKonseling} siswa • {todayKonselingPct}%)
              </span>
              <span className="text-slate-400">vs</span>
              <span className="text-amber-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Pengaduan ({todayPengaduan} siswa • {todayPengaduanPct}%)
              </span>
            </div>

            <span className="text-slate-500 text-[11px] font-normal">
              Akumulasi Semua Waktu: <strong>{totalVisitors}</strong> Total ({totalKonseling} Konseling, {totalPengaduan} Pengaduan)
            </span>
          </div>

          {/* Visual Dual Progress Bar */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            {todayTotal === 0 ? (
              <div className="w-full h-full bg-slate-300 text-[10px] text-slate-600 flex items-center justify-center font-bold">
                Belum ada kunjungan tercatat hari ini
              </div>
            ) : (
              <>
                <div
                  style={{ width: `${todayKonselingPct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                  title={`Konseling: ${todayKonseling} siswa (${todayKonselingPct}%)`}
                />
                <div
                  style={{ width: `${todayPengaduanPct}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  title={`Pengaduan: ${todayPengaduan} siswa (${todayPengaduanPct}%)`}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Indeks Kualitas Layanan & Survei Kepuasan Sesi (Session Satisfaction) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <span>Kualitas Layanan &amp; Survei Kepuasan Sesi</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {satisfactionCount} Responden Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pemantauan langsung kepuasan dan kenyamanan siswa setelah mengirim laporan/konseling di madrasah
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
            <div className="px-3.5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Rata-rata Rating
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-950 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{avgSatisfaction}</span>
                <span className="text-xs font-semibold text-amber-700">/5</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Tingkat Puas
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5">
                {positiveSatisfactionPct}%
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Rasa Nyaman
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {comfortablePct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisasi Frekuensi Kunjungan 7 Hari Terakhir & Deteksi Periode Puncak (Peak Period) */}
      <div className="no-print">
        <Last7DaysFrequencyChart
          records={records}
          selectedDateFilter={selectedDateFilter}
          onSelectDate={(dateKey) => {
            setSelectedDateFilter(dateKey);
            if (dateKey) {
              const el = document.getElementById('visitor-records-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      </div>

      {/* Visualisasi Tren Suasana Hati Harian (Recharts) */}
      <MoodTrendChart records={records} />

      {/* Visualisasi Tren Skor Kepuasan Layanan (Recharts) */}
      <SatisfactionTrendChart records={records} />

      {/* Visualisasi Grafik Distribusi & Tren Kunjungan per Kelas (Recharts) */}
      <div className="no-print">
        <VisitAnalyticsChart
          records={records}
          onSelectClass={(cls) => {
            setFilterClass(cls);
            // Scroll smoothly to table
            const el = document.getElementById('visitor-records-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>
      {/* Search Bar & Filter Controls Station */}
      <div id="visitor-records-section" className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4 no-print">
        {/* Header with Title, Match Counter, and Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Search className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Pencarian & Filter Rekapitulasi Siswa</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {filteredRecords.length} Siswa Ditemukan
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Temukan siswa dengan cepat berdasarkan nama, kelas, guru BK pembimbing, atau topik masalah
              </p>
            </div>
          </div>

          {/* Quick Actions (Reset Filter & Ekspor) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                title="Hapus semua filter dan pencarian"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Ekspor data hasil pencarian / filter ini"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor</span> ({filteredRecords.length})
            </button>
          </div>
        </div>

        {/* Primary Search Bar Row */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-600" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari cepat: Ketik nama siswa (cth: Maimun, Ahmad) atau kelas (cth: 7B, 8C, 9A)..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/70 text-slate-600 hidden sm:inline-block">
                {filteredRecords.length} hasil
              </span>
            </div>
          </div>

          {/* Quick Search Helper Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-0.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Pencarian Cepat:
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterGrade('7');
                setFilterClass('all');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterGrade === '7' && filterClass === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua Kelas 7
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGrade('8');
                setFilterClass('all');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterGrade === '8' && filterClass === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua Kelas 8
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGrade('9');
                setFilterClass('all');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterGrade === '9' && filterClass === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua Kelas 9
            </button>
            <button
              type="button"
              onClick={() => setFilterTodayOnly(!filterTodayOnly)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterTodayOnly
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              <span>Hari Ini ({todayTotal})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterFollowUpOnly(!filterFollowUpOnly)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterFollowUpOnly
                  ? 'bg-rose-600 text-white shadow-xs'
                  : countFollowUpNeeded > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="Tampilkan kasus yang belum diperbarui statusnya lebih dari 7 hari"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Follow-up Needed ({countFollowUpNeeded})</span>
            </button>
          </div>
        </div>

        {/* Dedicated Case Management Status Filtering Pipeline (Pending, Processed, Closed) */}
        <div className="pt-2 border-t border-slate-100/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manajemen Alur Kasus Siswa (Status Filtering Pipeline):</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Filter status untuk memonitor kasus baru, berjalan, dan terselesaikan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Semua Kasus / All */}
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  Semua Kasus (All)
                </span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    filterStatus === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {records.length}
                </span>
              </div>
              <div className="text-xs font-semibold">Semua Rekapitulasi Siswa</div>
            </button>

            {/* 2. Menunggu (Pending) */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Menunggu' ? 'all' : 'Menunggu')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterStatus === 'Menunggu'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu (Pending)
                </span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    filterStatus === 'Menunggu'
                      ? 'bg-white/25 text-white'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {countPending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />}
                  {countPending}
                </span>
              </div>
              <div className="text-xs font-semibold opacity-90">
                {countPending > 0 ? 'Perlu Respon Awal' : 'Tidak Ada Antrean'}
              </div>
            </button>

            {/* 3. Sedang Ditangani (Processed) */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Sedang Ditangani' ? 'all' : 'Sedang Ditangani')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterStatus === 'Sedang Ditangani'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-400/40'
                  : 'bg-sky-50/70 hover:bg-sky-100/70 text-sky-950 border-sky-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Ditangani (Processed)
                </span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    filterStatus === 'Sedang Ditangani'
                      ? 'bg-white/25 text-white'
                      : 'bg-sky-200 text-sky-900'
                  }`}
                >
                  {countProcessed}
                </span>
              </div>
              <div className="text-xs font-semibold opacity-90">
                {countProcessed > 0 ? 'Konseling Sedang Berjalan' : 'Belum Ada Sesi'}
              </div>
            </button>

            {/* 4. Selesai (Closed) */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Selesai' ? 'all' : 'Selesai')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                filterStatus === 'Selesai'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesai (Closed)
                </span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    filterStatus === 'Selesai'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {countClosed}
                </span>
              </div>
              <div className="text-xs font-semibold opacity-90">Masalah Tuntas Teratasi</div>
            </button>
          </div>
        </div>

        {/* Filter Controls Row (5 Selects: Kelas, Keperluan, Topik Konseling, Guru BK, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Filter Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Kelas Siswa</span>
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className={`w-full py-2 px-3 bg-slate-50 border rounded-xl font-semibold transition-all focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                filterClass !== 'all'
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-50/50'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Kelas ({records.length} siswa)</option>
              {ALL_CLASSES.map((cls) => {
                const count = classCountMap[cls] || 0;
                return (
                  <option key={cls} value={cls}>
                    Kelas {cls} {count > 0 ? `(${count} siswa)` : '(0 siswa)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Filter Keperluan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>Keperluan Layanan</span>
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full py-2 px-3 bg-slate-50 border rounded-xl font-medium transition-all focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                filterType !== 'all'
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-50/50'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Keperluan</option>
              <option value="konseling">Konseling Saja</option>
              <option value="pengaduan">Pengaduan Saja</option>
            </select>
          </div>

          {/* 3. Filter Topik Konseling */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Topik Konseling</span>
            </label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className={`w-full py-2 px-3 bg-slate-50 border rounded-xl font-medium transition-all focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                filterTopic !== 'all'
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-50/50'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Topik</option>
              <option value="akademik">Belajar &amp; Akademik</option>
              <option value="perundungan">Perundungan / Bullying</option>
              <option value="sosial">Pertemanan &amp; Sosial</option>
              <option value="emosi">Emosi, Cemas &amp; Percaya Diri</option>
              <option value="keluarga">Keluarga &amp; Ekonomi</option>
              <option value="karier">Karier &amp; Masa Depan</option>
            </select>
          </div>

          {/* 4. Filter Guru BK */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Users2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guru BK Dituju</span>
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => {
                setFilterTeacher(e.target.value);
                if (e.target.value !== 'all') {
                  const t = COUNSELORS.find((c) => c.id === e.target.value);
                  if (t && filterClass !== 'all' && !t.classes.includes(filterClass)) {
                    setFilterClass('all');
                  }
                }
              }}
              className={`w-full py-2 px-3 bg-slate-50 border rounded-xl font-medium transition-all focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                filterTeacher !== 'all'
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-50/50'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Guru BK (9 Guru)</option>
              {COUNSELORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.classes.length} kelas)
                </option>
              ))}
            </select>
          </div>

          {/* 5. Filter Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status Penanganan</span>
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full py-2 px-3 bg-slate-50 border rounded-xl font-medium transition-all focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                filterStatus !== 'all'
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-50/50'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Status ({records.length} kasus)</option>
              <option value="Menunggu">Menunggu (Pending) — {countPending} kasus</option>
              <option value="Sedang Ditangani">Sedang Ditangani (Processed) — {countProcessed} kasus</option>
              <option value="Selesai">Selesai (Closed) — {countClosed} kasus</option>
            </select>
          </div>
        </div>

        {/* Quick Tingkat & Class Pills Navigation */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          {/* Tingkat & Class Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1 mr-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              Tingkat:
            </span>

            {/* Tingkat selector buttons */}
            <div className="flex items-center gap-1">
              {['all', '7', '8', '9'].map((gr) => (
                <button
                  key={gr}
                  type="button"
                  onClick={() => {
                    setFilterGrade(gr);
                    if (gr !== 'all' && filterClass !== 'all' && !filterClass.startsWith(gr)) {
                      setFilterClass('all');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterGrade === gr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {gr === 'all' ? 'Semua' : `Kelas ${gr}`}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Class Quick Chips with live visitor counts */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterClass('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer ${
                  filterClass === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Kelas
              </button>

              {displayedClasses.map((cls) => {
                const count = classCountMap[cls] || 0;
                const isSelected = filterClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setFilterClass(isSelected ? 'all' : cls)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300 scale-105'
                        : count > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={`Filter siswa Kelas ${cls} (${count} siswa terdata)`}
                  >
                    <span>{cls}</span>
                    {count > 0 && (
                      <span
                        className={`px-1 py-0.2 rounded-full text-[10px] font-black ${
                          isSelected
                            ? 'bg-white text-emerald-700'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Toggle (Tabel Biasa vs Kelompokkan per Kelas) */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan semua rekapan dalam satu tabel datar"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tabel Biasa</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kelompokkan tabel berdasarkan kelas siswa"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kelompokkan Kelas</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline shrink-0 cursor-pointer"
              title="Reset ke data sampel jika butuh simulasi ulang"
            >
              Reset Sampel
            </button>
          </div>
        </div>

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-emerald-600" />
              Filter Aktif:
            </span>

            {filterTodayOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-xs">
                <CalendarDays className="w-3 h-3" />
                Hari Ini Saja
                <button
                  type="button"
                  onClick={() => setFilterTodayOnly(false)}
                  className="hover:text-emerald-200 cursor-pointer ml-0.5"
                  title="Hapus filter hari ini"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterFollowUpOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[11px] shadow-xs">
                <AlertCircle className="w-3 h-3" />
                Follow-up Needed (&gt;7 Hari)
                <button
                  type="button"
                  onClick={() => setFilterFollowUpOnly(false)}
                  className="hover:text-rose-200 cursor-pointer ml-0.5"
                  title="Hapus filter Follow-up Needed"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDateFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[11px] shadow-xs">
                <CalendarDays className="w-3 h-3" />
                Tanggal: {selectedDateFilter}
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(null)}
                  className="hover:text-emerald-200 cursor-pointer ml-0.5"
                  title="Hapus filter tanggal"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterGrade !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                Tingkat: Kelas {filterGrade}
                <button
                  type="button"
                  onClick={() => setFilterGrade('all')}
                  className="hover:text-slate-950 cursor-pointer"
                  title="Hapus filter tingkat"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterClass !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                Kelas: {filterClass}
                <button
                  type="button"
                  onClick={() => setFilterClass('all')}
                  className="hover:text-emerald-950 cursor-pointer"
                  title="Hapus filter kelas"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterTeacher !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                Guru: {selectedTeacherObj?.name}
                <button
                  type="button"
                  onClick={() => setFilterTeacher('all')}
                  className="hover:text-slate-950 cursor-pointer"
                  title="Hapus filter guru BK"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                {filterType === 'pengaduan' ? 'Pengaduan' : 'Konseling'}
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className="hover:text-slate-950 cursor-pointer"
                  title="Hapus filter keperluan"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterTopic !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[11px] border border-indigo-200">
                Topik: {TOPIC_LABELS[filterTopic] || filterTopic}
                <button
                  type="button"
                  onClick={() => setFilterTopic('all')}
                  className="hover:text-indigo-950 cursor-pointer"
                  title="Hapus filter topik konseling"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterStatus !== 'all' && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  filterStatus === 'Menunggu'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : filterStatus === 'Sedang Ditangani'
                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                Status: {filterStatus === 'Menunggu' ? 'Menunggu (Pending)' : filterStatus === 'Sedang Ditangani' ? 'Sedang Ditangani (Processed)' : 'Selesai (Closed)'}
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                  title="Hapus filter status"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                Pencarian: "{searchTerm}"
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-amber-950 cursor-pointer"
                  title="Hapus kata kunci"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-bold ml-auto cursor-pointer"
            >
              <FilterX className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Records Presentation: Grouped vs Table View */}
      {viewMode === 'grouped' ? (
        <div className="space-y-4">
          {/* Grouped summary bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs no-print">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">
                Tampilan Dikelompokkan per Kelas:
              </span>
              <span className="text-slate-600">
                Ditemukan <strong>{sortedClassKeys.length}</strong> kelas ({filteredRecords.length} siswa)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {sortedClassKeys.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Tidak Ditemukan Siswa yang Sesuai
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `Tidak ada data siswa untuk kata kunci pencarian "${searchTerm}".`
                  : 'Tidak ada data siswa yang cocok dengan filter kelas atau status yang dipilih.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset Filter & Tampilkan Semua</span>
              </button>
            </div>
          ) : (
            sortedClassKeys.map((cls) => {
              const classRecords = groupedByClass[cls] || [];
              const counselor = findCounselorByClass(cls);
              const isCollapsed = collapsedGroups[cls] === true;
              const kCount = classRecords.filter((r) => r.serviceType === 'konseling').length;
              const pCount = classRecords.filter((r) => r.serviceType === 'pengaduan').length;
              const pendingCount = classRecords.filter((r) => r.status === 'Menunggu').length;

              return (
                <div
                  key={cls}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  {/* Class Group Header Banner */}
                  <div
                    onClick={() => toggleGroupCollapse(cls)}
                    className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                        {cls}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            Kelas {cls}
                          </h3>
                          {counselor && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Guru BK: {counselor.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {counselor
                            ? `Guru BK Pendamping: ${counselor.name} • No: ${counselor.phoneDisplay}`
                            : 'Guru BK Pendamping Kelas'}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
                          {classRecords.length} Siswa
                        </span>
                        {kCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {kCount} Konseling
                          </span>
                        )}
                        {pCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800">
                            {pCount} Pengaduan
                          </span>
                        )}
                        {pendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            {pendingCount} Perlu Ditangani
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Semua Selesai
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 no-print">
                        {counselor && (
                          <a
                            href={`https://wa.me/${counselor.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors"
                            title={`Chat WhatsApp ${counselor.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline">Chat Guru BK</span>
                          </a>
                        )}
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                          title={isCollapsed ? 'Buka rincian kelas' : 'Tutup rincian kelas'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Class Table Body */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-3.5 px-4">Waktu & Tanggal</th>
                            <th className="py-3.5 px-4">Siswa</th>
                            <th className="py-3.5 px-4">Keperluan</th>
                            <th className="py-3.5 px-4">Guru BK</th>
                            <th className="py-3.5 px-4">Ringkasan Topik</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-center no-print">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {classRecords.map((r) => {
                            const isPengaduan = r.serviceType === 'pengaduan';
                            return (
                              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                                  <div className="font-semibold text-slate-800">
                                    {formatShortDate(r.timestamp)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    ID: {r.id.substring(0, 8)}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {r.studentPhoto && (
                                      <img
                                        src={r.studentPhoto}
                                        alt={r.studentName}
                                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                                      />
                                    )}
                                    <div>
                                      <div className="font-extrabold text-slate-900">{highlightMatch(r.studentName, searchTerm)}</div>
                                      {r.studentWhatsapp && (
                                        <a
                                          href={`https://wa.me/${r.studentWhatsapp.replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline mt-0.5"
                                        >
                                          <Phone className="w-3 h-3" />
                                          {r.studentWhatsapp}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {isPengaduan ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                      Pengaduan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      Konseling
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-800">{r.assignedTeacherName}</div>
                                </td>
                                <td className="py-3.5 px-4 max-w-xs">
                                  <p className="line-clamp-2 text-slate-600 text-xs">
                                    {r.notes || <em className="text-slate-400">Tidak ada catatan awal</em>}
                                  </p>
                                  {r.followUpNotes && (
                                    <p className="line-clamp-1 text-emerald-800 font-semibold text-[11px] mt-0.5">
                                      ↳ Tindak Lanjut: {r.followUpNotes}
                                    </p>
                                  )}
                                  {r.satisfaction && (
                                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                      <span>{r.satisfaction.rating}/5 • {r.satisfaction.comfortLevel}</span>
                                    </div>
                                  )}
                                  {r.counselorNotes?.trim() && (
                                    <div className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 no-print">
                                      <Lock className="w-3 h-3 text-emerald-700" />
                                      <span>Catatan Privat</span>
                                    </div>
                                  )}
                                  {r.mood && (() => {
                                    const moodMeta = getMoodMeta(r.mood);
                                    if (!moodMeta) return null;
                                    return (
                                      <div className={`inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-md border text-[10px] font-bold no-print ${moodMeta.badgeClass}`}>
                                        <span>{moodMeta.emoji}</span>
                                        <span>{moodMeta.label}</span>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={r.status}
                                      onChange={(e) => handleStatusChange(r.id, e.target.value as VisitorStatus)}
                                      className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-hidden transition-colors cursor-pointer ${
                                        r.status === 'Selesai'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : r.status === 'Sedang Ditangani'
                                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                                          : 'bg-amber-50 text-amber-800 border-amber-300'
                                      }`}
                                    >
                                      <option value="Menunggu">Menunggu (Pending)</option>
                                      <option value="Sedang Ditangani">Sedang Ditangani (Processed)</option>
                                      <option value="Selesai">Selesai (Closed)</option>
                                    </select>
                                    {/* Quick Status Workflow Action Button */}
                                    {r.status === 'Menunggu' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(r.id, 'Sedang Ditangani')}
                                        className="p-1 px-1.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                        title="Ubah status ke Sedang Ditangani (Processed)"
                                      >
                                        <span>Proses</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {r.status === 'Sedang Ditangani' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(r.id, 'Selesai')}
                                        className="p-1 px-1.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                        title="Tandai kasus Selesai (Closed)"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Selesai</span>
                                      </button>
                                    )}
                                    {r.status === 'Selesai' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(r.id, 'Sedang Ditangani')}
                                        className="p-1 px-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                        title="Buka kembali kasus (Reopen to Processed)"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                  {(() => {
                                    const fu = getFollowUpStatus(r);
                                    if (!fu.needed) return null;
                                    return (
                                      <div
                                        className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-extrabold text-rose-700 no-print"
                                        title={`Belum ada pembaruan status selama ${fu.daysStale} hari`}
                                      >
                                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span>Follow-up Needed ({fu.daysStale}h)</span>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDetail(r)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                      title="Buka Detail & Tindak Lanjut"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {r.studentWhatsapp && (
                                      <a
                                        href={`https://wa.me/${r.studentWhatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-800 transition-colors"
                                        title="Chat WhatsApp Siswa"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(r.id, r.studentName)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                      title="Hapus Rekapan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Main Table Records (Flat Table View) */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Waktu & Tanggal</th>
                  <th className="py-3.5 px-4">Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Keperluan</th>
                  <th className="py-3.5 px-4">Guru BK</th>
                  <th className="py-3.5 px-4">Ringkasan Topik</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Tidak Ditemukan Siswa yang Sesuai
                        </h4>
                        <p className="text-xs text-slate-500">
                          {searchTerm
                            ? `Pencarian kata kunci "${searchTerm}" tidak menemukan data siswa yang cocok.`
                            : 'Tidak ada data siswa yang cocok dengan filter kelas atau status yang dipilih.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <FilterX className="w-3.5 h-3.5" />
                          <span>Reset Semua Filter & Pencarian</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isPengaduan = r.serviceType === 'pengaduan';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Waktu */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {formatShortDate(r.timestamp)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: {r.id.substring(0, 8)}
                          </div>
                        </td>

                        {/* Siswa */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {r.studentPhoto && (
                              <img
                                src={r.studentPhoto}
                                alt={r.studentName}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                              />
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900">
                                {highlightMatch(r.studentName, searchTerm)}
                              </div>
                              {r.studentWhatsapp && (
                                <a
                                  href={`https://wa.me/${r.studentWhatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  {r.studentWhatsapp}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kelas - Clickable badge for instant filter! */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setFilterClass(r.studentClass)}
                            className="font-black px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-800 text-xs transition-all cursor-pointer flex items-center gap-1"
                            title={`Klik untuk filter hanya Kelas ${r.studentClass}`}
                          >
                            <span>{highlightMatch(r.studentClass, searchTerm)}</span>
                          </button>
                        </td>

                        {/* Keperluan */}
                        <td className="py-3.5 px-4">
                          {isPengaduan ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Pengaduan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Konseling
                            </span>
                          )}
                        </td>

                        {/* Guru BK */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{r.assignedTeacherName}</div>
                        </td>

                        {/* Ringkasan Topik */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-600 text-xs">
                            {r.notes || <em className="text-slate-400">Tidak ada catatan awal</em>}
                          </p>
                          {r.followUpNotes && (
                            <p className="line-clamp-1 text-emerald-800 font-semibold text-[11px] mt-0.5">
                              ↳ Tindak Lanjut: {r.followUpNotes}
                            </p>
                          )}
                          {r.satisfaction && (
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{r.satisfaction.rating}/5 • {r.satisfaction.comfortLevel}</span>
                            </div>
                          )}
                          {r.counselorNotes?.trim() && (
                            <div className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 no-print">
                              <Lock className="w-3 h-3 text-emerald-700" />
                              <span>Catatan Privat</span>
                            </div>
                          )}
                          {r.mood && (() => {
                            const moodMeta = getMoodMeta(r.mood);
                            if (!moodMeta) return null;
                            return (
                              <div className={`inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-md border text-[10px] font-bold no-print ${moodMeta.badgeClass}`}>
                                <span>{moodMeta.emoji}</span>
                                <span>{moodMeta.label}</span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={r.status}
                              onChange={(e) => handleStatusChange(r.id, e.target.value as VisitorStatus)}
                              className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-hidden transition-colors cursor-pointer ${
                                r.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : r.status === 'Sedang Ditangani'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Menunggu">Menunggu (Pending)</option>
                              <option value="Sedang Ditangani">Sedang Ditangani (Processed)</option>
                              <option value="Selesai">Selesai (Closed)</option>
                            </select>
                            {/* Quick Status Workflow Action Button */}
                            {r.status === 'Menunggu' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.id, 'Sedang Ditangani')}
                                className="p-1 px-1.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                title="Ubah status ke Sedang Ditangani (Processed)"
                              >
                                <span>Proses</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {r.status === 'Sedang Ditangani' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.id, 'Selesai')}
                                className="p-1 px-1.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                title="Tandai kasus Selesai (Closed)"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>Selesai</span>
                              </button>
                            )}
                            {r.status === 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(r.id, 'Sedang Ditangani')}
                                className="p-1 px-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer no-print"
                                title="Buka kembali kasus (Reopen to Processed)"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          {(() => {
                            const fu = getFollowUpStatus(r);
                            if (!fu.needed) return null;
                            return (
                              <div
                                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-extrabold text-rose-700 no-print"
                                title={`Belum ada pembaruan status selama ${fu.daysStale} hari`}
                              >
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Follow-up Needed ({fu.daysStale}h)</span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(r)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Buka Detail & Tindak Lanjut"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {r.studentWhatsapp && (
                              <a
                                href={`https://wa.me/${r.studentWhatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-800 transition-colors"
                                title="Chat WhatsApp Siswa"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(r.id, r.studentName)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Hapus Rekapan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Signatures (Visible only when printing) */}
      <div className="hidden print-only mt-10 pt-4 text-xs print-avoid-break">
        <div className="flex justify-between items-start text-center">
          <div className="w-72">
            <p className="text-slate-700">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala Madrasah</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">___________________________</p>
            <p className="text-[10px] text-slate-600 mt-1">NIP. .....................................................</p>
          </div>

          <div className="w-72">
            <p className="text-slate-700">Madrasah, {formatIndonesianDate(new Date().toISOString())}</p>
            <p className="font-bold text-slate-900">
              {filterTeacher !== 'all' ? selectedTeacherObj?.name || 'Guru BK Madrasah' : 'Guru / Koordinator BK'}
            </p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">___________________________</p>
            <p className="text-[10px] text-slate-600 mt-1">NIP. .....................................................</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: DETAIL & TINDAK LANJUT SISWA */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedRecord.studentPhoto ? (
                  <img
                    src={selectedRecord.studentPhoto}
                    alt={selectedRecord.studentName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    {selectedRecord.studentClass}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedRecord.studentName}
                    </h3>
                    {selectedRecord.studentPhoto && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                        {selectedRecord.studentClass}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Waktu Input: {formatIndonesianDate(selectedRecord.timestamp)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block mb-1">Keperluan Layanan:</span>
                <span className="font-extrabold text-slate-900 capitalize">
                  {selectedRecord.serviceType}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block mb-1">Guru BK Dituju:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedRecord.assignedTeacherName}
                </span>
              </div>
              {selectedRecord.mood && (() => {
                const moodMeta = getMoodMeta(selectedRecord.mood);
                if (!moodMeta) return null;
                return (
                  <div className={`p-3 rounded-xl border col-span-2 flex items-center justify-between ${moodMeta.badgeClass}`}>
                    <span className="font-bold">Suasana Hati Siswa Saat Mengisi:</span>
                    <span className="font-extrabold flex items-center gap-1.5 text-sm">
                      <span>{moodMeta.emoji}</span>
                      <span>{moodMeta.label}</span>
                    </span>
                  </div>
                );
              })()}
              {selectedRecord.studentWhatsapp && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Kontak WA Siswa:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedRecord.studentWhatsapp}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedRecord.studentWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    Chat Siswa
                  </a>
                </div>
              )}
            </div>

            {/* Student's initial note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pesan / Keluhan Awal dari Siswa:
              </label>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap italic">
                {selectedRecord.notes ? `"${selectedRecord.notes}"` : 'Tidak menyertakan catatan pesan awal.'}
              </div>
            </div>

            {/* Student's Session Satisfaction Survey */}
            {selectedRecord.satisfaction && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    Hasil Survei Kepuasan Sesi Siswa
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-[11px] font-black text-amber-800">
                    {selectedRecord.satisfaction.rating}/5 Bintang
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-700">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-200/80 font-semibold">
                    Kenyamanan: <strong>{selectedRecord.satisfaction.comfortLevel}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-200/80 font-semibold">
                    Akses Layanan: <strong>{selectedRecord.satisfaction.easeOfAccess}</strong>
                  </span>
                </div>
                {selectedRecord.satisfaction.feedback && (
                  <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-amber-100">
                    "{selectedRecord.satisfaction.feedback}"
                  </p>
                )}
              </div>
            )}

            {/* Update Status & Counselor Follow-Up Notes */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ubah Status Penanganan Kasus:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'Menunggu' as VisitorStatus, label: 'Menunggu (Pending)', desc: 'Perlu Respon Awal' },
                    { value: 'Sedang Ditangani' as VisitorStatus, label: 'Sedang Ditangani (Processed)', desc: 'Konseling Berjalan' },
                    { value: 'Selesai' as VisitorStatus, label: 'Selesai (Closed)', desc: 'Kasus Tuntas' },
                  ].map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setEditStatus(st.value)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                        editStatus === st.value
                          ? st.value === 'Selesai'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                            : st.value === 'Sedang Ditangani'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300'
                            : 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">{st.label}</div>
                      <div className={`text-[10px] font-normal mt-0.5 ${editStatus === st.value ? 'text-white/80' : 'text-slate-500'}`}>
                        {st.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Tindak Lanjut Guru BK (Ringkasan Laporan):
                </label>
                <textarea
                  rows={3}
                  value={editFollowUp}
                  onChange={(e) => setEditFollowUp(e.target.value)}
                  placeholder="Tuliskan hasil konseling, tindakan mediasi, tanggal pemanggilan, atau solusi yang telah disepakati..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/[0.03] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Catatan Privat Guru BK (Log Progres Sesi)</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                    Privat • Tidak Tercetak di Laporan
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={editCounselorNotes}
                  onChange={(e) => setEditCounselorNotes(e.target.value)}
                  placeholder="Catat perkembangan psikologis siswa, observasi khusus, rencana sesi lanjutan, atau catatan rahasia konselor..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFollowUp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Penanganan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH KUNJUNGAN MANUAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Tambah Rekap Kunjungan Manual
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Contoh: Rian Hidayat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={manualClass}
                    onChange={(e) => setManualClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keperluan</label>
                  <select
                    value={manualService}
                    onChange={(e) => setManualService(e.target.value as ServiceType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="konseling">Konseling</option>
                    <option value="pengaduan">Pengaduan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Guru BK yang Menangani
                </label>
                <select
                  value={manualTeacher}
                  onChange={(e) => setManualTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {COUNSELORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.classes.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. WhatsApp Siswa (Opsional)
                </label>
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Topik / Masalah
                </label>
                <textarea
                  rows={3}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ringkasan konsultasi tatap muka di ruang BK..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GANTI PIN GURU BK */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Ganti PIN Keamanan Guru BK
              </h3>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinChangeMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  pinChangeMsg.isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {pinChangeMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Lama</label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Masukkan PIN saat ini"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN Baru (Minimal 4 angka/karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Masukkan PIN baru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Perbarui PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EKSPOR LAPORAN KE EXCEL ATAU CSV */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Ekspor Rekapitulasi Data Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unduh data kunjungan Ruang Cerita untuk pelaporan offline madrasah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan 1: Format Berkas */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">1. Pilih Format Berkas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Excel Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportFormat === 'excel'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Microsoft Excel (.xls)
                    </span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Rapi dengan kop resmi madrasah, gridlines tabel, dan warna status otomatis.
                  </p>
                </button>

                {/* CSV Option */}
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    exportFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-slate-600" />
                      Format CSV (.csv)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Universal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Teks terpisah koma dengan UTF-8 BOM, kompatibel dengan Google Sheets & aplikasi lain.
                  </p>
                </button>
              </div>
            </div>

            {/* Pilihan 2: Cakupan Data */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">2. Pilih Cakupan Data</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportScope('current')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportScope === 'current'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-0.5">
                    Tabel Saat Ini ({filteredRecords.length} Siswa)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hanya data yang sesuai hasil pencarian dan filter kelas yang aktif saat ini.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportScope === 'all'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-0.5">
                    Semua Data ({records.length} Siswa)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Seluruh riwayat kunjungan dari awal tanpa mempedulikan filter aktif.
                  </p>
                </button>
              </div>
            </div>

            {/* Active Filter Summary Box if Current Scope */}
            {exportScope === 'current' && hasActiveFilters && (
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                  <Filter className="w-3 h-3 text-amber-600" />
                  Kriteria Filter Aktif:
                </span>
                <p className="text-[11px] text-amber-800">
                  {getFilterDescription()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  Unduh Berkas {exportFormat === 'excel' ? 'Excel (.xls)' : 'CSV (.csv)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PRATINJAU & CETAK LAPORAN REKAPITULASI RESMI */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto print-modal-overlay">
          <div className="bg-white rounded-3xl max-w-5xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[94vh] print-modal-content">
            {/* Modal Header & Quick Actions Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 no-print space-y-3 bg-slate-50/90 rounded-t-3xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                    <Printer className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Cetak Laporan Rekapitulasi Siswa
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pratinjau lembar cetak fisik resmi layanan Bimbingan & Konseling madrasah
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer self-end sm:self-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scope & Print Action Buttons Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
                {/* Scope selector */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Cakupan Data:</span>
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPrintScope('current')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printScope === 'current'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tabel Saat Ini ({filteredRecords.length} Siswa)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintScope('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printScope === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Data ({records.length} Siswa)
                    </button>
                  </div>
                </div>

                {/* Print Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF()}
                    disabled={isGeneratingPdf}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    title="Unduh dokumen laporan langsung sebagai file PDF"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteBrowserPrint}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                    title="Buka dialog cetak browser langsung (Ctrl+P)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Print / PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPrintTab}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    title="Buka di jendela baru tanpa batasan iframe"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Buka Jendela Cetak</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPrintFile}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    title="Unduh berkas cetak mandiri (.html) siap dibuka & dicetak kapan saja"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span className="hidden sm:inline">Unduh Berkas Cetak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingKop(!isEditingKop)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold border shadow-2xs transition-colors cursor-pointer ${
                      isEditingKop
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                    title="Ubah Logo Kiri/Kanan dan Teks Header Kop Surat"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>{isEditingKop ? 'Tutup Pengaturan Kop' : 'Atur Kop Surat & Logo'}</span>
                  </button>
                </div>
              </div>

              {/* Pengaturan Kop Surat Panel (Logo Kiri, Logo Kanan, & Edit Header) */}
              {isEditingKop && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Settings2 className="w-4 h-4 text-emerald-600" />
                        Pengaturan Kop Surat &amp; Logo Madrasah
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Perubahan langsung tersimpan otomatis dan diterapkan ke pratinjau maupun hasil cetak.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetLetterhead}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer self-start"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset ke Default
                    </button>
                  </div>

                  {/* Upload Logo Kiri & Logo Kanan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Logo Kiri */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                          Logo Kiri (Instansi / Kemenag)
                        </span>
                        {letterhead.leftLogoUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateLetterhead('leftLogoUrl', '')}
                            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {letterhead.leftLogoUrl ? (
                            <img src={letterhead.leftLogoUrl} alt="Logo Kiri" className="max-h-12 max-w-12 object-contain" />
                          ) : (
                            <span className="text-[10px] text-slate-400 text-center px-1">Kosong</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer">
                            <ImagePlus className="w-3.5 h-3.5" />
                            <span>Unggah Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload('leftLogoUrl', file);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={letterhead.leftLogoUrl.startsWith('data:') ? '' : letterhead.leftLogoUrl}
                            onChange={(e) => handleUpdateLetterhead('leftLogoUrl', e.target.value)}
                            placeholder="Atau tempel URL gambar logo..."
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Kanan */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                          Logo Kanan (Madrasah / BK)
                        </span>
                        {letterhead.rightLogoUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateLetterhead('rightLogoUrl', '')}
                            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {letterhead.rightLogoUrl ? (
                            <img src={letterhead.rightLogoUrl} alt="Logo Kanan" className="max-h-12 max-w-12 object-contain" />
                          ) : (
                            <span className="text-[10px] text-slate-400 text-center px-1">Kosong</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer">
                            <ImagePlus className="w-3.5 h-3.5" />
                            <span>Unggah Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload('rightLogoUrl', file);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={letterhead.rightLogoUrl.startsWith('data:') ? '' : letterhead.rightLogoUrl}
                            onChange={(e) => handleUpdateLetterhead('rightLogoUrl', e.target.value)}
                            placeholder="Atau tempel URL gambar logo..."
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Header Lines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Baris 1 (Instansi Atas)</label>
                      <input
                        type="text"
                        value={letterhead.line1}
                        onChange={(e) => handleUpdateLetterhead('line1', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Baris 2 (Kantor Wilayah / Kab)</label>
                      <input
                        type="text"
                        value={letterhead.line2}
                        onChange={(e) => handleUpdateLetterhead('line2', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Baris 3 (Nama Madrasah - Tebal)</label>
                      <input
                        type="text"
                        value={letterhead.line3}
                        onChange={(e) => handleUpdateLetterhead('line3', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Baris 4 (Unit Layanan)</label>
                      <input
                        type="text"
                        value={letterhead.line4}
                        onChange={(e) => handleUpdateLetterhead('line4', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Baris 5 (Alamat / Slogan)</label>
                      <input
                        type="text"
                        value={letterhead.line5}
                        onChange={(e) => handleUpdateLetterhead('line5', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Dokumen Laporan</label>
                      <input
                        type="text"
                        value={letterhead.docTitle}
                        onChange={(e) => handleUpdateLetterhead('docTitle', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Informative tips */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Solusi Cetak Aman:</strong> Jika browser menahan jendela cetak karena pembatasan iframe, gunakan tombol <strong>"Buka Jendela Cetak"</strong> atau <strong>"Unduh Berkas Cetak"</strong> agar langsung terhubung ke printer atau disimpan sebagai PDF.
                </span>
              </div>
            </div>

            {/* Document Paper Preview Sheet */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
              <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-300 max-w-4xl mx-auto space-y-5 text-slate-900 font-serif print:shadow-none print:border-none print:p-0">
                {/* Kop Surat Madrasah */}
                <div className="flex items-center justify-between gap-4 font-sans">
                  {(letterhead.leftLogoUrl || letterhead.rightLogoUrl) && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                      {letterhead.leftLogoUrl && (
                        <img src={letterhead.leftLogoUrl} alt="Logo Kiri" className="max-h-16 sm:max-h-20 max-w-full object-contain" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 text-center space-y-0.5">
                    {letterhead.line1 && (
                      <p className="text-[10pt] font-semibold tracking-wider uppercase text-slate-800">
                        {letterhead.line1}
                      </p>
                    )}
                    {letterhead.line2 && (
                      <p className="text-[9.5pt] font-medium tracking-wide uppercase text-slate-700">
                        {letterhead.line2}
                      </p>
                    )}
                    {letterhead.line3 && (
                      <p className="text-[13pt] font-black tracking-wide uppercase text-slate-900">
                        {letterhead.line3}
                      </p>
                    )}
                    {letterhead.line4 && (
                      <p className="text-[9.5pt] font-extrabold text-emerald-800 tracking-wide uppercase">
                        {letterhead.line4}
                      </p>
                    )}
                    {letterhead.line5 && (
                      <p className="text-[8pt] text-slate-500 italic">
                        {letterhead.line5}
                      </p>
                    )}
                  </div>
                  {(letterhead.leftLogoUrl || letterhead.rightLogoUrl) && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                      {letterhead.rightLogoUrl && (
                        <img src={letterhead.rightLogoUrl} alt="Logo Kanan" className="max-h-16 sm:max-h-20 max-w-full object-contain" />
                      )}
                    </div>
                  )}
                </div>

                {/* Double Border Separator */}
                <div className="border-t-2 border-b border-black h-1" />

                {/* Judul Dokumen */}
                <div className="text-center space-y-1 font-sans">
                  <h2 className="text-[12pt] font-black uppercase tracking-wide text-slate-900">
                    {letterhead.docTitle}
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-between items-center text-[8pt] text-slate-600 border-b border-slate-300 pb-2">
                    <span>
                      <strong>Waktu Cetak:</strong> {formatIndonesianDate(new Date().toISOString())}
                    </span>
                    <span>
                      <strong>Jumlah Data:</strong>{' '}
                      {(printScope === 'current' ? filteredRecords : records).length} Siswa Terdata
                    </span>
                    <span>
                      <strong>Kriteria Laporan:</strong>{' '}
                      {printScope === 'current' ? getFilterDescription() : 'Semua Data Rekapan'}
                    </span>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto font-sans">
                  <table className="w-full border-collapse text-[8.5pt]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[7.5pt]">
                        <th className="border border-slate-600 p-2 text-center w-8">No</th>
                        <th className="border border-slate-600 p-2 text-left w-28">Waktu & Tanggal</th>
                        <th className="border border-slate-600 p-2 text-left w-36">Nama Siswa</th>
                        <th className="border border-slate-600 p-2 text-center w-14">Kelas</th>
                        <th className="border border-slate-600 p-2 text-center w-24">Keperluan</th>
                        <th className="border border-slate-600 p-2 text-left w-32">Guru BK</th>
                        <th className="border border-slate-600 p-2 text-left w-24">No WhatsApp</th>
                        <th className="border border-slate-600 p-2 text-center w-20">Status</th>
                        <th className="border border-slate-600 p-2 text-left">Topik / Catatan Siswa</th>
                        <th className="border border-slate-600 p-2 text-left">Tindak Lanjut Guru BK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(printScope === 'current' ? filteredRecords : records).length === 0 ? (
                        <tr>
                          <td colSpan={10} className="border border-slate-600 p-6 text-center text-slate-400">
                            Tidak ada rekapan data siswa untuk dicetak.
                          </td>
                        </tr>
                      ) : (
                        (printScope === 'current' ? filteredRecords : records).map((r, idx) => (
                          <tr key={r.id}>
                            <td className="border border-slate-600 p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-600 p-2 whitespace-nowrap">{formatShortDate(r.timestamp)}</td>
                            <td className="border border-slate-600 p-2 font-bold">{r.studentName}</td>
                            <td className="border border-slate-600 p-2 text-center font-bold">{r.studentClass}</td>
                            <td className="border border-slate-600 p-2 text-center font-bold text-[8pt]">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm ${
                                  r.serviceType === 'pengaduan'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}
                              >
                                {r.serviceType === 'pengaduan' ? 'PENGADUAN' : 'KONSELING'}
                              </span>
                            </td>
                            <td className="border border-slate-600 p-2">{r.assignedTeacherName}</td>
                            <td className="border border-slate-600 p-2">{r.studentWhatsapp || '-'}</td>
                            <td className="border border-slate-600 p-2 text-center font-semibold text-[8pt]">
                              {r.status}
                            </td>
                            <td className="border border-slate-600 p-2 max-w-xs break-words">{r.notes || '-'}</td>
                            <td className="border border-slate-600 p-2 max-w-xs break-words">{r.followUpNotes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Area */}
                <div className="flex justify-between items-start pt-6 text-[9.5pt] font-sans print-avoid-break">
                  <div className="w-64 text-center">
                    <p>Mengetahui,</p>
                    <p className="font-bold">Kepala Madrasah</p>
                    <div className="h-20" />
                    <p className="font-bold underline">___________________________</p>
                    <p className="text-[8pt] text-slate-600 mt-1">NIP. .....................................................</p>
                  </div>

                  <div className="w-64 text-center">
                    <p>Madrasah, {formatIndonesianDate(new Date().toISOString())}</p>
                    <p className="font-bold">
                      {filterTeacher !== 'all' ? selectedTeacherObj?.name || 'Guru BK Madrasah' : 'Koordinator / Guru BK'}
                    </p>
                    <div className="h-20" />
                    <p className="font-bold underline">___________________________</p>
                    <p className="text-[8pt] text-slate-600 mt-1">NIP. .....................................................</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Close Button */}
            <div className="p-3 border-t border-slate-200 no-print flex justify-end bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DATABASE DAFTAR SISWA (UPLOAD CSV UNTUK AUTO-FILL) */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                  <Users2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Database Daftar Siswa Madrasah (CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah file CSV berisi nama &amp; kelas siswa agar formulir pengunjung dapat mengisi otomatis (auto-fill).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Upload & Template Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 block">1. Unggah File CSV (.csv)</span>
                    <span className="text-[11px] text-slate-500">
                      Format kolom: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">Nama Siswa, Kelas</code> (pemisah koma atau titik koma).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadRosterTemplateCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] cursor-pointer self-start"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unduh Contoh Template CSV</span>
                  </button>
                </div>

                {/* Import Mode */}
                {roster.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600">Mode Impor:</span>
                    <button
                      type="button"
                      onClick={() => setRosterImportMode('merge')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        rosterImportMode === 'merge'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Gabungkan dengan Data Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterImportMode('replace')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        rosterImportMode === 'replace'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Ganti Seluruh Data Lama
                    </button>
                  </div>
                )}

                <label className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-emerald-600" />
                  <span className="font-extrabold text-xs sm:text-sm">Klik di sini untuk memilih file CSV siswa</span>
                  <span className="text-[11px] text-emerald-700">Mendukung ekspor CSV dari Excel / Google Sheets</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRosterFileUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>

                {rosterFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold border ${
                      rosterFeedback.isError
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {rosterFeedback.text}
                  </div>
                )}
              </div>

              {/* Roster List Preview */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-800">
                    Daftar Siswa Tersimpan ({roster.length} Siswa)
                  </span>
                  <div className="flex items-center gap-2">
                    {roster.length > 0 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={(e) => setRosterSearch(e.target.value)}
                          placeholder="Cari nama/kelas..."
                          className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    )}
                    {roster.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearRoster}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                {roster.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-slate-200 text-center text-slate-400 italic">
                    Belum ada daftar siswa yang diunggah. Unggah file CSV di atas untuk mengaktifkan auto-fill di formulir siswa.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr className="text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">Kelas</th>
                          <th className="py-2 px-3 text-right">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roster
                          .filter(
                            (r) =>
                              !rosterSearch.trim() ||
                              r.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                              r.studentClass.toLowerCase().includes(rosterSearch.toLowerCase())
                          )
                          .slice(0, 100)
                          .map((entry, idx) => (
                            <tr key={entry.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{entry.name}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                  {entry.studentClass}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRosterEntry(entry.id)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                  title="Hapus siswa ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: BACKUP & RESTORE DATABASE APLIKASI */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-indigo-100 text-indigo-800">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Backup &amp; Restore Database Aplikasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simpan salinan cadangan seluruh data aplikasi madrasah atau pulihkan dari file backup (.json).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Isi Database Saat Ini */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Data Kunjungan</span>
                <span className="text-lg font-black text-slate-900">{records.length}</span>
                <span className="text-[11px] text-slate-500 ml-1">rekaman</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Daftar Siswa</span>
                <span className="text-lg font-black text-slate-900">{roster.length}</span>
                <span className="text-[11px] text-slate-500 ml-1">siswa</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-500 block">Pengaturan</span>
                <span className="text-xs font-extrabold text-emerald-700">Kop Surat &amp; PIN BK</span>
              </div>
            </div>

            {/* Bagian 1: Unduh Backup */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950">
                  1. Unduh Cadangan Database (.JSON)
                </h4>
                <p className="text-[11px] text-indigo-800/80 mt-0.5">
                  Mencakup seluruh riwayat konseling/pengaduan (termasuk foto &amp; catatan privat), daftar siswa madrasah, kop surat, dan pengaturan PIN.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadDatabaseBackup();
                  setBackupFeedback({
                    text: 'File backup database (.json) berhasil diunduh ke perangkat Anda.',
                    isError: false,
                  });
                }}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Backup Database Sekarang (.JSON)</span>
              </button>
            </div>

            {/* Bagian 2: Restore Database */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  2. Pulihkan (Restore) dari File Backup
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih file <code className="bg-white px-1 py-0.5 rounded border border-slate-200">.json</code> hasil backup Ruang Cerita untuk memulihkan data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Mode Restore:</span>
                <button
                  type="button"
                  onClick={() => setBackupRestoreMode('replace')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    backupRestoreMode === 'replace'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Ganti Semua Data
                </button>
                <button
                  type="button"
                  onClick={() => setBackupRestoreMode('merge')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    backupRestoreMode === 'merge'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Gabungkan Data Baru
                </button>
              </div>

              <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span className="font-extrabold text-xs">Klik untuk memilih file backup (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const text = typeof reader.result === 'string' ? reader.result : '';
                      const result = restoreDatabaseBackup(text, backupRestoreMode);
                      setBackupFeedback({ text: result.message, isError: !result.success });
                      if (result.success) {
                        onRecordsChange(getVisitorRecords());
                        setRoster(getStudentRoster());
                        setLetterhead(getLetterheadConfig());
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>

              {backupFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    backupFeedback.isError
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {backupFeedback.text}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON: ATUR FOKUS KONSELING HARIAN */}
      <button
        type="button"
        onClick={() => {
          setGoalThemeInput(dailyGoal.themeTitle);
          setGoalNotesInput(dailyGoal.focusNotes);
          setGoalTargetInput(dailyGoal.targetSessions);
          setIsFocusModalOpen(true);
        }}
        className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer group"
        title="Atur Fokus Konseling Hari Ini untuk ditampilkan di Formulir Siswa"
      >
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4 text-white" />
        </span>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          Fokus Konseling
        </span>
      </button>

      {/* MODAL 8: ATUR FOKUS KONSELING HARIAN (TAMPIL DI BANNER FORMULIR SISWA) */}
      {isFocusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Fokus Konseling Hari Ini
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tema ini akan tampil sebagai banner penyemangat di bagian atas Formulir Siswa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFocusModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pilih Tema Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    title: 'Membangun Empati (Empathy Building)',
                    note: 'Yuk saling memahami perasaan teman dan ciptakan suasana madrasah yang hangat serta saling mendukung.',
                  },
                  {
                    title: 'Mengatasi Stres Ujian (Exam Stress)',
                    note: 'Merasa cemas menghadapi ujian itu wajar. Guru BK siap mendengarkan dan membantu mengatur strategi belajarmu.',
                  },
                  {
                    title: 'Pekan Anti-Perundungan (Anti-Bullying Week)',
                    note: 'Kamu berhak merasa aman di madrasah. Jangan ragu bercerita jika mengalami atau melihat perundungan.',
                  },
                  {
                    title: 'Pertemanan Sehat & Adaptasi Sosial',
                    note: 'Butuh teman diskusi soal pergaulan atau komunikasi dengan teman sekelas? Kami siap mendengarkan.',
                  },
                ].map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      setGoalThemeInput(preset.title);
                      setGoalNotesInput(preset.note);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      goalThemeInput === preset.title
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Fokus Konseling <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={goalThemeInput}
                  onChange={(e) => setGoalThemeInput(e.target.value)}
                  placeholder="Contoh: Membangun Empati / Manajemen Stres Ujian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Dukungan untuk Siswa
                </label>
                <textarea
                  rows={3}
                  value={goalNotesInput}
                  onChange={(e) => setGoalNotesInput(e.target.value)}
                  placeholder="Tulis kalimat hangat yang tampil di banner atas formulir siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFocusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!goalThemeInput.trim()}
                onClick={() => {
                  const updated = saveDailyCounselingGoal({
                    ...dailyGoal,
                    dateKey: new Date().toISOString().slice(0, 10),
                    themeTitle: goalThemeInput.trim(),
                    focusNotes: goalNotesInput.trim(),
                    targetSessions: Math.max(1, Number(goalTargetInput) || dailyGoal.targetSessions || 5),
                  });
                  setDailyGoal(updated);
                  if (auth.currentUser) {
                    saveSettingToFirestore('dailyGoal', updated as unknown as Record<string, unknown>).catch(() => {});
                  }
                  setIsFocusModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                Simpan &amp; Tampilkan di Formulir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan QR Code */}
      {isQrSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Pengaturan QR Code Aplikasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur tautan tujuan, label madrasah, instruksi scan, dan warna QR Code untuk siswa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrSettingsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
              {/* Live QR Preview */}
              <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white border border-emerald-200 p-4 flex flex-col items-center text-center space-y-3">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  {qrSettingsDraft.schoolLabel || 'Ruang Cerita Madrasah'}
                </span>
                <div className="p-2.5 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                  <QRCodeCanvas
                    value={qrSettingsDraft.targetUrl.trim() || getDefaultQRUrl()}
                    size={164}
                    bgColor="#ffffff"
                    fgColor={qrSettingsDraft.fgColor || '#0f172a'}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-[11px] font-semibold text-emerald-900 leading-snug">
                  {qrSettingsDraft.instruction || 'Arahkan kamera HP siswa ke QR Code di atas'}
                </p>
              </div>

              {/* Form Settings */}
              <div className="md:col-span-3 space-y-3.5">
                {qrSettingsDraft.targetUrl.includes('://ais-dev-') && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-semibold leading-snug">
                        Tautan <code className="font-mono">ais-dev-</code> bersifat privat. Ubah ke tautan publik agar siswa bisa memindai.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setQrSettingsDraft((prev) => ({
                            ...prev,
                            targetUrl: prev.targetUrl.replace('://ais-dev-', '://ais-pre-'),
                          }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Ubah ke Tautan Publik (ais-pre)
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Tautan Tujuan QR Code <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQrSettingsDraft((prev) => ({
                          ...prev,
                          targetUrl: getDefaultQRUrl(),
                        }))
                      }
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Gunakan URL Default
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={qrSettingsDraft.targetUrl}
                      onChange={(e) =>
                        setQrSettingsDraft((prev) => ({ ...prev, targetUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <a
                      href={qrSettingsDraft.targetUrl.trim() || getDefaultQRUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
                      title="Uji buka tautan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul / Nama Madrasah
                  </label>
                  <input
                    type="text"
                    value={qrSettingsDraft.schoolLabel}
                    onChange={(e) =>
                      setQrSettingsDraft((prev) => ({ ...prev, schoolLabel: e.target.value }))
                    }
                    placeholder="Contoh: Ruang Cerita MTsN 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subjudul Poster QR
                  </label>
                  <input
                    type="text"
                    value={qrSettingsDraft.subtitle}
                    onChange={(e) =>
                      setQrSettingsDraft((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Pintu Aman Pengaduan & Konseling Siswa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teks Instruksi Scan
                  </label>
                  <input
                    type="text"
                    value={qrSettingsDraft.instruction}
                    onChange={(e) =>
                      setQrSettingsDraft((prev) => ({ ...prev, instruction: e.target.value }))
                    }
                    placeholder="Arahkan kamera HP siswa ke QR Code di atas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Warna Kode QR
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: 'Hitam Slate', hex: '#0f172a' },
                      { label: 'Hijau Madrasah', hex: '#065f46' },
                      { label: 'Biru Navy', hex: '#1e3a8a' },
                    ].map((opt) => (
                      <button
                        key={opt.hex}
                        type="button"
                        onClick={() =>
                          setQrSettingsDraft((prev) => ({ ...prev, fgColor: opt.hex }))
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          qrSettingsDraft.fgColor === opt.hex
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: opt.hex }}
                        />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {qrSavedFeedback && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pengaturan QR Code berhasil disimpan dan langsung diterapkan.</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const reset = resetQRSettings();
                  setQrSettingsDraft(reset);
                  setQrSavedFeedback(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const saved = saveQRSettings(qrSettingsDraft);
                    setQrSettingsDraft(saved);
                    if (auth.currentUser) {
                      saveSettingToFirestore('qrConfig', saved as unknown as Record<string, unknown>).catch(() => {});
                    }
                    setQrSavedFeedback(true);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Pengaturan QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
