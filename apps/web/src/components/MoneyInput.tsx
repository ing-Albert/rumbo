import { type ChangeEvent, type InputHTMLAttributes } from "react";

function formatThousands(rawDigits: string): string {
  const [integerPart, decimalPart] = rawDigits.split(".");
  const withCommas = (integerPart ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;
}

/**
 * A decimal amount input that displays thousands separators while typing.
 * `value`/`onChange` deal in the raw numeric string (no commas) so callers
 * can keep using Number(value) as before.
 */
export function MoneyInput({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (raw: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const displayValue = value ? formatThousands(value) : "";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
    const [firstPart, ...rest] = digitsOnly.split(".");
    const cleaned = rest.length > 0 ? `${firstPart}.${rest.join("")}` : digitsOnly;
    onChange(cleaned);
  }

  return <input inputMode="decimal" value={displayValue} onChange={handleChange} {...rest} />;
}
