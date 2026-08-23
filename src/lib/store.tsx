import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  role: Role;
  teacherId?: string;
  studentId?: string;
}

export interface ClassRoom { id: string; name: string; grade: string; }
export interface Subject { id: string; name: string; classId?: string; }
export interface Teacher { id: string; name: string; classIds: string[]; code: string; }

export interface Material {
  id: string; classId: string; subjectId: string; title: string; publishDate: string;
  videoLink?: string; fileLink?: string; instructions?: string;
}
export interface Module { id: string; classId: string; subjectId: string; title: string; fileLink: string; }
export interface ScheduleItem { id: string; classId: string; day: "Senin"|"Selasa"|"Rabu"|"Kamis"|"Jumat"; subject: string; }
export type StudentStatus = "Reguler" | "Online";
export interface Student { id: string; name: string; pin: string; classId: string; status: StudentStatus; }
export type IndicatorCategory = "Adab" | "Tarbiyah";
export interface Indicator { id: string; classId: string; month: string; category: IndicatorCategory; text: string; title?: string; }
export type ObservationValue = "BB" | "MB" | "BSH" | "BSB";
export interface ObservationEntry { indicatorId: string; value: ObservationValue; note: string; }
export interface ObservationRecord { studentId: string; month: string; entries: ObservationEntry[]; }
export type AttendanceStatus = "H" | "I" | "S" | "A";
export interface AttendanceRecord { studentId: string; date: string; status: AttendanceStatus; }
export interface Grade { id: string; classId: string; subjectId: string; studentId: string; title: string; score: number; }

export interface Anecdote {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  category: string; // "Penghargaan" | "Pelanggaran" | custom string
  title: string;
  description: string;
  actionTaken?: string;
}

