import { dominicanDate } from "@ahorra/domain";

export function currentMonth(): string {
  return dominicanDate().slice(0, 7);
}

export function today(): string {
  return dominicanDate();
}

export function monthLabel(month: string): string {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" }).format(
    new Date(year!, value! - 1, 1)
  );
}

export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error("No pudimos cargar la informacion.");
  return response.json() as Promise<T>;
}

export function getUserName(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null
): string {
  if (!user) return "Usuario";
  const meta = user.user_metadata;
  if (meta?.username && typeof meta.username === "string" && (meta.username as string).trim())
    return (meta.username as string).trim();
  if (
    meta?.display_name &&
    typeof meta.display_name === "string" &&
    (meta.display_name as string).trim()
  )
    return (meta.display_name as string).trim();
  if (meta?.full_name && typeof meta.full_name === "string" && (meta.full_name as string).trim())
    return (meta.full_name as string).trim();
  if (meta?.name && typeof meta.name === "string" && (meta.name as string).trim())
    return (meta.name as string).trim();
  if (user.email) {
    const raw = user.email.split("@")[0] || "Usuario";
    return raw
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Usuario";
}

export function getUserInitial(name: string): string {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
}
