import React, { useState, useEffect } from 'react';
import { COUNSELORS } from '../data/counselors';
import { CalendarClock, Clock, Edit3, Trash2, CheckCircle2, BellRing, Plus } from 'lucide-react';

const APPOINTMENT_KEY = 'ruang_cerita_upcoming_appointment_v1';

interface SavedAppointment {
  dateTime: string; // YYYY-MM-DDTHH:mm
  counselorName: string;
  note: string;
}

function loadAppointment(): SavedAppointment | null {
  try {
    const raw = localStorage.getItem(APPOINTMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedAppointment;
    if (parsed && parsed.dateTime) return parsed;
    return null;
  } catch {
    return null;
  }
}

function getDefaultDateTimeInput(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AppointmentCountdown: React.FC = () => {
  const [appointment, setAppointment] = useState<SavedAppointment | null>(() => loadAppointment());
  const [isEditing, setIsEditing] = useState(false);
  const [dateTimeInput, setDateTimeInput] = useState(
    () => loadAppointment()?.dateTime || getDefaultDateTimeInput()
  );
  const [counselorInput, setCounselorInput] = useState(
    () => loadAppointment()?.counselorName || COUNSELORS[0].name
  );
  const [noteInput, setNoteInput] = useState(
    () => loadAppointment()?.note || 'Sesi Konseling Ruang BK'
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!appointment) return undefined;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [appointment]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTimeInput) return;
    const next: SavedAppointment = {
      dateTime: dateTimeInput,
      counselorName: counselorInput || COUNSELORS[0].name,
      note: noteInput.trim() || 'Sesi Konseling Ruang BK',
    };
    try {
      localStorage.setItem(APPOINTMENT_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
    setAppointment(next);
    setNowMs(Date.now());
    setIsEditing(false);
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(APPOINTMENT_KEY);
    } catch {
      // ignore
    }
    setAppointment(null);
    setIsEditing(false);
  };

  const targetMs = appointment ? new Date(appointment.dateTime).getTime() : 0;
  const diffMs = targetMs - nowMs;
  const isValidDate = Boolean(appointment && !Number.isNaN(targetMs));
  const isPast = isValidDate && diffMs <= 0;
  const isSoon = isValidDate && diffMs > 0 && diffMs <= 15 * 60 * 1000;

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedSchedule =
    appointment && isValidDate
      ? new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(appointment.dateTime))
      : '';

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isPast || isSoon
                ? 'bg-amber-100 text-amber-700'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}
          >
            {isPast || isSoon ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <CalendarClock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Pengingat Jadwal Konseling Mendatang
              </h3>
              {appointment && isValidDate && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isPast
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isSoon
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}
                >
                  {isPast ? 'Waktunya Sesi' : isSoon ? 'Segera Dimulai' : 'Terjadwal'}
                </span>
              )}
            </div>
            {appointment && isValidDate ? (
              <p className="text-xs text-slate-600 mt-0.5">
                <strong className="text-slate-800">{appointment.note}</strong> bersama{' '}
                <strong className="text-emerald-700">{appointment.counselorName}</strong> •{' '}
                <span>{formattedSchedule} WIB</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Sudah punya janji temu dengan Guru BK madrasah? Catat waktunya di sini agar tidak terlewat.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {appointment && !isEditing && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Hapus pengingat jadwal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (appointment) {
                setDateTimeInput(appointment.dateTime);
                setCounselorInput(appointment.counselorName);
                setNoteInput(appointment.note);
              }
              setIsEditing(!isEditing);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {appointment ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Tutup' : 'Ubah Jadwal'}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Tutup' : 'Atur Jadwal Temu'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Countdown Display */}
      {appointment && isValidDate && !isEditing && (
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          {isPast ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Waktu pertemuan konselingmu sudah tiba! Silakan temui {appointment.counselorName} di Ruang BK madrasah atau hubungi via WhatsApp.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Hari', value: days },
                { label: 'Jam', value: hours },
                { label: 'Menit', value: minutes },
                { label: 'Detik', value: seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-2 text-center"
                >
                  <div className="text-lg sm:text-xl font-black text-emerald-700 tabular-nums leading-none">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Input Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Tanggal &amp; Jam Pertemuan
            </label>
            <input
              type="datetime-local"
              required
              value={dateTimeInput}
              onChange={(e) => setDateTimeInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Guru BK Pendamping
            </label>
            <select
              value={counselorInput}
              onChange={(e) => setCounselorInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {COUNSELORS.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Singkat
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Contoh: Konseling Ruang BK"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 cursor-pointer transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
