import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, type IndicatorCategory } from "@/lib/store";
import { successToast, swal } from "@/lib/swal";
import { Download, FileText } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/reports")({ component: ReportsPage });

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_LABEL: Record<string,string> = {
  "01":"Januari","02":"Februari","03":"Maret","04":"April","05":"Mei","06":"Juni",
  "07":"Juli","08":"Agustus","09":"September","10":"Oktober","11":"November","12":"Desember"
};

function labelMonth(m: string) {
  const [y, mm] = m.split("-");
  return `${MONTH_LABEL[mm] ?? mm} ${y}`;
}

function monthsInRange(from: string, to: string): string[] {
  if (from > to) [from, to] = [to, from];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const out: string[] = [];
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2,"0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

function ReportsPage() {
  const { students, observations, indicators, classes, activeClassId, refresh } = useStore();
  useEffect(() => { void refresh(); }, [refresh]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [fromMonth, setFromMonth] = useState(currentMonth);
  const [toMonth, setToMonth] = useState(currentMonth);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );

  const months = useMemo(() => monthsInRange(fromMonth, toMonth), [fromMonth, toMonth]);

  // per-student: how many months in range have any observation entries
  const studentProgress = useMemo(() => {
    const map = new Map<string, { done: number; total: number; pct: number }>();
    classStudents.forEach((s) => {
      const done = months.reduce((acc, mo) => {
        const rec = observations.find((o) => o.studentId === s.id && o.month === mo);
        return acc + (rec && rec.entries.length > 0 ? 1 : 0);
      }, 0);
      const total = months.length || 1;
      map.set(s.id, { done, total, pct: Math.round((done / total) * 100) });
    });
    return map;
  }, [classStudents, observations, months]);

  const filled = useMemo(() => {
    const set = new Set<string>();
    studentProgress.forEach((v, k) => { if (v.done > 0) set.add(k); });
    return set;
  }, [studentProgress]);


  if (!activeClassId) return <NoClassSelected />;
  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";

  const toggleStudent = (id: string) => {
    setSelectedStudents((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selectedStudents.size === classStudents.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(classStudents.map((s) => s.id)));
  };

  const done = classStudents.filter((s) => filled.has(s.id)).length;
  const total = classStudents.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const exportDoc = async (cat: IndicatorCategory) => {
    const targets = classStudents.filter((s) => selectedStudents.has(s.id));
    if (targets.length === 0) {
      await swal.fire({ icon: "warning", title: "Pilih minimal 1 siswa", timer: 1600, showConfirmButton: false });
      return;
    }
    const rangeLabel = months.length === 1 ? labelMonth(months[0]) : `${labelMonth(months[0])} – ${labelMonth(months[months.length-1])}`;

    const VALS = ["BB","MB","BSH","BSB"] as const;
    const green = "#7AB648";

    const buildAdabTable = (catIndicators: typeof indicators, rec: typeof observations[number] | undefined) => {
      // group by title
      const groups: Record<string, typeof catIndicators> = {};
      catIndicators.forEach((i) => {
        const k = i.title || "Umum";
        (groups[k] ||= []).push(i);
      });
      const headerStyle = `background:${green};color:#fff;font-weight:bold;text-align:center;`;
      let html = `<table border="1" cellspacing="0" cellpadding="6" width="100%" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;">
        <thead>
          <tr>
            <th rowspan="2" style="${headerStyle}width:40px;">NO</th>
            <th rowspan="2" style="${headerStyle}">DAFTAR ADAB</th>
            <th colspan="4" style="${headerStyle}">PENGAMATAN ORANGTUA</th>
            <th rowspan="2" style="${headerStyle}">KETERANGAN</th>
          </tr>
          <tr>${VALS.map((v)=>`<th style="${headerStyle}width:40px;">${v}</th>`).join("")}</tr>
        </thead><tbody>`;
      let no = 1;
      Object.entries(groups).forEach(([title, items]) => {
        html += `<tr><td colspan="7" align="center" style="font-weight:bold;background:#f2f2f2;">${title}</td></tr>`;
        items.forEach((ind) => {
          const e = rec?.entries.find((x) => x.indicatorId === ind.id);
          const cells = VALS.map((v) => `<td align="center">${e?.value === v ? "✓" : ""}</td>`).join("");
          html += `<tr><td align="center">${no++}.</td><td>${ind.text}</td>${cells}<td>${e?.note ?? ""}</td></tr>`;
        });
      });
      html += `</tbody></table>`;
      return html;
    };

    const buildTarbiyahTable = (catIndicators: typeof indicators, rec: typeof observations[number] | undefined) => {
      const headerStyle = `background:${green};color:#fff;font-weight:bold;text-align:center;`;
      const rows = catIndicators.map((ind, idx) => {
        const e = rec?.entries.find((x) => x.indicatorId === ind.id);
        const cells = VALS.map((v) => `<td align="center">${e?.value === v ? "✓" : ""}</td>`).join("");
        return `<tr><td align="center">${idx+1}.</td><td>${ind.text}</td>${cells}<td>${e?.note ?? ""}</td></tr>`;
      }).join("");
      return `<table border="1" cellspacing="0" cellpadding="6" width="100%" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;">
        <thead><tr>
          <th rowspan="2" style="${headerStyle}width:40px;">NO</th>
          <th rowspan="2" style="${headerStyle}">DAFTAR TARBIYAH</th>
          <th colspan="4" style="${headerStyle}">PENGAMATAN ORANGTUA</th>
          <th rowspan="2" style="${headerStyle}">KETERANGAN</th>
        </tr><tr>${VALS.map((v)=>`<th style="${headerStyle}width:40px;">${v}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody></table>`;
    };

    const studentBlocks = targets.map((s) => {
      const monthBlocks = months.map((mo) => {
        const rec = observations.find((o) => o.studentId === s.id && o.month === mo);
        const catIndicators = indicators.filter((i) => i.category === cat && i.classId === activeClassId && i.month === mo);
        if (catIndicators.length === 0) {
          return `<h4>${labelMonth(mo)}</h4><p><i>Belum ada indikator untuk bulan ini.</i></p>`;
        }
        const table = cat === "Adab" ? buildAdabTable(catIndicators, rec) : buildTarbiyahTable(catIndicators, rec);
        return `<h4>${labelMonth(mo)}</h4>${table}`;
      }).join("<br/>");
      return `<h2>${s.name}</h2>${monthBlocks}<hr/>`;
    }).join("");



    const html = `<html><head><meta charset="utf-8"><title>Laporan ${cat} - ${className}</title></head><body>
      <h1>Laporan Observasi ${cat} — ${className}</h1>
      <p><b>Periode:</b> ${rangeLabel}<br/><b>Jumlah Siswa:</b> ${targets.length}</p>
      ${studentBlocks}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${cat.toLowerCase()}-${className.replace(/\s+/g,"_")}-${months[0]}_${months[months.length-1]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    successToast(`Laporan ${cat} diunduh`);
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthOptions = years.flatMap((y) => MONTHS.map((m) => ({ v: `${y}-${m}`, label: `${MONTH_LABEL[m]} ${y}` })));

  return (
    <div>
      <PageHeader title="Progress & Laporan" description={`Monitor pengisian matriks observasi ${className}.`} />

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Dari bulan</Label>
            <Select value={fromMonth} onValueChange={setFromMonth}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sampai bulan</Label>
            <Select value={toMonth} onValueChange={setToMonth}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Pilih siswa untuk diekspor</div>
              <div className="text-xs text-muted-foreground">{selectedStudents.size} dari {classStudents.length} siswa dipilih</div>
            </div>
            <Button size="sm" variant="outline" onClick={toggleAll}>
              {selectedStudents.size === classStudents.length && classStudents.length > 0 ? "Kosongkan" : "Pilih Semua"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {classStudents.map((s) => {
              const prog = studentProgress.get(s.id) ?? { done: 0, total: months.length || 1, pct: 0 };
              return (
                <label key={s.id} className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent/40 transition">
                  <Checkbox checked={selectedStudents.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      <span className={`text-xs font-bold ${prog.pct === 100 ? "text-primary" : prog.pct > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {prog.pct}%
                      </span>
                    </div>
                    <Progress value={prog.pct} className="h-1.5 mt-1.5" />
                    <div className="text-[10px] text-muted-foreground mt-1">{prog.done}/{prog.total} bulan terisi</div>
                  </div>
                </label>
              );
            })}
            {classStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 sm:col-span-2">Belum ada siswa di kelas ini.</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => exportDoc("Adab")}><Download className="h-4 w-4 mr-1" /> Export Adab (DOC)</Button>
            <Button onClick={() => exportDoc("Tarbiyah")}><FileText className="h-4 w-4 mr-1" /> Export Tarbiyah (DOC)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">{className}</div>
              <div className="text-xs text-muted-foreground">{done} dari {total} siswa mengisi di periode terpilih</div>
            </div>
            <div className="text-2xl font-bold text-primary">{pct}%</div>
          </div>
          <Progress value={pct} />
        </CardContent>
      </Card>
    </div>
  );
}
