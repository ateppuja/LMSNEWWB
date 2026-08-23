CREATE TABLE IF NOT EXISTS public.deleted_records_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_key text NOT NULL,
  row_data jsonb NOT NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.deleted_records_archive TO anon;
GRANT SELECT, INSERT ON public.deleted_records_archive TO authenticated;
GRANT ALL ON public.deleted_records_archive TO service_role;

ALTER TABLE public.deleted_records_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can archive deleted records" ON public.deleted_records_archive;
CREATE POLICY "public can archive deleted records"
ON public.deleted_records_archive
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "public can read deleted archives" ON public.deleted_records_archive;
CREATE POLICY "public can read deleted archives"
ON public.deleted_records_archive
FOR SELECT
TO public
USING (true);

CREATE OR REPLACE FUNCTION public.archive_deleted_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_value text;
BEGIN
  key_value := COALESCE(
    OLD.id::text,
    OLD.student_id::text || ':' || COALESCE(OLD.month::text, OLD.date::text, ''),
    OLD.class_id::text,
    OLD.key::text,
    OLD.title::text,
    md5(to_jsonb(OLD)::text)
  );

  INSERT INTO public.deleted_records_archive (table_name, record_key, row_data)
  VALUES (TG_TABLE_NAME, key_value, to_jsonb(OLD));

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS archive_deleted_classes ON public.classes;
CREATE TRIGGER archive_deleted_classes BEFORE DELETE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_subjects ON public.subjects;
CREATE TRIGGER archive_deleted_subjects BEFORE DELETE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_teachers ON public.teachers;
CREATE TRIGGER archive_deleted_teachers BEFORE DELETE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_materials ON public.materials;
CREATE TRIGGER archive_deleted_materials BEFORE DELETE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_modules ON public.modules;
CREATE TRIGGER archive_deleted_modules BEFORE DELETE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_schedule ON public.schedule;
CREATE TRIGGER archive_deleted_schedule BEFORE DELETE ON public.schedule FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_students ON public.students;
CREATE TRIGGER archive_deleted_students BEFORE DELETE ON public.students FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_indicators ON public.indicators;
CREATE TRIGGER archive_deleted_indicators BEFORE DELETE ON public.indicators FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_adab_titles ON public.adab_titles;
CREATE TRIGGER archive_deleted_adab_titles BEFORE DELETE ON public.adab_titles FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_observations ON public.observations;
CREATE TRIGGER archive_deleted_observations BEFORE DELETE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_attendance ON public.attendance;
CREATE TRIGGER archive_deleted_attendance BEFORE DELETE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_grades ON public.grades;
CREATE TRIGGER archive_deleted_grades BEFORE DELETE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_announcements ON public.announcements;
CREATE TRIGGER archive_deleted_announcements BEFORE DELETE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();

DROP TRIGGER IF EXISTS archive_deleted_settings ON public.settings;
CREATE TRIGGER archive_deleted_settings BEFORE DELETE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_row();