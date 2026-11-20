import { StudentMood } from '../types';

export interface MoodOption {
  id: StudentMood;
  emoji: string;
  label: string;
  badgeClass: string;
  barClass: string;
}

export const STUDENT_MOODS: MoodOption[] = [
  {
    id: 'senang',
    emoji: '😊',
    label: 'Senang',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barClass: 'bg-emerald-500',
  },
  {
    id: 'tenang',
    emoji: '😌',
    label: 'Tenang',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    barClass: 'bg-teal-500',
  },
  {
    id: 'bingung',
    emoji: '😕',
    label: 'Bingung',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    barClass: 'bg-amber-500',
  },
  {
    id: 'cemas',
    emoji: '😰',
    label: 'Cemas',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    barClass: 'bg-orange-500',
  },
  {
    id: 'sedih',
    emoji: '😢',
    label: 'Sedih',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    barClass: 'bg-sky-500',
  },
  {
    id: 'marah',
    emoji: '😠',
    label: 'Kesal',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    barClass: 'bg-rose-500',
  },
];

export function getMoodMeta(mood?: StudentMood): MoodOption | undefined {
  if (!mood) return undefined;
  return STUDENT_MOODS.find((m) => m.id === mood);
}
