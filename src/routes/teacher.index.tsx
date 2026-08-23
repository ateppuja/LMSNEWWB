import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Material } from "@/lib/store";
import { confirmDelete, successToast, swal } from "@/lib/swal";
import { Pencil, Plus, Search, Trash2, Megaphone, FileDown, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/teacher/")({ component: MaterialsPage });

const TEACHER_ANNOUNCEMENT_KEY = "__teachers__";

const ADD_NEW = "__add_new__";

function MaterialsPage() {
  const { materials, subjects, set, uid, activeClassId, classes, announcements, students, observations, refresh } = useStore();
  useEffect(() => { void refresh(); }, [refresh]);
  const adminAnnouncement = announcements[TEACHER_ANNOUNCEMENT_KEY]?.trim();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [videoLink, setVideoLink] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setPage(1);
  }, [q, filterSubject]);

  const mySubjects = useMemo(
    () => subjects.filter((s) => s.classId === activeClassId),
    [subjects, activeClassId]
  );
  const classMaterials = useMemo(
    () => materials.filter((m) => m.classId === activeClassId),
    [materials, activeClassId]
  );
  const filtered = useMemo(
    () =>
      classMaterials.filter((m) => {
        if (filterSubject !== "all" && m.subjectId !== filterSubject) return false;
        if (q && !m.title.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [classMaterials, filterSubject, q]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );
  const observedThisMonth = useMemo(
    () => classStudents.filter((s) => observations.some((o) => o.studentId === s.id && o.month === currentMonth && o.entries.length > 0)).length,
    [classStudents, observations, currentMonth]
  );
  const observationPct = classStudents.length ? Math.round((observedThisMonth / classStudents.length) * 100) : 0;

  const openNew = () => {
    setEditing(null);
    setSubjectId(mySubjects[0]?.id ?? "");
    setTitle(""); setPublishDate(new Date().toISOString().slice(0, 10));
    setVideoLink(""); setFileLink(""); setInstructions("");
    setOpen(true);
  };
  const openEdit = (m: Material) => {
    setEditing(m); setSubjectId(m.subjectId); setTitle(m.title);
    setPublishDate(m.publishDate); setVideoLink(m.videoLink ?? "");
    setFileLink(m.fileLink ?? ""); setInstructions(m.instructions ?? "");
    setOpen(true);
  };

  const [newCatMode, setNewCatMode] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const handleSubjectChange = (v: string) => {
    if (v === ADD_NEW) {
      setNewCatMode(true);
      setNewCatName("");
    } else setSubjectId(v);
  };

  const addNewCategory = () => {
    const name = newCatName.trim();
    if (!name || !activeClassId) return;
    const newId = uid();
    set("subjects", [...subjects, { id: newId, name, classId: activeClassId }]);
    setSubjectId(newId);
    setNewCatMode(false);
    setNewCatName("");
    successToast("Kategori ditambahkan");
  };

  const save = () => {
    if (!title.trim() || !subjectId || !activeClassId) return;
    const data: Material = { id: editing?.id ?? uid(), classId: activeClassId, subjectId, title, publishDate, videoLink, fileLink, instructions };
    if (editing) set("materials", materials.map((m) => m.id === editing.id ? data : m));
    else set("materials", [...materials, data]);
    successToast(editing ? "Materi diperbarui" : "Materi ditambahkan");
    setOpen(false);
  };

  const remove = async (m: Material) => {
    if (await confirmDelete(m.title)) {
      set("materials", materials.filter((x) => x.id !== m.id));
      successToast("Dihapus");
    }
  };

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "-";

  const exportExcel = () => {
    if (classMaterials.length === 0) {
      swal.fire({ icon: "info", title: "Tidak ada materi", text: "Belum ada materi untuk diexport." });
      return;
    }
    const wb = XLSX.utils.book_new();
    const targetSubjects = filterSubject === "all"
      ? mySubjects.filter((s) => classMaterials.some((m) => m.subjectId === s.id))
      : mySubjects.filter((s) => s.id === filterSubject);
    targetSubjects.forEach((s) => {
      const rows = classMaterials
        .filter((m) => m.subjectId === s.id)
        .map((m) => ({
          Judul: m.title,
          "Tanggal Publish": m.publishDate,
          "Link Video": m.videoLink ?? "",
          "Link File": m.fileLink ?? "",
          Instruksi: m.instructions ?? "",
        }));
      if (rows.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 32 }, { wch: 14 }, { wch: 30 }, { wch: 30 }, { wch: 40 }];
      const sheetName = s.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    if (wb.SheetNames.length === 0) {
      swal.fire({ icon: "info", title: "Tidak ada materi", text: "Kategori yang dipilih belum memiliki materi." });
      return;
    }
    const safeClass = className.replace(/\s+/g, "_");
    XLSX.writeFile(wb, `Materi_${safeClass}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    successToast("Excel berhasil diexport");
  };

  if (!activeClassId) return <NoClassSelected />;

  return (
    <div>
      <PageHeader
        title="Kelola Materi"
        description={`Publikasikan materi untuk ${className}.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel}><FileDown className="h-4 w-4 mr-1" /> Export Excel</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Materi Baru</Button>
          </div>
        }
      />

      {adminAnnouncement && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-primary mb-1">Pengumuman dari Admin</div>
              <div className="text-sm whitespace-pre-wrap">{adminAnnouncement}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Progress Matriks Observasi Bulan Ini</div>
            <div className="text-sm text-muted-foreground">
              {observedThisMonth} dari {classStudents.length} siswa sudah mengisi · {observationPct}%
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>Refresh</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul materi..." className="pl-9" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {mySubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tanggal Publish</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>{subjectName(m.subjectId)}</TableCell>
                  <TableCell>{m.publishDate}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Tidak ada materi.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-sm bg-muted/10">
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span> - <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, filtered.length)}</span> dari <span className="font-semibold text-foreground">{filtered.length}</span> materi
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Materi" : "Materi Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
              Kelas: <span className="font-semibold text-primary">{className}</span>
            </div>
            <div>
              <Label>Kategori Mapel</Label>
              {newCatMode ? (
                <div className="mt-1.5 flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Nama kategori baru"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewCategory())}
                  />
                  <Button type="button" onClick={addNewCategory}>Tambah</Button>
                  <Button type="button" variant="outline" onClick={() => setNewCatMode(false)}>Batal</Button>
                </div>
              ) : (
                <div className="mt-1.5 flex gap-2">
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {mySubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => { setNewCatMode(true); setNewCatName(""); }}>
                    <Plus className="h-4 w-4 mr-1" /> Kategori
                  </Button>
                </div>
              )}
            </div>
            <div><Label>Judul</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Tanggal Publish</Label><Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Link Video</Label><Input value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
            <div><Label>Link File</Label><Input value={fileLink} onChange={(e) => setFileLink(e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
            <div><Label>Instruksi Tugas</Label><Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1.5" rows={4} /></div>
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
