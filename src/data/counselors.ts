import { TeacherBK } from '../types';

export const COUNSELORS: TeacherBK[] = [
  {
    id: 'chol',
    name: 'Bu Chol',
    title: 'Guru BK Tingkat 7, 8, & 9',
    gender: 'female',
    phoneDisplay: '+62 819-1367-2981',
    whatsappNumber: '6281913672981',
    classes: ['7B', '7D', '7I', '8F', '9B'],
    motto: 'Pintu selalu terbuka untuk setiap cerita dan langkah masa depanmu.',
    description: 'Mendampingi siswa dalam perkembangan pribadi, sosial, dan akademik.',
  },
  {
    id: 'anis',
    name: 'Bu Anis',
    title: 'Guru BK Tingkat 7, 8, & 9',
    gender: 'female',
    phoneDisplay: '+62 819-9955-4453',
    whatsappNumber: '6281999554453',
    classes: ['7A', '7F', '7H', '8A', '9C'],
    motto: 'Setiap tantangan punya jalan keluar, mari bicarakan bersama.',
    description: 'Siap mendengarkan tanpa menghakimi, mendampingi belajar dan adaptasi madrasah.',
  },
  {
    id: 'puput',
    name: 'Bu Puput',
    title: 'Guru BK Tingkat 7, 8, & 9',
    gender: 'female',
    phoneDisplay: '+62 877-0338-5285',
    whatsappNumber: '6287703385285',
    classes: ['7C', '7E', '7G', '8I', '9E'],
    motto: 'Temukan potensi terbaik dalam dirimu dengan hati yang tenang.',
    description: 'Fokus pada kesehatan emosional, pertemanan sehat, dan motivasi belajar siswa.',
  },
  {
    id: 'sakir',
    name: 'Pak Sakir',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'male',
    phoneDisplay: '+62 819-3163-2673',
    whatsappNumber: '6281931632673',
    classes: ['8E', '9H'],
    motto: 'Jujur pada diri sendiri adalah awal keberanian menyelesaikan masalah.',
    description: 'Mendukung kedisiplinan positif, resolusi konflik teman, dan bimbingan karir.',
  },
  {
    id: 'roni',
    name: 'Pak Roni',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'male',
    phoneDisplay: '+62 818-0622-8424',
    whatsappNumber: '6281806228424',
    classes: ['8H', '9D'],
    motto: 'Jadikan masa remaja penuh makna, berani bicara jika butuh pertolongan.',
    description: 'Membimbing kematangan kepribadian, minat bakat, dan pemecahan kendala belajar.',
  },
  {
    id: 'shofi',
    name: 'Pak Shofi',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'male',
    phoneDisplay: '+62 852-5773-8799',
    whatsappNumber: '6285257738799',
    classes: ['8G', '9I'],
    motto: 'Semangat belajar dan ketenangan hati adalah kunci sukses siswa.',
    description: 'Pendampingan adaptasi lingkungan madrasah, etika pergaulan, dan konseling pribadi.',
  },
  {
    id: 'jufri',
    name: 'Pak Jufri',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'male',
    phoneDisplay: '+62 877-6263-2490',
    whatsappNumber: '6287762632490',
    classes: ['8B', '9F'],
    motto: 'Masalah bukan untuk dihindari, melainkan diselesaikan dengan bijak.',
    description: 'Konseling motivasi belajar, pencegahan bullying, dan eksplorasi bakat siswa.',
  },
  {
    id: 'desi',
    name: 'Bu Desi',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'female',
    phoneDisplay: '+62 822-3210-4991',
    whatsappNumber: '6282232104991',
    classes: ['8C', '9G'],
    motto: 'Ceritakan apa yang kamu rasakan, kami di sini untuk membantumu.',
    description: 'Membantu pengelolaan stres akademik, hubungan interpersonal, dan kepercayaan diri.',
  },
  {
    id: 'riyah',
    name: 'Bu Riyah',
    title: 'Guru BK Tingkat 8 & 9',
    gender: 'female',
    phoneDisplay: '+62 823-3020-0978',
    whatsappNumber: '6282330200978',
    classes: ['8D', '9A'],
    motto: 'Tidak ada anak yang sendirian, mari melangkah bersama meraih impian.',
    description: 'Layanan bimbingan belajar, pemantapan pilihan madrasah lanjutan, dan konseling keluarga.',
  },
];

export const ALL_CLASSES: string[] = [
  '7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H', '7I',
  '8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H', '8I',
  '9A', '9B', '9C', '9D', '9E', '9F', '9G', '9H', '9I',
];

export function findCounselorByClass(studentClass: string): TeacherBK | undefined {
  const normalized = studentClass.trim().toUpperCase();
  return COUNSELORS.find((c) => c.classes.includes(normalized));
}

export function buildWhatsAppLink(params: {
  teacher: TeacherBK;
  studentName: string;
  studentClass: string;
  serviceType: 'pengaduan' | 'konseling';
  notes?: string;
  studentWhatsapp?: string;
}): string {
  const greeting = params.teacher.gender === 'female' ? 'Bu' : 'Pak';
  const typeLabel = params.serviceType === 'pengaduan' ? 'PENGADUAN SISWA' : 'LAYANAN KONSELING';
  
  let message = `Assalamualaikum wr. wb. / Halo ${greeting} ${params.teacher.name.replace(/^(Bu|Pak)\s+/i, '')},\n\n`;
  message += `Perkenalkan saya:\n`;
  message += `👤 Nama: *${params.studentName.trim()}*\n`;
  message += `🏫 Kelas: *${params.studentClass.trim()}*\n`;
  message += `📌 Keperluan: *${typeLabel}*\n`;
  
  if (params.studentWhatsapp) {
    message += `📱 No. Kontak Siswa: ${params.studentWhatsapp}\n`;
  }

  if (params.notes && params.notes.trim()) {
    message += `\n📝 Topik / Catatan Singkat:\n"${params.notes.trim()}"\n`;
  }

  message += `\nSaya telah mengisi data kunjungan melalui aplikasi *Ruang Cerita* madrasah. Mohon izin dan waktu ${greeting} untuk membimbing atau menindaklanjuti keperluan saya ini.\n\nTerima kasih banyak atas perhatian dan bantuannya ${greeting}. 🙏`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${params.teacher.whatsappNumber}?text=${encoded}`;
}
