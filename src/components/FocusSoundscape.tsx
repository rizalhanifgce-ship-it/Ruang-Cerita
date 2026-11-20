import React, { useState, useRef, useEffect } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CloudRain,
  Wind,
  Radio,
  ChevronDown,
} from 'lucide-react';

type SoundPresetId = 'rain' | 'white' | 'brown';

interface SoundPreset {
  id: SoundPresetId;
  label: string;
  desc: string;
  icon: 'rain' | 'white' | 'brown';
}

const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'rain',
    label: 'Hujan Lembut',
    desc: 'Suara rintik hujan yang menenangkan',
    icon: 'rain',
  },
  {
    id: 'white',
    label: 'White Noise',
    desc: 'Membantu fokus saat membaca & menulis',
    icon: 'white',
  },
  {
    id: 'brown',
    label: 'Angin Tenang',
    desc: 'Frekuensi rendah yang hangat & rileks',
    icon: 'brown',
  },
];

export const FocusSoundscape: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preset, setPreset] = useState<SoundPresetId>('rain');
  const [volume, setVolume] = useState(0.35);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
  };

  const startAudio = (selectedPreset: SoundPresetId, targetVolume: number) => {
    stopAudio();

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Generate 3-second seamless noise buffer
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (selectedPreset === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
    } else if (selectedPreset === 'rain') {
      // Pink-ish noise for gentle rain
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
      }
    } else {
      // Brown noise for deep calm wind
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.4;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value =
      selectedPreset === 'rain' ? 1100 : selectedPreset === 'white' ? 2400 : 480;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    sourceNodeRef.current = source;
    gainNodeRef.current = gain;
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        volume,
        audioCtxRef.current.currentTime,
        0.08
      );
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(preset, volume);
      setIsPlaying(true);
    }
  };

  const handleSelectPreset = (nextPreset: SoundPresetId) => {
    setPreset(nextPreset);
    if (isPlaying) {
      startAudio(nextPreset, volume);
    }
  };

  return (
    <div className="no-print fixed bottom-5 left-5 z-40">
      {isExpanded && (
        <div className="mb-2.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Suara Fokus &amp; Tenang
                </h4>
                <p className="text-[10px] text-slate-500">
                  Audio latar untuk menulis &amp; refleksi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Perkecil pemutar audio"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Preset List */}
          <div className="space-y-1.5">
            {SOUND_PRESETS.map((item) => {
              const isSelected = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPreset(item.id)}
                  className={`w-full px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  {item.icon === 'rain' ? (
                    <CloudRain className="w-4 h-4 text-teal-600 shrink-0" />
                  ) : item.icon === 'white' ? (
                    <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Wind className="w-4 h-4 text-cyan-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume & Play Controls */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Putar</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 flex-1">
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
                aria-label="Volume suara fokus"
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact Floating Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-lg transition-all cursor-pointer text-xs font-extrabold ${
          isPlaying
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
            : 'bg-white/95 backdrop-blur-xs text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-800'
        }`}
        title="Buka Audio Latar Fokus & Tenang"
      >
        <Headphones className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-emerald-100' : 'text-emerald-600'}`} />
        <span>{isPlaying ? 'Fokus Aktif' : 'Fokus & Tenang'}</span>
      </button>
    </div>
  );
};
