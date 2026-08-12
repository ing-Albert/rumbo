import { ArrowUpDown, BarChart2, Home, LayoutGrid, Target } from "lucide-react";
import type { ReactNode } from "react";

export const NAV_ITEMS: [string, ReactNode, string][] = [
  ["/", <Home size={18} />, "Inicio"],
  ["/movimientos", <ArrowUpDown size={18} />, "Movimientos"],
  ["/presupuesto", <LayoutGrid size={18} />, "Presupuesto"],
  ["/metas", <Target size={18} />, "Metas"],
  ["/reportes", <BarChart2 size={18} />, "Reportes"]
];
