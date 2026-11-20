import React, { useState, useEffect } from 'react';
import { ActiveTab, DailyCounselingGoal, TeacherBK, VisitorRecord } from './types';
import {
  getVisitorRecords,
  saveDailyCounselingGoal,
  saveQRSettings,
  QRCodeSettings,
} from './utils/storage';
import {
  subscribeFirebaseAuth,
  subscribeVisitorsFromFirestore,
  subscribeSettingFromFirestore,
  signOutAdminFromFirebase,
} from './utils/firestoreSync';
import type { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { StudentForm } from './components/StudentForm';
import { CounselorList } from './components/CounselorList';
import { ServiceGuide } from './components/ServiceGuide';
import { MentalHealthLibrary } from './components/MentalHealthLibrary';
import { SelfAssessment } from './components/SelfAssessment';
import { GuidedBreathing } from './components/GuidedBreathing';
import { DailyGratitude } from './components/DailyGratitude';
import { MoodTracker } from './components/MoodTracker';
import { SleepTracker } from './components/SleepTracker';
import { AdminPortal } from './components/AdminPortal';
import { ShareQRModal } from './components/ShareQRModal';
import { CrisisSupport } from './components/CrisisSupport';
import { FocusSoundscape } from './components/FocusSoundscape';
import {
  MessageSquareHeart,
  ShieldCheck,
  Heart,
  Lock,
  Phone,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('siswa');
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);

  // Initialize records from local storage
  useEffect(() => {
    const loaded = getVisitorRecords();
    setRecords(loaded);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = subscribeFirebaseAuth((user) => {
      setFirebaseUser(user);
      if (user && user.emailVerified) {
        setIsTeacherAuthenticated(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore visitors in real time when admin is authenticated via Firebase
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeVisitorsFromFirestore((cloudRecords) => {
      if (cloudRecords.length > 0) {
        setRecords(cloudRecords);
      }
    });
    return () => unsub();
  }, [firebaseUser]);

  // Subscribe to public settings (dailyGoal & qrConfig) from Firestore
  useEffect(() => {
    const unsubGoal = subscribeSettingFromFirestore<DailyCounselingGoal>('dailyGoal', (data) => {
      if (data && data.themeTitle) {
        saveDailyCounselingGoal(data);
      }
    });
    const unsubQr = subscribeSettingFromFirestore<QRCodeSettings>('qrConfig', (data) => {
      if (data && data.targetUrl) {
        saveQRSettings(data);
      }
    });
    return () => {
      unsubGoal();
      unsubQr();
    };
  }, []);

  // When student submits a record
  const handleRecordCreated = (newRecord: VisitorRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  // When a record is updated (e.g. session satisfaction survey submitted)
  const handleRecordsUpdated = (updatedRecords: VisitorRecord[]) => {
    setRecords(updatedRecords);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTeacherAuthenticated={isTeacherAuthenticated}
        totalVisitors={records.length}
        onLogout={() => {
          setIsTeacherAuthenticated(false);
          signOutAdminFromFirebase().catch(() => {});
          setActiveTab('siswa');
        }}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenCrisisSupport={() => setIsCrisisModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'siswa' && (
          <StudentForm
            onRecordCreated={handleRecordCreated}
            onRecordsUpdated={handleRecordsUpdated}
            onViewTeacherDirectory={() => setActiveTab('guru-list')}
          />
        )}

        {activeTab === 'guru-list' && (
          <CounselorList
            onSelectForStudent={(_counselor: TeacherBK) => {
              setActiveTab('siswa');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'pustaka' && (
          <MentalHealthLibrary
            isTeacherAuthenticated={isTeacherAuthenticated}
            onRequestTeacherLogin={() => setActiveTab('portal-bk')}
          />
        )}

        {activeTab === 'refleksi' && (
          <SelfAssessment
            onGoToForm={() => {
              setActiveTab('siswa');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToLibrary={() => {
              setActiveTab('pustaka');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'napas' && (
          <GuidedBreathing
            onGoToForm={() => {
              setActiveTab('siswa');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToAssessment={() => {
              setActiveTab('refleksi');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'syukur' && <DailyGratitude />}

        {activeTab === 'mood' && <MoodTracker />}

        {activeTab === 'tidur' && <SleepTracker />}

        {activeTab === 'panduan' && <ServiceGuide />}

        {activeTab === 'portal-bk' && (
          <AdminPortal
            records={records}
            onRecordsChange={setRecords}
            isAuthenticated={isTeacherAuthenticated}
            setIsAuthenticated={setIsTeacherAuthenticated}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <MessageSquareHeart className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-700">Ruang Cerita</span>
              <span>— Layanan Bimbingan & Konseling Madrasah</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600">
              <button
                onClick={() => setActiveTab('panduan')}
                className="hover:text-emerald-700 transition-colors"
              >
                Asas Kerahasiaan BK
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('pustaka')}
                className="hover:text-emerald-700 transition-colors"
              >
                Pustaka Kesehatan Mental
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('refleksi')}
                className="hover:text-emerald-700 transition-colors"
              >
                Refleksi Diri
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('napas')}
                className="hover:text-emerald-700 transition-colors"
              >
                Latihan Napas 4-7-8
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('syukur')}
                className="hover:text-emerald-700 transition-colors"
              >
                Jurnal Syukur Harian
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('mood')}
                className="hover:text-emerald-700 transition-colors"
              >
                Pelacak Mood
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('tidur')}
                className="hover:text-emerald-700 transition-colors"
              >
                Pelacak Tidur
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('guru-list')}
                className="hover:text-emerald-700 transition-colors"
              >
                9 Guru BK Pendamping
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('portal-bk')}
                className="hover:text-emerald-700 transition-colors font-medium flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                Portal Rekap BK
              </button>
            </div>

            <div className="text-slate-400 text-center md:text-right">
              &copy; {new Date().getFullYear()} Ruang Cerita. Menjaga rahasia, mendengar dengan hati.
            </div>
          </div>
        </div>
      </footer>

      <ShareQRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <CrisisSupport
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        onGoToCounselors={() => {
          setActiveTab('guru-list');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToForm={() => {
          setActiveTab('siswa');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <FocusSoundscape />
    </div>
  );
}
