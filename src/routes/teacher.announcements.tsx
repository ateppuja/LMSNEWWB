import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { successToast } from "@/lib/swal";
import { Megaphone, Save } from "lucide-react";
import { NoClassSelected } from "@/components/NoClassSelected";

export const Route = createFileRoute("/teacher/announcements")({ component: AnnouncementsPage });

function AnnouncementsPage() {
  const { announcements, set, activeClassId, classes } = useStore();
  const [text, setText] = useState("");

  const className = classes.find((c) => c.id === activeClassId)?.name ?? "";

  useEffect(() => {
    if (activeClassId) setText(announcements[activeClassId] ?? "");
  }, [activeClassId, announcements]);

  if (!activeClassId) return <NoClassSelected />;

  const save = () => {
    set("announcements", { ...announcements, [activeClassId]: text });
    successToast("Pengumuman disimpan");
  };

  return (
    <div>
      <PageHeader title="Pengumuman" description={`Pesan untuk siswa ${className}.`} />
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="h-5 w-5" />
            <div className="font-semibold">Pesan untuk {className}</div>
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Tulis pengumuman untuk kelas ini..." />
          <Button onClick={save} className="w-full sm:w-auto"><Save className="h-4 w-4 mr-1" /> Simpan Pengumuman</Button>
        </CardContent>
      </Card>
    </div>
  );
}
