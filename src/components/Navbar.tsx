import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab } from '../types';
import {
  MessageSquareHeart,
  Users,
  HelpCircle,
  ShieldCheck,
  Lock,
  LogOut,
  QrCode,
  BookOpen,
  HeartPulse,
  PhoneCall,
  Wind,
  Heart,
  SmilePlus,
  Moon,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isTeacherAuthenticated: boolean;
  totalVisitors: number;
  onLogout: () => void;
  onOpenQRModal: () => void;
  onOpenCrisisSupport: () => void;
}

const WELLNESS_TABS: { id: ActiveTab; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pustaka', label: 'Pustaka Kesehatan Mental', desc: 'Artikel & panduan psikologi remaja', icon: BookOpen },
  { id: 'refleksi', label: 'Refleksi Diri', desc: 'Cek kondisi emosional mandiri', icon: HeartPulse },
  { id: 'napas', label: 'Napas Tenang 4-7-8', desc: 'Latihan relaksasi pernapasan', icon: Wind },
  { id: 'syukur', label: 'Jurnal Syukur', desc: 'Catatan hal baik harian', icon: Heart },
  { id: 'mood', label: 'Pelacak Mood', desc: 'Pantau suasana hati setiap hari', icon: SmilePlus },
  { id: 'tidur', label: 'Pelacak Tidur', desc: 'Evaluasi kualitas istirahat', icon: Moon },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isTeacherAuthenticated,
  totalVisitors,
  onLogout,
  onOpenQRModal,
  onOpenCrisisSupport,
}) => {
  const [isWellnessOpen, setIsWellnessOpen] = useState(false);
  const wellnessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wellnessRef.current && !wellnessRef.current.contains(e.target as Node)) {
        setIsWellnessOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsWellnessOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isWellnessActive = WELLNESS_TABS.some((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('siswa')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap group-hover:text-emerald-700 transition-colors">
              Ruang Cerita
            </span>
          </div>

          {/* Desktop Navigation — Single-row, no wrapping */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('siswa')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquareHeart className="w-4 h-4 shrink-0" />
              <span>Formulir Siswa</span>
            </button>

            <button
              onClick={() => setActiveTab('guru-list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'guru-list'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Daftar Guru BK</span>
            </button>

            {/* Dropdown for Student Wellness Tools */}
            <div className="relative" ref={wellnessRef}>
              <button
                type="button"
                onClick={() => setIsWellnessOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isWellnessActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <HeartPulse className="w-4 h-4 shrink-0" />
                <span>Ruang Tenang</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWellnessOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWellnessOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-lg p-2 z-50">
                  {WELLNESS_TABS.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsWellnessOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-snug">{item.label}</div>
                          <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('panduan')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'panduan'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Panduan</span>
            </button>
          </nav>

          {/* Right Utility & Portal Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCrisisSupport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              title="Kontak Darurat & Dukungan Krisis 24 Jam"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span>Darurat</span>
            </button>

            <button
              type="button"
              onClick={onOpenQRModal}
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Bagikan aplikasi via QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            <button
              onClick={() => setActiveTab('portal-bk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors border cursor-pointer ${
                activeTab === 'portal-bk'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : isTeacherAuthenticated
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isTeacherAuthenticated ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Portal BK</span>
              {totalVisitors > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                  activeTab === 'portal-bk' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {totalVisitors}
                </span>
              )}
            </button>

            {isTeacherAuthenticated && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                title="Keluar / Log Out dari Portal Admin Guru BK"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Quick Action for Portal BK */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCrisisSupport}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer"
              title="Kontak Darurat & Dukungan Krisis"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenQRModal}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer"
              title="Bagikan via QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('portal-bk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                activeTab === 'portal-bk'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : isTeacherAuthenticated
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isTeacherAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Guru BK</span>
            </button>
            {isTeacherAuthenticated && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                title="Log Out Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'siswa' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Formulir</span>
          </button>
          <button
            onClick={() => setActiveTab('guru-list')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'guru-list' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guru BK</span>
          </button>
          <button
            onClick={() => setActiveTab('pustaka')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'pustaka' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Pustaka</span>
          </button>
          <button
            onClick={() => setActiveTab('refleksi')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === 'refleksi' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Refleksi</span>
          </button>
          <button
            onClick={() => setActiveTab('napas')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === 'napas' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Napas</span>
          </button>
          <button
            onClick={() => setActiveTab('syukur')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === 'syukur' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Syukur</span>
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === 'mood' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <SmilePlus className="w-4 h-4" />
            <span>Mood</span>
          </button>
          <button
            onClick={() => setActiveTab('tidur')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tidur' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Tidur</span>
          </button>
          <button
            onClick={() => setActiveTab('panduan')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'panduan' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
