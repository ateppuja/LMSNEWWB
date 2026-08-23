import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { FolderOpen, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/student/modules")({ component: ModulesPage });

function ModulesPage() {
  const { subjects, modules, students, user } = useStore();
  const me = students.find((s) => s.id === user?.studentId);
  const classId = me?.classId;
  const classModules = modules.filter((m) => m.classId === classId);

  // Folders visible = teacher-created for this class (localStorage) + any subject that has modules
  let folderIds: string[] = [];
  if (typeof window !== "undefined" && classId) {
    try { folderIds = JSON.parse(localStorage.getItem(`wb-module-folders:${classId}`) ?? "[]"); } catch { /* noop */ }
  }
  const activeFolderIds = Array.from(new Set([...folderIds, ...classModules.map((m) => m.subjectId)]));
  const folders = activeFolderIds
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is { id: string; name: string } => !!s);

  return (
    <div>
      <PageHeader title="Kumpulan Modul" description="Unduh atau lihat modul per kategori." />
      {folders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="font-semibold">Belum ada folder modul</div>
            <p className="text-sm text-muted-foreground mt-1">Guru belum membuat folder modul untuk kelas ini.</p>
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
                  </div>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada modul.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map((m) => (
                        <a key={m.id} href={m.fileLink} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="text-sm font-medium truncate">{m.title}</div>
                          </div>
                          <Download className="h-4 w-4 text-primary shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

