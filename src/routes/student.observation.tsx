import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useStore, type IndicatorCategory, type ObservationValue } from "@/lib/store";
import { successToast, swal } from "@/lib/swal";
import { Heart, Save, Sparkles } from "lucide-react";

export const Route = createFileRoute("/student/observation")({ component: ObservationPage });

const VALUES: { v: ObservationValue; label: string }[] = [
  { v: "BB", label: "Belum Berkembang" },
  { v: "MB", label: "Mulai Berkembang" },
  { v: "BSH", label: "Berkembang Sesuai Harapan" },
  { v: "BSB", label: "Berkembang Sangat Baik" },
];

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_LABEL: Record<string,string> = {
  "01":"Januari","02":"Februari","03":"Maret","04":"April","05":"Mei","06":"Juni",
  "07":"Juli","08":"Agustus","09":"September","10":"Oktober","11":"November","12":"Desember"
};

function ObservationPage() {
  const { indicators, observations, user, students, saveObservation } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [entries, setEntries] = useState<Record<string, { value: ObservationValue; note: string }>>({});

  const student = useMemo(
    () => students.find((s) => s.id === user?.studentId) ?? students[0],
    [students, user]
  );

  const classIndicators = useMemo(
    () => indicators.filter((i) => i.classId === student?.classId && i.month === month),
    [indicators, student, month]
  );


  useEffect(() => {
    if (!student) return;
    const rec = observations.find((o) => o.studentId === student.id && o.month === month);
    const next: typeof entries = {};
    classIndicators.forEach((i) => {
      const e = rec?.entries.find((x) => x.indicatorId === i.id);
      next[i.id] = { value: e?.value ?? "BB", note: e?.note ?? "" };
    });
    setEntries(next);
    // Only reload from cloud when student/month changes, not on every observations refresh —
    // otherwise the 30s auto-refresh would overwrite the student's unsaved input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, month]);

  const setValue = (id: string, value: ObservationValue) =>
    setEntries((p) => ({ ...p, [id]: { ...p[id], value } }));
  const setNote = (id: string, note: string) =>
    setEntries((p) => ({ ...p, [id]: { ...p[id], note } }));

  // Auto-save with debounce — persists without waiting for the Save button.
  const initialLoadRef = useRef(true);
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => {
    // Skip the initial hydration effect that populates entries on mount / month change.
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!student || classIndicators.length === 0) return;
    setAutoStatus("saving");
    const t = setTimeout(async () => {
      const ok = await saveObservation({
        studentId: student.id,
        month,
        entries: classIndicators.map((i) => ({
          indicatorId: i.id,
          value: entries[i.id]?.value ?? "BB",
          note: entries[i.id]?.note ?? "",
        })),
      });
      setAutoStatus(ok ? "saved" : "error");
    }, 1200);
    return () => clearTimeout(t);
  }, [entries, student, month, classIndicators, saveObservation]);

  // Reset the initial-load guard when the target record changes.
  useEffect(() => {
    initialLoadRef.current = true;
    setAutoStatus("idle");
  }, [student?.id, month]);

  const save = async () => {
    if (!student) return;
    const ok = await saveObservation({
      studentId: student.id,
      month,
      entries: classIndicators.map((i) => ({
        indicatorId: i.id,
        value: entries[i.id]?.value ?? "BB",
        note: entries[i.id]?.note ?? "",
      })),
    });
    if (ok) successToast("Data observasi tersimpan dan terkirim ke guru");
    else await swal.fire({ icon: "error", title: "Gagal menyimpan", text: "Data observasi belum terkirim. Coba simpan ulang." });
  };

  const groups: { cat: IndicatorCategory; icon: typeof Heart; tone: string }[] = [
    { cat: "Adab", icon: Heart, tone: "bg-primary/10 text-primary" },
    { cat: "Tarbiyah", icon: Sparkles, tone: "bg-accent text-accent-foreground" },
  ];

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div>
      <PageHeader title="Matriks Observasi" description="Refleksikan pertumbuhan Adab dan Tarbiyah-mu setiap bulan." />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Label className="text-sm font-semibold">Bulan penilaian:</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.flatMap((y) => MONTHS.map((m) => (
                <SelectItem key={`${y}-${m}`} value={`${y}-${m}`}>{MONTH_LABEL[m]} {y}</SelectItem>
              )))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground ml-auto">Siswa: <span className="font-semibold text-foreground">{student?.name ?? "-"}</span></div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.map(({ cat, icon: Icon, tone }) => {
          const list = classIndicators.filter((i) => i.category === cat);
          // Group Adab by title; Tarbiyah as single group
          const grouped: Record<string, typeof list> = {};
          if (cat === "Adab") {
            list.forEach((i) => {
              const k = i.title || "(Tanpa Judul)";
              (grouped[k] ||= []).push(i);
            });
          } else {
            grouped["__all__"] = list;
          }
          return (
            <Card key={cat}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-5 border-b">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold text-lg">{cat}</div>
                    <div className="text-xs text-muted-foreground">{list.length} indikator</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 min-w-[220px]">Indikator</th>
                        {VALUES.map((v) => (
                          <th key={v.v} className="p-3 text-center text-xs font-semibold" title={v.label}>{v.v}</th>
                        ))}
                        <th className="text-left p-3 min-w-[200px]">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grouped).map(([grp, items]) => (
                        <Fragment key={grp}>
                          {cat === "Adab" && (
                            <tr className="bg-primary/5">
                              <td colSpan={6} className="p-2 px-3 text-xs font-bold uppercase tracking-wide text-primary">{grp}</td>
                            </tr>
                          )}
                          {items.map((i) => (
                            <tr key={i.id} className="border-t">
                              <td className="p-3 align-top">{i.text}</td>
                              {(() => {
                                const val = entries[i.id]?.value ?? "BB";
                                return (
                                  <td colSpan={4} className="p-3">
                                    <RadioGroup value={val} onValueChange={(v) => setValue(i.id, v as ObservationValue)} className="flex justify-around">
                                      {VALUES.map((v) => (
                                        <div key={v.v} className="flex flex-col items-center gap-1">
                                          <RadioGroupItem id={`${i.id}-${v.v}`} value={v.v} />
                                          <Label htmlFor={`${i.id}-${v.v}`} className="text-[10px] text-muted-foreground">{v.v}</Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </td>
                                );
                              })()}
                              <td className="p-3 align-top">
                                <Textarea rows={2} value={entries[i.id]?.note ?? ""} onChange={(e) => setNote(i.id, e.target.value)} placeholder="Catatan..." className="text-xs" />
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                      {list.length === 0 && (
                        <tr><td colSpan={6} className="p-6 text-center text-muted-foreground italic">Belum ada indikator untuk kelasmu.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground">
          {autoStatus === "saving" && "Menyimpan otomatis..."}
          {autoStatus === "saved" && "Tersimpan otomatis"}
          {autoStatus === "error" && <span className="text-destructive">Gagal auto-save, coba tombol Simpan</span>}
        </span>
        <Button size="lg" onClick={save} className="h-12 px-8 text-base font-bold">
          <Save className="h-5 w-5 mr-2" /> Simpan &amp; Update Data
        </Button>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Keterangan: {VALUES.map((v) => `${v.v} = ${v.label}`).join(" · ")}
      </div>
    </div>
  );
}
