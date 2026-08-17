begin;

-- Saldo con el que arranca un espacio.
--
-- Hasta ahora la app solo sabia razonar por mes: cuanto entro, cuanto salio,
-- cuanto queda. Lo que sobraba en enero no aparecia en febrero. Con este punto
-- de partida se puede acumular hacia adelante y responder cuanto hay de
-- verdad, no solo que paso en el periodo.
--
-- Cero es el valor honesto por defecto: significa "empiezo a contar desde los
-- movimientos registrados", que es exactamente lo que hacia la app antes.
alter table public.spaces
  add column opening_balance_cents bigint not null default 0,
  add constraint spaces_opening_balance_safe
    check (abs(opening_balance_cents) <= 9000000000000000);

commit;
