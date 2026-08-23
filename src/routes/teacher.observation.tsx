import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/observation")({ component: TeacherObservationPage });

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

function TeacherObservationPage() {
  const { indicators, observations, students, activeClassId, classes, saveObservation, refresh } = useStore();
  useEffect(() => { void refresh(); }, [refresh]);

  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );
  const [studentId, setStudentId] = useState<string>("");
  const [entries, setEntries] = useState<Record<string, { value: ObservationValue; note: string }>>({});

  useEffect(() => {
    if (!studentId && classStudents[0]) setStudentId(classStudents[0].id);
    if (studentId && !classStudents.some((s) => s.id === studentId)) {
      setStudentId(classStudents[0]?.id ?? "");
    }
  }, [classStudents, studentId]);

  const classIndicators = useMemo(
    () => indicators.filter((i) => i.classId === activeClassId && i.month === month),
    [indicators, activeClassId, month]
  );


  useEffect(() => {
    if (!studentId) return;
    const rec = observations.find((o) => o.studentId === studentId && o.month === month);
    const next: typeof entries = {};
    classIndicators.forEach((i) => {
      const e = rec?.entries.find((x) => x.indicatorId === i.id);
      next[i.id] = { value: e?.value ?? "BB", note: e?.note ?? "" };
    });
    setEntries(next);
    // Only reload from cloud when student/month changes — auto-refresh must not
    // overwrite the teacher's unsaved input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, month]);

  if (!activeClassId) return <NoClassSelected />;
  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";

  const setValue = (id: string, value: ObservationValue) =>
    setEntries((p) => ({ ...p, [id]: { ...p[id], value } }));
  const setNote = (id: string, note: string) =>
    setEntries((p) => ({ ...p, [id]: { ...p[id], note } }));

  const save = async () => {
    if (!studentId) return;
    const ok = await saveObservation({
      studentId,
      month,
      entries: classIndicators.map((i) => ({
        indicatorId: i.id,
        value: entries[i.id]?.value ?? "BB",
        note: entries[i.id]?.note ?? "",
      })),
    });
    if (ok) successToast("Observasi tersimpan");
    else await swal.fire({ icon: "error", title: "Gagal menyimpan", text: "Data observasi belum tersimpan ke database." });
  };

  const groups: { cat: IndicatorCategory; icon: typeof Heart; tone: string }[] = [
    { cat: "Adab", icon: Heart, tone: "bg-primary/10 text-primary" },
    { cat: "Tarbiyah", icon: Sparkles, tone: "bg-accent text-accent-foreground" },
  ];

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const filled = observations.some((o) => o.studentId === studentId && o.month === month);

  return (
    <div>
      <PageHeader title="Lihat Observasi" description={`Isi matriks observasi Adab & Tarbiyah per siswa dan per bulan untuk ${className}.`} />

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <div>
            <Label className="text-xs">Siswa</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
              <SelectContent>
                {classStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bulan Penilaian</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.flatMap((y) => MONTHS.map((m) => (
                  <SelectItem key={`${y}-${m}`} value={`${y}-${m}`}>{MONTH_LABEL[m]} {y}</SelectItem>
                )))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <span className={`text-xs font-semibold ${filled ? "text-primary" : "text-muted-foreground"}`}>
              {filled ? "Sudah ada data" : "Belum diisi"}
            </span>
          </div>
        </CardContent>
      </Card>

      {classStudents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Belum ada siswa di kelas ini.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(({ cat, icon: Icon, tone }) => {
            const list = classIndicators.filter((i) => i.category === cat);
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
                            {items.map((i) => {
                              const val = entries[i.id]?.value ?? "BB";
                              return (
                                <tr key={i.id} className="border-t">
                                  <td className="p-3 align-top">{i.text}</td>
                                  <td colSpan={4} className="p-3">
                                    <RadioGroup value={val} onValueChange={(v) => setValue(i.id, v as ObservationValue)} className="flex justify-around">
                                      {VALUES.map((v) => (
                                        <div key={v.v} className="flex flex-col items-center gap-1">
                                          <RadioGroupItem id={`t-${i.id}-${v.v}`} value={v.v} />
                                          <Label htmlFor={`t-${i.id}-${v.v}`} className="text-[10px] text-muted-foreground">{v.v}</Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </td>
                                  <td className="p-3 align-top">
                                    <Textarea rows={2} value={entries[i.id]?.note ?? ""} onChange={(e) => setNote(i.id, e.target.value)} placeholder="Catatan..." className="text-xs" />
                                  </td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ))}
                        {list.length === 0 && (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground italic">Belum ada indikator.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={save} disabled={!studentId} className="h-12 px-8 text-base font-bold">
          <Save className="h-5 w-5 mr-2" /> Simpan Observasi
        </Button>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Keterangan: {VALUES.map((v) => `${v.v} = ${v.label}`).join(" · ")}
      </div>
    </div>
  );
}
