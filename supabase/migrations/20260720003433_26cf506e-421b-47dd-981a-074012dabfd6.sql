CREATE TABLE public.grades (
  id text NOT NULL PRIMARY KEY,
  class_id text NOT NULL,
  subject_id text NOT NULL,
  student_id text NOT NULL,
  title text NOT NULL,
  score numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO anon, authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);