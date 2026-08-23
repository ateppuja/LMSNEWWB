CREATE TABLE public.attendance (
  student_id text NOT NULL,
  date text NOT NULL,
  status text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO anon, authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);