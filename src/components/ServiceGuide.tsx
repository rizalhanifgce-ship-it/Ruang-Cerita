import React, { useState } from 'react';
import {
  HeartHandshake,
  ShieldAlert,
  HelpCircle,
  Lock,
  Smile,
  CheckCircle2,
  Compass,
  ChevronDown,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'Privasi' | 'Proses Konseling' | 'Keamanan';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Privasi',
    question: 'Apakah cerita, foto, dan identitasku benar-benar dirahasiakan?',
    answer:
      'Ya, 100% dirahasiakan. Sesuai Asas Kerahasiaan Bimbingan & Konseling, seluruh data yang kamu kirim hanya dapat diakses oleh Guru BK melalui portal khusus yang dilindungi PIN. Ceritamu tidak akan dibagikan ke teman, wali kelas, atau pihak lain tanpa persetujuanmu.',
  },
  {
    id: 'faq-2',
    category: 'Privasi',
    question: 'Apakah teman sekelas atau siswa lain bisa melihat laporanku?',
    answer:
      'Tidak bisa. Formulir Ruang Cerita hanya untuk pengisian satu arah. Siswa lain tidak memiliki akses untuk melihat daftar pengunjung, catatan keluhan, maupun riwayat konseling milikmu.',
  },
  {
    id: 'faq-3',
    category: 'Keamanan',
    question: 'Bagaimana jika saya melaporkan perundungan (bullying) — apakah saya aman?',
    answer:
      'Keamanan pelapor adalah prioritas utama Guru BK madrasah. Identitas pelapor akan dilindungi sepenuhnya, dan Guru BK akan menangani laporan secara bijaksana serta melakukan mediasi tanpa membuka siapa yang melapor.',
  },
  {
    id: 'faq-4',
    category: 'Proses Konseling',
    question: 'Apakah saya boleh memilih Guru BK lain selain pendamping kelasku?',
    answer:
      'Tentu boleh. Sistem otomatis merekomendasikan Guru BK pendamping kelasmu agar lebih cepat ditangani, namun pada langkah berikutnya atau melalui menu Daftar Guru BK kamu bebas memilih dan menghubungi salah satu dari 9 Guru BK yang paling membuatmu nyaman.',
  },
  {
    id: 'faq-5',
    category: 'Proses Konseling',
    question: 'Apa yang terjadi setelah saya mengirim formulir Ruang Cerita?',
    answer:
      'Data kunjunganmu langsung masuk ke rekap Guru BK dengan status "Menunggu". Kamu juga bisa langsung menekan tombol WhatsApp untuk memulai percakapan dengan Guru BK pendampingmu guna menyepakati jadwal konseling tatap muka di ruang BK atau konsultasi via chat.',
  },
  {
    id: 'faq-6',
    category: 'Proses Konseling',
    question: 'Apakah datang ke Guru BK akan memengaruhi nilai atau catatan pelanggaran?',
    answer:
      'Sama sekali tidak. Guru BK bukan "polisi madrasah", melainkan sahabat dan pembimbingmu. Mengikuti sesi konseling justru membantu kamu menemukan solusi, ketenangan, serta meningkatkan semangat belajar di madrasah.',
  },
];

export const ServiceGuide: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          Panduan & Asas Layanan
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Memahami Layanan di Ruang Cerita
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Ruang Cerita adalah rumah aman bagi seluruh siswa. Ketahui perbedaan layanan pengaduan dan konseling, serta jaminan kerahasiaan yang kamu dapatkan.
        </p>
      </div>

      {/* Difference: Konseling vs Pengaduan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Konseling Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Layanan #1
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 mb-3">
            Layanan Konseling
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Ditujukan untuk siswa yang membutuhkan teman bicara, bimbingan, atau bantuan pemecahan masalah pribadi, sosial, maupun akademik.
          </p>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Contoh Keperluan Konseling:
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Merasa cemas, tertekan, atau stres menghadapi ujian dan tugas madrasah.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Mengalami perselisihan atau rasa canggung dengan sahabat atau teman sekelas.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Bingung menentukan cita-cita atau pilihan madrasah lanjutan (MA/MAK/SMA/SMK).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Kesulitan mengatur waktu belajar dan kecanduan gadget atau game.</span>
            </li>
          </ul>
        </div>

        {/* Pengaduan Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
            Layanan #2
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 mb-3">
            Layanan Pengaduan
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Ditujukan untuk melaporkan insiden, perlakuan tidak menyenangkan, atau ancaman keselamatan fisik maupun psikologis di lingkungan madrasah.
          </p>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Contoh Keperluan Pengaduan:
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Mengalami atau menyaksikan tindakan perundungan (bullying) verbal/fisik.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Pemalakan uang, pemerasan, atau intimidasi oleh pihak mana pun.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Pelecehan atau perkataan tidak pantas yang membuat merasa tidak aman.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Kehilangan barang berharga atau laporan insiden keamanan madrasah.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4 Asas Penting Bimbingan & Konseling */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Kode Etik & Komitmen Kami
          </span>
          <h2 className="text-xl sm:text-3xl font-black mt-1 mb-2">
            4 Asas Utama Bimbingan & Konseling
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Guru BK bertindak sebagai sahabat dan pembimbing, bukan 'polisi madrasah'. Layanan BK selalu berlandaskan asas profesional:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-1">Asas Kerahasiaan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Segala cerita, identitas, dan permasalahan siswa dirahasiakan dan tidak akan disebarkan.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-1">Asas Keterbukaan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Siswa diajak terbuka menceritakan apa yang dirasakan tanpa rasa takut dicemooh atau dihakimi.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-1">Asas Kesukarelaan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Siswa datang dengan sukarela dan tulus untuk mencari solusi bersama guru pembimbing.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-1">Asas Kenormatifan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Solusi yang diambil senantiasa selaras dengan norma hukum, agama, adat, dan tata tertib madrasah.
            </p>
          </div>
        </div>
      </div>

      {/* Alur Kunjungan */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
          Bagaimana Alur Menggunakan Ruang Cerita?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Isi Data Diri
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tulis namamu, pilih kelasmu, dan tentukan apakah ingin melakukan konseling atau pengaduan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Data Masuk Rekapan BK
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem Ruang Cerita otomatis mencatat kunjunganmu ke buku rekap khusus yang hanya bisa diakses Guru BK.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Langsung Chat WhatsApp
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Klik tombol WhatsApp guru BK pendamping kelasmu dengan pesan sopan yang sudah otomatis tersusun.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-100 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions (FAQ)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Pertanyaan yang Sering Diajukan Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Temukan jawaban seputar privasi, keamanan laporan, dan cara kerja layanan konseling di madrasah.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'border-emerald-300 bg-emerald-50/30 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        item.category === 'Privasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.category === 'Keamanan'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="font-bold text-sm sm:text-base text-slate-900">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-emerald-100/80 mt-0 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
