import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Student, type StudentStatus } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { confirmDelete, successToast } from "@/lib/swal";
import { Pencil, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/students")({ component: StudentsPage });

const PAGE_SIZE = 8;

function StudentsPage() {
  const { students, classes, set, uid, activeClassId } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<StudentStatus>("Reguler");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );
  const filtered = useMemo(
    () => classStudents.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())),
    [classStudents, q]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNew = () => { setEditing(null); setName(""); setPin(""); setStatus("Reguler"); setOpen(true); };
  const openEdit = (s: Student) => { setEditing(s); setName(s.name); setPin(s.pin); setStatus(s.status ?? "Reguler"); setOpen(true); };
  const save = () => {
    if (!name.trim() || !pin.trim() || !activeClassId) return;
    const data: Student = { id: editing?.id ?? uid(), name, pin, classId: activeClassId, status };
    if (editing) set("students", students.map((x) => x.id === editing.id ? data : x));
    else set("students", [...students, data]);
    successToast("Tersimpan");
    setOpen(false);
  };
  const remove = async (s: Student) => {
    if (await confirmDelete(s.name)) {
      set("students", students.filter((x) => x.id !== s.id));
      successToast("Dihapus");
    }
  };

  if (!activeClassId) return <NoClassSelected />;

  return (
    <div>
      <PageHeader title="Manajemen Siswa" description={`Daftar siswa ${className}.`}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Tambah Siswa</Button>} />
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama siswa..." className="pl-9" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nama</TableHead><TableHead>Status Kelas</TableHead><TableHead>Kode Siswa</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Online" ? "secondary" : "default"}>{s.status ?? "Reguler"}</Badge>
                  </TableCell>
                  <TableCell><span className="font-mono">{s.pin}</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {pageData.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Tidak ada siswa.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-3 border-t">
            <div className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
              Kelas: <span className="font-semibold text-primary">{className}</span>
            </div>
            <div><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Kode Siswa</Label><Input value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1.5 font-mono" placeholder="Contoh: 1234" /></div>
            <div>
              <Label>Status Kelas</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StudentStatus)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reguler">Reguler</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
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
