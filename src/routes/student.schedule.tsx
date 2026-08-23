import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, type ScheduleItem } from "@/lib/store";
import { Calendar } from "lucide-react";

const DAYS: ScheduleItem["day"][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export const Route = createFileRoute("/student/schedule")({ component: SchedulePage });

function SchedulePage() {
  const { schedule, students, user, classes } = useStore();
  const me = students.find((s) => s.id === user?.studentId);
  const myClass = classes.find((c) => c.id === me?.classId);
  const classSchedule = schedule.filter((s) => s.classId === me?.classId);
  return (
    <div>
      <PageHeader title="Jadwal Pelajaran" description={`Jadwal mingguan ${myClass?.name ?? ""}.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DAYS.map((d) => {
          const list = classSchedule.filter((s) => s.day === d);
          return (
            <Card key={d}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Calendar className="h-4 w-4" />
                  <div className="font-bold">{d}</div>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Kosong</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((s) => (
                      <li key={s.id} className="rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-sm font-medium">
                        {s.subject}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
