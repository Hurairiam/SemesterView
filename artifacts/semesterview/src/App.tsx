import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Search,
  Send,
  Settings2,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  type Faculty,
  type ScheduleRow,
  cleanTba,
  courseOptions,
  courseRows,
  dateLabel,
  days,
  displayCourseId,
  faculty,
  facultyMatchesRow,
  formatMinutes,
  initials,
  normalizeCourseId,
  normalizeFacultyName,
  parseTimeRange,
  researchAreas,
  semesterPlan,
  uniqueRooms,
  weeklyRows,
} from '@/data';

const queryClient = new QueryClient();
const STORAGE = {
  session: 'semesterview.session',
  courses: 'semesterview.selected-courses',
  advisor: 'semesterview.advisor',
  interests: 'semesterview.research-interests',
};

type Session = { role: 'student' | 'teacher'; id?: string; facultyName?: string };
type Icon = typeof LayoutDashboard;

function readJson<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayName() {
  return days[new Date().getDay()];
}

function NavIcon({ icon: Icon }: { icon: Icon }) {
  return <Icon size={17} strokeWidth={1.8} />;
}

function Avatar({ name, image, size = 'md' }: { name: string; image?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
  return image ? (
    <img src={image} alt={name} className={`${dimensions} rounded-2xl object-cover bg-secondary`} />
  ) : (
    <div className={`${dimensions} rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold tracking-tight`}>
      {initials(name)}
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: 'primary' | 'soft' | 'ghost' | 'outline' | 'accent';
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-md',
    soft: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    outline: 'border border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-card',
    accent: 'bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-md',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-card-border bg-card shadow-[var(--shadow-sm)] ${className}`}>{children}</section>;
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end animate-rise">
      <div>
        <div className="mono mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-primary">{eyebrow}</div>
        <h1 className="serif text-4xl leading-none tracking-tight text-foreground md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: Icon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="soft-grid flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={21} /></div>
      <h3 className="text-base font-extrabold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function RowCard({ row, compact = false }: { row: ScheduleRow; compact?: boolean }) {
  const range = parseTimeRange(row.time_slot);
  return (
    <div className={`group flex gap-3 border-b border-border/70 py-3 last:border-0 ${compact ? '' : 'md:gap-5'}`}>
      <div className="mono w-[76px] shrink-0 pt-0.5 text-[10px] leading-4 text-muted-foreground">{row.time_slot}</div>
      <div className="min-w-0 flex-1 border-l-2 border-accent/60 pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight">{displayCourseId(row.course_code)}</span>
          {row.session_category && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">{row.session_category}</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{cleanTba(row.room)}</span>
          <span>Section {row.section || 'TBA'}</span>
          {range && <span className="hidden text-primary/70 lg:inline">{formatMinutes(range[0])}–{formatMinutes(range[1])}</span>}
        </div>
        {!compact && row.faculty_names?.[0] && <div className="mt-1 text-xs text-muted-foreground">{cleanTba(row.faculty_names[0])}</div>}
      </div>
      <ArrowRight className="mt-1 text-border transition-transform group-hover:translate-x-1 group-hover:text-primary" size={15} />
    </div>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const session = readJson<Session | null>(STORAGE.session, null);
  const isTeacher = session?.role === 'teacher' || location.startsWith('/teacher');
  const roleRoot = isTeacher ? '/teacher/dashboard' : '/student/dashboard';
  const [searchOpen, setSearchOpen] = useState(false);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const results: { type: string; title: string; detail: string; href: string }[] = [];
    courseOptions.filter((x) => `${x.id} ${x.raw}`.toLowerCase().includes(query)).slice(0, 4).forEach((x) => results.push({ type: 'Course', title: x.id, detail: x.raw, href: isTeacher ? '/teacher/schedule' : '/student/courses' }));
    faculty.filter((x) => `${x.name} ${x.designation}`.toLowerCase().includes(query)).slice(0, 4).forEach((x) => results.push({ type: 'Faculty', title: x.name, detail: x.designation, href: '/student/faculty' }));
    researchAreas.filter((x) => `${x.name} ${x.topics.join(' ')}`.toLowerCase().includes(query)).slice(0, 3).forEach((x) => results.push({ type: 'Research', title: x.name, detail: x.topics.slice(0, 2).join(' · '), href: '/student/research' }));
    uniqueRooms.filter((x) => x.toLowerCase().includes(query)).slice(0, 3).forEach((x) => results.push({ type: 'Room', title: x, detail: 'Room occupancy finder', href: '/student/rooms' }));
    return results.slice(0, 8);
  }, [isTeacher, search]);
  const studentNav = [
    { href: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/student/courses', label: 'My courses', icon: BookOpen },
    { href: '/student/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/student/rooms', label: 'Free rooms', icon: MapPin },
    { href: '/student/exams', label: 'Exams', icon: Clock3 },
    { href: '/student/calendar', label: 'Academic calendar', icon: Library },
    { href: '/student/faculty', label: 'Faculty', icon: UsersRound },
    { href: '/student/research', label: 'Research', icon: FlaskConical },
    { href: '/student/advisor', label: 'Advisor', icon: MessageCircle },
    { href: '/student/connect', label: 'CSE Connect', icon: Monitor },
  ];
  const teacherNav = [
    { href: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/teacher/schedule', label: 'Teaching schedule', icon: CalendarDays },
    { href: '/teacher/research', label: 'Research spaces', icon: FlaskConical },
    { href: '/teacher/profile', label: 'My profile', icon: UsersRound },
  ];
  const nav = isTeacher ? teacherNav : studentNav;
  const logout = () => {
    localStorage.removeItem(STORAGE.session);
    setLocation('/login');
  };
  return (
    <div className="app-grain min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[246px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[88px] items-center gap-3 border-b border-sidebar-border px-7">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"><span className="serif text-2xl italic">S</span><span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent" /></div>
          <div><div className="font-extrabold tracking-tight">Semester<span className="text-sidebar-primary">View</span></div><div className="mono mt-0.5 text-[9px] uppercase tracking-[.17em] text-sidebar-foreground/50">ULAB · CSE</div></div>
        </div>
        <div className="px-4 pt-7">
          <div className="mono mb-3 px-3 text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">{isTeacher ? 'Faculty desk' : 'Your semester'}</div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = location === item.href || (location.startsWith(item.href) && item.href !== roleRoot);
              return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}><NavIcon icon={item.icon} /><span>{item.label}</span>{item.label === 'Research' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="mb-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="flex items-center gap-2 text-sidebar-primary"><Sparkles size={14} /><span className="text-xs font-bold">Summer 2026</span></div>
            <p className="mt-2 text-[11px] leading-5 text-sidebar-foreground/55">A lighter way to hold the semester together.</p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut size={16} />Sign out</button>
        </div>
      </aside>
      <div className="lg:pl-[246px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="font-bold text-foreground">{isTeacher ? 'Faculty desk' : 'Student command center'}</span><span>/</span><span>Summer 2026</span></div>
            <div className="md:hidden font-extrabold tracking-tight">Semester<span className="text-primary">View</span></div>
          </div>
          <div className="relative flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} placeholder="Search anything" className="h-10 w-52 rounded-xl border border-border bg-card/65 pl-9 pr-3 text-xs outline-none transition-all placeholder:text-muted-foreground/70 focus:w-64 focus:border-primary/45 focus:ring-4 focus:ring-primary/10" />
              {searchOpen && search && <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-lg)]">
                {searchResults.length ? searchResults.map((result) => <Link key={`${result.type}-${result.title}`} href={result.href} onClick={() => { setSearchOpen(false); setSearch(''); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Search size={14} /></div><div className="min-w-0"><div className="text-xs font-bold">{result.title}</div><div className="truncate text-[10px] text-muted-foreground">{result.type} · {result.detail}</div></div></Link>) : <div className="px-3 py-5 text-center text-xs text-muted-foreground">No records found in the local semester data.</div>}
              </div>}
            </div>
            <button className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <Avatar name={session?.facultyName || session?.id || 'Student'} size="sm" />
              <div className="hidden leading-tight sm:block"><div className="max-w-[130px] truncate text-xs font-bold">{session?.facultyName || 'CSE student'}</div><div className="mono mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{isTeacher ? 'Faculty' : session?.id || 'Demo profile'}</div></div>
              <ChevronDown size={14} className="hidden text-muted-foreground sm:block" />
            </div>
          </div>
        </header>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-sidebar/95 p-5 pt-20 text-sidebar-foreground lg:hidden">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><span className="serif text-2xl italic">S</span></div><div className="font-extrabold">Semester<span className="text-sidebar-primary">View</span></div></div>
          <nav className="space-y-1">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold hover:bg-sidebar-accent"><NavIcon icon={item.icon} />{item.label}</Link>)}</nav>
          <button onClick={logout} className="mt-8 flex items-center gap-3 px-4 py-3 text-sm text-sidebar-foreground/70"><LogOut size={16} />Sign out</button>
        </div>}
        <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[1440px] px-4 py-7 pb-24 md:px-8 md:py-10 lg:pb-10">{children}</main>
        <div className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 px-1 backdrop-blur-xl lg:hidden">
          {nav.slice(0, 5).map((item) => <Link key={item.href} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-bold ${location === item.href ? 'text-primary' : 'text-muted-foreground'}`}><NavIcon icon={item.icon} /><span>{item.label.split(' ')[0]}</span></Link>)}
        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const session = readJson<Session | null>(STORAGE.session, null);
    setLocation(session?.role === 'teacher' ? '/teacher/dashboard' : session ? '/student/dashboard' : '/login');
  }, [setLocation]);
  return <div className="min-h-[100dvh] bg-background" />;
}

