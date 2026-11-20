import React, { useState } from 'react';
import { COUNSELORS, ALL_CLASSES } from '../data/counselors';
import { CounselorAvailabilityStatus, TeacherBK } from '../types';
import { getCounselorAvailabilityMap, setCounselorAvailability } from '../utils/storage';
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Copy,
  Check,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Clock,
} from 'lucide-react';

interface CounselorListProps {
  onSelectForStudent: (counselor: TeacherBK) => void;
}

export const CounselorList: React.FC<CounselorListProps> = ({ onSelectForStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | CounselorAvailabilityStatus>('all');
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, CounselorAvailabilityStatus>>(() =>
    getCounselorAvailabilityMap()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getStatus = (id: string): CounselorAvailabilityStatus => availabilityMap[id] || 'available';

  const handleToggleAvailability = (id: string) => {
    const current = getStatus(id);
    const next: CounselorAvailabilityStatus = current === 'available' ? 'busy' : 'available';
    const updated = setCounselorAvailability(id, next);
    setAvailabilityMap(updated);
  };

  const availableCount = COUNSELORS.filter((c) => getStatus(c.id) === 'available').length;
  const busyCount = COUNSELORS.length - availableCount;

  // Filter counselors
  const filteredCounselors = COUNSELORS.filter((c) => {
    // Search by name or class
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.classes.some((cls) => cls.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phoneDisplay.includes(searchTerm);

    if (!matchSearch) return false;

    // Filter by class
    if (selectedClassFilter !== 'all') {
      if (!c.classes.includes(selectedClassFilter)) return false;
    }

    // Filter by grade
    if (selectedGrade !== 'all') {
      const hasGradeClass = c.classes.some((cls) => cls.startsWith(selectedGrade));
      if (!hasGradeClass) return false;
    }

    // Filter by availability
    if (availabilityFilter !== 'all') {
      if (getStatus(c.id) !== availabilityFilter) return false;
    }

    return true;
  });

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Users className="w-3.5 h-3.5" />
          Tim Bimbingan & Konseling
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Daftar Guru BK & Kelas yang Diampu
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Berikut adalah 9 Guru Bimbingan & Konseling yang siap mendampingi, mendengarkan, serta membantu setiap kebutuhan siswa di madrasah.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama guru BK atau kelas (misal: Bu Chol, 7B, Pak Sakir)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setSelectedGrade('all');
                setSelectedClassFilter('all');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGrade === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tingkat
            </button>
            <button
              onClick={() => {
                setSelectedGrade('7');
                setSelectedClassFilter('all');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGrade === '7'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kelas 7
            </button>
            <button
              onClick={() => {
                setSelectedGrade('8');
                setSelectedClassFilter('all');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGrade === '8'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kelas 8
            </button>
            <button
              onClick={() => {
                setSelectedGrade('9');
                setSelectedClassFilter('all');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGrade === '9'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kelas 9
            </button>
          </div>
        </div>

        {/* Quick class pill filter & Availability filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-slate-400 font-bold shrink-0">Filter Kelas:</span>
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                selectedClassFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {ALL_CLASSES.filter((c) => (selectedGrade === 'all' ? true : c.startsWith(selectedGrade))).map(
              (c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClassFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedClassFilter === c
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 font-bold mr-1">Ketersediaan:</span>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                availabilityFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({COUNSELORS.length})
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                availabilityFilter === 'available'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Available ({availableCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('busy')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                availabilityFilter === 'busy'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Busy ({busyCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Counselors Grid */}
      {filteredCounselors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Tidak ditemukan Guru BK
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Coba sesuaikan kata kunci pencarian atau reset filter kelas.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGrade('all');
              setSelectedClassFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCounselors.map((counselor, idx) => {
            const isFemale = counselor.gender === 'female';
            const defaultWAMessage = encodeURIComponent(
              `Assalamualaikum wr. wb. / Halo ${counselor.name},\nSaya siswa yang ingin berkonsultasi mengenai layanan Bimbingan & Konseling melalui Ruang Cerita. Mohon izin dan waktu ${isFemale ? 'Ibu' : 'Bapak'}. Terima kasih.`
            );
            const waLink = `https://wa.me/${counselor.whatsappNumber}?text=${defaultWAMessage}`;

            const status = getStatus(counselor.id);
            const isAvailable = status === 'available';

            return (
              <div
                key={counselor.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top card info */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 ${
                          isFemale
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-600 shadow-pink-500/20'
                            : 'bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sky-500/20'
                        }`}
                      >
                        {counselor.name.replace(/^(Bu|Pak)\s+/i, '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Guru BK
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {counselor.name}
                        </h3>
                      </div>
                    </div>

                    {/* Counselor Availability Status & Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(counselor.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Klik (khusus Guru BK) untuk mengubah status ketersediaan Available / Busy"
                    >
                      {isAvailable ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Busy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isAvailable && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Sedang mendampingi sesi. Pesan WhatsApp tetap dapat dikirim dan akan dibalas setelah sesi selesai.</span>
                    </div>
                  )}

                  {/* Phone & Copy */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{counselor.phoneDisplay}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(counselor.id, counselor.phoneDisplay)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Salin nomor"
                    >
                      {copiedId === counselor.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Motto / Description */}
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed italic">
                    "{counselor.motto}"
                  </p>

                  {/* Classes Assigned */}
                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kelas yang Diampu ({counselor.classes.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {counselor.classes.map((cls) => {
                        const isHighlighted =
                          selectedClassFilter === cls ||
                          (selectedGrade !== 'all' && cls.startsWith(selectedGrade));

                        return (
                          <span
                            key={cls}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                              isHighlighted
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {cls}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>Chat WhatsApp Langsung</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectForStudent(counselor)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Gunakan di Formulir Ruang Cerita</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
