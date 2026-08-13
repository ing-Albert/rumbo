import {
  Car,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  Tag,
  UtensilsCrossed,
  Zap
} from "lucide-react";
import type { ComponentType } from "react";

const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Vivienda: Home,
  Alimentacion: UtensilsCrossed,
  Transporte: Car,
  Servicios: Zap,
  Salud: Heart,
  Educacion: GraduationCap,
  "Otros gastos": MoreHorizontal
};

export function CategoryIcon({ category, size = 16 }: { category: string; size?: number }) {
  const Icon = CATEGORY_ICONS[category] ?? Tag;
  return <Icon size={size} />;
}
