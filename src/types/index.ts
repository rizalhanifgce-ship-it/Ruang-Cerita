export type ServiceType = 'konseling' | 'pengaduan';

export interface TeacherBK {
  id: string;
  name: string;
  title: string;
  gender: 'female' | 'male';
  phoneDisplay: string;
  whatsappNumber: string; // raw formatted for wa.me/62...
  classes: string[];
  motto: string;
  description: string;
}

export type VisitorStatus = 'Menunggu' | 'Sedang Ditangani' | 'Selesai';

export type CounselorAvailabilityStatus = 'available' | 'busy';

export type StudentMood = 'senang' | 'tenang' | 'bingung' | 'cemas' | 'sedih' | 'marah';

export interface SessionSatisfaction {
  rating: number; // 1 to 5
  comfortLevel: 'Sangat Nyaman' | 'Nyaman' | 'Cukup' | 'Kurang Nyaman';
  easeOfAccess: 'Sangat Mudah' | 'Mudah' | 'Cukup' | 'Sulit';
  feedback?: string;
  submittedAt: string; // ISO string
}

export interface VisitorRecord {
  id: string;
  timestamp: string; // ISO string
  studentName: string;
  studentClass: string;
  serviceType: ServiceType;
  studentWhatsapp?: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  notes: string;
  studentPhoto?: string;
  mood?: StudentMood;
  status: VisitorStatus;
  followUpNotes?: string;
  counselorNotes?: string;
  handledAt?: string;
  satisfaction?: SessionSatisfaction;
}

export type ActiveTab = 'siswa' | 'guru-list' | 'pustaka' | 'refleksi' | 'napas' | 'syukur' | 'mood' | 'tidur' | 'panduan' | 'portal-bk';

export interface LetterheadConfig {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  docTitle: string;
  leftLogoUrl: string;
  rightLogoUrl: string;
}

export interface StudentRosterEntry {
  id: string;
  name: string;
  studentClass: string;
}

export interface DailyCounselingGoal {
  dateKey: string;
  themeTitle: string;
  focusNotes: string;
  targetSessions: number;
  completedSessions: number;
  updatedAt: string;
}

export type LibraryResourceCategory =
  | 'stres'
  | 'perundungan'
  | 'emosi'
  | 'belajar'
  | 'pertemanan'
  | 'umum';

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  category: LibraryResourceCategory;
  resourceType: 'pdf' | 'artikel';
  sourceType: 'upload' | 'link';
  urlOrData: string;
  fileName?: string;
  fileSizeBytes?: number;
  authorName: string;
  createdAt: string;
  downloadsCount?: number;
}
