import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  X,
  Copy,
  Check,
  Download,
  RotateCcw,
  Smartphone,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  getQRSettings,
  saveQRSettings,
  getDefaultQRUrl,
  QRCodeSettings,
} from '../utils/storage';

interface ShareQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareQRModal: React.FC<ShareQRModalProps> = ({ isOpen, onClose }) => {
  const defaultUrl = getDefaultQRUrl();
  const [qrSettings, setQrSettings] = useState<QRCodeSettings>(() => getQRSettings());
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncSettings = () => setQrSettings(getQRSettings());
    window.addEventListener('ruang-cerita-qr-updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('ruang-cerita-qr-updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQrSettings(getQRSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanUrl = qrSettings.targetUrl.trim() || defaultUrl || 'https://ruang-cerita-madrasah';
  const isDevPreviewUrl = cleanUrl.includes('://ais-dev-');

  const updateUrl = (newUrl: string) => {
    const next = { ...qrSettings, targetUrl: newUrl };
    setQrSettings(next);
    saveQRSettings(next);
  };

  const handleCopyUrl = () => {
    if (!cleanUrl) return;
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleUsePublicUrl = () => {
    updateUrl(cleanUrl.replace('://ais-dev-', '://ais-pre-'));
  };

  const handleDownloadPosterPng = () => {
    const qrCanvas = qrWrapperRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    const poster = document.createElement('canvas');
    const width = 640;
    const height = 820;
    poster.width = width;
    poster.height = height;
    const ctx = poster.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top emerald header banner
    const grad = ctx.createLinearGradient(0, 0, width, 160);
    grad.addColorStop(0, '#059669');
    grad.addColorStop(1, '#0f766e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 170);

    // Header text
    ctx.fillStyle = '#d1fae5';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAYANAN BIMBINGAN & KONSELING MADRASAH', width / 2, 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px sans-serif';
    ctx.fillText((qrSettings.schoolLabel || 'RUANG CERITA').toUpperCase(), width / 2, 108);

    ctx.fillStyle = '#ecfdf5';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(qrSettings.subtitle || 'Pintu Aman Pengaduan & Konseling Siswa', width / 2, 142);

    // QR Code card border
    const qrSize = 360;
    const qrX = (width - qrSize) / 2;
    const qrY = 220;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = 4;
    ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Footer instruction
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Scan QR Code dengan Kamera HP', width / 2, 665);

    ctx.fillStyle = '#475569';
    ctx.font = '15px sans-serif';
    ctx.fillText(
      qrSettings.instruction || 'Arahkan kamera ponselmu ke kode di atas untuk langsung',
      width / 2,
      700
    );
    ctx.fillText('membuka formulir Ruang Cerita secara rahasia & aman.', width / 2, 724);

    // URL caption
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 13px monospace';
    const displayUrl = cleanUrl.length > 55 ? cleanUrl.slice(0, 52) + '...' : cleanUrl;
    ctx.fillText(displayUrl, width / 2, 775);

    const pngUrl = poster.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'qr_code_ruang_cerita_madrasah.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Bagikan via QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Scan langsung dengan kamera HP untuk membuka Ruang Cerita
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Preview Card */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 p-5 flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{qrSettings.schoolLabel}</span>
          </div>

          <div
            ref={qrWrapperRef}
            className="p-3 bg-white rounded-2xl border-2 border-emerald-100 shadow-md"
          >
            <QRCodeCanvas
              value={cleanUrl}
              size={208}
              bgColor="#ffffff"
              fgColor={qrSettings.fgColor || '#0f172a'}
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{qrSettings.instruction}</span>
          </div>
        </div>

        {/* Warning if still pointing to private ais-dev preview URL */}
        {isDevPreviewUrl && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold leading-snug">
                Tautan <code className="font-mono">ais-dev-</code> hanya bisa dibuka oleh pembuat aplikasi. Gunakan tautan publik agar siswa bisa memindai.
              </p>
              <button
                type="button"
                onClick={handleUsePublicUrl}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Ubah ke Tautan Publik (ais-pre)
              </button>
            </div>
          </div>
        )}

        {/* Editable URL Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Tautan Tujuan QR Code
            </label>
            {qrSettings.targetUrl !== defaultUrl && (
              <button
                type="button"
                onClick={() => updateUrl(defaultUrl)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Tautan Publik</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={qrSettings.targetUrl}
              onChange={(e) => updateUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              title="Salin tautan aplikasi"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition-colors"
              title="Uji buka tautan di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            Teks &amp; warna QR Code juga dapat disesuaikan melalui menu <strong>Kelola Data &rarr; Pengaturan QR Code</strong> di Portal BK.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadPosterPng}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Poster QR (.PNG)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
