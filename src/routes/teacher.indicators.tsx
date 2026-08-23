import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Indicator, type IndicatorCategory } from "@/lib/store";
import { confirmDelete, successToast } from "@/lib/swal";
import { Copy, Heart, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/indicators")({ component: IndicatorsPage });

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_LABEL: Record<string,string> = {
  "01":"Januari","02":"Februari","03":"Maret","04":"April","05":"Mei","06":"Juni",
  "07":"Juli","08":"Agustus","09":"September","10":"Oktober","11":"November","12":"Desember"
};

function IndicatorsPage() {
  const { indicators, adabTitles, set, uid, activeClassId, classes } = useStore();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [month, setMonth] = useState(currentMonth);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Indicator | null>(null);
  const [category, setCategory] = useState<IndicatorCategory>("Adab");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [newTitleMode, setNewTitleMode] = useState(false);
  const [newTitleVal, setNewTitleVal] = useState("");

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classIndicators = useMemo(
    () => indicators.filter((i) => i.classId === activeClassId && i.month === month),
    [indicators, activeClassId, month]
  );

  const openNew = (cat?: IndicatorCategory) => {
    setEditing(null); setCategory(cat ?? "Adab"); setTitle(adabTitles[0] ?? ""); setText(""); setNewTitleMode(false); setNewTitleVal(""); setOpen(true);
  };
  const openEdit = (i: Indicator) => {
    setEditing(i); setCategory(i.category); setTitle(i.title ?? ""); setText(i.text); setNewTitleMode(false); setNewTitleVal(""); setOpen(true);
  };
  const addTitle = () => {
    const t = newTitleVal.trim();
    if (!t) return;
    if (!adabTitles.includes(t)) set("adabTitles", [...adabTitles, t]);
    setTitle(t);
    setNewTitleVal("");
    setNewTitleMode(false);
  };
  const save = () => {
    if (!text.trim() || !activeClassId) return;
    if (category === "Adab" && !title.trim()) return;
    const data: Indicator = {
      id: editing?.id ?? uid(),
      classId: activeClassId,
      month,
      category,
      text: text.trim(),
      title: category === "Adab" ? title.trim() : undefined,
    };
    if (editing) set("indicators", indicators.map((x) => x.id === editing.id ? data : x));
    else set("indicators", [...indicators, data]);
    successToast("Tersimpan");
    setOpen(false);
  };
  const remove = async (i: Indicator) => {
    if (await confirmDelete(i.text)) {
      set("indicators", indicators.filter((x) => x.id !== i.id));
      successToast("Dihapus");
    }
  };

  const copyFromPrev = () => {
    const [y, m] = month.split("-").map(Number);
    let py = y, pm = m - 1;
    if (pm < 1) { pm = 12; py--; }
    const prev = `${py}-${String(pm).padStart(2,"0")}`;
    const src = indicators.filter((i) => i.classId === activeClassId && i.month === prev);
    if (src.length === 0) { successToast(`Tidak ada indikator di ${MONTH_LABEL[String(pm).padStart(2,"0")]} ${py}`); return; }
    const cloned: Indicator[] = src.map((s) => ({ ...s, id: uid(), month }));
    set("indicators", [...indicators, ...cloned]);
    successToast(`${cloned.length} indikator disalin`);
  };

  if (!activeClassId) return <NoClassSelected />;

  const adabList = classIndicators.filter((i) => i.category === "Adab");
  const tarbiyahList = classIndicators.filter((i) => i.category === "Tarbiyah");
  const adabGrouped: Record<string, Indicator[]> = {};
  adabList.forEach((i) => {
    const k = i.title || "(Tanpa Judul)";
    (adabGrouped[k] ||= []).push(i);
  });

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div>
      <PageHeader title="Indikator Observasi" description={`Indikator Adab & Tarbiyah per bulan untuk ${className}.`}
        actions={<Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-1" /> Indikator Baru</Button>} />

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
          <div>
            <Label className="text-xs">Bulan Indikator</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.flatMap((y) => MONTHS.map((m) => (
                  <SelectItem key={`${y}-${m}`} value={`${y}-${m}`}>{MONTH_LABEL[m]} {y}</SelectItem>
                )))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground flex items-end pb-1">
            Indikator dibuat per bulan. Data observasi mengikuti indikator bulan yang sama.
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={copyFromPrev}>
              <Copy className="h-4 w-4 mr-1" /> Salin dari bulan lalu
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Heart className="h-5 w-5" /></div>
              <div>
                <div className="font-semibold">Adab</div>
                <div className="text-xs text-muted-foreground">{adabList.length} indikator · {Object.keys(adabGrouped).length} judul</div>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => openNew("Adab")}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              {Object.entries(adabGrouped).map(([grp, items]) => (
                <div key={grp}>
                  <div className="text-xs font-bold uppercase tracking-wide text-primary mb-2">{grp}</div>
                  <div className="space-y-2">
                    {items.map((i) => (
                      <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="text-sm min-w-0 truncate">{i.text}</div>
                        <div className="flex shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {adabList.length === 0 && <p className="text-sm text-muted-foreground italic">Belum ada indikator untuk bulan ini.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Sparkles className="h-5 w-5" /></div>
              <div>
                <div className="font-semibold">Tarbiyah</div>
                <div className="text-xs text-muted-foreground">{tarbiyahList.length} indikator</div>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => openNew("Tarbiyah")}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {tarbiyahList.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="text-sm min-w-0 truncate">{i.text}</div>
                  <div className="flex shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              {tarbiyahList.length === 0 && <p className="text-sm text-muted-foreground italic">Belum ada indikator untuk bulan ini.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Indikator" : "Indikator Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
              Kelas: <span className="font-semibold text-primary">{className}</span> · Bulan: <span className="font-semibold text-primary">{MONTH_LABEL[month.split("-")[1]]} {month.split("-")[0]}</span>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as IndicatorCategory)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adab">Adab</SelectItem>
                  <SelectItem value="Tarbiyah">Tarbiyah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category === "Adab" && (
              <div>
                <Label>Judul Adab</Label>
                <div className="mt-1.5 flex gap-2">
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih judul..." /></SelectTrigger>
                    <SelectContent>
                      {adabTitles.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewTitleMode((v) => !v)}>
                    <Plus className="h-4 w-4 mr-1" /> Judul
                  </Button>
                </div>
                {newTitleMode && (
                  <div className="mt-2 flex gap-2">
                    <Input value={newTitleVal} onChange={(e) => setNewTitleVal(e.target.value)} placeholder="Judul adab baru..." />
                    <Button type="button" size="sm" onClick={addTitle}>Tambah</Button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>{category === "Adab" ? "Sub Judul (deskripsi indikator)" : "Deskripsi Indikator"}</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} className="mt-1.5" placeholder={category === "Adab" ? "Contoh: Mengucap salam saat bertemu guru" : "Deskripsi..."} />
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
