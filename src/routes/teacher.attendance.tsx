import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type AttendanceStatus } from "@/lib/store";
import { successToast, toast } from "@/lib/swal";
import { NoClassSelected } from "@/components/NoClassSelected";
import { CalendarCheck, Save, FileDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/teacher/attendance")({ component: AttendancePage });

const STATUS: { code: AttendanceStatus; label: string; color: string }[] = [
  { code: "H", label: "Hadir", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { code: "I", label: "Izin", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { code: "S", label: "Sakit", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { code: "A", label: "Alfa", color: "bg-red-100 text-red-700 border-red-300" },
];

const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function AttendancePage() {
  const { students, attendance, activeClassId, classes, saveAttendance } = useStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(monthNow());
  const [pending, setPending] = useState<Record<string, AttendanceStatus>>({});
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 4);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rangeEnd, setRangeEnd] = useState(monthNow());
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClassId),
    [students, activeClassId]
  );

  if (!activeClassId) return <NoClassSelected />;

  const existingFor = (studentId: string, d: string) =>
    attendance.find((a) => a.studentId === studentId && a.date === d)?.status;

  const setPendingFor = (studentId: string, status: AttendanceStatus) => {
    setPending((p) => ({ ...p, [studentId]: status }));
  };

  const saveAll = async () => {
    let count = 0;
    let failed = 0;
    const saves: Promise<boolean>[] = [];
    classStudents.forEach((s) => {
      const status = pending[s.id];
      if (status) {
        saves.push(saveAttendance({ studentId: s.id, date, status }));
        count++;
      }
    });
    if (count === 0) {
      successToast("Tidak ada perubahan");
      return;
    }
    const results = await Promise.all(saves);
    failed = results.filter((ok) => !ok).length;
    if (failed > 0) {
      toast.fire({ icon: "error", title: `${failed} presensi gagal tersimpan` });
      return;
    }
    setPending({});
    successToast(`${count} presensi tersimpan`);
  };

  // Monthly summary
  const summary = useMemo(() => {
    return classStudents.map((s) => {
      const recs = attendance.filter((a) => a.studentId === s.id && a.date.startsWith(month));
      const c = { H: 0, I: 0, S: 0, A: 0 } as Record<AttendanceStatus, number>;
      recs.forEach((r) => { c[r.status]++; });
      return { student: s, counts: c, total: recs.length };
    });
  }, [classStudents, attendance, month]);

  const monthsInRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    const [sy, sm] = rangeStart.split("-").map(Number);
    const [ey, em] = rangeEnd.split("-").map(Number);
    const out: { key: string; label: string }[] = [];
    const names = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      out.push({ key: `${y}-${String(m).padStart(2,"0")}`, label: `${names[m-1]}${sy !== ey ? " " + y : ""}` });
      m++; if (m > 12) { m = 1; y++; }
      if (out.length > 24) break;
    }
    return out;
  }, [rangeStart, rangeEnd]);

  const toggleSelect = (id: string) => setSelectedIds((p) => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => {
    const all = classStudents.every((s) => selectedIds[s.id]);
    const next: Record<string, boolean> = {};
    if (!all) classStudents.forEach((s) => (next[s.id] = true));
    setSelectedIds(next);
  };

  const exportDoc = () => {
    const chosen = classStudents.filter((s) => selectedIds[s.id]);
    if (chosen.length === 0) { successToast("Pilih minimal 1 siswa"); return; }
    if (monthsInRange.length === 0) { successToast("Range bulan tidak valid"); return; }

    const W = 640, H = 340, padL = 40, padR = 20, padT = 40, padB = 60;
    const chartW = W - padL - padR, chartH = H - padT - padB;

    const studentBlocks = chosen.map((s) => {
      const data = monthsInRange.map((m) => {
        const recs = attendance.filter((a) => a.studentId === s.id && a.date.startsWith(m.key));
        const c = { H: 0, I: 0, S: 0, A: 0 } as Record<AttendanceStatus, number>;
        recs.forEach((r) => c[r.status]++);
        return { label: m.label, ...c };
      });
      const maxVal = Math.max(20, ...data.flatMap((d) => [d.H, d.I, d.S, d.A])) ;
      const yMax = Math.ceil(maxVal / 2) * 2;
      const groupW = chartW / data.length;
      const barW = Math.max(6, (groupW - 12) / 4);
      const colors = { H: "#4472C4", S: "#ED7D31", I: "#A5A5A5", A: "#FFC000" };

      const yTicks = 10;
      const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = (yMax / yTicks) * i;
        const y = padT + chartH - (val / yMax) * chartH;
        return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
                <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#555" font-family="Arial">${Math.round(val)}</text>`;
      }).join("");

      const bars = data.map((d, i) => {
        const gx = padL + i * groupW + 6;
        const items: [AttendanceStatus, number][] = [["H", d.H], ["S", d.S], ["I", d.I], ["A", d.A]];
        const rects = items.map(([k, v], j) => {
          const h = (v / yMax) * chartH;
          const x = gx + j * barW;
          const y = padT + chartH - h;
          return `<rect x="${x}" y="${y}" width="${barW - 1}" height="${h}" fill="${colors[k]}"/>`;
        }).join("");
        const label = `<text x="${gx + (barW * 4) / 2}" y="${H - padB + 16}" text-anchor="middle" font-size="11" fill="#333" font-family="Arial">${d.label}</text>`;
        return rects + label;
      }).join("");

      const legendItems = [
        ["Total Kehadiran", colors.H], ["Sakit", colors.S], ["Izin", colors.I], ["Alfa", colors.A],
      ];
      const legend = legendItems.map(([lbl, col], i) => {
        const lx = padL + i * 140;
        const ly = H - 18;
        return `<rect x="${lx}" y="${ly - 10}" width="12" height="12" fill="${col}"/>
                <text x="${lx + 18}" y="${ly}" font-size="11" fill="#333" font-family="Arial">${lbl}</text>`;
      }).join("");

      const title = `<text x="${W / 2}" y="22" text-anchor="middle" font-size="16" font-weight="bold" fill="#111" font-family="Arial">${s.name}</text>`;
      const axis = `<line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#333"/>
                    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#333"/>`;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        ${title}${gridLines}${axis}${bars}${legend}
      </svg>`;

      const rows = data.map((d) => `
        <tr>
          <td style="border:1px solid #999;padding:4px 8px;">${d.label}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:center;">${d.H}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:center;">${d.S}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:center;">${d.I}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:center;">${d.A}</td>
        </tr>`).join("");

      return `
        <div style="page-break-after:always;margin-bottom:24px;">
          <h2 style="font-family:Arial;margin:0 0 8px 0;">${s.name}</h2>
          <div style="font-family:Arial;font-size:12px;color:#555;margin-bottom:12px;">Kelas: ${className} · Periode: ${monthsInRange[0].label} – ${monthsInRange[monthsInRange.length-1].label}</div>
          ${svg}
          <table style="border-collapse:collapse;font-family:Arial;font-size:12px;margin-top:12px;">
            <thead><tr style="background:#f3f4f6;">
              <th style="border:1px solid #999;padding:4px 8px;">Bulan</th>
              <th style="border:1px solid #999;padding:4px 8px;">Total Kehadiran</th>
              <th style="border:1px solid #999;padding:4px 8px;">Sakit</th>
              <th style="border:1px solid #999;padding:4px 8px;">Izin</th>
              <th style="border:1px solid #999;padding:4px 8px;">Alfa</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join("");

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Presensi</title></head>
      <body>
        <h1 style="font-family:Arial;">Laporan Presensi Siswa</h1>
        <p style="font-family:Arial;font-size:12px;color:#555;">Kelas: ${className}</p>
        ${studentBlocks}
      </body></html>`;

    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Presensi_${className}_${rangeStart}_${rangeEnd}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    successToast("Export DOC berhasil");
  };

  return (
    <div>
      <PageHeader
        title="Presensi Siswa"
        description={`Input dan rekap kehadiran ${className}.`}
      />


      <Card className="mb-4">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheck className="h-5 w-5" />
            <div className="font-semibold">Input Presensi Harian</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[220px_1fr] items-end">
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPending({}); }} className="mt-1.5" />
            </div>
            <div className="text-xs text-muted-foreground">
              Pilih status untuk setiap siswa lalu klik <span className="font-semibold">Simpan Presensi</span>.
              Status yang sudah tersimpan ditampilkan sebagai badge.
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Tersimpan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((s, i) => {
                  const saved = existingFor(s.id, date);
                  const current = pending[s.id] ?? saved;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        {saved ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded border ${STATUS.find((x) => x.code === saved)?.color}`}>
                            {STATUS.find((x) => x.code === saved)?.label}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS.map((opt) => {
                            const active = current === opt.code;
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => setPendingFor(s.id, opt.code)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                                  active ? opt.color : "bg-background text-muted-foreground border-input hover:bg-muted"
                                }`}
                              >
                                {opt.code} · {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {classStudents.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada siswa di kelas ini.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next: Record<string, AttendanceStatus> = {};
                classStudents.forEach((s) => { next[s.id] = "H"; });
                setPending(next);
                successToast("Semua siswa ditandai Hadir");
              }}
            >
              <CalendarCheck className="h-4 w-4 mr-1" /> Tandai Hadir Semua
            </Button>
            <Button onClick={saveAll}><Save className="h-4 w-4 mr-1" /> Simpan Presensi</Button>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div className="font-semibold text-primary">Rekap Bulanan</div>
            <div>
              <Label>Bulan</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1.5 w-[180px]" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="text-center">Hadir</TableHead>
                  <TableHead className="text-center">Izin</TableHead>
                  <TableHead className="text-center">Sakit</TableHead>
                  <TableHead className="text-center">Alfa</TableHead>
                  <TableHead className="text-center">Total Hari</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((r, i) => (
                  <TableRow key={r.student.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.student.name}</TableCell>
                    <TableCell className="text-center font-semibold text-emerald-700">{r.counts.H}</TableCell>
                    <TableCell className="text-center font-semibold text-amber-700">{r.counts.I}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-700">{r.counts.S}</TableCell>
                    <TableCell className="text-center font-semibold text-red-700">{r.counts.A}</TableCell>
                    <TableCell className="text-center">{r.total}</TableCell>
                  </TableRow>
                ))}
                {summary.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada data.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <FileDown className="h-5 w-5" />
            <div className="font-semibold">Export Presensi (DOC)</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Bulan Mulai</Label>
              <Input type="month" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Bulan Akhir</Label>
              <Input type="month" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Pilih Siswa</Label>
              <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline">
                {classStudents.every((s) => selectedIds[s.id]) && classStudents.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-64 overflow-auto border rounded-md p-3">
              {classStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!selectedIds[s.id]} onCheckedChange={() => toggleSelect(s.id)} />
                  <span>{s.name}</span>
                </label>
              ))}
              {classStudents.length === 0 && <div className="text-xs text-muted-foreground">Belum ada siswa.</div>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={exportDoc}><FileDown className="h-4 w-4 mr-1" /> Export DOC</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
