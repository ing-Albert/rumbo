import type { ComponentType } from "react";

export interface OptionCard<T extends string> {
  value: T;
  label: string;
  /** Una linea que explique la opcion, para quien no reconozca el nombre. */
  hint?: string;
  Icon?: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  /** Clase de color: la usa el CSS para pintar la opcion elegida. */
  tone?: string;
  disabled?: boolean;
}

/**
 * Elegir entre pocas opciones que cambian el resto del formulario.
 *
 * Reemplaza al desplegable cuando la eleccion es la decision importante: en un
 * `select` las opciones viven detras de un clic y pesan lo mismo que un campo
 * cualquiera. Aqui se ven todas de golpe, con su explicacion y su color.
 *
 * Debajo hay radios nativos de verdad, solo ocultos a la vista: el teclado y
 * los lectores de pantalla no deberian pagar el precio de un control mas
 * bonito. El anillo de foco se dibuja sobre la tarjeta con `:has()`.
 */
export function OptionCards<T extends string>({
  name,
  legend,
  value,
  options,
  onChange
}: {
  /** Agrupa los radios; tiene que ser unico en la pagina. */
  name: string;
  legend: string;
  value: T;
  options: Array<OptionCard<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="option-cards">
      <legend>{legend}</legend>
      <div className="option-cards-grid">
        {options.map((option) => (
          <label
            key={option.value}
            className={`option-card ${option.tone ?? ""}${
              value === option.value ? " selected" : ""
            }${option.disabled ? " disabled" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            {option.Icon && <option.Icon size={18} aria-hidden={true} />}
            <strong>{option.label}</strong>
            {option.hint && <small>{option.hint}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
