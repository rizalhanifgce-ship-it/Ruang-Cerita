import {
  VisitorRecord,
  LetterheadConfig,
  StudentRosterEntry,
  CounselorAvailabilityStatus,
  DailyCounselingGoal,
  LibraryResource,
} from '../types';
import { getMoodMeta } from '../data/moods';

const STORAGE_KEY = 'ruang_cerita_visitors_v1';
const PIN_KEY = 'ruang_cerita_bk_pin_v1';
const LETTERHEAD_KEY = 'ruang_cerita_letterhead_v1';
const ROSTER_KEY = 'ruang_cerita_student_roster_v1';
const COUNSELOR_AVAILABILITY_KEY = 'ruang_cerita_counselor_availability_v1';
const DAILY_GOAL_KEY = 'ruang_cerita_daily_goal_v1';
const LIBRARY_KEY = 'ruang_cerita_library_resources_v1';
const DEFAULT_PIN = '1234';

export const DEFAULT_LETTERHEAD: LetterheadConfig = {
  line1: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  line2: 'KANTOR KEMENTERIAN AGAMA KABUPATEN / KOTA',
  line3: 'MADRASAH TSANAWIYAH — LAYANAN BIMBINGAN & KONSELING',
  line4: 'UNIT PELAYANAN SISWA (RUANG CERITA)',
  line5: 'Sistem Informasi Pengaduan & Konseling Siswa Terintegrasi Madrasah',
  docTitle: 'REKAPITULASI BUKU INDUK PENGADUAN & KONSELING SISWA',
  leftLogoUrl: '',
  rightLogoUrl: '',
};

