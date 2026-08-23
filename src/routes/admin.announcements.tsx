import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { successToast } from "@/lib/swal";
import { Megaphone, Save } from "lucide-react";

export const TEACHER_ANNOUNCEMENT_KEY = "__teachers__";

export const Route = createFileRoute("/admin/announcements")({ component: AdminAnnouncementsPage });

function AdminAnnouncementsPage() {
  const { announcements, set } = useStore();
  const [text, setText] = useState("");

  useEffect(() => {
    setText(announcements[TEACHER_ANNOUNCEMENT_KEY] ?? "");
  }, [announcements]);

  const save = () => {
    set("announcements", { ...announcements, [TEACHER_ANNOUNCEMENT_KEY]: text });
    successToast("Pengumuman untuk guru disimpan");
  };

  return (
    <div>
      <PageHeader title="Pengumuman untuk Guru" description="Pesan ini akan tampil di dasbor semua guru." />
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="h-5 w-5" />
            <div className="font-semibold">Pesan untuk seluruh guru</div>
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Tulis pengumuman untuk guru..." />
          <Button onClick={save} className="w-full sm:w-auto"><Save className="h-4 w-4 mr-1" /> Simpan Pengumuman</Button>
        </CardContent>
      </Card>
    </div>
  );
}
