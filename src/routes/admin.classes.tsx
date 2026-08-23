import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type ClassRoom } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/classes")({ component: ClassesPage });

function ClassesPage() {
  const { classes, set, uid, students } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");

  const openNew = () => { setEditing(null); setName(""); setGrade(""); setOpen(true); };
  const openEdit = (c: ClassRoom) => { setEditing(c); setName(c.name); setGrade(c.grade); setOpen(true); };

  const save = () => {
    if (!name.trim()) return;
    if (editing) {
      set("classes", classes.map((c) => c.id === editing.id ? { ...c, name, grade } : c));
      successToast("Kelas diperbarui");
    } else {
      set("classes", [...classes, { id: uid(), name, grade }]);
      successToast("Kelas ditambahkan");
    }
    setOpen(false);
  };

  const remove = async (c: ClassRoom) => {
    if (await confirmDelete(c.name)) {
      set("classes", classes.filter((x) => x.id !== c.id));
      successToast("Kelas dihapus");
    }
  };

  return (
    <div>
      <PageHeader
        title="Kelola Kelas"
        description="Buat dan kelola kelas beserta tingkatannya."
        actions={
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Tambah Kelas</Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.grade}</TableCell>
                  <TableCell>{students.filter((s) => s.classId === c.id).length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada kelas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama Kelas</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Kelas 4A" />
            </div>
            <div>
              <Label>Grade / Tingkatan</Label>
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1.5" placeholder="4" />
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
