import {
  ArrowUpDown,
  BarChart2,
  HandCoins,
  Home,
  LayoutGrid,
  Target,
  type LucideIcon
} from "lucide-react";

export interface NavItem {
  path: string;
  /**
   * El componente del icono, no un elemento ya creado: quien lo pinta decide
   * el tamano, y asi la lista deja de ser un array de JSX suelto sin `key`.
   */
  Icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", Icon: Home, label: "Inicio" },
  { path: "/movimientos", Icon: ArrowUpDown, label: "Movimientos" },
  { path: "/presupuesto", Icon: LayoutGrid, label: "Presupuesto" },
  { path: "/metas", Icon: Target, label: "Metas" },
  { path: "/deudas", Icon: HandCoins, label: "Deudas" },
  { path: "/reportes", Icon: BarChart2, label: "Reportes" }
];
