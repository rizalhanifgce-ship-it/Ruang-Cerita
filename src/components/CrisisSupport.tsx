import React from 'react';
import {
  PhoneCall,
  ShieldAlert,
  HeartHandshake,
  MessageCircle,
  X,
  Users,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface CrisisSupportProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCounselors: () => void;
  onGoToForm: () => void;
}

interface HotlineItem {
  id: string;
  name: string;
  agency: string;
  phoneDisplay: string;
  telHref: string;
  whatsappHref?: string;
  hours: string;
  description: string;
}

const EMERGENCY_HOTLINES: HotlineItem[] = [
  {
    id: 'sapa-129',
    name: 'Layanan SAPA 129 (SEJIWA)',
    agency: 'Kementerian PPPA RI',
    phoneDisplay: '129',
    telHref: 'tel:129',
    whatsappHref: 'https://wa.me/628111129129',
    hours: '24 Jam',
    description:
      'Layanan pengaduan dan dukungan psikososial bagi anak dan remaja yang mengalami tekanan berat, perundungan, atau kekerasan.',
  },
  {
    id: 'kemenkes-119',
    name: 'Layanan Darurat & Kesehatan Jiwa',
    agency: 'Kementerian Kesehatan RI',
    phoneDisplay: '119 (ext. 8) / 1500-567',
    telHref: 'tel:119',
    hours: '24 Jam',
    description:
      'Bantuan darurat medis dan dukungan krisis kesehatan mental nasional yang siap dihubungi kapan saja.',
  },
  {
    id: 'darurat-112',
    name: 'Panggilan Darurat Nasional',
    agency: 'Layanan Terpadu 112',
    phoneDisplay: '112',
    telHref: 'tel:112',
    hours: '24 Jam • Bebas Pulsa',
    description:
      'Nomor darurat terpadu bebas pulsa untuk situasi mendesak yang membutuhkan pertolongan segera.',
  },
  {
    id: 'kpai',
    name: 'Pengaduan Perlindungan Anak (KPAI)',
    agency: 'Komisi Perlindungan Anak Indonesia',
    phoneDisplay: '(021) 31901556',
    telHref: 'tel:+622131901556',
    hours: 'Jam Kerja',
    description:
      'Konsultasi dan perlindungan hak anak serta penanganan kasus kekerasan atau perundungan.',
  },
];

export const CrisisSupport: React.FC<CrisisSupportProps> = ({
  isOpen,
  onClose,
  onGoToCounselors,
  onGoToForm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-rose-200 max-h-[90vh] overflow-y-auto">
        {/* Top Urgent Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-6 text-white rounded-t-3xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-colors"
            aria-label="Tutup Dukungan Darurat"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-3 h-3" />
                Dukungan Krisis &amp; Bantuan Segera
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Kamu Tidak Sendirian, Bantuan Selalu Ada
              </h2>
              <p className="text-rose-50 text-xs sm:text-sm mt-1 leading-relaxed">
                Jika kamu sedang merasa sangat tertekan, tidak aman, atau membutuhkan pertolongan segera, jangan ragu menghubungi salah satu kontak darurat di bawah ini.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Madrasah BK Action */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Hubungi Guru BK Madrasah Sekarang
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sampaikan kondisimu secara rahasia agar Guru BK dapat segera mendampingimu.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToCounselors();
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Daftar Guru BK</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToForm();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Isi Formulir
              </button>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Hotline Resmi &amp; Bantuan Darurat Indonesia
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {EMERGENCY_HOTLINES.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {item.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                        <Clock className="w-3 h-3 text-rose-500" />
                        {item.hours}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {item.agency} • <span className="text-rose-700 font-extrabold">{item.phoneDisplay}</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={item.telHref}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Telepon</span>
                    </a>
                    {item.whatsappHref && (
                      <a
                        href={item.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Jika dalam bahaya fisik langsung, segera cari orang dewasa terpercaya di sekitarmu.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0 ml-3"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
