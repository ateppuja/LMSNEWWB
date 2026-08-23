import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, type Teacher } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";

export const Route = createFileRoute("/admin/teachers")({ component: TeachersPage });

function TeachersPage() {
  const { teachers, classes, set, uid } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);

  const openNew = () => { setEditing(null); setName(""); setCode(""); setClassIds([]); setOpen(true); };
  const openEdit = (t: Teacher) => { setEditing(t); setName(t.name); setCode(t.code); setClassIds(t.classIds); setOpen(true); };

  const toggle = (id: string) =>
    setClassIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    if (!name.trim() || !code.trim()) return;
    const data: Teacher = { id: editing?.id ?? uid(), name: name.trim(), code: code.trim(), classIds };
    if (editing) set("teachers", teachers.map((t) => (t.id === editing.id ? data : t)));
    else set("teachers", [...teachers, data]);
    successToast("Tersimpan");
    setOpen(false);
  };


  const remove = async (t: Teacher) => {
    if (await confirmDelete(t.name)) {
      set("teachers", teachers.filter((x) => x.id !== t.id));
      successToast("Dihapus");
    }
  };

  const classNames = (ids: string[]) =>
    ids.map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "—";

  return (
    <div>
      <PageHeader
        title="Guru & Penugasan Kelas"
        description="Tambah guru dan tentukan kelas apa saja yang mereka pegang."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Tambah Guru</Button>}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {teachers.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserCog className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Kode: <span className="font-mono font-semibold text-primary">{t.code}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Kelas: <span className="text-foreground">{classNames(t.classIds)}</span>
                  </div>
                </div>

                <div className="flex shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {teachers.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada guru.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Guru" : "Tambah Guru"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Guru</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Ustadz / Ustadzah ..." />
            </div>
            <div>
              <Label>Kode Login Guru</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 font-mono" placeholder="Contoh: GURU1" />
              <p className="text-xs text-muted-foreground mt-1">Guru login dengan memilih kelas + memasukkan kode ini.</p>
            </div>
            <div>
              <Label>Kelas yang Ditangani</Label>

              <div className="mt-2 space-y-2 rounded-lg border p-3">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={classIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                    <span className="text-sm">{c.name} <span className="text-muted-foreground">· Grade {c.grade}</span></span>
                  </label>
                ))}
                {classes.length === 0 && <p className="text-xs text-muted-foreground">Belum ada kelas. Buat di menu Kelola Kelas.</p>}
              </div>
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
