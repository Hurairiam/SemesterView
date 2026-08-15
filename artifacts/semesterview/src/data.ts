import plan from '../../../attached_assets/ULAB_Summer2026_Complete_Semester_Plan_(1)_1786787795713.json';
import facultySource from '../../../attached_assets/ulab_cse_faculty_(1)_1786787795714.json';

export type ScheduleRow = {
  time_slot: string;
  course_code: string;
  section?: string | null;
  room?: string | null;
  faculty_codes?: string[];
  faculty_names?: string[];
  session_type_note?: string | null;
  session_category?: string | null;
  raw_text?: string;
  day?: string;
};

export type Faculty = {
  name: string;
  designation: string;
  department: string;
  status: string;
  photo_url?: string;
  profile_url?: string;
  education: string[];
  areas_of_interest: string[];
  courses_taught: string[];
  research_area_mapping?: string | null;
};

export type ResearchArea = {
  id: number;
  name: string;
  topics: string[];
  faculty: string[];
};

export const semesterPlan = plan as any;
export const facultyData = facultySource as any;
export const faculty = facultyData.faculty as Faculty[];
export const researchAreas = facultyData.research_area_categories as ResearchArea[];
export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const weeklyRows = days.flatMap((day) => {
  const sourceRows = semesterPlan.weekly_recurring_class_schedule?.[day];
  const rows = Array.isArray(sourceRows) ? (sourceRows as ScheduleRow[]) : [];
  return rows.map((row) => ({ ...row, day }));
});

export const uniqueRooms = Array.from(
  new Set(weeklyRows.map((row) => cleanTba(row.room)).filter(Boolean)),
).sort() as string[];

export function cleanTba(value?: string | null) {
  if (!value || value.trim().toUpperCase() === 'TBA') return 'TBA';
  return value.trim();
}

export function normalizeText(value?: string | null) {
  return (value ?? '').toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeCourseId(value?: string | null) {
  const raw = (value ?? '').toUpperCase();
  const dept = raw.match(/\b([A-Z]{2,4})\b/)?.[1] ?? 'COURSE';
  const numbers = raw.match(/\d{4}/g) ?? [];
  return `${dept} ${numbers.at(-1) ?? raw.replace(/[^A-Z0-9]/g, '').slice(-6)}`.trim();
}

export function displayCourseId(value?: string | null) {
  return normalizeCourseId(value);
}

export function normalizeFacultyName(value?: string | null) {
  return normalizeText(value)
    .replace(/\b(prof|professor|associate|assistant|lecturer|senior|phd|smieee|dr|mr|ms|mst)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMinutes(hour: number, minute: number, meridiem?: string) {
  let h = hour;
  const mer = meridiem?.toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return h * 60 + minute;
}

export function parseTimeRange(value?: string | null): [number, number] | null {
  if (!value) return null;
  const matches = [...value.toLowerCase().matchAll(/(\d{1,2})\s*(?::\s*(\d{1,2}))\s*(am|pm)?/g)];
  if (matches.length < 2) return null;
  const first = matches[0];
  const second = matches[1];
  const endMeridiem = second[3] ?? first[3];
  let start = toMinutes(Number(first[1]), Number(first[2]), first[3] ?? endMeridiem);
  let end = toMinutes(Number(second[1]), Number(second[2]), endMeridiem);
  if (end <= start && !first[3] && second[3]) {
    start = toMinutes(Number(first[1]), Number(first[2]), second[3] === 'am' ? 'am' : 'pm');
  }
  return end > start ? [start, end] : null;
}

export function formatMinutes(value: number) {
  const h = Math.floor(value / 60) % 24;
  const m = value % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function courseRows(courseIds: string[]) {
  const selected = new Set(courseIds);
  return weeklyRows.filter((row) => selected.has(normalizeCourseId(row.course_code)));
}

export const courseOptions = Array.from(
  new Map(
    weeklyRows.map((row) => [
      normalizeCourseId(row.course_code),
      {
        id: normalizeCourseId(row.course_code),
        raw: row.course_code,
        department: normalizeCourseId(row.course_code).split(' ')[0],
        sample: row,
      },
    ]),
  ).values(),
).sort((a, b) => a.id.localeCompare(b.id));

export const cseCourseOptions = courseOptions.filter((course) => course.department === 'CSE');

export function facultyMatchesRow(person: Faculty | string, row: ScheduleRow) {
  const target = normalizeFacultyName(typeof person === 'string' ? person : person.name);
  return [...(row.faculty_names ?? []), ...(row.faculty_codes ?? [])].some((value) => {
    const candidate = normalizeFacultyName(value);
    return candidate === target || (candidate.length > 2 && target.includes(candidate)) || (target.length > 2 && candidate.includes(target));
  });
}

export function initials(name: string) {
  const words = name.replace(/[,.-]/g, ' ').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'SV';
}

export function dateLabel(value?: string) {
  if (!value) return 'Date TBA';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function storage<T>(key: string, fallback: T): [() => T, (value: T) => void] {
  return [
    () => {
      try {
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : fallback;
      } catch {
        return fallback;
      }
    },
    (value) => localStorage.setItem(key, JSON.stringify(value)),
  ];
}
