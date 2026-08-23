import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { successToast } from "@/lib/swal";
import Swal from "sweetalert2";
import { Users, School, KeyRound, Download, Upload } from "lucide-react";

const BACKUP_KEYS = [
  "classes","subjects","teachers","materials","modules","schedule",
  "students","indicators","adabTitles","observations","attendance",
  "grades","announcements","adminCode",
] as const;

type BackupKey = typeof BACKUP_KEYS[number];

const rowKey = (key: BackupKey, row: unknown) => {
  if (typeof row !== "object" || row === null) return String(row);
  const r = row as Record<string, unknown>;
  if (key === "observations") return `${r.studentId ?? ""}:${r.month ?? ""}`;
  if (key === "attendance") return `${r.studentId ?? ""}:${r.date ?? ""}`;
  return String(r.id ?? r.title ?? JSON.stringify(r));
};

const mergeBackupValue = (key: BackupKey, current: unknown, incoming: unknown) => {
  if (key === "adminCode") return typeof incoming === "string" && incoming.trim() ? incoming : current;
  if (key === "announcements") return { ...(current as Record<string, string>), ...(incoming as Record<string, string>) };
  if (!Array.isArray(current) || !Array.isArray(incoming)) return current;
  if (key === "adabTitles") return Array.from(new Set([...current, ...incoming]));
  const merged = new Map<string, unknown>();
  current.forEach((row) => merged.set(rowKey(key, row), row));
  incoming.forEach((row) => merged.set(rowKey(key, row), row));
  return Array.from(merged.values());
};

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const store = useStore();
  const { students, classes, adminCode, set } = store;
  const [codeInput, setCodeInput] = useState(adminCode);

  const perClass = classes.map((c) => ({
    ...c,
    count: students.filter((s) => s.classId === c.id).length,
  }));

  const handleBackup = () => {
    const data: Record<string, unknown> = { _exportedAt: new Date().toISOString(), _version: 1 };
    for (const k of BACKUP_KEYS) data[k] = (store as unknown as Record<string, unknown>)[k];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitebee-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    successToast("Backup diunduh");
  };

  const handleRestore = async (file: File) => {
    const confirm = await Swal.fire({
      title: "Impor data dari backup?",
      text: "Data dari file akan ditambahkan/diperbarui tanpa menghapus data yang sudah ada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, impor",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      for (const k of BACKUP_KEYS) {
        if (k in parsed) {
          const current = (store as unknown as Record<string, unknown>)[k];
          set(k as never, mergeBackupValue(k, current, parsed[k]) as never);
        }
      }
      successToast("Data backup berhasil diimpor");
    } catch {
      Swal.fire({ title: "Gagal", text: "File backup tidak valid.", icon: "error" });
    }
  };


  const stats = [
    { label: "Total Siswa", value: students.length, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Total Kelas", value: classes.length, icon: School, tone: "bg-accent text-accent-foreground" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard Admin" description="Ringkasan sistem WhiteBee LMS." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-2xl font-bold">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Siswa per Kelas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {perClass.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Grade {c.grade}</div>
                </div>
                <div className="text-2xl font-bold text-primary">{c.count}</div>
              </div>
            ))}
            {perClass.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada kelas.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Kode Khusus Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Kode ini dipakai untuk login sebagai Admin di halaman masuk.</p>
            <div>
              <Label>Kode Admin</Label>
              <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="mt-1.5 font-mono" />
            </div>
            <Button
              onClick={() => {
                const v = codeInput.trim();
                if (!v) return;
                set("adminCode", v);
                successToast("Kode admin diperbarui");
              }}
            >
              Simpan Kode
            </Button>
            <div className="pt-2 text-xs text-muted-foreground border-t">
              <p className="font-semibold text-foreground mb-1">Alokasi Menu</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><School className="h-3.5 w-3.5 text-primary" /> Kelas &amp; pengelompokan siswa</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Backup &amp; Pemulihan Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Unduh salinan seluruh data aplikasi (kelas, siswa, materi, modul, jadwal, indikator, observasi, presensi, nilai, pengumuman) sebagai file JSON. Simpan berkala untuk cadangan mandiri.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleBackup} className="gap-2">
                <Download className="h-4 w-4" /> Unduh Backup (JSON)
              </Button>
              <Button variant="outline" asChild className="gap-2 cursor-pointer">
                <label>
                  <Upload className="h-4 w-4" /> Impor Backup
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleRestore(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Impor backup tidak menghapus data lama; data dengan ID yang sama akan diperbarui. Pastikan file berasal dari aplikasi ini.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
