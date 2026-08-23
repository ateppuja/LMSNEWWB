import { Card, CardContent } from "@/components/ui/card";
import { School } from "lucide-react";
import { useStore } from "@/lib/store";

export function NoClassSelected() {
  const { teacherClasses } = useStore();
  return (
    <Card>
      <CardContent className="p-10 text-center">
        <School className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Belum ada kelas aktif</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {teacherClasses.length === 0
            ? "Admin belum menugaskan kelas apapun untuk Anda. Hubungi Admin sekolah."
            : "Pilih salah satu kelas dari selector di bagian atas untuk mulai mengelola."}
        </p>
      </CardContent>
    </Card>
  );
}
