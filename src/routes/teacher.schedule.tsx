import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type ScheduleItem } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

const DAYS: ScheduleItem["day"][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export const Route = createFileRoute("/teacher/schedule")({ component: SchedulePage });

function SchedulePage() {
  const { schedule, set, uid, activeClassId, classes } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [day, setDay] = useState<ScheduleItem["day"]>("Senin");
  const [subject, setSubject] = useState("");

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classSchedule = schedule.filter((s) => s.classId === activeClassId);

  const openNew = () => { setEditing(null); setDay("Senin"); setSubject(""); setOpen(true); };
  const openEdit = (it: ScheduleItem) => { setEditing(it); setDay(it.day); setSubject(it.subject); setOpen(true); };
  const save = () => {
    if (!subject.trim() || !activeClassId) return;
    const data: ScheduleItem = { id: editing?.id ?? uid(), classId: activeClassId, day, subject };
    if (editing) set("schedule", schedule.map((s) => s.id === editing.id ? data : s));
    else set("schedule", [...schedule, data]);
    successToast("Tersimpan");
    setOpen(false);
  };
  const remove = async (it: ScheduleItem) => {
    if (await confirmDelete(`${it.day} - ${it.subject}`)) {
      set("schedule", schedule.filter((x) => x.id !== it.id));
      successToast("Dihapus");
    }
  };

  if (!activeClassId) return <NoClassSelected />;

  const byDay = DAYS.map((d) => ({ day: d, items: classSchedule.filter((s) => s.day === d) }));

  return (
    <div>
      <PageHeader title="Jadwal Pelajaran" description={`Jadwal mingguan untuk ${className}.`}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Hari</TableHead><TableHead>Pelajaran</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {byDay.flatMap(({ day, items }) =>
                items.length === 0
                  ? [<TableRow key={day}><TableCell className="font-medium">{day}</TableCell><TableCell className="text-muted-foreground italic">Belum ada</TableCell><TableCell /></TableRow>]
                  : items.map((it, i) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{i === 0 ? day : ""}</TableCell>
                        <TableCell>{it.subject}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(it)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Jadwal" : "Tambah Jadwal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
              Kelas: <span className="font-semibold text-primary">{className}</span>
            </div>
            <div>
              <Label>Hari</Label>
              <Select value={day} onValueChange={(v) => setDay(v as ScheduleItem["day"])}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Pelajaran</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" /></div>
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
