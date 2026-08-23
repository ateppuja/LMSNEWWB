import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore, type Grade } from "@/lib/store";
import { confirmDelete, successToast, swal } from "@/lib/swal";
import { FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/grades")({ component: GradesPage });

function GradesPage() {
  const { grades, students, subjects, classes, set, uid, activeClassId } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const mySubjects = useMemo(
    () => subjects.filter((s) => s.classId === activeClassId),
    [subjects, activeClassId]
  );
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );
  const classGrades = useMemo(
    () => grades.filter((g) => g.classId === activeClassId),
    [grades, activeClassId]
  );
  const filtered = useMemo(
    () => classGrades.filter((g) => filterSubject === "all" || g.subjectId === filterSubject),
    [classGrades, filterSubject]
  );

  if (!activeClassId) return <NoClassSelected />;

  const reset = () => {
    setEditing(null);
    setSubjectId("");
    setStudentId("");
    setTitle("");
    setScore("");
  };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (g: Grade) => {
    setEditing(g);
    setSubjectId(g.subjectId);
    setStudentId(g.studentId);
    setTitle(g.title);
    setScore(String(g.score));
    setOpen(true);
  };

  const save = async () => {
    const n = Number(score);
    if (!subjectId || !studentId || !title.trim() || Number.isNaN(n)) {
      await swal.fire({ icon: "warning", title: "Lengkapi semua field", text: "Mapel, siswa, judul nilai dan angka nilai wajib diisi." });
      return;
    }
    if (editing) {
      set("grades", grades.map((g) => g.id === editing.id ? { ...editing, subjectId, studentId, title: title.trim(), score: n } : g));
    } else {
      const rec: Grade = { id: uid(), classId: activeClassId, subjectId, studentId, title: title.trim(), score: n };
      set("grades", [...grades, rec]);
    }
    setOpen(false);
    reset();
    successToast(editing ? "Nilai diperbarui" : "Nilai ditambahkan");
  };

  const remove = async (g: Grade) => {
    const ok = await confirmDelete("nilai ini");
    if (ok) {
      set("grades", grades.filter((x) => x.id !== g.id));
      successToast("Nilai dihapus");
    }
  };
  const exportExcel = () => {
    const cls = classes.find((c) => c.id === activeClassId);
    const rows = filtered.map((g) => {
      const st = students.find((s) => s.id === g.studentId);
      const sub = subjects.find((s) => s.id === g.subjectId);
      return {
        Mapel: sub?.name ?? "-",
        Siswa: st?.name ?? "-",
        "Judul Nilai": g.title,
        Nilai: g.score,
      };
    });
    if (rows.length === 0) {
      swal.fire({ icon: "info", title: "Tidak ada data", text: "Belum ada nilai untuk diexport." });
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Nilai");
    const fname = `Nilai_${(cls?.name ?? "Kelas").replace(/\s+/g, "_")}${filterSubject !== "all" ? "_" + (subjects.find((s) => s.id === filterSubject)?.name.replace(/\s+/g, "_") ?? "") : ""}.xlsx`;
    XLSX.writeFile(wb, fname);
    successToast("Export Excel berhasil");
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Input Nilai Siswa" description="Catat nilai per mapel, judul penilaian, dan angka nilai." />

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Filter Mapel</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {mySubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel</Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Tambah Nilai</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mapel</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Judul Nilai</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada nilai.</TableCell></TableRow>
              )}
              {filtered.map((g) => {
                const st = students.find((s) => s.id === g.studentId);
                const sub = subjects.find((s) => s.id === g.subjectId);
                return (
                  <TableRow key={g.id}>
                    <TableCell>{sub?.name ?? "-"}</TableCell>
                    <TableCell>{st?.name ?? "-"}</TableCell>
                    <TableCell>{g.title}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={g.score >= 75 ? "default" : "secondary"}>{g.score}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(g)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Nilai" : "Tambah Nilai"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Mapel</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
                <SelectContent>
                  {mySubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Siswa</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {classStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Judul Nilai</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. Ulangan Harian 1" />
            </div>
            <div className="space-y-1">
              <Label>Nilai</Label>
              <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="0 - 100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
