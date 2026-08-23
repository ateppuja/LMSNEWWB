import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, type Role } from "@/lib/store";
import { swal, successToast } from "@/lib/swal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Shield, BookOpen, User } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";


export const Route = createFileRoute("/")({ component: LoginPage });

const ROLES: { id: Role; label: string; desc: string; icon: typeof Shield }[] = [
  { id: "admin", label: "Admin", desc: "Kelola sekolah & sistem", icon: Shield },
  { id: "teacher", label: "Guru", desc: "Materi, modul & observasi", icon: BookOpen },
  { id: "student", label: "Siswa", desc: "Belajar & self-assessment", icon: User },
];

function LoginPage() {
  const { user, login, teachers, students, classes, adminCode } = useStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [adminInput, setAdminInput] = useState("");

  const [classId, setClassId] = useState<string>("");
  const [studentSlot, setStudentSlot] = useState<string>(""); // "classId::status"
  const [code, setCode] = useState("");

  useEffect(() => {
    if (user) navigate({ to: `/${user.role}` });
  }, [user, navigate]);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  const studentSlots = useMemo(() => {
    const out: { key: string; classId: string; status: "Reguler" | "Online"; label: string; count: number }[] = [];
    for (const c of classes) {
      for (const status of ["Reguler", "Online"] as const) {
        const count = students.filter((s) => s.classId === c.id && s.status === status).length;
        out.push({ key: `${c.id}::${status}`, classId: c.id, status, label: `${c.name} - ${status}`, count });
      }
    }
    return out;
  }, [classes, students]);

  useEffect(() => {
    if (!studentSlot && studentSlots[0]) setStudentSlot(studentSlots[0].key);
  }, [studentSlots, studentSlot]);

  const teacherHint = useMemo(() => {
    const list = teachers.filter((t) => t.classIds.includes(classId));
    return list.length ? `${list.length} guru terdaftar untuk kelas ini` : "Belum ada guru untuk kelas ini";
  }, [teachers, classId]);
  const studentHint = useMemo(() => {
    const slot = studentSlots.find((s) => s.key === studentSlot);
    if (!slot) return "";
    return slot.count ? `${slot.count} siswa pada ${slot.label}` : `Belum ada siswa pada ${slot.label}`;
  }, [studentSlots, studentSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "admin") {
      if (adminInput.trim() !== adminCode) {
        await swal.fire({ icon: "error", title: "Kode admin salah" });
        return;
      }
      login("admin", "Admin Sekolah");
      successToast("Selamat datang, Admin!");
      navigate({ to: "/admin" });
      return;
    }
    if (role === "teacher") {
      if (!classId) { await swal.fire({ icon: "warning", title: "Pilih kelas" }); return; }
      const t = teachers.find((x) => x.classIds.includes(classId) && x.code === code.trim());
      if (!t) {
        await swal.fire({ icon: "error", title: "Kode guru salah", text: "Kode tidak cocok dengan guru pada kelas ini." });
        return;
      }
      login("teacher", t.name, t.id);
      successToast(`Selamat datang, ${t.name}!`);
      navigate({ to: "/teacher" });
      return;
    }
    const slot = studentSlots.find((s) => s.key === studentSlot);
    if (!slot) { await swal.fire({ icon: "warning", title: "Pilih kelas" }); return; }
    const st = students.find((x) => x.classId === slot.classId && x.status === slot.status && x.pin === code.trim());
    if (!st) {
      await swal.fire({ icon: "error", title: "Kode siswa salah", text: "Kode tidak cocok dengan siswa pada kelas & status ini." });
      return;
    }
    login("student", st.name, st.id);
    successToast(`Selamat datang, ${st.name}!`);
    navigate({ to: "/student" });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-secondary/40 to-accent/30 flex items-center justify-center p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl md:grid-cols-2">
        <div className="relative hidden md:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-10 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-15 bg-center bg-no-repeat"
            style={{
              backgroundSize: "80%",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 40 C60 25 100 25 100 40 L100 170 C100 155 60 155 20 170 Z'/><path d='M180 40 C140 25 100 25 100 40 L100 170 C100 155 140 155 180 170 Z'/><path d='M100 40 L100 170'/><path d='M35 65 L85 55'/><path d='M35 85 L85 75'/><path d='M35 105 L85 95'/><path d='M35 125 L85 115'/><path d='M115 55 L165 65'/><path d='M115 75 L165 85'/><path d='M115 95 L165 105'/><path d='M115 115 L165 125'/></g></svg>\")",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-lg ring-1 ring-sidebar-border/40 overflow-hidden">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="font-extrabold text-lg tracking-tight">White Bee School of Life</div>
                <div className="text-xs opacity-75">Beriman · Beradab · Berilmu · Berguna</div>
              </div>
            </div>

            <h2 className="mt-12 text-3xl font-bold leading-tight">
              Islami Alami <br /> Membumi.
            </h2>
            <p className="mt-3 text-sm opacity-80 max-w-xs">
              Platform pembelajaran modern yang memadukan LMS dengan observasi Adab &amp; Tarbiyah untuk pertumbuhan siswa yang utuh.
            </p>
          </div>
          <div className="relative text-xs opacity-60">© {new Date().getFullYear()} WhiteBee Education</div>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-6 md:hidden flex items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow ring-1 ring-border overflow-hidden text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="font-bold">WhiteBee LMS</div>
          </div>

          <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
          <p className="text-sm text-muted-foreground mt-1">Silakan pilih peran akun Anda untuk melanjutkan.</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {role === "admin" && (
              <div>
                <Label htmlFor="adminCode">Kode Khusus Admin</Label>
                <Input id="adminCode" type="password" placeholder="Masukkan kode admin" value={adminInput} onChange={(e) => setAdminInput(e.target.value)} className="mt-1.5 font-mono" />
              </div>
            )}


            {role === "teacher" && (
              <>
                <div>
                  <Label>Pilih Kelas</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{teacherHint}</p>
                </div>
                <div>
                  <Label htmlFor="tcode">Kode Khusus Guru</Label>
                  <Input id="tcode" placeholder="Kode dari admin" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 font-mono" />
                  <p className="text-xs text-muted-foreground mt-1">Kode dibuat oleh Admin di menu Guru & Penugasan Kelas.</p>
                </div>
              </>
            )}

            {role === "student" && (
              <>
                <div>
                  <Label>Pilih Kelas</Label>
                  <Select value={studentSlot} onValueChange={setStudentSlot}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                    <SelectContent>
                      {studentSlots.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{studentHint}</p>
                </div>
                <div>
                  <Label htmlFor="scode">Kode Siswa</Label>
                  <Input id="scode" placeholder="Kode / PIN dari guru" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 font-mono" />
                  <p className="text-xs text-muted-foreground mt-1">Kode dibuat guru di menu Manajemen Siswa.</p>
                </div>
              </>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold">
              Masuk sebagai {ROLES.find((r) => r.id === role)!.label}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