function Login() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [studentId, setStudentId] = useState('');
  const [teacherName, setTeacherName] = useState(faculty[0]?.name ?? '');
  const [error, setError] = useState('');
  const activeTeachers = faculty.filter((person) => person.status === 'active');
  const login = (nextId = studentId) => {
    if (role === 'student') {
      const normalized = nextId.replace(/[^0-9]/g, '');
      if (normalized.length < 8 || !normalized.includes('014')) {
        setError('Enter a valid ULAB CSE ID. The department code 014 should appear in your ID.');
        return;
      }
      writeJson(STORAGE.session, { role: 'student', id: nextId });
      setLocation('/student/dashboard');
    } else {
      writeJson(STORAGE.session, { role: 'teacher', facultyName: teacherName });
      setLocation('/teacher/dashboard');
    }
  };
  return (
    <div className="app-grain min-h-[100dvh] overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1500px] lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative hidden overflow-hidden border-r border-sidebar-border p-12 lg:flex lg:flex-col lg:justify-between xl:p-20">
          <div className="absolute -right-36 top-24 h-[420px] w-[420px] rounded-full border border-sidebar-primary/20" /><div className="absolute -right-20 top-40 h-[260px] w-[260px] rounded-full border border-sidebar-primary/20" />
          <div className="relative"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><span className="serif text-3xl italic">S</span></div><div className="text-lg font-extrabold">Semester<span className="text-sidebar-primary">View</span></div></div></div>
          <div className="relative max-w-xl"><div className="mono mb-5 text-[10px] uppercase tracking-[.22em] text-sidebar-primary">A calmer semester starts here</div><h1 className="serif text-6xl leading-[.92] tracking-tight xl:text-8xl">See the shape of your semester.</h1><p className="mt-7 max-w-md text-sm leading-7 text-sidebar-foreground/60">One considered place for classes, rooms, deadlines, people, and the questions worth asking next.</p><div className="mt-10 flex items-center gap-8 text-xs text-sidebar-foreground/55"><span><b className="block text-xl text-sidebar-primary">16</b>weeks in view</span><span><b className="block text-xl text-sidebar-primary">014</b>CSE, ULAB</span><span><b className="block text-xl text-sidebar-primary">1</b>local source</span></div></div>
          <div className="relative mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/35">Summer 2026 · Undergraduate command center</div>
        </div>
        <div className="flex items-center justify-center bg-background px-5 py-10 text-foreground md:px-12">
          <div className="w-full max-w-[440px] animate-rise">
            <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><span className="serif text-2xl italic">S</span></div><div className="font-extrabold">Semester<span className="text-primary">View</span></div></div>
            <div className="mono mb-3 text-[10px] uppercase tracking-[.2em] text-primary">Welcome to your desk</div><h2 className="serif text-5xl leading-none">Make the semester legible.</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Choose a demo role to enter the local ULAB CSE prototype.</p>
            <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
              <button onClick={() => { setRole('student'); setError(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold transition-all ${role === 'student' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}><span className="flex items-center justify-center gap-2"><GraduationCap size={16} />Student</span></button>
              <button onClick={() => { setRole('teacher'); setError(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold transition-all ${role === 'teacher' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}><span className="flex items-center justify-center gap-2"><UsersRound size={16} />Teacher</span></button>
            </div>
            {role === 'student' ? <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); login(); }}>
              <label className="block text-xs font-bold text-foreground">Student ID<span className="ml-1 text-primary">*</span><div className="relative mt-2"><input value={studentId} onChange={(event) => { setStudentId(event.target.value); setError(''); }} placeholder="e.g. 221014001" className="h-13 w-full rounded-xl border border-input bg-card px-4 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /></div></label>
              <p className="text-[11px] leading-5 text-muted-foreground">Demo validation checks the ULAB department code <b className="text-primary">014</b> for CSE.</p>
              {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive">{error}</div>}
              <Button type="submit" className="h-12 w-full">Enter student desk <ArrowRight size={16} /></Button>
              <button type="button" onClick={() => login('221014001')} className="w-full text-center text-xs font-bold text-primary hover:underline">Use demo student ID</button>
            </form> : <div className="mt-6 space-y-4">
              <label className="block text-xs font-bold">Choose a faculty profile<div className="relative mt-2"><select value={teacherName} onChange={(event) => setTeacherName(event.target.value)} className="h-13 w-full appearance-none rounded-xl border border-input bg-card px-4 pr-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">{activeTeachers.map((person) => <option key={person.name} value={person.name}>{person.name} · {person.designation}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /></div></label>
              <p className="text-[11px] leading-5 text-muted-foreground">Teacher schedules are derived from the actual recurring rows matched to this faculty record.</p><Button onClick={() => login()} className="h-12 w-full">Open faculty desk <ArrowRight size={16} /></Button>
            </div>}
            <div className="mt-10 flex items-center gap-2 text-[10px] text-muted-foreground"><CircleHelp size={13} />Local prototype · no Google OAuth · no credentials stored</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const session = readJson<Session | null>(STORAGE.session, null);
  const [selected] = useState<string[]>(readJson(STORAGE.courses, []));
  const rows = courseRows(selected);
  const upcoming = (semesterPlan.academic_calendar ?? []).filter((event: any) => event.date || event.start_date).slice(0, 3);
  const nextExam = (semesterPlan.midterm_exam_schedule?.by_date ?? []).find((day: any) => day.exams?.some((exam: any) => selected.includes(normalizeCourseId(exam.course_code))));
  return <><PageHeader eyebrow="Student / overview" title={`Good to see you${session?.id ? `, ${session.id}` : ''}.`} description="Your semester, reduced to the things worth seeing today." action={<Link href="/student/courses" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md">Edit course desk <ArrowRight size={16} /></Link>} />
    <div className="grid gap-4 md:grid-cols-3 animate-rise animate-rise-delay-1">
      <Surface className="relative overflow-hidden bg-primary p-5 text-primary-foreground"><div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border border-primary-foreground/15" /><div className="relative"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60">My courses</div><div className="mt-4 text-4xl font-extrabold">{selected.length.toString().padStart(2, '0')}</div><div className="mt-1 text-xs text-primary-foreground/65">{selected.length ? 'courses shaping this week' : 'start by selecting your courses'}</div><Link href="/student/courses" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-sidebar-primary hover:gap-3 transition-all">Open course desk <ArrowRight size={14} /></Link></div></Surface>
      <Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">This week</div><div className="mt-4 text-4xl font-extrabold">{rows.length.toString().padStart(2, '0')}</div><div className="mt-1 text-xs text-muted-foreground">class meetings in your view</div><Link href="/student/schedule" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary">See weekly rhythm <ArrowRight size={14} /></Link></Surface>
      <Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Next checkpoint</div><div className="mt-4 text-xl font-extrabold">{nextExam ? dateLabel(nextExam.date) : 'Jun 28'}</div><div className="mt-1 text-xs text-muted-foreground">{nextExam ? 'midterm exam day' : 'midterm window opens'}</div><Link href="/student/exams" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary">View exam timeline <ArrowRight size={14} /></Link></Surface>
    </div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Surface className="p-5 md:p-6"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">Today · {todayName()}</div><h2 className="serif mt-2 text-3xl">The next few hours.</h2></div><Link href="/student/schedule" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><ArrowRight size={18} /></Link></div>
        <div className="mt-5">{rows.filter((row) => row.day === todayName()).slice(0, 4).map((row, index) => <div key={`${row.raw_text}-${index}`} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}><RowCard row={row} /></div>)}{!rows.filter((row) => row.day === todayName()).length && <EmptyState icon={CalendarDays} title={selected.length ? 'A quiet day on your plan.' : 'Your schedule is waiting.'} body={selected.length ? 'No selected course meets today. Use the weekly view to see the whole rhythm.' : 'Select the courses you are taking and SemesterView will build this view from the source schedule.'} action={<Link href={selected.length ? '/student/schedule' : '/student/courses'} className="text-xs font-bold text-primary hover:underline">{selected.length ? 'Open weekly schedule' : 'Select courses'}</Link>} />}</div>
      </Surface>
      <Surface className="p-5 md:p-6"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">On the horizon</div><h2 className="serif mt-2 text-3xl">Keep an eye on it.</h2><div className="mt-5 space-y-1">{upcoming.map((event: any, index: number) => <div key={`${event.event}-${index}`} className="flex gap-3 border-b border-border py-3 last:border-0"><div className="mono w-14 shrink-0 pt-1 text-[10px] text-muted-foreground">{event.date ? event.date.slice(5).replace('-', '/') : event.start_date?.slice(5).replace('-', '/')}</div><div><div className="text-xs font-bold leading-5">{event.event}</div><div className="mt-1 text-[10px] text-muted-foreground">{event.day || event.days || 'Semester milestone'}</div></div></div>)} </div><Link href="/student/calendar" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Full academic calendar <ArrowRight size={14} /></Link></Surface>
    </div>
    <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/10 p-5 md:flex md:items-center md:justify-between md:p-6"><div><div className="flex items-center gap-2 text-xs font-extrabold text-accent"><Sparkles size={15} />One useful next step</div><p className="mt-2 text-sm font-semibold">Choose an advisor and make the semester feel less anonymous.</p></div><Link href="/student/advisor" className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-accent md:mt-0">Browse CSE faculty <ArrowRight size={14} /></Link></div>
  </>;
}

function Courses() {
  const [selected, setSelected] = useState<string[]>(readJson(STORAGE.courses, []));
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('CSE');
  const departments = Array.from(new Set(courseOptions.map((course) => course.department))).sort();
  const filtered = courseOptions.filter((course) => (department === 'ALL' || course.department === department) && `${course.id} ${course.raw}`.toLowerCase().includes(query.toLowerCase())).slice(0, 90);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  useEffect(() => writeJson(STORAGE.courses, selected), [selected]);
  return <><PageHeader eyebrow="Student / course desk" title="Build your semester." description="Pick the course IDs you actually carry. Your schedule, rooms, and exam view will follow this selection." action={<div className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-extrabold text-primary">{selected.length} selected</div>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
      <Surface className="overflow-hidden"><div className="border-b border-border p-4 md:p-5"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course ID or source text" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></div><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary">{['CSE', ...departments.filter((item) => item !== 'CSE'), 'ALL'].map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All departments' : `${item} courses`}</option>)}</select></div><div className="mt-3 text-[11px] text-muted-foreground">Showing source schedule records, grouped into normalized course IDs. Raw course codes remain available on each card.</div></div>
        <div className="grid gap-2 p-4 md:grid-cols-2 md:p-5">{filtered.map((course) => { const checked = selected.includes(course.id); return <button key={course.id} onClick={() => toggle(course.id)} className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${checked ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'}`}><Check size={13} strokeWidth={3} /></span><span className="min-w-0"><span className="block text-sm font-extrabold">{course.id}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{course.raw}</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary"><MapPin size={11} />{cleanTba(course.sample.room)}</span></span></button>; })}</div>
        {!filtered.length && <div className="p-8"><EmptyState icon={BookOpen} title="No course records match." body="Try a simpler course ID, or switch the department filter." /></div>}
      </Surface>
      <div className="space-y-5"><Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">Your selections</div><h2 className="serif mt-2 text-3xl">{selected.length ? 'A clear starting point.' : 'Nothing set yet.'}</h2>{selected.length ? <div className="mt-5 space-y-2">{selected.map((id) => <div key={id} className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5"><span className="text-xs font-extrabold">{id}</span><button onClick={() => toggle(id)} className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-destructive"><X size={14} /></button></div>)}</div> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Course selection is saved on this device and drives every personalized view.</p>}</Surface><Surface className="soft-grid p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Settings2 size={16} /></div><h3 className="mt-4 text-sm font-extrabold">How this works</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">A course can have multiple sections in the source. SemesterView keeps the actual recurring rows so room and faculty context stays honest.</p></Surface></div>
    </div>
  </>;
}

function Schedule() {
  const [selected] = useState<string[]>(readJson(STORAGE.courses, []));
  const [day, setDay] = useState(todayName());
  const rows = courseRows(selected).filter((row) => row.day === day).sort((a, b) => (parseTimeRange(a.time_slot)?.[0] ?? 0) - (parseTimeRange(b.time_slot)?.[0] ?? 0));
  return <><PageHeader eyebrow="Student / schedule" title="Your weekly rhythm." description="Only the course rows you chose, with the source time and room left intact." action={<Link href="/student/rooms" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:border-primary/50"><MapPin size={16} />Find a free room</Link>} />
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">{days.map((item) => <button key={item} onClick={() => setDay(item)} className={`min-w-[74px] flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${day === item ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}><span className="block text-[10px] uppercase tracking-wide">{item.slice(0, 3)}</span><span className="mt-1 block">{item === todayName() ? 'Today' : 'Week'}</span></button>)}</div>
    <Surface className="p-5 md:p-7"><div className="mb-3 flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">{day}</div><h2 className="serif mt-2 text-3xl">{rows.length ? `${rows.length} meetings on the grid.` : 'A little breathing room.'}</h2></div><div className="rounded-lg bg-secondary px-2.5 py-1.5 text-[10px] font-bold text-primary">{selected.length} course IDs</div></div>{rows.length ? <div className="mt-5 max-w-3xl">{rows.map((row, index) => <div key={`${row.raw_text}-${index}`} className="animate-rise" style={{ animationDelay: `${index * 45}ms` }}><RowCard row={row} /></div>)}</div> : <div className="mt-5"><EmptyState icon={CalendarDays} title={selected.length ? `No selected classes on ${day}.` : 'Select courses to reveal your week.'} body={selected.length ? 'That quiet space is based on the actual Summer 2026 recurring rows.' : 'Your weekly schedule is generated from the course desk, never from a static mock.'} action={<Link href="/student/courses" className="text-xs font-bold text-primary hover:underline">Open course desk</Link>} /></div>}</Surface>
  </>;
}

function Rooms() {
  const [day, setDay] = useState(todayName());
  const slots = Array.from(new Set(weeklyRows.filter((row) => row.day === day).map((row) => row.time_slot)));
  const [slot, setSlot] = useState(slots[0] ?? '');
  useEffect(() => { if (!slots.includes(slot)) setSlot(slots[0] ?? ''); }, [day, slot, slots]);
  const targetRange = parseTimeRange(slot);
  const occupied = weeklyRows.filter((row) => row.day === day && targetRange && parseTimeRange(row.time_slot) && parseTimeRange(row.time_slot)!.some((point, index) => index === 0 ? point < targetRange[1] : point > targetRange[0]));
  const occupiedRooms = new Set(occupied.map((row) => cleanTba(row.room)).filter((room) => room !== 'TBA'));
  const available = uniqueRooms.filter((room) => !occupiedRooms.has(room));
  return <><PageHeader eyebrow="Student / room finder" title="Find a little room." description="Availability is calculated from overlapping time ranges in the actual recurring schedule, not a hand-maintained list." action={<div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-primary"><span className="h-2 w-2 rounded-full bg-primary" />{available.length} open now</div>} />
    <Surface className="mb-6 p-4 md:p-5"><div className="grid gap-3 md:grid-cols-[180px_1fr]"><div><label className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Day</label><select value={day} onChange={(event) => setDay(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold outline-none focus:border-primary">{days.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Time window</label><select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold outline-none focus:border-primary">{slots.map((item) => <option key={item}>{item}</option>)}{!slots.length && <option>No scheduled slots</option>}</select></div></div></Surface>
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]"><Surface className="p-5 md:p-7"><div className="flex items-end justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">{day} · {slot || 'time TBA'}</div><h2 className="serif mt-2 text-3xl">Open rooms</h2></div><div className="mono text-xs text-muted-foreground">{occupiedRooms.size} occupied / {uniqueRooms.length} tracked</div></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{available.map((room) => <div key={room} className="group rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex items-center justify-between"><MapPin size={15} className="text-primary" /><span className="h-2 w-2 rounded-full bg-primary/70" /></div><div className="mt-5 text-sm font-extrabold">{room}</div><div className="mt-1 text-[10px] text-muted-foreground">available in this window</div></div>)}</div>{!available.length && <div className="mt-5"><EmptyState icon={MapPin} title="Every tracked room is occupied." body="Try the next source time window or a different day." /></div>}</Surface><Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-accent">Occupancy note</div><h3 className="serif mt-2 text-3xl">Use the gaps.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">SemesterView treats time ranges as overlapping when they cross. Rooms marked TBA are excluded from both sides of the finder.</p><div className="mt-6 border-t border-border pt-4"><div className="text-xs font-bold">Currently occupied</div><div className="mt-3 space-y-2">{occupied.slice(0, 5).map((row, index) => <div key={`${row.raw_text}-${index}`} className="flex items-center justify-between text-xs"><span className="font-semibold">{cleanTba(row.room)}</span><span className="text-muted-foreground">{displayCourseId(row.course_code)}</span></div>)}{!occupied.length && <div className="text-xs text-muted-foreground">No overlaps in this selection.</div>}</div></div></Surface></div>
  </>;
}

function Exams() {
  const [selected] = useState<string[]>(readJson(STORAGE.courses, []));
  const examDays = (semesterPlan.midterm_exam_schedule?.by_date ?? []) as any[];
  const exams = examDays.flatMap((day: any) => (day.exams ?? []).filter((exam: any) => !selected.length || selected.includes(normalizeCourseId(exam.course_code))).map((exam: any) => ({ ...exam, date: day.date, day: day.day })));
  return <><PageHeader eyebrow="Student / exams" title="The exam line." description="A date-first view of the Summer 2026 midterm window, narrowed to your selected courses when you have them." action={<div className="rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-bold text-accent">{exams.length} exam rows</div>} /><Surface className="p-5 md:p-7"><div className="mb-6 rounded-xl bg-secondary/60 p-4 text-xs leading-5 text-secondary-foreground">{semesterPlan.midterm_exam_schedule?.note || 'Midterm schedule from the supplied semester plan.'}</div><div className="space-y-7">{examDays.map((day: any) => { const dayExams = exams.filter((exam) => exam.date === day.date); return <div key={day.date} className="grid gap-3 md:grid-cols-[145px_1fr]"><div><div className="mono text-[10px] uppercase tracking-[.15em] text-primary">{day.day}</div><div className="mt-1 text-lg font-extrabold">{dateLabel(day.date).replace(', 2026', '')}</div></div><div className="space-y-2">{dayExams.length ? dayExams.map((exam: any, index: number) => <div key={`${exam.raw_text}-${index}`} className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center"><div><div className="text-sm font-extrabold">{displayCourseId(exam.course_code)} <span className="ml-1 text-muted-foreground">· section {exam.section || 'TBA'}</span></div><div className="mt-1 text-xs text-muted-foreground">{exam.time_slot} · {cleanTba(exam.room)}</div></div><div className="mono text-[10px] text-muted-foreground">{exam.faculty_names?.[0] || 'Faculty TBA'}</div></div>) : <div className="rounded-xl border border-dashed border-border px-4 py-4 text-xs text-muted-foreground">{selected.length ? 'No selected course exams on this date.' : 'No exam rows recorded.'}</div>}</div></div>; })}</div></Surface></>;
}

function AcademicCalendar() {
  const events = semesterPlan.academic_calendar ?? [];
  const [month, setMonth] = useState('all');
  const months: string[] = Array.from(new Set(events.flatMap((event: any) => [event.date, event.start_date].filter(Boolean).map((value: string) => value.slice(0, 7))))).sort() as string[];
  const shown = events.filter((event: any) => month === 'all' || [event.date, event.start_date, event.end_date].some((value) => value?.startsWith(month)));
  return <><PageHeader eyebrow="Student / academic calendar" title="The term at a glance." description="Milestones, holidays, payment dates, exam windows, and the last days of class from the supplied Summer 2026 plan." /><div className="mb-5 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setMonth('all')} className={`rounded-xl px-3 py-2 text-xs font-bold ${month === 'all' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}>All dates</button>{months.map((item) => <button key={item} onClick={() => setMonth(item)} className={`rounded-xl px-3 py-2 text-xs font-bold ${month === item ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(`${item}-01T00:00:00`))}</button>)}</div><Surface className="overflow-hidden"><div className="hidden grid-cols-[150px_1fr_180px] border-b border-border bg-muted/50 px-5 py-3 mono text-[10px] uppercase tracking-[.15em] text-muted-foreground md:grid"><span>Date</span><span>Milestone</span><span>Week / note</span></div><div>{shown.map((event: any, index: number) => <div key={`${event.event}-${index}`} className="grid gap-2 border-b border-border/70 px-5 py-4 last:border-0 md:grid-cols-[150px_1fr_180px] md:items-center"><div className="mono text-[11px] font-medium text-primary">{event.date ? dateLabel(event.date) : `${dateLabel(event.start_date)} → ${dateLabel(event.end_date)}`}</div><div><div className="text-sm font-bold">{event.event}</div><div className="mt-1 text-[11px] text-muted-foreground">{event.day || event.days || ''}</div></div><div className="text-xs text-muted-foreground">{event.week ? `Week ${event.week}` : event.note || 'Semester reference'}</div></div>)}</div></Surface></>;
}

function FacultyDirectory() {
  const params = useParams<{ id?: string }>();
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState(params.id ? decodeURIComponent(params.id) : '');
  const filtered = faculty.filter((person) => `${person.name} ${person.designation} ${person.areas_of_interest.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const selected = faculty.find((person) => person.name === selectedName) ?? filtered[0];
  return <><PageHeader eyebrow="Student / faculty" title="People behind the courses." description="Search the CSE directory, skim interests, and open a profile when a question needs a person." /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"><Surface className="overflow-hidden"><div className="border-b border-border p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, roles, or research interests" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></div><div className="mt-3 text-[11px] text-muted-foreground">{filtered.length} faculty records from the supplied CSE directory</div></div><div className="divide-y divide-border/70">{filtered.map((person) => <button key={person.name} onClick={() => setSelectedName(person.name)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/60 ${selected?.name === person.name ? 'bg-primary/5' : ''}`}><Avatar name={person.name} image={person.photo_url} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{person.name}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{person.designation}</span></span><ArrowRight size={15} className={selected?.name === person.name ? 'text-primary' : 'text-border'} /></button>)}</div>{!filtered.length && <div className="p-6"><EmptyState icon={UsersRound} title="No faculty match." body="Try a name or a research topic." /></div>}</Surface>{selected ? <Surface className="p-5 md:p-6"><div className="flex items-start justify-between gap-3"><Avatar name={selected.name} image={selected.photo_url} size="lg" /><a href={selected.profile_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><ExternalLink size={16} /></a></div><h2 className="serif mt-5 text-3xl leading-none">{selected.name}</h2><div className="mt-2 text-xs font-bold text-primary">{selected.designation}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{selected.department}</p>{selected.research_area_mapping && <div className="mt-5 rounded-xl bg-secondary/65 p-3 text-xs font-bold text-primary">{selected.research_area_mapping}</div>}<div className="mt-6"><div className="mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Areas of interest</div><div className="mt-3 flex flex-wrap gap-1.5">{selected.areas_of_interest.slice(0, 10).map((topic) => <span key={topic} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{topic}</span>)}</div></div><div className="mt-6 border-t border-border pt-5"><div className="mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Courses listed on profile</div><div className="mt-3 space-y-2">{selected.courses_taught.slice(0, 6).map((course) => <div key={course} className="text-xs font-semibold">{course}</div>)}{!selected.courses_taught.length && <div className="text-xs text-muted-foreground">No profile course list supplied.</div>}</div></div><Link href="/student/advisor" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground">Consider as advisor <ArrowRight size={14} /></Link></Surface> : <EmptyState icon={UsersRound} title="Choose a faculty record." body="Profile detail will appear here." />}</div></>;
}

function Research() {
  const [interests, setInterests] = useState<number[]>(readJson(STORAGE.interests, []));
  const [selectedId, setSelectedId] = useState(researchAreas[0]?.id ?? 1);
  const selected = researchAreas.find((area) => area.id === selectedId) ?? researchAreas[0];
  useEffect(() => writeJson(STORAGE.interests, interests), [interests]);
  const relevantFaculty = faculty.filter((person) => selected && (person.research_area_mapping === selected.name || selected.faculty.some((name) => normalizeFacultyName(person.name).includes(normalizeFacultyName(name)) || normalizeFacultyName(name).includes(normalizeFacultyName(person.name)))));
  return <><PageHeader eyebrow="Student / research" title="Find a question worth keeping." description="Seven local research spaces from the CSE source, with faculty context and a small, private interest list." action={<div className="rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-bold text-accent">{interests.length} saved</div>} /><div className="grid gap-6 xl:grid-cols-[310px_1fr]"><Surface className="h-fit overflow-hidden"><div className="p-4"><div className="mono text-[10px] uppercase tracking-[.17em] text-primary">Research spaces</div></div><div className="space-y-1 p-2">{researchAreas.map((area) => <button key={area.id} onClick={() => setSelectedId(area.id)} className={`w-full rounded-xl p-3 text-left transition ${selected?.id === area.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><div className="flex gap-3"><span className={`mono text-[10px] ${selected?.id === area.id ? 'text-sidebar-primary' : 'text-primary'}`}>0{area.id}</span><span className="text-xs font-bold leading-5">{area.name}</span></div></button>)}</div></Surface>{selected ? <div className="space-y-6"><Surface className="relative overflow-hidden bg-sidebar p-6 text-sidebar-foreground md:p-8"><div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-sidebar-primary/15" /><div className="relative"><div className="mono text-[10px] uppercase tracking-[.2em] text-sidebar-primary">Space 0{selected.id}</div><h2 className="serif mt-3 max-w-2xl text-4xl leading-[.95] text-sidebar-foreground md:text-5xl">{selected.name}</h2><div className="mt-6 flex flex-wrap gap-2">{selected.topics.map((topic) => <span key={topic} className="rounded-full border border-sidebar-foreground/15 px-2.5 py-1 text-[10px] text-sidebar-foreground/65">{topic}</span>)}</div><button onClick={() => setInterests((current) => current.includes(selected.id) ? current.filter((id) => id !== selected.id) : [...current, selected.id])} className={`mt-8 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${interests.includes(selected.id) ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'}`}>{interests.includes(selected.id) ? <Check size={14} /> : <Sparkles size={14} />}{interests.includes(selected.id) ? "I'm Interested" : "I'm Interested"}</button></div></Surface><Surface className="p-5 md:p-6"><div className="flex items-end justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-primary">Relevant faculty</div><h2 className="serif mt-2 text-3xl">People to ask.</h2></div><span className="text-xs text-muted-foreground">{relevantFaculty.length} records</span></div><div className="mt-5 grid gap-2 md:grid-cols-2">{relevantFaculty.map((person) => <Link key={person.name} href={`/student/faculty/${encodeURIComponent(person.name)}`} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><Avatar name={person.name} image={person.photo_url} size="sm" /><span className="min-w-0"><span className="block truncate text-xs font-bold">{person.name}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{person.designation}</span></span><ArrowRight size={14} className="ml-auto shrink-0 text-primary" /></Link>)}</div>{!relevantFaculty.length && <div className="mt-5"><EmptyState icon={UsersRound} title="No direct faculty mapping." body="The source marks this space as a starting point; browse the wider directory for adjacent interests." action={<Link href="/student/faculty" className="text-xs font-bold text-primary">Open faculty directory</Link>} /></div>}</Surface></div> : null}</div></>;
}

function Advisor() {
  const [advisor, setAdvisor] = useState<string>(readJson(STORAGE.advisor, ''));
  const selected = faculty.find((person) => person.name === advisor);
  const save = (name: string) => { setAdvisor(name); writeJson(STORAGE.advisor, name); };
  return <><PageHeader eyebrow="Student / advisor" title="Choose a person in your corner." description="Save a CSE faculty advisor locally, then start the conversation from your own mail client." />{selected ? <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 md:flex-row md:items-center"><div className="flex items-center gap-3"><Avatar name={selected.name} image={selected.photo_url} /><div><div className="text-sm font-extrabold">Your saved advisor</div><div className="mt-1 text-xs text-muted-foreground">{selected.name} · {selected.designation}</div></div></div><div className="flex gap-2"><a href="mailto:?subject=Advisor%20conversation%20request%20for%20Summer%202026" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><Send size={14} />Start email</a><Button variant="outline" onClick={() => save('')}>Change</Button></div></div> : <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/10 p-5 text-sm font-semibold">No advisor saved yet. Start with someone whose work makes you curious.</div>}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{faculty.map((person) => <div key={person.name} className={`rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${selected?.name === person.name ? 'border-primary/50 ring-2 ring-primary/10' : 'border-border'}`}><div className="flex items-start gap-3"><Avatar name={person.name} image={person.photo_url} size="sm" /><div className="min-w-0"><div className="truncate text-sm font-extrabold">{person.name}</div><div className="mt-1 text-[10px] text-muted-foreground">{person.designation}</div></div></div><div className="mt-4 flex flex-wrap gap-1">{person.areas_of_interest.slice(0, 3).map((topic) => <span key={topic} className="rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">{topic}</span>)}</div><Button variant={selected?.name === person.name ? 'soft' : 'outline'} className="mt-4 w-full py-2 text-xs" onClick={() => save(person.name)}>{selected?.name === person.name ? <><Check size={14} />Saved advisor</> : 'Choose advisor'}</Button></div>)}</div><p className="mt-5 text-[11px] text-muted-foreground">Email addresses were not supplied in the local source. The contact action opens a new message with a prepared subject, ready for the address you use.</p></>;
}

function Connect() {
  return <><PageHeader eyebrow="Student / CSE connect" title="A door that is not wired yet." description="The product has a place for official CSE links, but this source pack did not include any. We would rather say that plainly than send you to made-up portals." /><Surface className="soft-grid mx-auto max-w-2xl p-8 text-center md:p-14"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Monitor size={24} /></div><h2 className="serif mt-6 text-4xl">Official links unavailable.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">When the department provides a verified hub, this is where it will live. For now, use the local calendar, people directory, and your saved advisor to keep moving.</p><div className="mt-8 flex flex-wrap justify-center gap-2"><Link href="/student/calendar" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Open calendar <ArrowRight size={14} /></Link><Link href="/student/faculty" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold">Browse faculty <UsersRound size={14} /></Link></div><div className="mono mt-10 text-[9px] uppercase tracking-[.16em] text-muted-foreground/70">No official links supplied · local prototype state</div></Surface></>;
}

function TeacherDashboard() {
  const session = readJson<Session | null>(STORAGE.session, null);
  const person = faculty.find((item) => normalizeFacultyName(item.name) === normalizeFacultyName(session?.facultyName));
  const teachingRows = weeklyRows.filter((row) => person && facultyMatchesRow(person, row));
  const dayCounts = days.map((day) => ({ day, count: teachingRows.filter((row) => row.day === day).length })).filter((item) => item.count);
  return <><PageHeader eyebrow="Faculty / overview" title={`Good morning, ${person?.name?.split(',')[0] || 'faculty desk'}.`} description="A teaching-focused view derived from your matched Summer 2026 recurring schedule rows." action={<Link href="/teacher/schedule" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Open teaching grid <ArrowRight size={16} /></Link>} /><div className="grid gap-4 md:grid-cols-3"><Surface className="bg-primary p-5 text-primary-foreground"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60">Matched rows</div><div className="mt-4 text-4xl font-extrabold">{teachingRows.length}</div><div className="mt-1 text-xs text-primary-foreground/65">actual recurring assignments</div></Surface><Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Teaching days</div><div className="mt-4 text-4xl font-extrabold">{dayCounts.length}</div><div className="mt-1 text-xs text-muted-foreground">{dayCounts.map((item) => item.day.slice(0, 3)).join(' · ') || 'No matching rows'}</div></Surface><Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Profile status</div><div className="mt-4 text-xl font-extrabold">{person?.status === 'active' ? 'Active record' : 'Demo record'}</div><div className="mt-1 text-xs text-muted-foreground">from supplied CSE faculty data</div></Surface></div><div className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]"><Surface className="p-5 md:p-6"><div className="flex items-end justify-between"><div><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">This week</div><h2 className="serif mt-2 text-3xl">Where you are needed.</h2></div><Link href="/teacher/schedule" className="text-xs font-bold text-primary">Full grid <ArrowRight size={14} className="inline" /></Link></div><div className="mt-5 space-y-4">{dayCounts.map((item) => <div key={item.day} className="flex items-center gap-4"><div className="w-20 text-xs font-bold">{item.day}</div><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, item.count * 18)}%` }} /></div><div className="mono w-8 text-right text-[10px] text-muted-foreground">{item.count}</div></div>)}{!teachingRows.length && <EmptyState icon={CalendarDays} title="No schedule rows matched." body="Choose a different faculty demo account, or check the full profile record." />}</div></Surface><Surface className="p-5"><div className="mono text-[10px] uppercase tracking-[.18em] text-accent">Teaching note</div><h2 className="serif mt-2 text-3xl">Raw data, less noise.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Matching uses normalized faculty names and schedule codes. TBA remains visible instead of being silently filled.</p><Link href="/teacher/profile" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary">Review profile <ArrowRight size={14} /></Link></Surface></div></>;
}

function TeacherSchedule() {
  const session = readJson<Session | null>(STORAGE.session, null);
  const person = faculty.find((item) => normalizeFacultyName(item.name) === normalizeFacultyName(session?.facultyName));
  const rows = weeklyRows.filter((row) => person && facultyMatchesRow(person, row));
  const [day, setDay] = useState(todayName());
  const dayRows = rows.filter((row) => row.day === day).sort((a, b) => (parseTimeRange(a.time_slot)?.[0] ?? 0) - (parseTimeRange(b.time_slot)?.[0] ?? 0));
  return <><PageHeader eyebrow="Faculty / teaching schedule" title="Your teaching grid." description={`${person?.name || 'Selected faculty'} · rows matched from the Summer 2026 recurring schedule.`} action={<div className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-primary">{rows.length} matched rows</div>} /><div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">{days.map((item) => <button key={item} onClick={() => setDay(item)} className={`min-w-[74px] flex-1 rounded-xl px-3 py-2.5 text-xs font-bold ${day === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}><span className="block text-[10px] uppercase tracking-wide">{item.slice(0, 3)}</span><span className="mt-1 block">{rows.filter((row) => row.day === item).length} rows</span></button>)}</div><Surface className="p-5 md:p-7">{dayRows.length ? <div className="max-w-3xl">{dayRows.map((row, index) => <div key={`${row.raw_text}-${index}`}><RowCard row={row} /></div>)}</div> : <EmptyState icon={CalendarDays} title={`No matched teaching rows on ${day}.`} body={rows.length ? 'Choose another day to see the assignments in the source schedule.' : 'No rows match this faculty record. This is an honest empty state, not a placeholder schedule.'} action={<Link href="/teacher/profile" className="text-xs font-bold text-primary">Review faculty record</Link>} />}</Surface></>;
}

function TeacherResearch() {
  const session = readJson<Session | null>(STORAGE.session, null);
  const person = faculty.find((item) => normalizeFacultyName(item.name) === normalizeFacultyName(session?.facultyName));
  const area = researchAreas.find((item) => item.name === person?.research_area_mapping);
  return <><PageHeader eyebrow="Faculty / research" title="Your research context." description="A compact view of the supplied research mapping and the broader CSE spaces around it." />{area ? <div className="grid gap-6 xl:grid-cols-[1fr_350px]"><Surface className="bg-sidebar p-7 text-sidebar-foreground"><div className="mono text-[10px] uppercase tracking-[.2em] text-sidebar-primary">Mapped area</div><h2 className="serif mt-3 text-5xl leading-[.95]">{area.name}</h2><div className="mt-8 flex flex-wrap gap-2">{area.topics.map((topic) => <span key={topic} className="rounded-full border border-sidebar-foreground/15 px-3 py-1.5 text-[10px] text-sidebar-foreground/70">{topic}</span>)}</div></Surface><Surface className="p-6"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">Profile signals</div><h2 className="serif mt-2 text-3xl">{person?.areas_of_interest.length || 0} interests listed.</h2><div className="mt-5 space-y-2">{(person?.areas_of_interest || []).map((topic) => <div key={topic} className="flex items-center gap-2 text-xs font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{topic}</div>)}</div></Surface></div> : <Surface className="p-8"><EmptyState icon={FlaskConical} title="No mapped research area." body="The selected faculty profile does not carry a direct area mapping in the supplied source." action={<Link href="/teacher/profile" className="text-xs font-bold text-primary">Open profile</Link>} /></Surface>}<div className="mt-7"><div className="mb-4 mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">All CSE research spaces</div><div className="grid gap-3 md:grid-cols-2">{researchAreas.map((item) => <div key={item.id} className={`rounded-2xl border p-4 ${item.id === area?.id ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}><div className="flex items-start justify-between gap-3"><span className="mono text-[10px] text-primary">0{item.id}</span>{item.id === area?.id && <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">Your area</span>}</div><div className="mt-3 text-sm font-extrabold">{item.name}</div><div className="mt-2 text-[10px] leading-5 text-muted-foreground">{item.topics.slice(0, 4).join(' · ')}</div></div>)}</div></div></>;
}

function TeacherProfile() {
  const session = readJson<Session | null>(STORAGE.session, null);
  const person = faculty.find((item) => normalizeFacultyName(item.name) === normalizeFacultyName(session?.facultyName));
  if (!person) return <EmptyState icon={UsersRound} title="Faculty profile unavailable." body="Return to the login screen and select a supplied faculty record." action={<Link href="/login" className="text-xs font-bold text-primary">Return to login</Link>} />;
  return <><PageHeader eyebrow="Faculty / profile" title="The person behind the desk." description="Profile information is shown exactly from the supplied faculty source, with no invented contact details." action={<a href={person.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold"><ExternalLink size={14} />Source profile</a>} /><div className="grid gap-6 xl:grid-cols-[340px_1fr]"><Surface className="p-6"><Avatar name={person.name} image={person.photo_url} size="lg" /><h2 className="serif mt-5 text-4xl leading-none">{person.name}</h2><div className="mt-2 text-xs font-bold text-primary">{person.designation}</div><div className="mt-1 text-xs text-muted-foreground">{person.department}</div><div className="mt-6 rounded-xl bg-secondary/70 p-3 text-xs font-bold text-primary">{person.status} faculty record</div></Surface><div className="space-y-6"><Surface className="p-6"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">Areas of interest</div><div className="mt-4 flex flex-wrap gap-2">{person.areas_of_interest.map((item) => <span key={item} className="rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold">{item}</span>)}</div></Surface><Surface className="p-6"><div className="mono text-[10px] uppercase tracking-[.18em] text-primary">Education</div><div className="mt-4 space-y-4">{person.education.map((item) => <div key={item} className="flex gap-3 text-xs leading-5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{item}</div>)}</div></Surface></div></div></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/login" component={Login} />
    <Route><AppShell><Switch>
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/courses" component={Courses} />
      <Route path="/student/schedule" component={Schedule} />
      <Route path="/student/rooms" component={Rooms} />
      <Route path="/student/exams" component={Exams} />
      <Route path="/student/calendar" component={AcademicCalendar} />
      <Route path="/student/faculty/:id" component={FacultyDirectory} />
      <Route path="/student/faculty" component={FacultyDirectory} />
      <Route path="/student/research" component={Research} />
      <Route path="/student/advisor" component={Advisor} />
      <Route path="/student/connect" component={Connect} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/teacher/schedule" component={TeacherSchedule} />
      <Route path="/teacher/research" component={TeacherResearch} />
      <Route path="/teacher/profile" component={TeacherProfile} />
      <Route><HomeRedirect /></Route>
    </Switch></AppShell></Route>
  </Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;