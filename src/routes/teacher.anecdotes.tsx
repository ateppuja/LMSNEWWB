import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Anecdote } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { NoClassSelected } from "@/components/NoClassSelected";
import {
  NotebookPen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Award,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/teacher/anecdotes")({ component: AnecdotesPage });

const CATEGORY_PRESETS = [
  { id: "Penghargaan", label: "🏆 Penghargaan / Prestasi", color: "emerald" },
  { id: "Pelanggaran", label: "⚠️ Pelanggaran / Kedisiplinan", color: "rose" },
  { id: "CUSTOM", label: "✍️ Custom / Bebas Diisi...", color: "purple" },
];

function AnecdotesPage() {
  const { anecdotes, students, set, uid, activeClassId, classes } = useStore();

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );
  const classAnecdotes = useMemo(
    () => anecdotes.filter((a) => a.classId === activeClassId),
    [anecdotes, activeClassId]
  );

  // Filters & Search
  const [filterStudentId, setFilterStudentId] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Dialog State
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Anecdote | null>(null);

  // Form State
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryType, setCategoryType] = useState<string>("Penghargaan");
  const [customCategory, setCustomCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const filtered = useMemo(() => {
    return classAnecdotes.filter((a) => {
      if (filterStudentId !== "all" && a.studentId !== filterStudentId) return false;
      if (filterCategory !== "all") {
        if (filterCategory === "Penghargaan" && a.category !== "Penghargaan") return false;
        if (filterCategory === "Pelanggaran" && a.category !== "Pelanggaran") return false;
        if (filterCategory === "Custom" && (a.category === "Penghargaan" || a.category === "Pelanggaran")) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const stud = classStudents.find((s) => s.id === a.studentId)?.name.toLowerCase() ?? "";
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchDesc = a.description.toLowerCase().includes(q);
        const matchCategory = a.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCategory && !stud.includes(q)) return false;
      }
      return true;
    });
  }, [classAnecdotes, filterStudentId, filterCategory, searchQuery, classStudents]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const studentName = (id: string) => classStudents.find((s) => s.id === id)?.name ?? "-";

  const openNew = () => {
    setEditing(null);
    setStudentId(classStudents[0]?.id ?? "");
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryType("Penghargaan");
    setCustomCategory("");
    setTitle("");
    setDescription("");
    setActionTaken("");
    setOpen(true);
  };

  const openEdit = (a: Anecdote) => {
    setEditing(a);
    setStudentId(a.studentId);
    setDate(a.date);
    if (a.category === "Penghargaan" || a.category === "Pelanggaran") {
      setCategoryType(a.category);
      setCustomCategory("");
    } else {
      setCategoryType("CUSTOM");
      setCustomCategory(a.category);
    }
    setTitle(a.title);
    setDescription(a.description);
    setActionTaken(a.actionTaken ?? "");
    setOpen(true);
  };

  const save = () => {
    if (!studentId || !title.trim() || !description.trim() || !activeClassId) return;

    const finalCategory = categoryType === "CUSTOM" ? customCategory.trim() || "Lainnya" : categoryType;

    const item: Anecdote = {
      id: editing?.id ?? uid(),
      classId: activeClassId,
      studentId,
      date,
      category: finalCategory,
      title: title.trim(),
      description: description.trim(),
      actionTaken: actionTaken.trim() || undefined,
    };

    if (editing) {
      set("anecdotes", anecdotes.map((a) => (a.id === editing.id ? item : a)));
    } else {
      set("anecdotes", [...anecdotes, item]);
    }

    successToast(editing ? "Catatan anekdot diperbarui" : "Catatan anekdot ditambahkan");
    setOpen(false);
  };

  const remove = async (a: Anecdote) => {
    const sName = studentName(a.studentId);
    if (await confirmDelete(`Catatan anekdot "${a.title}" untuk ${sName}`)) {
      set("anecdotes", anecdotes.filter((x) => x.id !== a.id));
      successToast("Catatan dihapus");
    }
  };

  const exportExcel = () => {
    const rows = filtered.map((a, i) => ({
      No: i + 1,
      Tanggal: a.date,
      "Nama Siswa": studentName(a.studentId),
      Kategori: a.category,
      Judul: a.title,
      Deskripsi: a.description,
      "Tindakan / Solusi": a.actionTaken ?? "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catatan Anekdot");
    XLSX.writeFile(wb, `Catatan_Anekdot_${className.replace(/\s+/g, "_")}.xlsx`);
  };

  if (!activeClassId) return <NoClassSelected />;

  return (
    <div>
      <PageHeader
        title="Catatan Anekdot Siswa"
        description={`Pencatatan kejadian khusus, penghargaan, dan kedisiplinan siswa ${className}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportExcel} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-600" /> Export Excel
            </Button>
            <Button onClick={openNew} disabled={classStudents.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Catatan
            </Button>
          </div>
        }
      />

      {/* Filter Card */}
      <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Filter Siswa</Label>
            <Select value={filterStudentId} onValueChange={(v) => { setFilterStudentId(v); setPage(1); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Semua Siswa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Siswa ({classStudents.length})</SelectItem>
                {classStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Filter Kategori</Label>
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Penghargaan">🏆 Penghargaan</SelectItem>
                <SelectItem value="Pelanggaran">⚠️ Pelanggaran</SelectItem>
                <SelectItem value="Custom">✍️ Custom / Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Cari Catatan</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Cari judul, nama, atau deskripsi..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-[150px]">Kategori</TableHead>
                <TableHead>Judul & Deskripsi</TableHead>
                <TableHead>Tindakan / Solusi</TableHead>
                <TableHead className="text-right w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((a) => {
                const isReward = a.category === "Penghargaan";
                const isViolation = a.category === "Pelanggaran";

                return (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {a.date}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      {studentName(a.studentId)}
                    </TableCell>
                    <TableCell>
                      {isReward && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold border border-emerald-300/60">
                          <Award className="h-3.5 w-3.5" /> Penghargaan
                        </span>
                      )}
                      {isViolation && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2.5 py-1 text-xs font-bold border border-rose-300/60">
                          <AlertTriangle className="h-3.5 w-3.5" /> Pelanggaran
                        </span>
                      )}
                      {!isReward && !isViolation && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2.5 py-1 text-xs font-bold border border-purple-300/60">
                          <Sparkles className="h-3.5 w-3.5" /> {a.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{a.title}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.description}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {a.actionTaken ? (
                        <div className="rounded-md bg-muted/40 p-2 border border-border/50">{a.actionTaken}</div>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(a)} title="Hapus">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <NotebookPen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-semibold">Belum Ada Catatan Anekdot</p>
                    <p className="text-xs mt-0.5">Klik "Tambah Catatan" untuk mulai mencatat penghargaan atau pelanggaran siswa.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-sm bg-muted/10">
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span> -{" "}
              <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, filtered.length)}</span> dari{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> catatan
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
              </Button>
              <div className="text-xs font-bold px-2.5 py-1 rounded bg-background border shadow-2xs">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Dialog Add / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Catatan Anekdot" : "Tambah Catatan Anekdot Baru"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Kelas: {className}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Pilih Siswa</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih Siswa" /></SelectTrigger>
                  <SelectContent>
                    {classStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tanggal Kejadian</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Kategori Catatan</Label>
              <Select value={categoryType} onValueChange={setCategoryType}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PRESETS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categoryType === "CUSTOM" && (
              <div className="rounded-lg border-2 border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                <Label className="text-purple-900 dark:text-purple-200 font-bold text-xs">
                  Nama Kategori Custom (Bebas Diisi)
                </Label>
                <Input
                  autoFocus
                  placeholder="Contoh: Kesehatan, Prestasi Olahraga, Catatan Sosial..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-1.5 bg-white dark:bg-slate-900"
                />
              </div>
            )}

            <div>
              <Label>Judul Peristiwa / Kejadian</Label>
              <Input
                placeholder="Contoh: Membantu teman yang terjatuh / Terlambat masuk kelas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Deskripsi Peristiwa</Label>
              <Textarea
                rows={3}
                placeholder="Jelaskan secara rinci situasi, waktu, dan kejadian yang berlangsung..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Tindakan Lanjutan / Solusi / Catatan Guru (Opsional)</Label>
              <Textarea
                rows={2}
                placeholder="Tindakan yang diambil (penghargaan/teguran/konseling/solusi)..."
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save}>Simpan Catatan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