// Sample initial data representing realistic madrasah counseling records across 7 days
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const INITIAL_RECORDS: VisitorRecord[] = [
  // H-0 (Hari Ini)
  {
    id: 'rec-001',
    timestamp: new Date(Date.now() - 2 * ONE_HOUR).toISOString(),
    studentName: 'Ahmad Fauzan',
    studentClass: '7B',
    serviceType: 'konseling',
    studentWhatsapp: '081234567801',
    assignedTeacherId: 'chol',
    assignedTeacherName: 'Bu Chol',
    notes: 'Merasa cemas menghadapi ujian tengah semester dan sulit mengatur jadwal belajar.',
    mood: 'cemas',
    status: 'Sedang Ditangani',
    followUpNotes: 'Sudah dijadwalkan sesi konseling individu di ruang BK hari ini jam istirahat kedua.',
  },
  {
    id: 'rec-002',
    timestamp: new Date(Date.now() - 4 * ONE_HOUR).toISOString(),
    studentName: 'Siti Rahmawati',
    studentClass: '8A',
    serviceType: 'pengaduan',
    studentWhatsapp: '085712345678',
    assignedTeacherId: 'anis',
    assignedTeacherName: 'Bu Anis',
    notes: 'Melaporkan perlakuan saling ejek dan pengucilan yang terjadi di grup pertemanan kelas.',
    mood: 'sedih',
    status: 'Menunggu',
    followUpNotes: 'Menunggu klarifikasi dengan ketua kelas dan wali kelas 8A.',
  },
  {
    id: 'rec-003',
    timestamp: new Date(Date.now() - 6 * ONE_HOUR).toISOString(),
    studentName: 'Muhammad Rizki',
    studentClass: '9C',
    serviceType: 'konseling',
    studentWhatsapp: '081999554453',
    assignedTeacherId: 'anis',
    assignedTeacherName: 'Bu Anis',
    notes: 'Ingin mendiskusikan target nilai asesmen madrasah dan persiapan masuk MAN Insan Cendekia.',
    mood: 'bingung',
    status: 'Menunggu',
    followUpNotes: '',
  },

  // H-1 (Kemarin)
  {
    id: 'rec-004',
    timestamp: new Date(Date.now() - 1 * ONE_DAY - 3 * ONE_HOUR).toISOString(),
    studentName: 'Bima Satria',
    studentClass: '9E',
    serviceType: 'konseling',
    studentWhatsapp: '087812984512',
    assignedTeacherId: 'puput',
    assignedTeacherName: 'Bu Puput',
    notes: 'Konsultasi pemilihan jurusan SMA/SMK dan bingung memilih antara IPA atau kejuruan Teknik.',
    mood: 'bingung',
    status: 'Selesai',
    followUpNotes: 'Telah diberikan tes inventori minat bakat dan konsultasi bersama orang tua.',
    satisfaction: {
      rating: 5,
      comfortLevel: 'Sangat Nyaman',
      easeOfAccess: 'Sangat Mudah',
      feedback: 'Bu Puput sangat ramah dan membantu saya menentukan pilihan jurusan dengan tenang.',
      submittedAt: new Date(Date.now() - 1 * ONE_DAY - 2 * ONE_HOUR).toISOString(),
    },
  },
  {
    id: 'rec-005',
    timestamp: new Date(Date.now() - 1 * ONE_DAY - 5 * ONE_HOUR).toISOString(),
    studentName: 'Nadia Putri',
    studentClass: '7C',
    serviceType: 'konseling',
    studentWhatsapp: '087703385285',
    assignedTeacherId: 'puput',
    assignedTeacherName: 'Bu Puput',
    notes: 'Masih merasa kesulitan beradaptasi dengan lingkungan baru madrasah dan teman sekelas.',
    mood: 'cemas',
    status: 'Sedang Ditangani',
    followUpNotes: 'Diberikan pendampingan teman sebaya dan komunikasi dengan wali kelas 7C.',
  },

  // H-2 (2 Hari Lalu - Peak Period)
  {
    id: 'rec-006',
    timestamp: new Date(Date.now() - 2 * ONE_DAY - 2 * ONE_HOUR).toISOString(),
    studentName: 'Rafi Pratama',
    studentClass: '8E',
    serviceType: 'pengaduan',
    studentWhatsapp: '081931632673',
    assignedTeacherId: 'sakir',
    assignedTeacherName: 'Pak Sakir',
    notes: 'Kehilangan buku paket matematika di laci meja saat pergantian jam olahraga.',
    mood: 'marah',
    status: 'Selesai',
    followUpNotes: 'Buku tertinggal di lab komputer dan sudah diserahkan kembali kepada siswa.',
    satisfaction: {
      rating: 4,
      comfortLevel: 'Nyaman',
      easeOfAccess: 'Sangat Mudah',
      feedback: 'Proses pengaduan cepat ditindaklanjuti oleh Pak Sakir.',
      submittedAt: new Date(Date.now() - 2 * ONE_DAY - 1 * ONE_HOUR).toISOString(),
    },
  },
  {
    id: 'rec-007',
    timestamp: new Date(Date.now() - 2 * ONE_DAY - 4 * ONE_HOUR).toISOString(),
    studentName: 'Maimunah Zahra',
    studentClass: '8C',
    serviceType: 'konseling',
    studentWhatsapp: '082232104991',
    assignedTeacherId: 'desi',
    assignedTeacherName: 'Bu Desi',
    notes: 'Sering merasa mengantuk di kelas karena membantu orang tua berjualan hingga larut malam.',
    mood: 'sedih',
    status: 'Sedang Ditangani',
    followUpNotes: 'Konsultasi manajemen waktu belajar dan istirahat, progres dipantau berkala.',
  },
  {
    id: 'rec-008',
    timestamp: new Date(Date.now() - 2 * ONE_DAY - 6 * ONE_HOUR).toISOString(),
    studentName: 'Fajar Nugraha',
    studentClass: '9H',
    serviceType: 'konseling',
    studentWhatsapp: '081931632673',
    assignedTeacherId: 'sakir',
    assignedTeacherName: 'Pak Sakir',
    notes: 'Merasa tertekan dengan ekspektasi keluarga terkait kelulusan dan nilai tryout.',
    mood: 'cemas',
    status: 'Sedang Ditangani',
    followUpNotes: 'Sesi konseling individual dan relaksasi mental telah dilaksanakan.',
  },
  {
    id: 'rec-009',
    timestamp: new Date(Date.now() - 2 * ONE_DAY - 7 * ONE_HOUR).toISOString(),
    studentName: 'Aisyah Bella',
    studentClass: '7D',
    serviceType: 'pengaduan',
    studentWhatsapp: '081913672981',
    assignedTeacherId: 'chol',
    assignedTeacherName: 'Bu Chol',
    notes: 'Mengadukan perlakuan senior yang menahan antrean di kantin madrasah.',
    mood: 'marah',
    status: 'Selesai',
    followUpNotes: 'Telah dimediasi bersama pembina OSIS dan pengelola kantin.',
    satisfaction: {
      rating: 5,
      comfortLevel: 'Sangat Nyaman',
      easeOfAccess: 'Mudah',
      feedback: 'Merasa aman melapor tanpa takut diketahui siswa lain.',
      submittedAt: new Date(Date.now() - 2 * ONE_DAY - 5 * ONE_HOUR).toISOString(),
    },
  },
  {
    id: 'rec-010',
    timestamp: new Date(Date.now() - 2 * ONE_DAY - 8 * ONE_HOUR).toISOString(),
    studentName: 'Zaki Mubarak',
    studentClass: '8F',
    serviceType: 'konseling',
    studentWhatsapp: '',
    assignedTeacherId: 'chol',
    assignedTeacherName: 'Bu Chol',
    notes: 'Ingin berdiskusi mengenai minat di bidang ekstrakurikuler robotik madrasah.',
    mood: 'senang',
    status: 'Selesai',
    followUpNotes: 'Diarahkan ke pembina ekstrakurikuler riset dan robotik.',
  },

  // H-3 (3 Hari Lalu)
  {
    id: 'rec-011',
    timestamp: new Date(Date.now() - 3 * ONE_DAY - 3 * ONE_HOUR).toISOString(),
    studentName: 'Dina Lestari',
    studentClass: '9D',
    serviceType: 'konseling',
    studentWhatsapp: '082199887766',
    assignedTeacherId: 'roni',
    assignedTeacherName: 'Pak Roni',
    notes: 'Kurang percaya diri saat diminta presentasi di depan kelas, sering gemetar.',
    mood: 'tenang',
    status: 'Sedang Ditangani',
    followUpNotes: 'Latihan teknik pernapasan dan relaksasi, perkembangan cukup positif.',
  },
  {
    id: 'rec-012',
    timestamp: new Date(Date.now() - 3 * ONE_DAY - 5 * ONE_HOUR).toISOString(),
    studentName: 'Dimas Anggara',
    studentClass: '8H',
    serviceType: 'pengaduan',
    studentWhatsapp: '081806228424',
    assignedTeacherId: 'roni',
    assignedTeacherName: 'Pak Roni',
    notes: 'Ada barang milik siswa lain yang tertukar saat kegiatan kepramukaan hari Jumat.',
    status: 'Selesai',
    followUpNotes: 'Barang sudah dipertemukan dan diserahkan ke pemilik aslinya.',
  },

  // H-4 (4 Hari Lalu)
  {
    id: 'rec-013',
    timestamp: new Date(Date.now() - 4 * ONE_DAY - 4 * ONE_HOUR).toISOString(),
    studentName: 'Hendro Wijaya',
    studentClass: '8G',
    serviceType: 'konseling',
    studentWhatsapp: '085257738799',
    assignedTeacherId: 'shofi',
    assignedTeacherName: 'Pak Shofi',
    notes: 'Mengalami penurunan motivasi belajar setelah kekalahan di lomba sains madrasah.',
    status: 'Selesai',
    followUpNotes: 'Diberikan motivasi dan refleksi bahwa proses belajar adalah pencapaian utama.',
  },

  // H-5 (5 Hari Lalu)
  {
    id: 'rec-014',
    timestamp: new Date(Date.now() - 5 * ONE_DAY - 5 * ONE_HOUR).toISOString(),
    studentName: 'Nurul Hidayah',
    studentClass: '9A',
    serviceType: 'konseling',
    studentWhatsapp: '082330200978',
    assignedTeacherId: 'riyah',
    assignedTeacherName: 'Bu Riyah',
    notes: 'Bimbingan karir lanjutan dan beasiswa prestasi ke madrasah aliyah unggulan.',
    status: 'Selesai',
    followUpNotes: 'Informasi jalur beasiswa dan portofolio prestasi telah disiapkan bersama.',
  },
  {
    id: 'rec-015',
    timestamp: new Date(Date.now() - 5 * ONE_DAY - 6 * ONE_HOUR).toISOString(),
    studentName: 'Rian Pratama',
    studentClass: '8B',
    serviceType: 'pengaduan',
    studentWhatsapp: '087762632490',
    assignedTeacherId: 'jufri',
    assignedTeacherName: 'Pak Jufri',
    notes: 'Melaporkan fasilitas toilet madrasah lantai dua yang kran airnya bocor.',
    status: 'Selesai',
    followUpNotes: 'Sudah dikoordinasikan ke staf sarpras madrasah dan telah diperbaiki.',
  },

  // H-6 (6 Hari Lalu)
  {
    id: 'rec-016',
    timestamp: new Date(Date.now() - 6 * ONE_DAY - 4 * ONE_HOUR).toISOString(),
    studentName: 'Bayu Saputra',
    studentClass: '7I',
    serviceType: 'konseling',
    studentWhatsapp: '081913672981',
    assignedTeacherId: 'chol',
    assignedTeacherName: 'Bu Chol',
    notes: 'Merasa kesulitan konsentrasi saat pelajaran jam terakhir setelah dzuhur.',
    status: 'Selesai',
    followUpNotes: 'Diberikan tips menjaga hidrasi dan peregangan ringan antar jam pelajaran.',
  },
];

