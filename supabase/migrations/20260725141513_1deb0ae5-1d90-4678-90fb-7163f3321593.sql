REVOKE SELECT, INSERT ON public.deleted_records_archive FROM anon;
REVOKE SELECT, INSERT ON public.deleted_records_archive FROM authenticated;

DROP POLICY IF EXISTS "public can archive deleted records" ON public.deleted_records_archive;
DROP POLICY IF EXISTS "public can read deleted archives" ON public.deleted_records_archive;

CREATE OR REPLACE FUNCTION public.archive_deleted_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_json jsonb;
  key_value text;
BEGIN
  row_json := to_jsonb(OLD);
  key_value := COALESCE(
    row_json->>'id',
    NULLIF(CONCAT_WS(':', row_json->>'student_id', COALESCE(row_json->>'month', row_json->>'date')), ''),
    row_json->>'class_id',
    row_json->>'key',
    row_json->>'title',
    md5(row_json::text)
  );

  INSERT INTO public.deleted_records_archive (table_name, record_key, row_data)
  VALUES (TG_TABLE_NAME, key_value, row_json);

  RETURN OLD;
END;
$$;