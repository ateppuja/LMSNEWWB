import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Module } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { FolderOpen, Plus, FileText, Pencil, Trash2, FolderPlus } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/modules")({ component: ModulesPage });

const FOLDERS_KEY = (classId: string) => `wb-module-folders:${classId}`;

function loadFolderIds(classId: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY(classId)) ?? "[]"); } catch { return []; }
}
function saveFolderIds(classId: string, ids: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(FOLDERS_KEY(classId), JSON.stringify(ids));
}

function ModulesPage() {
  const { modules, subjects, set, uid, activeClassId, classes } = useStore();
  const [folderIds, setFolderIds] = useState<string[]>([]);
  useEffect(() => { if (activeClassId) setFolderIds(loadFolderIds(activeClassId)); }, [activeClassId]);

  const [folderOpen, setFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [fileLink, setFileLink] = useState("");

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classModules = modules.filter((m) => m.classId === activeClassId);

  // Folders visible for this class = teacher-created here + any that have modules
  const activeFolderIds = Array.from(new Set([...folderIds, ...classModules.map((m) => m.subjectId)]));
  const folders = activeFolderIds
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is { id: string; name: string } => !!s);

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name || !activeClassId) return;
    const newId = uid();
    set("subjects", [...subjects, { id: newId, name, classId: activeClassId }]);
    const next = [...folderIds, newId];
    setFolderIds(next);
    saveFolderIds(activeClassId, next);
    setNewFolderName("");
    setFolderOpen(false);
    successToast("Folder ditambahkan");
  };

  const removeFolder = async (id: string, name: string) => {
    const hasModules = classModules.some((m) => m.subjectId === id);
    if (hasModules) {
      const ok = await confirmDelete(`Folder "${name}" beserta modul di dalamnya`);
      if (!ok) return;
      set("modules", modules.filter((m) => !(m.classId === activeClassId && m.subjectId === id)));
    }
    const next = folderIds.filter((x) => x !== id);
    setFolderIds(next);
    if (activeClassId) saveFolderIds(activeClassId, next);
    successToast("Folder dihapus");
  };

  const openNew = (preselect?: string) => { setEditing(null); setSubjectId(preselect ?? folders[0]?.id ?? ""); setTitle(""); setFileLink(""); setOpen(true); };
  const openEdit = (m: Module) => { setEditing(m); setSubjectId(m.subjectId); setTitle(m.title); setFileLink(m.fileLink); setOpen(true); };
  const save = () => {
    if (!title.trim() || !subjectId || !activeClassId) return;
    const data: Module = { id: editing?.id ?? uid(), classId: activeClassId, subjectId, title, fileLink };
    if (editing) set("modules", modules.map((m) => m.id === editing.id ? data : m));
    else set("modules", [...modules, data]);
    successToast(editing ? "Modul diperbarui" : "Modul ditambahkan");
    setOpen(false);
  };
  const remove = async (m: Module) => {
    if (await confirmDelete(m.title)) {
      set("modules", modules.filter((x) => x.id !== m.id));
      successToast("Dihapus");
    }
  };

  if (!activeClassId) return <NoClassSelected />;

  return (
    <div>
      <PageHeader title="Kelola Modul" description={`Modul untuk ${className}.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setNewFolderName(""); setFolderOpen(true); }}>
              <FolderPlus className="h-4 w-4 mr-1" /> Folder Baru
            </Button>
            <Button onClick={() => openNew()} disabled={folders.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Modul Baru
            </Button>
          </div>
        } />

      {folders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="font-semibold">Belum ada folder modul</div>
            <p className="text-sm text-muted-foreground mt-1">Buat folder terlebih dahulu untuk mulai menambahkan modul.</p>
            <Button className="mt-4" onClick={() => { setNewFolderName(""); setFolderOpen(true); }}>
              <FolderPlus className="h-4 w-4 mr-1" /> Tambah Folder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {folders.map((s) => {
            const list = classModules.filter((m) => m.subjectId === s.id);
            return (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <div className="font-semibold">{s.name}</div>
                    <span className="text-xs text-muted-foreground">({list.length} file)</span>
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openNew(s.id)}>
                        <Plus className="h-4 w-4 mr-1" /> Modul
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeFolder(s.id, s.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada modul di folder ini.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="text-sm font-medium truncate">{m.title}</div>
                          </div>
                          <div className="flex shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => remove(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Folder Modul Baru</DialogTitle></DialogHeader>
          <div>
            <Label>Nama Folder</Label>
            <Input autoFocus className="mt-1.5" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFolder())}
              placeholder="Contoh: Fiqih, Tahfidz, Bahasa Arab..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderOpen(false)}>Batal</Button>
            <Button onClick={addFolder}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Modul" : "Modul Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
              Kelas: <span className="font-semibold text-primary">{className}</span>
            </div>
            <div>
              <Label>Folder</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih folder" /></SelectTrigger>
                <SelectContent>{folders.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Judul</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Link File</Label><Input value={fileLink} onChange={(e) => setFileLink(e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
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
