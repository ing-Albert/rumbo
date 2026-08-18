import type { ComponentType } from "react";
import {
  BalancePreview,
  BudgetAlertPreview,
  GoalPacePreview,
  OfflinePreview,
  ReceiptPreview,
  RecurrencePreview,
  ReminderPreview,
  SanPreview
} from "./previews";

export interface ReleaseEntry {
  title: string;
  /** Que cambio, en una o dos frases y sin jerga. */
  description: string;
  /** Donde encontrarlo dentro de la app. */
  where?: string;
  /** El componente real de la app, montado con datos de ejemplo. */
  Preview?: ComponentType;
}

export interface Release {
  version: string;
  /** Fecha de publicacion, en formato ISO. */
  date: string;
  title: string;
  summary: string;
  entries: ReleaseEntry[];
}

/**
 * Historial de novedades.
 *
 * Es la unica fuente: de aqui salen tanto la pantalla de Novedades como el
 * aviso que aparece solo durante los primeros dias tras publicar. Tener la
 * fecha aqui evita el error de actualizar el texto y olvidar la fecha, que
 * dejaria el aviso sin aparecer.
 *
 * Lo mas nuevo va primero.
 */
export const RELEASES: Release[] = [
  {
    version: "0.6",
    date: "2026-08-17",
    title: "Ocho cosas nuevas",
    summary:
      "Rumbo pasa de anotar lo que gastas a trabajar por su cuenta: registra lo que se repite, avisa antes de que te pases, y ahora sabe cuanto dinero tienes de verdad.",
    entries: [
      {
        title: "Lo que se repite se registra solo",
        description:
          "Declaras una vez el alquiler, el sueldo o una suscripcion, y Rumbo lo anota el dia que toca. Ya no hay que entrar cada mes a escribir lo mismo. Los movimientos que aparecen solos quedan marcados como recurrentes.",
        where: "Movimientos, panel de abajo",
        Preview: RecurrencePreview
      },
      {
        title: "Te avisa antes de pasarte del presupuesto",
        description:
          "Al llegar al 80% de lo que fijaste para una categoria, y de nuevo al pasarte, el inicio te lo dice con el nombre y el monto. Antes solo te enterabas si entrabas a mirar.",
        where: "Inicio y Presupuesto",
        Preview: BudgetAlertPreview
      },
      {
        title: "Cuanto apartar al mes para llegar a tu meta",
        description:
          "Si tu meta tiene fecha, Rumbo divide lo que falta entre los meses que quedan y te dice la cifra. Si te atrasas, la recalcula y te avisa.",
        where: "Metas",
        Preview: GoalPacePreview
      },
      {
        title: "Ahora sabe cuanto dinero tienes",
        description:
          "Antes solo contaba el mes, y lo que sobraba en enero desaparecia en febrero. Ahora acumula, y separa lo que ya tienes apartado en metas de lo que sigue libre. Puedes indicar con cuanto empezabas.",
        where: "Inicio, y el saldo inicial en Configuracion",
        Preview: BalancePreview
      },
      {
        title: "Deudas, prestamos y sanes",
        description:
          "Un modulo nuevo para lo que debes y lo que te deben. El san se trata como lo que es: ves la rueda completa, cual es tu turno, y si por ahora estas prestando al grupo o ya te toca devolver.",
        where: "Deudas",
        Preview: SanPreview
      },
      {
        title: "Foto del recibo",
        description:
          "Le adjuntas una foto a un gasto desde la camara del telefono. Se guarda en privado y solo tu puedes verla. Dos meses despues, ya no hay que adivinar que era ese cargo.",
        where: "Al registrar o editar un gasto",
        Preview: ReceiptPreview
      },
      {
        title: "Funciona sin internet",
        description:
          "Puedes anotar un gasto en la calle aunque no tengas senal. Queda marcado como pendiente y se sube solo en cuanto vuelve la conexion, sin que tengas que hacer nada.",
        where: "En todos lados",
        Preview: OfflinePreview
      },
      {
        title: "Recordatorio diario",
        description:
          "Eliges una hora y Rumbo te avisa para anotar lo del dia. El aviso lo lanza tu propio aparato, asi que solo suena mientras la app sigue abierta.",
        where: "Configuracion",
        Preview: ReminderPreview
      }
    ]
  },
  {
    version: "0.5",
    date: "2026-08-12",
    title: "Rumbo en el telefono",
    summary:
      "La app se instala en Android, y en iPhone se puede anadir a la pantalla de inicio. Las dos se actualizan solas.",
    entries: [
      {
        title: "App de Android instalable",
        description:
          "Rumbo se empaqueta como una app de verdad, con su icono y su nombre. Carga tu misma cuenta y los mismos datos que la web, y se actualiza sola: no hay que reinstalar por cada cambio."
      },
      {
        title: "En iPhone, desde Safari",
        description:
          "Abriendo el sitio en Safari y eligiendo 'Anadir a pantalla de inicio' queda como una app, a pantalla completa y con el logo de Rumbo."
      },
      {
        title: "Retoques de diseno",
        description:
          "Iconos en toda la app, progreso de las metas en un anillo, el grafico de flujo comparando con el mes anterior, y montos que se formatean con comas mientras escribes."
      }
    ]
  }
];

export const LATEST_RELEASE = RELEASES[0]!;
