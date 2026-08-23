import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/student/")({ component: InfoPage });

function InfoPage() {
  const { announcements, user, students, classes } = useStore();
  const me = students.find((s) => s.id === user?.studentId);
  const myClass = classes.find((c) => c.id === me?.classId);
  const text = me ? announcements[me.classId] : "";
  return (
    <div>
      <PageHeader
        title={`Assalamu'alaikum, ${user?.name ?? "Siswa"} 👋`}
        description={myClass ? `Kelas ${myClass.name} — informasi terbaru dari guru.` : "Selamat datang kembali."}
      />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Megaphone className="h-5 w-5" />
            <div className="font-semibold">Pengumuman {myClass?.name ?? ""}</div>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {text || <span className="text-muted-foreground italic">Belum ada pengumuman untuk kelas ini.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
