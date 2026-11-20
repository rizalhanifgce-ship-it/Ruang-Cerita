import React, { useState, useMemo } from 'react';
import { Sparkles, Heart, RefreshCw, ChevronDown, ChevronUp, Trash2, Quote } from 'lucide-react';

const FAVORITE_AFFIRMATIONS_KEY = 'ruang_cerita_favorite_affirmations_v1';

interface AffirmationItem {
  id: string;
  text: string;
  tag: string;
}

const AFFIRMATIONS: AffirmationItem[] = [
  {
    id: 'aff-01',
    text: 'Setiap langkah kecil yang kamu ambil hari ini tetaplah sebuah kemajuan. Pelan-pelan tidak apa-apa.',
    tag: 'Semangat Harian',
  },
  {
    id: 'aff-02',
    text: 'Kamu berharga, perasaanmu valid, dan kamu tidak harus memikul beban pikiranmu sendirian.',
    tag: 'Penerimaan Diri',
  },
  {
    id: 'aff-03',
    text: 'Hari yang terasa berat bukan berarti masa depanmu suram. Tarik napas dalam, berdoa, dan beri dirimu ruang untuk beristirahat.',
    tag: 'Ketenangan',
  },
  {
    id: 'aff-04',
    text: 'Kesalahan saat belajar bukanlah tanda kegagalan, melainkan bagian alami dari proses bertumbuh.',
    tag: 'Belajar',
  },
  {
    id: 'aff-05',
    text: 'Tidak apa-apa untuk berkata cukup dan beristirahat sejenak saat pikiranmu mulai terasa penuh.',
    tag: 'Self-Care',
  },
  {
    id: 'aff-06',
    text: 'Keberanian bukan berarti tidak pernah merasa takut atau cemas, tetapi tetap melangkah meski hati sedang ragu.',
    tag: 'Keberanian',
  },
  {
    id: 'aff-07',
    text: 'Kamu tidak perlu menjadi sempurna untuk pantas dihargai, didengarkan, dan disayangi.',
    tag: 'Harga Diri',
  },
  {
    id: 'aff-08',
    text: 'Selalu ada guru, teman, dan orang-orang di madrasah yang siap mendengarkan dan mendukungmu.',
    tag: 'Dukungan',
  },
  {
    id: 'aff-09',
    text: 'Fokuslah pada hal-hal yang bisa kamu kendalikan hari ini, dan lepaskan kekhawatiran tentang hal di luar kuasamu.',
    tag: 'Mindfulness',
  },
  {
    id: 'aff-10',
    text: 'Kebaikan kecil yang kamu bagikan kepada teman hari ini bisa menjadi penguat besar bagi hatinya.',
    tag: 'Empati',
  },
];

function getInitialDailyIndex(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % AFFIRMATIONS.length;
}

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_AFFIRMATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const DailyAffirmation: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => getInitialDailyIndex());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds());
  const [showFavorites, setShowFavorites] = useState(false);

  const currentAffirmation = AFFIRMATIONS[currentIndex] || AFFIRMATIONS[0];
  const isFavorited = favoriteIds.includes(currentAffirmation.id);

  const favoriteItems = useMemo(
    () => AFFIRMATIONS.filter((a) => favoriteIds.includes(a.id)),
    [favoriteIds]
  );

  const handleRandomize = () => {
    if (AFFIRMATIONS.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * AFFIRMATIONS.length);
    if (nextIdx === currentIndex) {
      nextIdx = (currentIndex + 1) % AFFIRMATIONS.length;
    }
    setCurrentIndex(nextIdx);
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev];
      try {
        localStorage.setItem(FAVORITE_AFFIRMATIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Afirmasi Positif Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold">
                {currentAffirmation.tag}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed italic">
              &ldquo;{currentAffirmation.text}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <button
            type="button"
            onClick={() => toggleFavorite(currentAffirmation.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFavorited
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white hover:bg-rose-50/60 text-slate-700 border-slate-200'
            }`}
            title={isFavorited ? 'Hapus dari favorit' : 'Simpan ke afirmasi favorit'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{isFavorited ? 'Difavoritkan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={handleRandomize}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tampilkan kutipan penyemangat lainnya"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kutipan Lain</span>
          </button>
        </div>
      </div>

      {/* Saved Favorites Toggle */}
      <div className="mt-3 pt-3 border-t border-amber-200/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFavorites(!showFavorites)}
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Afirmasi Favorit Saya ({favoriteItems.length})</span>
          {showFavorites ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {showFavorites && (
        <div className="mt-3 space-y-2">
          {favoriteItems.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white/80 rounded-xl p-3 border border-slate-200/80">
              Belum ada afirmasi favorit. Tekan tombol &ldquo;Simpan&rdquo; untuk menyimpan kutipan yang paling menguatkanmu.
            </p>
          ) : (
            favoriteItems.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] mb-1">
                    {fav.tag}
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    &ldquo;{fav.text}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(fav.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                  title="Hapus dari favorit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
