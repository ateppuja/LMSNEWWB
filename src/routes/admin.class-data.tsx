import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { successToast, swal } from "@/lib/swal";
import { FileSpreadsheet, School, Cloud, Loader2 } from "lucide-react";
import { exportToGoogleSheets, type SheetPayload } from "@/lib/googleSheets.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/class-data")({ component: ClassDataPage });

function ClassDataPage() {
  const {
    classes, subjects, teachers, students, materials, modules,
    schedule, indicators, observations, attendance, announcements,
  } = useStore();
  const [selectedId, setSelectedId] = useState<string>(classes[0]?.id ?? "");
  const [syncing, setSyncing] = useState(false);
  const [lastUrl, setLastUrl] = useState<string>("");

  const buildSheets = (): SheetPayload[] => {
    if (!cls || !data) return [];
    const subjName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
    const studName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

    const sheets: SheetPayload[] = [];
    sheets.push({
      title: "Ringkasan",
      rows: [
        ["Ringkasan Kelas"],
        ["Nama Kelas", cls.name],
        ["Jenjang", cls.grade],
        ["Jumlah Siswa", data.students.length],
        ["Jumlah Materi", data.materials.length],
        ["Jumlah Modul", data.modules.length],
        ["Jumlah Guru", data.teachers.length],
        ["Pengumuman", data.announcement],
        ["Diperbarui", new Date().toLocaleString("id-ID")],
      ],
    });
    sheets.push({
      title: "Guru",
      rows: [["Nama", "Kode Guru"], ...data.teachers.map((t) => [t.name, t.code])],
    });
    sheets.push({
      title: "Siswa",
      rows: [["No", "Nama", "Kode Siswa", "Status Kelas"], ...data.students.map((s, i) => [i + 1, s.name, s.pin, s.status])],
    });
    sheets.push({
      title: "Materi",
      rows: [
        ["Mata Pelajaran", "Judul", "Tanggal Terbit", "Link Video", "Link File", "Instruksi"],
        ...data.materials.map((m) => [subjName(m.subjectId), m.title, m.publishDate, m.videoLink ?? "", m.fileLink ?? "", m.instructions ?? ""]),
      ],
    });
    sheets.push({
      title: "Modul",
      rows: [["Mata Pelajaran", "Judul", "Link File"], ...data.modules.map((m) => [subjName(m.subjectId), m.title, m.fileLink])],
    });
    sheets.push({
      title: "Jadwal",
      rows: [["Hari", "Mata Pelajaran"], ...data.schedule.map((s) => [s.day, s.subject])],
    });
    sheets.push({
      title: "Indikator",
      rows: [["Bulan", "Kategori", "Judul", "Indikator"], ...data.indicators.map((i) => [i.month, i.category, i.title ?? "", i.text])],
    });

    const attMap: Record<string, Record<string, { H: number; I: number; S: number; A: number }>> = {};
    data.attendance.forEach((a) => {
      const m = a.date.slice(0, 7);
      attMap[a.studentId] ??= {};
      attMap[a.studentId][m] ??= { H: 0, I: 0, S: 0, A: 0 };
      attMap[a.studentId][m][a.status]++;
    });
    const attRows: (string | number)[][] = [["Siswa", "Bulan", "Hadir", "Izin", "Sakit", "Alfa", "Total"]];
    data.students.forEach((s) => {
      const months = attMap[s.id] ?? {};
      Object.keys(months).sort().forEach((m) => {
        const v = months[m];
        attRows.push([s.name, m, v.H, v.I, v.S, v.A, v.H + v.I + v.S + v.A]);
      });
    });
    sheets.push({ title: "Presensi", rows: attRows });

    const obsRows: (string | number)[][] = [["Siswa", "Bulan", "Kategori", "Judul", "Indikator", "Nilai", "Catatan"]];
    data.observations.forEach((o) => {
      o.entries.forEach((e) => {
        const ind = indicators.find((i) => i.id === e.indicatorId);
        obsRows.push([studName(o.studentId), o.month, ind?.category ?? "", ind?.title ?? "", ind?.text ?? "", e.value, e.note]);
      });
    });
    sheets.push({ title: "Observasi", rows: obsRows });

    return sheets;
  };

  const exportSheets = async () => {
    if (!cls || !data) return;
    setSyncing(true);
    try {
      const settingsKey = `gsheet:${cls.id}`;
      const { data: existing } = await (supabase as unknown as {
        from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { value: string } | null }> } } };
      }).from("settings").select("value").eq("key", settingsKey).maybeSingle();
      const spreadsheetId = existing?.value || undefined;
      const res = await exportToGoogleSheets({
        data: {
          spreadsheetTitle: `WhiteBee LMS · ${cls.name}`,
          spreadsheetId,
          sheets: buildSheets(),
        },
      });
      if (res.spreadsheetId && res.spreadsheetId !== spreadsheetId) {
        await (supabase as unknown as { from: (t: string) => { upsert: (v: unknown) => Promise<unknown> } })
          .from("settings").upsert({ key: settingsKey, value: res.spreadsheetId });
      }
      setLastUrl(res.spreadsheetUrl);
      await swal.fire({
        icon: "success",
        title: "Google Sheets terupdate",
        html: `<a href="${res.spreadsheetUrl}" target="_blank" rel="noreferrer" style="color:#0b7c3f;text-decoration:underline">Buka Spreadsheet</a>`,
      });
    } catch (e) {
      await swal.fire({ icon: "error", title: "Gagal export", text: (e as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  const cls = classes.find((c) => c.id === selectedId);

  const data = useMemo(() => {
    if (!selectedId) return null;
    return {
      students: students.filter((s) => s.classId === selectedId),
      materials: materials.filter((m) => m.classId === selectedId),
      modules: modules.filter((m) => m.classId === selectedId),
      schedule: schedule.filter((s) => s.classId === selectedId),
      indicators: indicators.filter((i) => i.classId === selectedId),
      teachers: teachers.filter((t) => t.classIds.includes(selectedId)),
      attendance: attendance.filter((a) =>
        students.some((s) => s.classId === selectedId && s.id === a.studentId)
      ),
      observations: observations.filter((o) =>
        students.some((s) => s.classId === selectedId && s.id === o.studentId)
      ),
      announcement: announcements[selectedId] ?? "",
    };
  }, [selectedId, students, materials, modules, schedule, indicators, teachers, attendance, observations, announcements]);

  const exportExcel = () => {
    if (!cls || !data) return;
    const wb = XLSX.utils.book_new();
    const subjName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
    const studName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

    // Info
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Ringkasan Kelas"],
      ["Nama Kelas", cls.name],
      ["Jenjang", cls.grade],
      ["Jumlah Siswa", data.students.length],
      ["Jumlah Materi", data.materials.length],
      ["Jumlah Modul", data.modules.length],
      ["Jumlah Guru", data.teachers.length],
      ["Pengumuman", data.announcement],
    ]), "Ringkasan");

    // Guru
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.teachers.map((t) => ({ Nama: t.name, "Kode Guru": t.code }))
    ), "Guru");

    // Siswa
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.students.map((s, i) => ({ No: i + 1, Nama: s.name, "Kode Siswa": s.pin, "Status Kelas": s.status }))
    ), "Siswa");

    // Materi
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.materials.map((m) => ({
        "Mata Pelajaran": subjName(m.subjectId),
        Judul: m.title,
        "Tanggal Terbit": m.publishDate,
        "Link Video": m.videoLink ?? "",
        "Link File": m.fileLink ?? "",
        Instruksi: m.instructions ?? "",
      }))
    ), "Materi");

    // Modul
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.modules.map((m) => ({
        "Mata Pelajaran": subjName(m.subjectId),
        Judul: m.title,
        "Link File": m.fileLink,
      }))
    ), "Modul");

    // Jadwal
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.schedule.map((s) => ({ Hari: s.day, "Mata Pelajaran": s.subject }))
    ), "Jadwal");

    // Indikator
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.indicators.map((i) => ({
        Bulan: i.month,
        Kategori: i.category,
        Judul: i.title ?? "",
        Indikator: i.text,
      }))
    ), "Indikator");

    // Presensi Rekap
    const attMap: Record<string, Record<string, { H: number; I: number; S: number; A: number }>> = {};
    data.attendance.forEach((a) => {
      const m = a.date.slice(0, 7);
      attMap[a.studentId] ??= {};
      attMap[a.studentId][m] ??= { H: 0, I: 0, S: 0, A: 0 };
      attMap[a.studentId][m][a.status]++;
    });
    const attRows: Record<string, string | number>[] = [];
    data.students.forEach((s) => {
      const months = attMap[s.id] ?? {};
      Object.keys(months).sort().forEach((m) => {
        attRows.push({
          Siswa: s.name, Bulan: m,
          Hadir: months[m].H, Izin: months[m].I, Sakit: months[m].S, Alfa: months[m].A,
          Total: months[m].H + months[m].I + months[m].S + months[m].A,
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows), "Presensi");

    // Observasi
    const obsRows: Record<string, string>[] = [];
    data.observations.forEach((o) => {
      o.entries.forEach((e) => {
        const ind = indicators.find((i) => i.id === e.indicatorId);
        obsRows.push({
          Siswa: studName(o.studentId),
          Bulan: o.month,
          Kategori: ind?.category ?? "",
          Judul: ind?.title ?? "",
          Indikator: ind?.text ?? "",
          Nilai: e.value,
          Catatan: e.note,
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(obsRows), "Observasi");

    XLSX.writeFile(wb, `Data_${cls.name.replace(/\s+/g, "_")}.xlsx`);
    successToast("Export Excel berhasil");
  };

  return (
    <div>
      <PageHeader
        title="Kelola Data Kelas"
        description="Pantau seluruh data per kelas dan export ke Excel."
      />

      <Card className="mb-4">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div className="min-w-[240px]">
              <Label>Pilih Kelas</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} · Jenjang {c.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportExcel} disabled={!selectedId} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
              </Button>
              <Button onClick={exportSheets} disabled={!selectedId || syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Cloud className="h-4 w-4 mr-1" />}
                Export ke Google Sheets
              </Button>
            </div>
          </div>
          {lastUrl && (
            <div className="text-sm text-muted-foreground">
              Spreadsheet terakhir: <a href={lastUrl} target="_blank" rel="noreferrer" className="text-primary underline">Buka di Google Sheets</a>
            </div>
          )}
        </CardContent>
      </Card>

      {cls && data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          {[
            { label: "Siswa", value: data.students.length },
            { label: "Guru", value: data.teachers.length },
            { label: "Materi", value: data.materials.length },
            { label: "Modul", value: data.modules.length },
            { label: "Jadwal", value: data.schedule.length },
            { label: "Indikator", value: data.indicators.length },
            { label: "Presensi", value: data.attendance.length },
            { label: "Observasi", value: data.observations.length },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-primary">
                  <School className="h-4 w-4" />
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
                </div>
                <div className="text-2xl font-bold mt-1">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cls && data && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="font-semibold text-primary">Daftar Siswa · {cls.name}</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kode Siswa</TableHead>
                    <TableHead>Status Kelas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.pin}</TableCell>
                      <TableCell>{s.status}</TableCell>
                    </TableRow>
                  ))}
                  {data.students.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Belum ada siswa.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