interface StoreState {
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  materials: Material[];
  modules: Module[];
  schedule: ScheduleItem[];
  students: Student[];
  indicators: Indicator[];
  adabTitles: string[];
  observations: ObservationRecord[];
  attendance: AttendanceRecord[];
  grades: Grade[];
  anecdotes: Anecdote[];
  announcements: Record<string, string>;
  adminCode: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = new Date().toISOString().slice(0, 10);

const C1 = "c1", C2 = "c2";
const S1 = "s1", S2 = "s2", S3 = "s3";
const T1 = "t1", T2 = "t2";

const initialState: StoreState = {
  classes: [
    { id: C1, name: "Kelas 4A", grade: "4" },
    { id: C2, name: "Kelas 5B", grade: "5" },
  ],
  subjects: [
    { id: S1, name: "Matematika" },
    { id: S2, name: "Bahasa Indonesia" },
    { id: S3, name: "Pendidikan Agama Islam" },
  ],
  teachers: [
    { id: T1, name: "Ustadz Hasan", classIds: [C1, C2], code: "GURU1" },
    { id: T2, name: "Ustadzah Aisyah", classIds: [C1], code: "GURU2" },
  ],
  materials: [
    { id: uid(), classId: C1, subjectId: S1, title: "Pengenalan Pecahan", publishDate: today, videoLink: "https://youtube.com/watch?v=example", fileLink: "", instructions: "Kerjakan latihan halaman 42." },
    { id: uid(), classId: C1, subjectId: S3, title: "Adab Menuntut Ilmu", publishDate: today, instructions: "Baca dan ringkas dalam 5 poin." },
    { id: uid(), classId: C2, subjectId: S1, title: "Bilangan Bulat", publishDate: today, instructions: "Kerjakan soal 1-10." },
  ],
  modules: [
    { id: uid(), classId: C1, subjectId: S1, title: "Modul Matematika 4A Bab 1", fileLink: "#" },
    { id: uid(), classId: C1, subjectId: S2, title: "Modul B. Indonesia 4A Bab 1", fileLink: "#" },
    { id: uid(), classId: C2, subjectId: S1, title: "Modul Matematika 5B Bab 1", fileLink: "#" },
  ],
  schedule: [
    { id: uid(), classId: C1, day: "Senin", subject: "Matematika" },
    { id: uid(), classId: C1, day: "Selasa", subject: "Bahasa Indonesia" },
    { id: uid(), classId: C1, day: "Rabu", subject: "Pendidikan Agama Islam" },
    { id: uid(), classId: C2, day: "Senin", subject: "Bahasa Indonesia" },
    { id: uid(), classId: C2, day: "Rabu", subject: "Matematika" },
  ],
  students: [
    { id: "st1", name: "Ahmad Fauzi", pin: "1234", classId: C1, status: "Reguler" },
    { id: "st2", name: "Siti Nurhaliza", pin: "2345", classId: C1, status: "Online" },
    { id: "st3", name: "Bilal Rahman", pin: "3456", classId: C2, status: "Reguler" },
  ],
  indicators: (() => {
    const m = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
    return [
      { id: uid(), classId: C1, month: m, category: "Adab" as const, title: "Adab kepada Guru", text: "Mengucap salam saat bertemu guru" },
      { id: uid(), classId: C1, month: m, category: "Adab" as const, title: "Adab Berbicara", text: "Berbicara dengan sopan" },
      { id: uid(), classId: C1, month: m, category: "Tarbiyah" as const, text: "Shalat lima waktu tepat waktu" },
      { id: uid(), classId: C1, month: m, category: "Tarbiyah" as const, text: "Membaca Al-Qur'an setiap hari" },
      { id: uid(), classId: C2, month: m, category: "Adab" as const, title: "Adab kepada Orang Tua", text: "Menghormati orang tua" },
      { id: uid(), classId: C2, month: m, category: "Tarbiyah" as const, text: "Menghafal surah pendek" },
    ];
  })(),
  adabTitles: ["Adab kepada Guru", "Adab kepada Orang Tua", "Adab Berbicara", "Adab Belajar", "Adab Makan & Minum"],
  observations: [],
  attendance: [],
  grades: [],
  anecdotes: [
    {
      id: uid(),
      classId: C1,
      studentId: "st1",
      date: today,
      category: "Penghargaan",
      title: "Membantu Menjaga Kebersihan Kelas",
      description: "Ahmad dengan inisiatif sendiri merapikan rak buku dan menyapu lantai kelas.",
      actionTaken: "Diberikan pujian di depan kelas & bintang kebaikan.",
    },
    {
      id: uid(),
      classId: C1,
      studentId: "st2",
      date: today,
      category: "Pelanggaran",
      title: "Terlambat Masuk Kelas setelah Istirahat",
      description: "Siti terlambat masuk kelas 15 menit setelah bel istirahat berbunyi.",
      actionTaken: "Diberikan teguran lisan dan nasihat kedisiplinan.",
    },
  ],
  announcements: {
    [C1]: "Assalamu'alaikum Kelas 4A. Jangan lupa isi Matriks Observasi bulan ini.",
    [C2]: "Assalamu'alaikum Kelas 5B. Selamat belajar hari ini!",
  },
  adminCode: "ADMIN123",
};

interface StoreContextType extends StoreState {
  user: User | null;
  hydrated: boolean;
  activeClassId: string | null;
  setActiveClassId: (id: string) => void;
  teacherClasses: ClassRoom[];
  login: (role: Role, name: string, refId?: string) => void;
  logout: () => void;
  set: <K extends keyof StoreState>(key: K, value: StoreState[K]) => void;
  update: (updater: (s: StoreState) => Partial<StoreState>) => void;
  saveObservation: (rec: ObservationRecord) => Promise<boolean>;
  saveAttendance: (rec: AttendanceRecord) => Promise<boolean>;
  refresh: () => Promise<void>;
  uid: () => string;

}

const StoreContext = createContext<StoreContextType | null>(null);
const USER_KEY = "whitebee-lms-user-v4";
const ACTIVE_CLASS_KEY = "whitebee-lms-active-class-v4";
const ANECDOTES_KEY = "whitebee-anecdotes-v1";

function getStoredAnecdotes(): Anecdote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANECDOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------- cloud mappers ----------
const db: any = supabase;

const toRow = {
  classes: (x: ClassRoom) => ({ id: x.id, name: x.name, grade: x.grade }),
  subjects: (x: Subject) => ({ id: x.id, name: x.name, class_id: x.classId ?? null }),
  teachers: (x: Teacher) => ({ id: x.id, name: x.name, code: x.code, class_ids: x.classIds }),
  materials: (x: Material) => ({ id: x.id, class_id: x.classId, subject_id: x.subjectId, title: x.title, publish_date: x.publishDate, video_link: x.videoLink ?? null, file_link: x.fileLink ?? null, instructions: x.instructions ?? null }),
  modules: (x: Module) => ({ id: x.id, class_id: x.classId, subject_id: x.subjectId, title: x.title, file_link: x.fileLink }),
  schedule: (x: ScheduleItem) => ({ id: x.id, class_id: x.classId, day: x.day, subject: x.subject }),
  students: (x: Student) => ({ id: x.id, name: x.name, pin: x.pin, class_id: x.classId, status: x.status }),
  indicators: (x: Indicator) => ({ id: x.id, class_id: x.classId, month: x.month, category: x.category, text: x.text, title: x.title ?? null }),
  adab_titles: (t: string) => ({ title: t }),
  observations: (x: ObservationRecord) => ({ student_id: x.studentId, month: x.month, entries: x.entries }),
  attendance: (x: AttendanceRecord) => ({ student_id: x.studentId, date: x.date, status: x.status }),
  grades: (x: Grade) => ({ id: x.id, class_id: x.classId, subject_id: x.subjectId, student_id: x.studentId, title: x.title, score: x.score }),
};

const fromRow = {
  classes: (r: any): ClassRoom => ({ id: r.id, name: r.name, grade: r.grade }),
  subjects: (r: any): Subject => ({ id: r.id, name: r.name, classId: r.class_id ?? undefined }),
  teachers: (r: any): Teacher => ({ id: r.id, name: r.name, code: r.code, classIds: r.class_ids ?? [] }),
  materials: (r: any): Material => ({ id: r.id, classId: r.class_id, subjectId: r.subject_id, title: r.title, publishDate: r.publish_date, videoLink: r.video_link ?? undefined, fileLink: r.file_link ?? undefined, instructions: r.instructions ?? undefined }),
  modules: (r: any): Module => ({ id: r.id, classId: r.class_id, subjectId: r.subject_id, title: r.title, fileLink: r.file_link }),
  schedule: (r: any): ScheduleItem => ({ id: r.id, classId: r.class_id, day: r.day, subject: r.subject }),
  students: (r: any): Student => ({ id: r.id, name: r.name, pin: r.pin, classId: r.class_id, status: r.status }),
  indicators: (r: any): Indicator => ({ id: r.id, classId: r.class_id, month: r.month, category: r.category, text: r.text, title: r.title ?? undefined }),
  observations: (r: any): ObservationRecord => ({ studentId: r.student_id, month: r.month, entries: r.entries ?? [] }),
  attendance: (r: any): AttendanceRecord => ({ studentId: r.student_id, date: r.date, status: r.status }),
  grades: (r: any): Grade => ({ id: r.id, classId: r.class_id, subjectId: r.subject_id, studentId: r.student_id, title: r.title, score: Number(r.score) }),
};

// Safe sync: upsert current rows, then delete only tiny, deliberate-looking
// removals from the previous in-memory state. Never compare against the full
// cloud table here, because a stale/incomplete local state could otherwise
// delete rows that were simply not loaded in this browser session.
async function syncTable(table: string, pkCol: string, rows: any[], previousRows?: any[]) {
  if (rows.length) {
    const { error } = await db.from(table).upsert(rows, { onConflict: pkCol });
    if (error) {
      console.error(`[cloud] upsert ${table} failed`, error);
      return;
    }
  }
  if (!previousRows) return;
  const keep = new Set(rows.map((r) => r[pkCol]));
  const toDelete = previousRows
    .map((r: any) => r[pkCol])
    .filter((id: any) => id != null && !keep.has(id));
  if (!toDelete.length) return;
  // Safety valve: a legitimate UI action deletes one or a few rows. Emptying a
  // table, deleting many rows, or deleting a large percentage usually means the
  // caller worked from stale/partial state, so refuse it instead of wiping data.
  const deleteRatio = previousRows.length ? toDelete.length / previousRows.length : 0;
  if (rows.length === 0 || toDelete.length > 5 || (previousRows.length > 5 && deleteRatio > 0.2)) {
    console.warn(`[cloud] refused suspicious delete of ${toDelete.length} rows in ${table}`);
    return;
  }
  const { error } = await db.from(table).delete().in(pkCol, toDelete);
  if (error) console.error(`[cloud] delete ${table} failed`, error);
}

// First-run seeding must be non-destructive. It only inserts/updates demo rows
// when the database is genuinely empty; it never deletes existing cloud data.
async function seedTable(table: string, pkCol: string, rows: any[]) {
  if (rows.length) await db.from(table).upsert(rows, { onConflict: pkCol });
}

// PostgREST caps a plain select at 1000 rows. Page through everything so large
// tables (attendance, grades, observations) never look "half deleted".
const PAGE = 1000;
async function selectAll(table: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// Every page calls refresh() on mount and polling fires periodically. Without
// coalescing, that means many full downloads of all 14 tables per minute.
// Reuse one in-flight request and cache the result briefly.
const LOAD_TTL = 60000;
let lastLoadAt = 0;
let lastLoaded: StoreState | null = null;
let inflight: Promise<StoreState | null> | null = null;
async function throttledLoadAll(force = false): Promise<StoreState | null> {
  if (!force && lastLoaded && Date.now() - lastLoadAt < LOAD_TTL) return lastLoaded;
  if (inflight) return inflight;
  inflight = loadAll().then((res) => {
    if (res) { lastLoaded = res; lastLoadAt = Date.now(); }
    inflight = null;
    return res;
  }).catch((e) => { inflight = null; throw e; });
  return inflight;
}


function invalidateLoadCache() {
  lastLoadAt = 0;
  lastLoaded = null;
}

async function loadAll(): Promise<StoreState | null> {


  try {
    const [c, s, t, m, mo, sch, st, ind, ad, ob, an, se, at, gr] = await Promise.all([
      selectAll("classes"),
      selectAll("subjects"),
      selectAll("teachers"),
      selectAll("materials"),
      selectAll("modules"),
      selectAll("schedule"),
      selectAll("students"),
      selectAll("indicators"),
      selectAll("adab_titles"),
      selectAll("observations"),
      selectAll("announcements"),
      selectAll("settings"),
      selectAll("attendance"),
      selectAll("grades"),
    ]);
    const announcements: Record<string, string> = {};
    an.forEach((r: any) => { announcements[r.class_id] = r.text; });
    const settings: Record<string, string> = {};
    se.forEach((r: any) => { settings[r.key] = r.value; });

    return {
      classes: c.map(fromRow.classes),
      subjects: s.map(fromRow.subjects),
      teachers: t.map(fromRow.teachers),
      materials: m.map(fromRow.materials),
      modules: mo.map(fromRow.modules),
      schedule: sch.map(fromRow.schedule),
      students: st.map(fromRow.students),
      indicators: ind.map(fromRow.indicators),
      adabTitles: ad.map((r: any) => r.title),
      observations: ob.map(fromRow.observations),
      attendance: at.map(fromRow.attendance),
      grades: gr.map(fromRow.grades),
      anecdotes: getStoredAnecdotes().length > 0 ? getStoredAnecdotes() : initialState.anecdotes,
      announcements,
      adminCode: settings.adminCode ?? initialState.adminCode,
    };
  } catch (e) {
    // A failed/partial load must NEVER be treated as "cloud is empty".
    console.error("[cloud] load failed", e);
    return null;
  }
}


async function seedAll(s: StoreState) {
  await Promise.all([
    seedTable("classes", "id", s.classes.map(toRow.classes)),
    seedTable("subjects", "id", s.subjects.map(toRow.subjects)),
    seedTable("teachers", "id", s.teachers.map(toRow.teachers)),
    seedTable("materials", "id", s.materials.map(toRow.materials)),
    seedTable("modules", "id", s.modules.map(toRow.modules)),
    seedTable("schedule", "id", s.schedule.map(toRow.schedule)),
    seedTable("students", "id", s.students.map(toRow.students)),
    seedTable("indicators", "id", s.indicators.map(toRow.indicators)),
    seedTable("adab_titles", "title", s.adabTitles.map(toRow.adab_titles)),
    seedTable("observations", "student_id,month", s.observations.map(toRow.observations)),
    seedTable("announcements", "class_id", Object.entries(s.announcements).map(([class_id, text]) => ({ class_id, text }))),
    seedTable("attendance", "student_id,date", s.attendance.map(toRow.attendance)),
    seedTable("grades", "id", s.grades.map(toRow.grades)),
    db.from("settings").upsert({ key: "adminCode", value: s.adminCode }),
  ]);
}

async function syncKey<K extends keyof StoreState>(key: K, value: StoreState[K], previous?: StoreState[K]) {
  try {
    switch (key) {
      case "classes": return await syncTable("classes", "id", (value as ClassRoom[]).map(toRow.classes), (previous as ClassRoom[] | undefined)?.map(toRow.classes));
      case "subjects": return await syncTable("subjects", "id", (value as Subject[]).map(toRow.subjects), (previous as Subject[] | undefined)?.map(toRow.subjects));
      case "teachers": return await syncTable("teachers", "id", (value as Teacher[]).map(toRow.teachers), (previous as Teacher[] | undefined)?.map(toRow.teachers));
      case "materials": return await syncTable("materials", "id", (value as Material[]).map(toRow.materials), (previous as Material[] | undefined)?.map(toRow.materials));
      case "modules": return await syncTable("modules", "id", (value as Module[]).map(toRow.modules), (previous as Module[] | undefined)?.map(toRow.modules));
      case "schedule": return await syncTable("schedule", "id", (value as ScheduleItem[]).map(toRow.schedule), (previous as ScheduleItem[] | undefined)?.map(toRow.schedule));
      case "students": return await syncTable("students", "id", (value as Student[]).map(toRow.students), (previous as Student[] | undefined)?.map(toRow.students));
      case "indicators": return await syncTable("indicators", "id", (value as Indicator[]).map(toRow.indicators), (previous as Indicator[] | undefined)?.map(toRow.indicators));
      case "adabTitles": return await syncTable("adab_titles", "title", (value as string[]).map(toRow.adab_titles), (previous as string[] | undefined)?.map(toRow.adab_titles));
      case "observations": {
        // observations PK is (student_id, month); safe path: upsert current + no delete here.
        const rows = (value as ObservationRecord[]).map(toRow.observations);
        if (rows.length) await db.from("observations").upsert(rows, { onConflict: "student_id,month" });
        return;
      }
      case "grades": return await syncTable("grades", "id", (value as Grade[]).map(toRow.grades), (previous as Grade[] | undefined)?.map(toRow.grades));
      case "announcements": {
        const rows = Object.entries(value as Record<string, string>).map(([class_id, text]) => ({ class_id, text }));
        const previousRows = previous ? Object.entries(previous as Record<string, string>).map(([class_id, text]) => ({ class_id, text })) : undefined;
        return await syncTable("announcements", "class_id", rows, previousRows);
      }
      case "adminCode": {
        await db.from("settings").upsert({ key: "adminCode", value: value as string });
        return;
      }
    }
  } catch (e) {
    console.error(`[cloud] sync ${String(key)} failed`, e);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [user, setUser] = useState<User | null>(null);
  const [activeClassId, setActiveClassIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipSync = useRef(true);
  // Tracks in-flight cloud writes so a background refresh can never overwrite
  // local state that has not finished persisting yet.
  const pendingWrites = useRef(0);
  const lastWriteAt = useRef(0);
  const track = (p: Promise<unknown>) => {
    pendingWrites.current += 1;
    lastWriteAt.current = Date.now();
    invalidateLoadCache();
    void Promise.resolve(p)
      .catch((e) => console.error("[cloud] write failed", e))
      .finally(() => {
        pendingWrites.current -= 1;
        lastWriteAt.current = Date.now();
        invalidateLoadCache();
      });
  };


  const applyRemote = (loaded: StoreState) => {
    skipSync.current = true;
    setState(loaded);
    setTimeout(() => { skipSync.current = false; }, 0);
  };

  useEffect(() => {
    (async () => {
      const loaded = await loadAll();
      if (loaded) {
        // Cloud reachable: use it as-is. Only seed when it is genuinely empty.
        if (loaded.classes.length > 0) {
          setState(loaded);
        } else {
          await seedAll(initialState);
          setState(initialState);
        }
      } else {
        // Load failed (offline / transient error). Show nothing destructive and
        // never seed — seeding would wipe existing cloud rows.
        console.warn("[cloud] initial load failed; skipping seed to protect data");
      }
      try {
        const u = localStorage.getItem(USER_KEY);
        if (u) setUser(JSON.parse(u));
        const a = localStorage.getItem(ACTIVE_CLASS_KEY);
        if (a) setActiveClassIdState(a);
      } catch {}
      setHydrated(true);
      // Allow subsequent state changes to sync
      setTimeout(() => { skipSync.current = false; }, 0);
    })();
  }, []);

  // Auto-refresh from cloud on window focus / visibility change so teachers see
  // student updates (observations, attendance, announcements, grades, etc.)
  // without needing to manually reload.
  useEffect(() => {
    if (!hydrated) return;
    const doRefresh = async () => {
      // Don't pull while local edits are still being saved (or were just saved),
      // otherwise fresh input gets replaced by older cloud rows.
      if (pendingWrites.current > 0 || Date.now() - lastWriteAt.current < 4000) return;
      const loaded = await throttledLoadAll();
      if (!loaded) return;
      if (pendingWrites.current > 0 || Date.now() - lastWriteAt.current < 4000) return;
      applyRemote(loaded);
    };
    const onFocus = () => { void doRefresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void doRefresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    // Light polling as a fallback (every 5 minutes while tab open). Anything
    // more frequent multiplies network usage without a real UX benefit.
    const iv = window.setInterval(doRefresh, 300000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(iv);
    };
  }, [hydrated]);




  useEffect(() => {
    if (!hydrated) return;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (activeClassId) localStorage.setItem(ACTIVE_CLASS_KEY, activeClassId);
  }, [activeClassId, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ANECDOTES_KEY, JSON.stringify(state.anecdotes));
  }, [state.anecdotes, hydrated]);

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return state.classes;
    if (user.role === "teacher") {
      const t = state.teachers.find((x) => x.id === user.teacherId);
      const ids = t?.classIds ?? [];
      return state.classes.filter((c) => ids.includes(c.id));
    }
    return [];
  }, [user, state.classes, state.teachers]);

  useEffect(() => {
    if (!hydrated || !user) return;
    if (user.role === "teacher") {
      if (!activeClassId || !teacherClasses.some((c) => c.id === activeClassId)) {
        if (teacherClasses[0]) setActiveClassIdState(teacherClasses[0].id);
      }
    }
  }, [hydrated, user, teacherClasses, activeClassId]);

  const setActiveClassId = (id: string) => setActiveClassIdState(id);

  const ctx: StoreContextType = {
    ...state,
    user,
    hydrated,
    activeClassId,
    setActiveClassId,
    teacherClasses,
    login: (role, name, refId) => {
      if (role === "teacher") {
        const t = state.teachers.find((x) => x.id === refId) ?? state.teachers[0];
        setUser({ id: uid(), name: t?.name ?? name, role, teacherId: t?.id });
        if (t?.classIds[0]) setActiveClassIdState(t.classIds[0]);
      } else if (role === "student") {
        const st = state.students.find((x) => x.id === refId);
        setUser({ id: uid(), name: st?.name ?? name, role, studentId: st?.id });
      } else {
        setUser({ id: uid(), name, role });
      }
    },
    logout: () => { setUser(null); },
    set: (key, value) => {
      setState((s) => {
        const previous = s[key];
        const next = { ...s, [key]: value };
        if (!skipSync.current) track(syncKey(key, value, previous));
        return next;
      });
    },
    update: (updater) => {
      setState((s) => {
        const patch = updater(s);
        const next = { ...s, ...patch };
        if (!skipSync.current) {
          (Object.keys(patch) as (keyof StoreState)[]).forEach((k) => track(syncKey(k, next[k], s[k])));
        }
        return next;
      });
    },
    saveObservation: async (rec) => {
      let previous: ObservationRecord[] = [];
      setState((s) => {
        previous = s.observations;
        const rest = s.observations.filter((o) => !(o.studentId === rec.studentId && o.month === rec.month));
        return { ...s, observations: [...rest, rec] };
      });
      pendingWrites.current += 1;
      lastWriteAt.current = Date.now();
      invalidateLoadCache();
      const { error } = await db
        .from("observations")
        .upsert(toRow.observations(rec), { onConflict: "student_id,month" });
      pendingWrites.current -= 1;
      lastWriteAt.current = Date.now();
      invalidateLoadCache();
      if (error) {
        console.error("[cloud] save observation failed", error);
        setState((s) => ({ ...s, observations: previous }));
        return false;
      }
      // No full reload here: the local record already matches what was written,
      // and pulling the whole cloud could clobber other unsaved input.
      return true;
    },
    saveAttendance: async (rec) => {
      let previous: AttendanceRecord[] = [];
      setState((s) => {
        previous = s.attendance;
        const rest = s.attendance.filter((a) => !(a.studentId === rec.studentId && a.date === rec.date));
        return { ...s, attendance: [...rest, rec] };
      });
      pendingWrites.current += 1;
      lastWriteAt.current = Date.now();
      invalidateLoadCache();
      const { error } = await db
        .from("attendance")
        .upsert(toRow.attendance(rec), { onConflict: "student_id,date" });
      pendingWrites.current -= 1;
      lastWriteAt.current = Date.now();
      invalidateLoadCache();
      if (error) {
        console.error("[cloud] save attendance failed", error);
        setState((s) => ({ ...s, attendance: previous }));
        return false;
      }
      return true;
    },
    refresh: async () => {
      if (pendingWrites.current > 0) return;
      const loaded = await throttledLoadAll();
      if (!loaded || pendingWrites.current > 0) return;
      applyRemote(loaded);
    },


    uid,
  };


  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
