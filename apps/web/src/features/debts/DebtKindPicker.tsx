import type { DebtKind } from "@ahorra/domain";
import { HandCoins, Handshake, Users } from "lucide-react";

export const KIND_ICONS: Record<DebtKind, typeof HandCoins> = {
  DEBT: HandCoins,
  LOAN: Handshake,
  SAN: Users
};

/** El orden va de lo mas comun a lo mas raro, no por como se llaman. */
const KIND_OPTIONS: Array<{ kind: DebtKind; label: string; hint: string }> = [
  { kind: "DEBT", label: "Debo dinero", hint: "Un prestamo o una tarjeta" },
  { kind: "LOAN", label: "Me deben", hint: "Le prestaste a alguien" },
  { kind: "SAN", label: "San", hint: "Una tanda por turnos" }
];

/**
 * Elegir que clase de compromiso se registra.
 *
 * El tipo decide que campos aparecen despues y de que color sale la tarjeta,
 * asi que va primero, a lo ancho y con los mismos colores que las tarjetas. En
 * un desplegable las tres opciones quedaban escondidas detras de un clic, con
 * el mismo peso que la fecha limite.
 */
export function DebtKindPicker({
  value,
  onChange
}: {
  value: DebtKind;
  onChange: (kind: DebtKind) => void;
}) {
  return (
    <fieldset className="kind-picker">
      <legend>Tipo de compromiso</legend>
      <div className="kind-options">
        {KIND_OPTIONS.map(({ kind, label, hint }) => {
          const Icon = KIND_ICONS[kind];
          return (
            <label
              key={kind}
              className={`kind-option ${kind.toLowerCase()}${value === kind ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="debt-kind"
                value={kind}
                checked={value === kind}
                onChange={() => onChange(kind)}
              />
              <Icon size={18} aria-hidden="true" />
              <strong>{label}</strong>
              <small>{hint}</small>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
