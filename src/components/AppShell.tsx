import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore, type Role } from "@/lib/store";
import { swal } from "@/lib/swal";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  Megaphone,
  Info,
  Sparkles,
  Library,
  ListChecks,
  School,
  LogOut,
  GraduationCap,
  UserCog,
  FileSpreadsheet,
  NotebookPen,
} from "lucide-react";
import type { ReactNode } from "react";
import logoAsset from "@/assets/logo.png.asset.json";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/classes", label: "Kelola Kelas", icon: School },
    { to: "/admin/class-data", label: "Data Kelas & Export", icon: FileSpreadsheet },
    { to: "/admin/teachers", label: "Guru & Penugasan", icon: UserCog },
    { to: "/admin/announcements", label: "Pengumuman Guru", icon: Megaphone },
  ],

  teacher: [
    { to: "/teacher", label: "Kelola Materi", icon: BookOpen },
    { to: "/teacher/modules", label: "Kelola Modul", icon: FolderOpen },
    { to: "/teacher/schedule", label: "Jadwal Pelajaran", icon: Calendar },
    { to: "/teacher/students", label: "Manajemen Siswa", icon: Users },
    { to: "/teacher/attendance", label: "Presensi Siswa", icon: ListChecks },
    { to: "/teacher/grades", label: "Input Nilai Siswa", icon: GraduationCap },
    { to: "/teacher/indicators", label: "Indikator Observasi", icon: ClipboardList },
    { to: "/teacher/observation", label: "Lihat Observasi", icon: ClipboardList },
    { to: "/teacher/anecdotes", label: "Catatan Anekdot", icon: NotebookPen },
    { to: "/teacher/reports", label: "Progress & Laporan", icon: BarChart3 },
    { to: "/teacher/announcements", label: "Pengumuman", icon: Megaphone },
  ],
  student: [
    { to: "/student", label: "Informasi", icon: Info },
    { to: "/student/today", label: "Pelajaran Hari Ini", icon: Sparkles },
    { to: "/student/materials", label: "Semua Materi", icon: BookOpen },
    { to: "/student/modules", label: "Kumpulan Modul", icon: Library },
    { to: "/student/schedule", label: "Jadwal Pelajaran", icon: Calendar },
    { to: "/student/observation", label: "Matriks Observasi", icon: ClipboardList },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  teacher: "Guru",
  student: "Siswa",
};

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, logout, teacherClasses, activeClassId, setActiveClassId, students } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentStudent = role === "student" ? students.find((s) => s.id === user?.studentId) : undefined;
  const isReguler = currentStudent?.status === "Reguler";
  const items = role === "student" && isReguler
    ? NAV.student.filter((it) => it.to === "/student" || it.to === "/student/observation")
    : NAV[role];

  const handleLogout = async () => {
    const r = await swal.fire({
      title: "Keluar dari akun?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
    });
    if (r.isConfirmed) {
      logout();
      navigate({ to: "/" });
    }
  };

  const showClassPicker = role === "teacher" && teacherClasses.length > 0;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-sidebar-border/40 overflow-hidden">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight truncate">WhiteBee LMS</div>
            <div className="text-[11px] opacity-75 truncate">School Of Life · Adab &amp; Tarbiyah</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((it) => {
            const active =
              it.to === `/${role}`
                ? pathname === it.to
                : pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-2">
            <div className="text-xs opacity-70">Masuk sebagai</div>
            <div className="text-sm font-semibold truncate">{user?.name ?? "-"}</div>
            <div className="text-[11px] opacity-70">{ROLE_LABEL[role]}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {showClassPicker && (
          <header className="hidden md:flex items-center justify-between gap-3 px-6 py-3 border-b bg-card">
            <div className="flex items-center gap-3">
              <School className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Kelas Aktif</span>
              <Select value={activeClassId ?? undefined} onValueChange={setActiveClassId}>
                <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-muted-foreground">· Grade {c.grade}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {teacherClasses.length} kelas ditugaskan
            </div>
          </header>
        )}

        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow ring-1 ring-border overflow-hidden">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-bold">WhiteBee LMS</div>
          </div>
          <button onClick={handleLogout} className="text-sm text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </header>


        {showClassPicker && (
          <div className="md:hidden px-4 py-2 border-b bg-card">
            <Select value={activeClassId ?? undefined} onValueChange={setActiveClassId}>
              <SelectTrigger className="w-full h-9"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {teacherClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="md:hidden overflow-x-auto border-b bg-card px-3 py-2">
          <div className="flex gap-1 w-max">
            {items.map((it) => {
              const active =
                it.to === `/${role}`
                  ? pathname === it.to
                  : pathname === it.to || pathname.startsWith(it.to + "/");
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {it.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex gap-2">{actions}</div>}
    </div>
  );
}
