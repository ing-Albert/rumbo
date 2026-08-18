begin;

-- Foto del recibo de un movimiento.
--
-- Se guarda solo la ruta dentro del bucket, no la imagen: Postgres no es sitio
-- para binarios de varios megas, y Storage ya sabe servirlos con URL firmada.
alter table public.movements
  add column receipt_path text,
  add constraint movements_receipt_path_length
    check (receipt_path is null or char_length(receipt_path) <= 400);

-- El bucket y sus politicas solo existen en Supabase. En un Postgres pelado
-- (los tests) el esquema `storage` no esta, y la migracion tiene que aplicar
-- igual en vez de reventar.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('receipts', 'receipts', false)
    on conflict (id) do nothing;

    -- Mismo criterio que el RLS de las tablas: cada quien ve solo lo suyo. La
    -- primera carpeta de la ruta es el id del usuario, asi que la comparacion
    -- con auth.uid() basta para aislarlos.
    drop policy if exists receipts_owner_read on storage.objects;
    create policy receipts_owner_read on storage.objects
      for select to authenticated
      using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists receipts_owner_write on storage.objects;
    create policy receipts_owner_write on storage.objects
      for insert to authenticated
      with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists receipts_owner_delete on storage.objects;
    create policy receipts_owner_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end
$$;

commit;
