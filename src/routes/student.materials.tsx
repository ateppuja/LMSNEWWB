import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { ChevronLeft, FolderOpen, Video, FileText, Play, Youtube, ClipboardCheck, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/student/materials")({ component: MaterialsPage });

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function MiniVideoPreview({ videoUrl, title }: { videoUrl: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const ytId = getYouTubeId(videoUrl);

  if (isPlaying && ytId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-red-500/40 my-2">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute top-1.5 right-1.5 bg-black/80 text-white p-1 rounded-full text-xs"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

  return (
    <div
      onClick={() => (ytId ? setIsPlaying(true) : window.open(videoUrl, "_blank"))}
      className="group relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer bg-slate-900 border border-slate-800 my-2 hover:border-red-500/60 transition"
    >
      <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-85" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-between p-2.5">
        <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow self-start">
          <Youtube className="h-3 w-3 fill-white" /> YouTube
        </span>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-red-600 text-white shadow group-hover:scale-110 transition">
            <Play className="h-4 w-4 fill-white ml-0.5" />
          </div>
          <span className="text-white text-xs font-bold line-clamp-1">{title}</span>
        </div>
      </div>
    </div>
  );
}

function MaterialsPage() {
  const { subjects, materials, students, user } = useStore();
  const me = students.find((s) => s.id === user?.studentId);
  const classMaterials = materials.filter((m) => m.classId === me?.classId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    const s = subjects.find((x) => x.id === openId);
    const list = classMaterials.filter((m) => m.subjectId === openId);
    return (
      <div>
        <PageHeader title={s?.name ?? "Materi"} description={`${list.length} materi tersedia`}
          actions={<Button variant="outline" onClick={() => setOpenId(null)}><ChevronLeft className="h-4 w-4 mr-1" /> Kembali</Button>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <Card key={m.id} className="border-2 shadow-sm hover:shadow-md transition">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">{m.publishDate}</div>
                  <h3 className="font-extrabold text-base mt-1 text-slate-900 dark:text-slate-100">{m.title}</h3>

                  {m.videoLink && <MiniVideoPreview videoUrl={m.videoLink} title={m.title} />}

                  {m.instructions && (
                    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                        <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> Kolom Tugas
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{m.instructions}</p>
                    </div>
                  )}
                </div>

                {m.fileLink && (
                  <div className="mt-3 pt-2 border-t">
                    <a href={m.fileLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                      <FileText className="h-3.5 w-3.5" /> Unduh Lampiran
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && <p className="text-muted-foreground text-sm">Belum ada materi.</p>}
        </div>
      </div>
    );
  }

  const activeSubjectIds = Array.from(new Set(classMaterials.map((m) => m.subjectId)));
  const folders = activeSubjectIds
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is { id: string; name: string } => !!s);

  return (
    <div>
      <PageHeader title="Semua Materi" description="Pilih folder mata pelajaran." />
      {folders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="font-semibold">Belum ada folder materi</div>
            <p className="text-sm text-muted-foreground mt-1">Guru belum menambahkan materi untuk kelas ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((s) => {
            const count = classMaterials.filter((m) => m.subjectId === s.id).length;
            return (
              <button key={s.id} onClick={() => setOpenId(s.id)} className="text-left">
                <Card className="hover:shadow-md hover:border-primary/50 transition">
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><FolderOpen className="h-6 w-6" /></div>
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{count} materi</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
