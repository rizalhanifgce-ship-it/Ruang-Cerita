import React, { useState, useMemo, useEffect } from 'react';
import { LibraryResource, LibraryResourceCategory } from '../types';
import {
  getLibraryResources,
  addLibraryResource,
  deleteLibraryResource,
  incrementLibraryDownload,
  createBuiltinPdfBlobUrl,
  formatShortDate,
} from '../utils/storage';
import {
  BookOpen,
  FileText,
  Link2,
  Download,
  Search,
  PlusCircle,
  Trash2,
  ExternalLink,
  Upload,
  X,
  Eye,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

const SAVED_BOOKMARKS_KEY = 'ruang_cerita_saved_library_ids_v1';

function loadSavedResourceIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface MentalHealthLibraryProps {
  isTeacherAuthenticated: boolean;
  onRequestTeacherLogin: () => void;
}

const CATEGORY_META: Record<
  LibraryResourceCategory,
  { label: string; badgeClass: string }
> = {
  stres: {
    label: 'Stres & Ujian',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  perundungan: {
    label: 'Anti-Perundungan',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  emosi: {
    label: 'Regulasi Emosi',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  belajar: {
    label: 'Motivasi Belajar',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  pertemanan: {
    label: 'Pertemanan Sehat',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  umum: {
    label: 'Kesehatan Mental Umum',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MentalHealthLibrary: React.FC<MentalHealthLibraryProps> = ({
  isTeacherAuthenticated,
  onRequestTeacherLogin,
}) => {
  const [resources, setResources] = useState<LibraryResource[]>(() => getLibraryResources());
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedResourceIds());
  const [activeSubView, setActiveSubView] = useState<'all' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LibraryResourceCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'artikel'>('all');

  // Add Modal state (for teachers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'upload' | 'link'>('upload');
  const [resourceType, setResourceType] = useState<'pdf' | 'artikel'>('pdf');
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<LibraryResourceCategory>('stres');
  const [authorInput, setAuthorInput] = useState('Tim Guru BK Madrasah');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number | undefined>(undefined);
  const [formError, setFormError] = useState('');

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<LibraryResource | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');

  useEffect(() => {
    if (!previewItem) {
      setPreviewBlobUrl('');
      return;
    }

    if (previewItem.urlOrData.startsWith('builtin://')) {
      const url = createBuiltinPdfBlobUrl(
        previewItem.urlOrData,
        previewItem.title,
        previewItem.description
      );
      setPreviewBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    setPreviewBlobUrl(previewItem.urlOrData);
    return undefined;
  }, [previewItem]);

  const toggleSaveForLater = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev];
      try {
        localStorage.setItem(SAVED_BOOKMARKS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((item) => {
      const matchesSubView = activeSubView === 'all' || savedIds.includes(item.id);
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.resourceType === selectedType;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q);
      return matchesSubView && matchesCat && matchesType && matchesSearch;
    });
  }, [resources, activeSubView, savedIds, searchQuery, selectedCategory, selectedType]);

  const resetAddForm = () => {
    setSourceType('upload');
    setResourceType('pdf');
    setTitleInput('');
    setDescInput('');
    setCategoryInput('stres');
    setAuthorInput('Tim Guru BK Madrasah');
    setLinkUrlInput('');
    setUploadedDataUrl('');
    setUploadedFileName('');
    setUploadedFileSize(undefined);
    setFormError('');
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Mohon pilih berkas berformat PDF (.pdf).');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran PDF maksimal 2 MB agar dapat tersimpan di browser madrasah. Untuk file lebih besar, gunakan opsi Tautan Eksternal.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedDataUrl(reader.result);
        setUploadedFileName(file.name);
        setUploadedFileSize(file.size);
        if (!titleInput.trim()) {
          const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
          setTitleInput(cleanName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!titleInput.trim()) {
      setFormError('Judul materi wajib diisi.');
      return;
    }
    if (!descInput.trim()) {
      setFormError('Deskripsi singkat materi wajib diisi.');
      return;
    }

    if (sourceType === 'upload') {
      if (!uploadedDataUrl) {
        setFormError('Silakan unggah berkas PDF terlebih dahulu.');
        return;
      }
      const updated = addLibraryResource({
        title: titleInput.trim(),
        description: descInput.trim(),
        category: categoryInput,
        resourceType: 'pdf',
        sourceType: 'upload',
        urlOrData: uploadedDataUrl,
        fileName: uploadedFileName || `${titleInput.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSizeBytes: uploadedFileSize,
        authorName: authorInput.trim() || 'Tim Guru BK Madrasah',
      });
      setResources(updated);
    } else {
      const trimmedUrl = linkUrlInput.trim();
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        setFormError('Masukkan tautan URL yang valid diawali dengan http:// atau https://');
        return;
      }
      const updated = addLibraryResource({
        title: titleInput.trim(),
        description: descInput.trim(),
        category: categoryInput,
        resourceType,
        sourceType: 'link',
        urlOrData: trimmedUrl,
        authorName: authorInput.trim() || 'Tim Guru BK Madrasah',
      });
      setResources(updated);
    }

    resetAddForm();
    setIsAddModalOpen(false);
  };

  const handleDownloadResource = (item: LibraryResource) => {
    const updated = incrementLibraryDownload(item.id);
    setResources(updated);

    if (item.sourceType === 'upload') {
      const href = item.urlOrData.startsWith('builtin://')
        ? createBuiltinPdfBlobUrl(item.urlOrData, item.title, item.description)
        : item.urlOrData;
      const link = document.createElement('a');
      link.href = href;
      link.download = item.fileName || `${item.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (item.urlOrData.startsWith('builtin://')) {
        setTimeout(() => URL.revokeObjectURL(href), 2000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Pustaka Kesehatan Mental Madrasah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Sumber Bacaan &amp; Panduan PDF Siswa
            </h1>
            <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed">
              Jelajahi dan unduh modul PDF serta artikel pilihan dari Guru BK untuk membantumu mengelola stres, memahami emosi, dan menjaga kesehatan mental di madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isTeacherAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-sm shadow-lg transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Unggah PDF / Tambah Tautan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestTeacherLogin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Guru BK? Masuk untuk Unggah Materi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-View Switcher: Semua Materi vs Materi Tersimpan Saya */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setActiveSubView('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer ${
            activeSubView === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Semua Materi</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubView === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {resources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('saved')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer ${
            activeSubView === 'saved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Materi Tersimpan Saya</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubView === 'saved'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {resources.filter((r) => savedIds.includes(r.id)).length}
          </span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul panduan, topik kesehatan mental, atau penulis..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start">
            {[
              { id: 'all', label: 'Semua Tipe' },
              { id: 'pdf', label: 'Dokumen PDF' },
              { id: 'artikel', label: 'Artikel' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id as 'all' | 'pdf' | 'artikel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua Topik ({resources.length})
          </button>
          {(Object.keys(CATEGORY_META) as LibraryResourceCategory[]).map((catKey) => {
            const count = resources.filter((r) => r.category === catKey).length;
            const isActive = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_META[catKey].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          {activeSubView === 'saved' ? (
            <>
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Belum ada materi yang disimpan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Tekan tombol &ldquo;Simpan Nanti&rdquo; pada panduan PDF atau artikel yang ingin kamu baca ulang nanti.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubView('all')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Jelajahi Semua Materi
              </button>
            </>
          ) : (
            <>
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Belum ada materi yang cocok
              </h3>
              <p className="text-xs text-slate-500">
                Coba ubah kata kunci pencarian atau pilih kategori topik lainnya.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((item) => {
            const catMeta = CATEGORY_META[item.category] || CATEGORY_META.umum;
            const isPdf = item.resourceType === 'pdf';
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          isPdf
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-3 h-3" />
                        ) : (
                          <Link2 className="w-3 h-3" />
                        )}
                        {isPdf ? 'PDF' : 'Artikel'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSaveForLater(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          savedIds.includes(item.id)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title={
                          savedIds.includes(item.id)
                            ? 'Hapus dari Materi Tersimpan Saya'
                            : 'Simpan materi ini untuk dibaca nanti'
                        }
                      >
                        {savedIds.includes(item.id) ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersimpan</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Simpan Nanti</span>
                          </>
                        )}
                      </button>

                      {isTeacherAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deleteLibraryResource(item.id);
                            setResources(updated);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus materi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 truncate max-w-[60%]">
                      {item.authorName}
                    </span>
                    <span>
                      {formatShortDate(item.createdAt)}
                      {item.fileSizeBytes ? ` • ${formatFileSize(item.fileSizeBytes)}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.sourceType === 'upload' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Baca</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadResource(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF</span>
                        </button>
                      </>
                    ) : (
                      <a
                        href={item.urlOrData}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          const updated = incrementLibraryDownload(item.id);
                          setResources(updated);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka {isPdf ? 'PDF' : 'Artikel'}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH MATERI / UNGGAH PDF (KHUSUS GURU BK) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Tambah Materi Pustaka BK
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah file PDF atau bagikan tautan artikel kesehatan mental untuk siswa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResource} className="space-y-4">
              {/* Source mode */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSourceType('upload');
                    setResourceType('pdf');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    sourceType === 'upload'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah File PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('link')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    sourceType === 'link'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Tautan URL / Artikel</span>
                </button>
              </div>

              {sourceType === 'upload' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih File PDF (Maks. 2 MB) <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 cursor-pointer transition-colors">
                    {uploadedFileName ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-extrabold text-center break-all">
                          {uploadedFileName} ({formatFileSize(uploadedFileSize)})
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Klik untuk mengganti file PDF
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold">
                          Klik untuk memilih berkas .pdf
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipe Tautan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['pdf', 'artikel'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setResourceType(t)}
                          className={`py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            resourceType === t
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t === 'pdf' ? 'Tautan File PDF' : 'Tautan Artikel Web'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Tautan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={linkUrlInput}
                      onChange={(e) => setLinkUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Materi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Contoh: Panduan Mengelola Stres Menjelang Ujian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Topik
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as LibraryResourceCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {(Object.keys(CATEGORY_META) as LibraryResourceCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_META[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penyusun / Sumber
                  </label>
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    placeholder="Tim Guru BK Madrasah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Singkat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Jelaskan manfaat materi ini bagi siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan ke Pustaka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRATINJAU PDF */}
      {previewItem && previewBlobUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {previewItem.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {previewItem.authorName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadResource(previewItem)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={previewBlobUrl}
                title={previewItem.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
