/**
 * BadgeEstadoFormulario — indicador visual del estado de un formulario.
 *
 * Props:
 *   estado {string} "enviado" | "validado" | "rechazado" | (otros)
 *   overrides {object} overrides de estilo (fontSize/padding, etc.)
 */

import { ETIQUETA_ESTADO_FORMULARIO, ESTILO_ESTADO_FORMULARIO, estiloBadgeEstado } from './constantes';

const _FALLBACK_ESTILO = 'rechazado';

export default function BadgeEstadoFormulario({ estado, overrides = {} }) {
  if (process.env.NODE_ENV !== 'production' && !ESTILO_ESTADO_FORMULARIO[estado]) {
    console.warn(`BadgeEstadoFormulario: estado desconocido "${estado}".`);
  }

  const etiqueta = ETIQUETA_ESTADO_FORMULARIO[estado] ?? estado;
  const estadoSeguro = ESTILO_ESTADO_FORMULARIO[estado] ? estado : _FALLBACK_ESTILO;
  return <span style={estiloBadgeEstado(estadoSeguro, overrides)}>{etiqueta}</span>;
}

