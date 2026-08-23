import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import {
  Video,
  FileText,
  CalendarDays,
  Play,
  Youtube,
  ClipboardCheck,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/student/today")({ component: TodayPage });

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatID(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function VideoPreviewCard({ videoUrl, title }: { videoUrl: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const ytId = getYouTubeId(videoUrl);

  if (isPlaying && ytId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border-2 border-red-500/40 my-3">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1.5 rounded-full text-xs shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
          title="Tutup Video"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Sample fallback thumbnails for demo videos if URL is mock
  const fallbackThumb = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : fallbackThumb;

  return (
    <div className="my-3">
      <div
        onClick={() => (ytId ? setIsPlaying(true) : window.open(videoUrl, "_blank"))}
        className="group relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer shadow-lg border border-slate-800 bg-slate-950 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-red-500/60"
      >
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-75 transition-all duration-500 opacity-90"
        />

        {/* Netflix & YouTube Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 flex flex-col justify-between p-3.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md tracking-wide uppercase">
              <Youtube className="h-3.5 w-3.5 fill-white" /> YouTube
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-white/90 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 font-medium shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400" /> Tonton Video
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-xl group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300 border-2 border-white/30">
              <Play className="h-6 w-6 fill-white ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm line-clamp-1 drop-shadow-md">{title}</h4>
              <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                Klik untuk memutar video pembelajaran
              </p>
            </div>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-sm transition"
                title="Buka di Tab Baru"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TodayPage() {
  const { materials, subjects, students, user } = useStore();
  const me = students.find((s) => s.id === user?.studentId);
  const today = localDate();
  const [date, setDate] = useState(today);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const list = useMemo(
    () =>
      materials
        .filter((m) => m.classId === me?.classId && m.publishDate === date)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [materials, me?.classId, date],
  );
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "-";

  return (
    <div>
      <PageHeader title="Pelajaran Hari Ini" description={`Materi & tugas untuk ${formatID(date)}`} />

      <Card className="mb-6 border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="tgl" className="font-semibold text-xs text-muted-foreground uppercase">Pilih Tanggal</Label>
            <Input
              id="tgl"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || today)}
              className="mt-1.5 w-[190px] font-medium"
            />
          </div>
          {date !== today && (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="h-10 rounded-lg border border-emerald-600/30 bg-white dark:bg-slate-900 px-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 shadow-sm"
            >
              Kembali ke hari ini
            </button>
          )}
          <div className="ml-auto text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-300/40">
            {list.length} Materi Pembelajaran
          </div>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-bold text-lg">Tidak Ada Materi</h3>
            <p className="text-muted-foreground text-sm mt-1">Belum ada materi atau tugas pada {formatID(date)}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((m) => {
            const isCompleted = !!completedTasks[m.id];
            const hasVideo = !!m.videoLink;
            const hasInstructions = !!m.instructions;

            return (
              <Card key={m.id} className="overflow-hidden border-2 border-border/80 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    {/* Header Subject Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-md">
                        {subjectName(m.subjectId)}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" /> Selesai
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold mt-2.5 text-slate-900 dark:text-slate-100 leading-snug">
                      {m.title}
                    </h3>

                    {/* NETFLIX & YOUTUBE VIDEO PREVIEW CONTAINER */}
                    {hasVideo && <VideoPreviewCard videoUrl={m.videoLink!} title={m.title} />}

                    {/* ENHANCED TASK & INSTRUCTION CONTAINER */}
                    {hasInstructions && (
                      <div className="mt-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/50 pb-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm font-bold">
                              <ClipboardCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100 tracking-wide uppercase">
                                Kolom Tugas & Instruksi
                              </h4>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                Wajib dikerjakan sesuai arahan guru
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-md shadow-xs">
                            Tugas
                          </span>
                        </div>

                        {/* Task text content */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 border border-emerald-200/70 dark:border-emerald-900/60 text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                          {m.instructions}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleTask(m.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
                              isCompleted
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60"
                            }`}
                          >
                            <CheckCircle2 className={`h-4 w-4 ${isCompleted ? "fill-white text-emerald-600" : ""}`} />
                            {isCompleted ? "Tugas Selesai ✓" : "Tandai Tugas Selesai"}
                          </button>

                          {m.fileLink && (
                            <a
                              href={m.fileLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                            >
                              <FileText className="h-4 w-4" /> Unduh File / Link
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supplemental links if no instructions but has file */}
                  {!hasInstructions && m.fileLink && (
                    <div className="mt-4 pt-3 border-t">
                      <a
                        href={m.fileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 text-xs font-bold hover:bg-secondary/80 transition"
                      >
                        <FileText className="h-4 w-4" /> Buka File Lampiran
                      </a>
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