export function getVisitorRecords(): VisitorRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECORDS;
  } catch (error) {
    console.error('Error reading visitor records from localStorage:', error);
    return INITIAL_RECORDS;
  }
}

export function saveVisitorRecord(record: Omit<VisitorRecord, 'id' | 'timestamp' | 'status'>): VisitorRecord {
  const current = getVisitorRecords();
  const newRecord: VisitorRecord = {
    ...record,
    id: 'rec-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    status: 'Menunggu',
  };

  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  return newRecord;
}

export function updateVisitorRecord(id: string, updates: Partial<VisitorRecord>): VisitorRecord[] {
  const current = getVisitorRecords();
  const updated = current.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update localStorage:', err);
  }
  return updated;
}

export function deleteVisitorRecord(id: string): VisitorRecord[] {
  const current = getVisitorRecords();
  const updated = current.filter((rec) => rec.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete record:', err);
  }
  return updated;
}

export function resetToSampleRecords(): VisitorRecord[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
  } catch (err) {
    console.error('Failed to reset records:', err);
  }
  return INITIAL_RECORDS;
}

export function getTeacherPin(): string {
  try {
    const pin = localStorage.getItem(PIN_KEY);
    return pin || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export function setTeacherPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) return false;
  try {
    localStorage.setItem(PIN_KEY, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

export function getLetterheadConfig(): LetterheadConfig {
  try {
    const raw = localStorage.getItem(LETTERHEAD_KEY);
    if (!raw) return DEFAULT_LETTERHEAD;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LETTERHEAD, ...parsed };
  } catch {
    return DEFAULT_LETTERHEAD;
  }
}

export function saveLetterheadConfig(config: LetterheadConfig): void {
  try {
    localStorage.setItem(LETTERHEAD_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save letterhead config:', err);
  }
}

export function resetLetterheadConfig(): LetterheadConfig {
  try {
    localStorage.removeItem(LETTERHEAD_KEY);
  } catch (err) {
    console.error('Failed to reset letterhead config:', err);
  }
  return DEFAULT_LETTERHEAD;
}

export function getStudentRoster(): StudentRosterEntry[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStudentRoster(entries: StudentRosterEntry[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save student roster:', err);
  }
}

export function clearStudentRoster(): void {
  try {
    localStorage.removeItem(ROSTER_KEY);
  } catch (err) {
    console.error('Failed to clear student roster:', err);
  }
}

export function parseRosterCSV(csvText: string): { entries: StudentRosterEntry[]; skippedCount: number } {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const entries: StudentRosterEntry[] = [];
  let skippedCount = 0;

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  lines.forEach((line, idx) => {
    const delimiter = line.includes(';') && !line.includes(',') ? ';' : ',';
    const cols = parseCsvLine(line, delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

    if (cols.length < 2) {
      skippedCount++;
      return;
    }

    // Support either [Nama, Kelas] or [No, Nama, Kelas]
    let rawName = cols[0];
    let rawClass = cols[1];
    if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
      rawName = cols[1];
      rawClass = cols[2];
    }

    // Skip header row
    const lowerName = rawName.toLowerCase();
    const lowerClass = rawClass.toLowerCase();
    if (
      idx === 0 &&
      (lowerName.includes('nama') || lowerName === 'name' || lowerClass.includes('kelas') || lowerClass === 'class')
    ) {
      return;
    }

    if (!rawName || !rawClass) {
      skippedCount++;
      return;
    }

    const normalizedClass = rawClass.toUpperCase().replace(/\s+/g, '');
    entries.push({
      id: `stu-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      name: rawName,
      studentClass: normalizedClass,
    });
  });

  return { entries, skippedCount };
}

export function downloadRosterTemplateCSV(): void {
  const csvContent =
    '\uFEFF' +
    [
      'Nama Siswa,Kelas',
      'Ahmad Fauzan,7B',
      'Siti Rahmawati,8A',
      'Muhammad Rizki,9C',
      'Maimunah Zahra,8C',
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_daftar_siswa_madrasah.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatIndonesianDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function exportRecordsToExcel(
  records: VisitorRecord[],
  filterDescription?: string,
  filenameSuffix?: string
): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const formattedToday = formatIndonesianDate(new Date().toISOString());

  const rowsHtml = records
    .map(
      (r, index) => `
    <tr>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${index + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatIndonesianDate(r.timestamp)}</td>
      <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${r.studentName}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${r.studentClass}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; color: ${
        r.serviceType === 'pengaduan' ? '#b45309' : '#047857'
      }; background-color: ${r.serviceType === 'pengaduan' ? '#fef3c7' : '#d1fae5'};">
        ${r.serviceType === 'pengaduan' ? 'Pengaduan' : 'Konseling'}
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.assignedTeacherName}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.studentWhatsapp || '-'}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; color: ${
        r.status === 'Selesai' ? '#047857' : r.status === 'Sedang Ditangani' ? '#0369a1' : '#b45309'
      };">
        ${r.status}
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.notes || '-'}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.followUpNotes || '-'}</td>
    </tr>`
    )
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Ruang Cerita</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #065f46; padding: 10px; text-align: center; }
          .header-title { font-size: 16pt; font-weight: bold; color: #0f172a; text-align: center; }
          .header-sub { font-size: 11pt; color: #475569; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="header-title">REKAPITULASI LAYANAN BIMBINGAN & KONSELING (RUANG CERITA)</td></tr>
          <tr><td colspan="10" class="header-sub">Laporan Data Pengunjung, Pengaduan, dan Konseling Siswa Madrasah</td></tr>
          <tr><td colspan="10" style="text-align: center; font-size: 10pt; color: #64748b; padding-bottom: 12px;">Tanggal Ekspor: ${formattedToday} ${
    filterDescription ? `• Kriteria: ${filterDescription}` : ''
  }</td></tr>
          <tr></tr>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 140px;">Waktu & Tanggal</th>
              <th style="width: 180px;">Nama Siswa</th>
              <th style="width: 80px;">Kelas</th>
              <th style="width: 120px;">Keperluan</th>
              <th style="width: 150px;">Guru BK</th>
              <th style="width: 130px;">No WhatsApp Siswa</th>
              <th style="width: 130px;">Status Tindak Lanjut</th>
              <th style="width: 250px;">Ringkasan Topik / Catatan Awal</th>
              <th style="width: 250px;">Catatan Penanganan Guru BK</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const suffix = filenameSuffix ? `_${filenameSuffix}` : '';
  link.setAttribute('download', `rekap_ruang_cerita_madrasah_${dateStr}${suffix}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRecordsToCSV(records: VisitorRecord[], filenameSuffix?: string): void {
  const headers = [
    'No',
    'Tanggal & Waktu',
    'Nama Siswa',
    'Kelas',
    'Keperluan Layanan',
    'Suasana Hati (Mood)',
    'Guru BK Dituju',
    'No WhatsApp Siswa',
    'Status Tindak Lanjut',
    'Catatan Permasalahan / Topik',
    'Catatan Penanganan Guru BK',
    'Catatan Privat Guru BK',
  ];

  const rows = records.map((r, index) => [
    index + 1,
    `"${formatIndonesianDate(r.timestamp)}"`,
    `"${r.studentName.replace(/"/g, '""')}"`,
    `"${(r.studentClass || '').replace(/"/g, '""')}"`,
    `"${r.serviceType === 'pengaduan' ? 'Pengaduan' : 'Konseling'}"`,
    `"${getMoodMeta(r.mood)?.label || '-'}"`,
    `"${(r.assignedTeacherName || '').replace(/"/g, '""')}"`,
    `"${(r.studentWhatsapp || '-').replace(/"/g, '""')}"`,
    `"${(r.status || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    `"${(r.followUpNotes || '').replace(/"/g, '""')}"`,
    `"${(r.counselorNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const suffix = filenameSuffix ? `_${filenameSuffix}` : '';
  link.setAttribute('download', `rekap_ruang_cerita_madrasah_${new Date().toISOString().slice(0, 10)}${suffix}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePrintableHTML(
  records: VisitorRecord[],
  filterDescription?: string,
  letterheadConfig?: LetterheadConfig
): string {
  const kop = letterheadConfig || getLetterheadConfig();
  const dateStr = new Date().toISOString().slice(0, 10);
  const formattedToday = formatIndonesianDate(new Date().toISOString());
  const hasAnyLogo = Boolean(kop.leftLogoUrl || kop.rightLogoUrl);

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const rowsHtml = records
    .map(
      (r, index) => `
    <tr>
      <td style="text-align: center; font-weight: bold; border: 1px solid #334155; padding: 6px 8px;">${index + 1}</td>
      <td style="border: 1px solid #334155; padding: 6px 8px; white-space: nowrap;">${formatIndonesianDate(r.timestamp)}</td>
      <td style="border: 1px solid #334155; padding: 6px 8px; font-weight: bold;">${escapeHtml(r.studentName)}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.studentClass)}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #334155; padding: 6px 8px; color: ${
        r.serviceType === 'pengaduan' ? '#9a3412' : '#047857'
      };">
        ${r.serviceType === 'pengaduan' ? 'PENGADUAN' : 'KONSELING'}
      </td>
      <td style="border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.assignedTeacherName)}</td>
      <td style="border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.studentWhatsapp || '-')}</td>
      <td style="text-align: center; font-weight: bold; border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.status)}</td>
      <td style="border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.notes || '-')}</td>
      <td style="border: 1px solid #334155; padding: 6px 8px;">${escapeHtml(r.followUpNotes || '-')}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Rekapitulasi Ruang Cerita Madrasah - ${dateStr}</title>
  <style>
    @page { size: landscape; margin: 12mm 15mm; }
    body { font-family: 'Times New Roman', Times, serif, Arial; font-size: 10pt; color: #000; background: #fff; margin: 0; padding: 20px; }
    .kop-wrapper { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
    .kop-logo-slot { width: 76px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .kop-logo-slot img { max-height: 68px; max-width: 72px; object-fit: contain; }
    .kop { flex: 1; text-align: center; line-height: 1.25; }
    .kop-1 { font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; }
    .kop-2 { font-size: 12pt; font-weight: bold; }
    .kop-3 { font-size: 14pt; font-weight: 900; }
    .kop-4 { font-size: 10.5pt; font-weight: bold; color: #047857; }
    .kop-desc { font-size: 8.5pt; font-style: italic; color: #444; }
    .line-double { border-top: 2px solid #000; border-bottom: 1px solid #000; height: 3px; margin: 8px 0 16px 0; }
    .doc-title { text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 12px; border-bottom: 1px solid #666; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; line-height: 1.25; margin-bottom: 24px; }
    th { background-color: #f1f5f9; border: 1px solid #334155; padding: 6px 8px; font-weight: bold; text-align: center; font-size: 8pt; text-transform: uppercase; }
    td { vertical-align: top; }
    .sig-block { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
    .sig-col { width: 280px; text-align: center; font-size: 9.5pt; }
    .sig-space { height: 75px; }
    .no-print-bar { background: #047857; color: white; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 13px; }
    .btn-print { background: white; color: #047857; font-weight: bold; padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>Petunjuk Cetak:</strong> Klik tombol Cetak di samping atau tekan tombol <strong>Ctrl + P</strong> (atau Cmd + P pada Mac) untuk mencetak atau simpan ke PDF.</div>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
  </div>

  <div class="kop-wrapper">
    ${hasAnyLogo ? `<div class="kop-logo-slot">${kop.leftLogoUrl ? `<img src="${escapeHtml(kop.leftLogoUrl)}" alt="Logo Kiri" />` : ''}</div>` : ''}
    <div class="kop">
      ${kop.line1 ? `<div class="kop-1">${escapeHtml(kop.line1)}</div>` : ''}
      ${kop.line2 ? `<div class="kop-2">${escapeHtml(kop.line2)}</div>` : ''}
      ${kop.line3 ? `<div class="kop-3">${escapeHtml(kop.line3)}</div>` : ''}
      ${kop.line4 ? `<div class="kop-4">${escapeHtml(kop.line4)}</div>` : ''}
      ${kop.line5 ? `<div class="kop-desc">${escapeHtml(kop.line5)}</div>` : ''}
    </div>
    ${hasAnyLogo ? `<div class="kop-logo-slot">${kop.rightLogoUrl ? `<img src="${escapeHtml(kop.rightLogoUrl)}" alt="Logo Kanan" />` : ''}</div>` : ''}
  </div>
  <div class="line-double"></div>

  <div class="doc-title">${escapeHtml(kop.docTitle)}</div>
  <div class="meta-bar">
    <span><strong>Waktu Cetak:</strong> ${formattedToday}</span>
    <span><strong>Jumlah Siswa:</strong> ${records.length} Siswa</span>
    <span><strong>Kriteria Filter:</strong> ${escapeHtml(filterDescription || 'Semua Data')}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">No</th>
        <th style="width: 125px;">Waktu & Tanggal</th>
        <th style="width: 140px;">Nama Siswa</th>
        <th style="width: 55px;">Kelas</th>
        <th style="width: 90px;">Keperluan</th>
        <th style="width: 120px;">Guru BK</th>
        <th style="width: 100px;">No WhatsApp</th>
        <th style="width: 85px;">Status</th>
        <th>Topik / Catatan Siswa</th>
        <th>Tindak Lanjut Guru BK</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sig-block">
    <div class="sig-col">
      <div>Mengetahui,</div>
      <div><strong>Kepala Madrasah</strong></div>
      <div class="sig-space"></div>
      <div style="text-decoration: underline; font-weight: bold;">___________________________</div>
      <div style="font-size: 8pt; margin-top: 4px;">NIP. .....................................................</div>
    </div>
    <div class="sig-col">
      <div>Madrasah, ${formattedToday}</div>
      <div><strong>Koordinator / Guru BK</strong></div>
      <div class="sig-space"></div>
      <div style="text-decoration: underline; font-weight: bold;">___________________________</div>
      <div style="font-size: 8pt; margin-top: 4px;">NIP. .....................................................</div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPrintableHTML(
  records: VisitorRecord[],
  filterDescription?: string,
  letterheadConfig?: LetterheadConfig
): void {
  const html = generatePrintableHTML(records, filterDescription, letterheadConfig);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `laporan_cetak_ruang_cerita_madrasah_${dateStr}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openPrintWindow(
  records: VisitorRecord[],
  filterDescription?: string,
  letterheadConfig?: LetterheadConfig
): void {
  const html = generatePrintableHTML(records, filterDescription, letterheadConfig);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // If popup is blocked by browser, fallback to downloading
    downloadPrintableHTML(records, filterDescription, letterheadConfig);
  }
}

export interface AppDatabaseBackup {
  version: string;
  appName: string;
  exportedAt: string;
  data: {
    visitors: VisitorRecord[];
    studentRoster: StudentRosterEntry[];
    letterhead: LetterheadConfig;
    teacherPin?: string;
  };
}

export function createDatabaseBackup(): AppDatabaseBackup {
  return {
    version: '1.0',
    appName: 'Ruang Cerita Madrasah',
    exportedAt: new Date().toISOString(),
    data: {
      visitors: getVisitorRecords(),
      studentRoster: getStudentRoster(),
      letterhead: getLetterheadConfig(),
      teacherPin: getTeacherPin(),
    },
  };
}

export function downloadDatabaseBackup(): void {
  const backup = createDatabaseBackup();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `backup_database_ruang_cerita_madrasah_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function restoreDatabaseBackup(
  jsonText: string,
  mode: 'replace' | 'merge' = 'replace'
): { success: boolean; message: string; visitorsCount: number; rosterCount: number } {
  try {
    const parsed = JSON.parse(jsonText) as Partial<AppDatabaseBackup>;
    if (!parsed || typeof parsed !== 'object' || !parsed.data || !Array.isArray(parsed.data.visitors)) {
      return {
        success: false,
        message: 'Format file backup tidak valid. Pastikan file berasal dari fitur Backup Database Ruang Cerita (.json).',
        visitorsCount: 0,
        rosterCount: 0,
      };
    }

    const incomingVisitors = parsed.data.visitors;
    const incomingRoster = Array.isArray(parsed.data.studentRoster) ? parsed.data.studentRoster : [];

    let finalVisitors: VisitorRecord[];
    let finalRoster: StudentRosterEntry[];

    if (mode === 'replace') {
      finalVisitors = incomingVisitors;
      finalRoster = incomingRoster;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalVisitors));
      saveStudentRoster(finalRoster);

      if (parsed.data.letterhead && typeof parsed.data.letterhead === 'object') {
        saveLetterheadConfig({ ...DEFAULT_LETTERHEAD, ...parsed.data.letterhead });
      }
      if (parsed.data.teacherPin && typeof parsed.data.teacherPin === 'string' && parsed.data.teacherPin.trim().length >= 4) {
        setTeacherPin(parsed.data.teacherPin.trim());
      }
    } else {
      // Merge mode
      const currentVisitors = getVisitorRecords();
      const existingIds = new Set(currentVisitors.map((v) => v.id));
      const newVisitors = incomingVisitors.filter((v) => v && v.id && !existingIds.has(v.id));
      finalVisitors = [...newVisitors, ...currentVisitors];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalVisitors));

      const currentRoster = getStudentRoster();
      const rosterKeys = new Set(
        currentRoster.map((r) => `${r.name.toLowerCase()}::${r.studentClass.toUpperCase()}`)
      );
      const newRoster = incomingRoster.filter(
        (r) => r && r.name && r.studentClass && !rosterKeys.has(`${r.name.toLowerCase()}::${r.studentClass.toUpperCase()}`)
      );
      finalRoster = [...currentRoster, ...newRoster];
      saveStudentRoster(finalRoster);
    }

    return {
      success: true,
      message:
        mode === 'replace'
          ? `Database berhasil dipulihkan! (${finalVisitors.length} data kunjungan & ${finalRoster.length} daftar siswa)`
          : `Database berhasil digabungkan! Total sekarang ${finalVisitors.length} data kunjungan & ${finalRoster.length} daftar siswa.`,
      visitorsCount: finalVisitors.length,
      rosterCount: finalRoster.length,
    };
  } catch {
    return {
      success: false,
      message: 'Gagal membaca file JSON. Pastikan file tidak rusak dan berformat JSON yang benar.',
      visitorsCount: 0,
      rosterCount: 0,
    };
  }
}

export function getCounselorAvailabilityMap(): Record<string, CounselorAvailabilityStatus> {
  try {
    const raw = localStorage.getItem(COUNSELOR_AVAILABILITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function setCounselorAvailability(
  teacherId: string,
  status: CounselorAvailabilityStatus
): Record<string, CounselorAvailabilityStatus> {
  const current = getCounselorAvailabilityMap();
  const updated: Record<string, CounselorAvailabilityStatus> = {
    ...current,
    [teacherId]: status,
  };
  try {
    localStorage.setItem(COUNSELOR_AVAILABILITY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save counselor availability:', err);
  }
  return updated;
}

export function getDailyCounselingGoal(): DailyCounselingGoal {
  const todayKey = new Date().toISOString().slice(0, 10);
  const fallback: DailyCounselingGoal = {
    dateKey: todayKey,
    themeTitle: 'Pekan Anti-Perundungan (Anti-Bullying Week)',
    focusNotes: 'Fokus mendeteksi dini ejekan verbal, pengucilan pertemanan, dan membangun budaya empati di madrasah.',
    targetSessions: 5,
    completedSessions: 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(DAILY_GOAL_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DailyCounselingGoal>;
    if (!parsed || typeof parsed !== 'object' || !parsed.themeTitle) {
      return fallback;
    }
    return {
      dateKey: parsed.dateKey || todayKey,
      themeTitle: parsed.themeTitle,
      focusNotes: parsed.focusNotes || '',
      targetSessions: typeof parsed.targetSessions === 'number' && parsed.targetSessions > 0 ? parsed.targetSessions : 5,
      completedSessions: typeof parsed.completedSessions === 'number' && parsed.completedSessions >= 0 ? parsed.completedSessions : 0,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export function saveDailyCounselingGoal(goal: DailyCounselingGoal): DailyCounselingGoal {
  const updated: DailyCounselingGoal = {
    ...goal,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ruang-cerita-daily-goal-updated', { detail: updated }));
    }
  } catch (err) {
    console.error('Failed to save daily counseling goal:', err);
  }
  return updated;
}

const INITIAL_LIBRARY_RESOURCES: LibraryResource[] = [
  {
    id: 'lib-001',
    title: 'Panduan Praktis Mengelola Stres & Kecemasan Ujian',
    description:
      'Langkah-langkah sederhana mengatur jadwal belajar, teknik pernapasan 4-7-8, serta cara menenangkan pikiran sebelum menghadapi ujian madrasah.',
    category: 'stres',
    resourceType: 'pdf',
    sourceType: 'upload',
    urlOrData: 'builtin://stres-ujian',
    fileName: 'panduan_mengelola_stres_ujian_madrasah.pdf',
    authorName: 'Tim Guru BK Madrasah',
    createdAt: new Date(Date.now() - 5 * ONE_DAY).toISOString(),
    downloadsCount: 14,
  },
  {
    id: 'lib-002',
    title: 'Kenali, Cegah, dan Laporkan Perundungan (Anti-Bullying)',
    description:
      'Materi edukasi mengenai bentuk perundungan fisik, verbal, maupun siber, serta hak siswa untuk mendapatkan perlindungan di lingkungan madrasah.',
    category: 'perundungan',
    resourceType: 'pdf',
    sourceType: 'upload',
    urlOrData: 'builtin://anti-bullying',
    fileName: 'panduan_anti_perundungan_madrasah.pdf',
    authorName: 'Unit Pelayanan Siswa BK',
    createdAt: new Date(Date.now() - 4 * ONE_DAY).toISOString(),
    downloadsCount: 19,
  },
  {
    id: 'lib-003',
    title: 'Teknik Regulasi Emosi & Mindfulness untuk Remaja',
    description:
      'Latihan mengenali emosi marah, sedih, atau cemas secara sehat melalui journaling harian dan jeda kesadaran diri.',
    category: 'emosi',
    resourceType: 'pdf',
    sourceType: 'upload',
    urlOrData: 'builtin://regulasi-emosi',
    fileName: 'modul_regulasi_emosi_remaja.pdf',
    authorName: 'Tim Guru BK Madrasah',
    createdAt: new Date(Date.now() - 2 * ONE_DAY).toISOString(),
    downloadsCount: 9,
  },
  {
    id: 'lib-004',
    title: 'Membangun Pertemanan Sehat & Komunikasi Asertif',
    description:
      'Artikel ringkas tentang cara berkata tidak secara sopan, menghargai batas pribadi teman, dan menjaga empati dalam pergaulan sehari-hari.',
    category: 'pertemanan',
    resourceType: 'artikel',
    sourceType: 'link',
    urlOrData: 'https://kemkes.go.id',
    authorName: 'Rekomendasi Bacaan BK',
    createdAt: new Date(Date.now() - 1 * ONE_DAY).toISOString(),
    downloadsCount: 6,
  },
];

const BUILTIN_PDF_CONTENT: Record<string, { heading: string; lines: string[] }> = {
  'builtin://stres-ujian': {
    heading: 'PANDUAN MENGELOLA STRES & KECEMASAN UJIAN MADRASAH',
    lines: [
      'Disusun oleh Tim Bimbingan & Konseling (Ruang Cerita Madrasah)',
      '',
      '1. Kenali Tanda Kecemasan Wajar:',
      '   Merasa gugup menjelang ujian adalah hal normal. Tarik napas perlahan',
      '   selama 4 detik, tahan 7 detik, dan hembuskan perlahan 8 detik.',
      '',
      '2. Pecah Materi Menjadi Target Kecil:',
      '   Belajar 25 menit fokus lalu istirahat 5 menit jauh lebih efektif',
      '   dibandingkan begadang semalam suntuk.',
      '',
      '3. Jaga Tidur, Air Putih, dan Doa:',
      '   Tidur cukup 7-8 jam membantu daya ingat bekerja optimal saat ujian.',
      '',
      '4. Butuh Teman Cerita?',
      '   Hubungi Guru BK pendamping kelasmu melalui Ruang Cerita Madrasah.',
    ],
  },
  'builtin://anti-bullying': {
    heading: 'KENALI, CEGAH & LAPORKAN PERUNDUNGAN (ANTI-BULLYING)',
    lines: [
      'Disusun oleh Unit Pelayanan Siswa (Ruang Cerita Madrasah)',
      '',
      '1. Apa Itu Perundungan (Bullying)?',
      '   Tindakan menyakiti secara sengaja dan berulang: fisik, ejekan verbal,',
      '   pengucilan teman, atau komentar menyakitkan di media sosial.',
      '',
      '2. Langkah Jika Kamu Mengalami atau Melihat:',
      '   - Simpan bukti (tangkapan layar jika perundungan siber).',
      '   - Ceritakan segera kepada Guru BK, wali kelas, atau orang tua.',
      '   - Gunakan Layanan Pengaduan di Ruang Cerita (kerahasiaan terjaga).',
      '',
      '3. Mari Jaga Madrasah Aman:',
      '   Satu kalimat empati darimu bisa menguatkan teman yang sedang berjuang.',
    ],
  },
  'builtin://regulasi-emosi': {
    heading: 'TEKNIK REGULASI EMOSI & MINDFULNESS UNTUK REMAJA',
    lines: [
      'Disusun oleh Tim Bimbingan & Konseling (Ruang Cerita Madrasah)',
      '',
      '1. Beri Nama Perasaanmu:',
      '   Sadari apakah kamu sedang cemas, kecewa, marah, atau sekadar lelah.',
      '   Menamai emosi membantu pikiran menjadi lebih tenang.',
      '',
      '2. Teknik Grounding 5-4-3-2-1:',
      '   Sebutkan 5 benda yang terlihat, 4 yang tersentuh, 3 suara yang',
      '   terdengar, 2 aroma, dan 1 hal yang kamu syukuri hari ini.',
      '',
      '3. Menulis Jurnal Singkat:',
      '   Tuangkan isi hatimu di buku catatan atau ceritakan ke Guru BK.',
    ],
  },
};

function sanitizePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function createBuiltinPdfBlobUrl(key: string, fallbackTitle: string, fallbackDesc: string): string {
  const doc = BUILTIN_PDF_CONTENT[key] || {
    heading: fallbackTitle.toUpperCase(),
    lines: [fallbackDesc, '', 'Ruang Cerita - Layanan Bimbingan & Konseling Madrasah'],
  };

  const textOps: string[] = ['BT', '/F1 14 Tf', '50 760 Td', `(${sanitizePdfText(doc.heading)}) Tj`, '/F1 11 Tf', '0 -26 Td'];
  for (const line of doc.lines) {
    textOps.push(`(${sanitizePdfText(line)}) Tj`);
    textOps.push('0 -16 Td');
  }
  textOps.push('ET');
  const stream = textOps.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export function getLibraryResources(): LibraryResource[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(INITIAL_LIBRARY_RESOURCES));
      return INITIAL_LIBRARY_RESOURCES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_LIBRARY_RESOURCES;
  } catch {
    return INITIAL_LIBRARY_RESOURCES;
  }
}

export function addLibraryResource(
  input: Omit<LibraryResource, 'id' | 'createdAt' | 'downloadsCount'>
): LibraryResource[] {
  const existing = getLibraryResources();
  const nextItem: LibraryResource = {
    ...input,
    id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    downloadsCount: 0,
  };
  const updated = [nextItem, ...existing];
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteLibraryResource(id: string): LibraryResource[] {
  const existing = getLibraryResources();
  const updated = existing.filter((item) => item.id !== id);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  return updated;
}

export function incrementLibraryDownload(id: string): LibraryResource[] {
  const existing = getLibraryResources();
  const updated = existing.map((item) =>
    item.id === id ? { ...item, downloadsCount: (item.downloadsCount || 0) + 1 } : item
  );
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  return updated;
}

export interface QRCodeSettings {
  targetUrl: string;
  schoolLabel: string;
  subtitle: string;
  instruction: string;
  fgColor: string;
}

const QR_SETTINGS_STORAGE_KEY = 'ruang_cerita_qr_settings_v1';
const LEGACY_QR_URL_STORAGE_KEY = 'ruang_cerita_qr_target_url_v1';

export function getDefaultQRUrl(): string {
  if (typeof window === 'undefined') return 'https://ruang-cerita-madrasah';
  const raw = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '');
  return raw.replace('://ais-dev-', '://ais-pre-');
}

export function getDefaultQRSettings(): QRCodeSettings {
  return {
    targetUrl: getDefaultQRUrl(),
    schoolLabel: 'Ruang Cerita Madrasah',
    subtitle: 'Pintu Aman Pengaduan & Konseling Siswa',
    instruction: 'Arahkan kamera HP siswa ke QR Code di atas',
    fgColor: '#0f172a',
  };
}

export function getQRSettings(): QRCodeSettings {
  const defaults = getDefaultQRSettings();
  try {
    const raw = localStorage.getItem(QR_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<QRCodeSettings>;
      return {
        targetUrl: parsed.targetUrl?.trim() || defaults.targetUrl,
        schoolLabel: parsed.schoolLabel?.trim() || defaults.schoolLabel,
        subtitle: parsed.subtitle?.trim() || defaults.subtitle,
        instruction: parsed.instruction?.trim() || defaults.instruction,
        fgColor: parsed.fgColor || defaults.fgColor,
      };
    }
    const legacyUrl = localStorage.getItem(LEGACY_QR_URL_STORAGE_KEY);
    if (legacyUrl && legacyUrl.trim()) {
      return { ...defaults, targetUrl: legacyUrl.trim() };
    }
  } catch {
    // ignore storage errors
  }
  return defaults;
}

export function saveQRSettings(settings: QRCodeSettings): QRCodeSettings {
  const defaults = getDefaultQRSettings();
  const normalized: QRCodeSettings = {
    targetUrl: settings.targetUrl.trim() || defaults.targetUrl,
    schoolLabel: settings.schoolLabel.trim() || defaults.schoolLabel,
    subtitle: settings.subtitle.trim() || defaults.subtitle,
    instruction: settings.instruction.trim() || defaults.instruction,
    fgColor: settings.fgColor || defaults.fgColor,
  };
  try {
    localStorage.setItem(QR_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_QR_URL_STORAGE_KEY, normalized.targetUrl);
    window.dispatchEvent(new Event('ruang-cerita-qr-updated'));
  } catch {
    // ignore storage errors
  }
  return normalized;
}

export function resetQRSettings(): QRCodeSettings {
  const defaults = getDefaultQRSettings();
  try {
    localStorage.removeItem(QR_SETTINGS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_QR_URL_STORAGE_KEY);
    window.dispatchEvent(new Event('ruang-cerita-qr-updated'));
  } catch {
    // ignore storage errors
  }
  return defaults;
}

