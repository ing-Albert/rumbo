begin;

-- Aportes que se apartan solos a una meta.
--
-- La app ya calculaba "aparta RD$6,000 al mes para llegar a tiempo" y luego
-- dejaba que la persona lo hiciera a mano cada mes. Aqui se cierra ese hueco
-- reutilizando las reglas recurrentes en vez de inventar un mecanismo aparte:
-- una recurrencia con `goal_id` genera un aporte a esa meta en lugar de un
-- movimiento suelto.
-- La foranea lleva space_id porque es la clave unica que tiene `goals`, y de
-- paso impide apuntar a una meta de otro espacio: el aporte saldria de un
-- presupuesto y entraria en otro.
alter table public.recurring_movements
  add column goal_id uuid,
  add constraint recurring_movements_goal_fk
    foreign key (goal_id, user_id, space_id)
    references public.goals(id, user_id, space_id) on delete cascade;

-- El tipo CONTRIBUTION solo tiene sentido acompanado de una meta, y una meta
-- solo tiene sentido acompanada de ese tipo: sin las dos cosas a la vez no se
-- sabria a donde va el dinero ni de que clase de movimiento se trata.
alter table public.recurring_movements
  drop constraint recurring_movements_type,
  add constraint recurring_movements_type check (
    (type in ('INCOME', 'EXPENSE') and goal_id is null)
    or (type = 'CONTRIBUTION' and goal_id is not null)
  );

commit;
