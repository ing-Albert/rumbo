import type { DebtKind } from "@ahorra/domain";
import { HandCoins, Handshake, Users } from "lucide-react";
import { OptionCards, type OptionCard } from "../../components/OptionCards";

export const KIND_ICONS: Record<DebtKind, typeof HandCoins> = {
  DEBT: HandCoins,
  LOAN: Handshake,
  SAN: Users
};

/** El orden va de lo mas comun a lo mas raro, no por como se llaman. */
const KIND_OPTIONS: Array<OptionCard<DebtKind>> = [
  {
    value: "DEBT",
    label: "Debo dinero",
    hint: "Un prestamo o una tarjeta",
    Icon: HandCoins,
    tone: "debt"
  },
  {
    value: "LOAN",
    label: "Me deben",
    hint: "Le prestaste a alguien",
    Icon: Handshake,
    tone: "loan"
  },
  { value: "SAN", label: "San", hint: "Una tanda por turnos", Icon: Users, tone: "san" }
];

/**
 * Elegir que clase de compromiso se registra.
 *
 * El tipo decide que campos aparecen despues y de que color sale la tarjeta,
 * asi que va primero, a lo ancho y con los mismos colores que las tarjetas.
 */
export function DebtKindPicker({
  value,
  onChange
}: {
  value: DebtKind;
  onChange: (kind: DebtKind) => void;
}) {
  return (
    <OptionCards
      name="debt-kind"
      legend="Tipo de compromiso"
      value={value}
      options={KIND_OPTIONS}
      onChange={onChange}
    />
  );
}
