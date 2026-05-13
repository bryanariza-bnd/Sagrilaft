/**
 * ModalDevolucion — panel para devolver un formulario SAGRILAFT al remitente.
 *
 * El usuario del portal especifica qué debe corregirse o completarse.
 * Al confirmar, el sistema cambia el estado a EN_CORRECCION y notifica
 * al destinatario registrado por correo electrónico.
 */

import { useState } from 'react';
import { api } from '../../services/api';

const LONGITUD_MINIMA_ESPECIFICACIONES = 20;
const LONGITUD_MAXIMA_ESPECIFICACIONES = 2000;

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = {
  fondo: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(15, 23, 42, 0.5)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          200,
    padding:         '16px',
  },
  modal: {
    background:   '#fff',
    borderRadius: 'var(--radius-md, 10px)',
    boxShadow:    '0 20px 60px rgba(0,0,0,0.2)',
    width:        '100%',
    maxWidth:     '560px',
    maxHeight:    '90vh',
    overflowY:    'auto',
    display:      'flex',
    flexDirection: 'column',
  },
  encabezado: {
    padding:      '24px 24px 0',
  },
  titulo: {
    fontSize:   '1.15rem',
    fontWeight: '800',
    color:      'var(--gray-900, #0f172a)',
    margin:     '0 0 8px',
  },
  descripcion: {
    fontSize:    '0.85rem',
    color:       'var(--gray-500, #64748b)',
    margin:      '0 0 24px',
    lineHeight:  1.5,
  },
  cuerpo: {
    padding:    '0 24px',
    flex:       1,
  },
  etiqueta: {
    display:    'block',
    fontSize:   '0.8rem',
    fontWeight: '700',
    color:      'var(--gray-700, #334155)',
    marginBottom: '6px',
    letterSpacing: '0.03em',
  },
  textarea: {
    width:        '100%',
    padding:      '10px 12px',
    border:       '1.5px solid var(--gray-300, #cbd5e1)',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize:     '0.88rem',
    lineHeight:   1.6,
    color:        'var(--gray-900, #0f172a)',
    resize:       'vertical',
    fontFamily:   'inherit',
    boxSizing:    'border-box',
    outline:      'none',
    transition:   'border-color 0.15s',
  },
  textareaActivo: {
    borderColor: 'var(--primary-500, #3b82f6)',
  },
  contadorCaracteres: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      '5px',
    fontSize:       '0.75rem',
    color:          'var(--gray-400, #94a3b8)',
  },
  avisoMinimo: {
    color: 'var(--orange-600, #ea580c)',
  },
  vistaPreviaContenedor: {
    marginTop:     '20px',
    marginBottom:  '4px',
  },
  vistaPreviaTitulo: {
    fontSize:    '0.75rem',
    fontWeight:  '700',
    color:       'var(--gray-500, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin:      '0 0 8px',
  },
  vistaPrevia: {
    background:   '#fffbeb',
    border:       '1px solid #fde68a',
    borderRadius: 'var(--radius-sm, 6px)',
    padding:      '14px 16px',
  },
  vistaPreviaIntroduccion: {
    fontSize:   '0.83rem',
    color:      '#78350f',
    margin:     '0 0 10px',
    lineHeight: 1.5,
  },
  vistaPreviaEspecificaciones: {
    fontSize:    '0.83rem',
    color:       '#92400e',
    fontStyle:   'normal',
    whiteSpace:  'pre-wrap',
    wordBreak:   'break-word',
    margin:      0,
    padding:     '8px 10px',
    background:  '#fef3c7',
    borderRadius: '4px',
    minHeight:   '32px',
  },
  bannerError: {
    marginTop:    '16px',
    padding:      '10px 14px',
    background:   '#fef2f2',
    border:       '1px solid #fca5a5',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize:     '0.85rem',
    color:        '#dc2626',
  },
  pie: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '10px',
    padding:        '20px 24px 24px',
    borderTop:      '1px solid var(--gray-100, #f1f5f9)',
    marginTop:      '20px',
  },
  btnCancelar: {
    padding:      '9px 20px',
    background:   '#fff',
    color:        'var(--gray-600, #475569)',
    border:       '1.5px solid var(--gray-300, #cbd5e1)',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize:     '0.88rem',
    fontWeight:   '600',
    cursor:       'pointer',
  },
  btnConfirmar: {
    padding:      '9px 20px',
    background:   '#c2410c',
    color:        '#fff',
    border:       'none',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize:     '0.88rem',
    fontWeight:   '700',
    cursor:       'pointer',
    transition:   'opacity 0.15s',
  },
  btnDeshabilitado: {
    opacity:  0.5,
    cursor:   'not-allowed',
  },
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function ModalDevolucion({ visible, formularioId, onDevuelto, onCancelar }) {
  const [especificaciones, setEspecificaciones] = useState('');
  const [enfocado, setEnfocado]                 = useState(false);
  const [enviando, setEnviando]                 = useState(false);
  const [error, setError]                       = useState(null);

  function limpiarYCerrar() {
    setEspecificaciones('');
    setError(null);
    onCancelar();
  }

  function validarEspecificaciones() {
    const longitud = especificaciones.trim().length;
    if (longitud < LONGITUD_MINIMA_ESPECIFICACIONES) {
      return `Mínimo ${LONGITUD_MINIMA_ESPECIFICACIONES} caracteres (actual: ${longitud}).`;
    }
    return null;
  }

  async function handleConfirmar() {
    const errorValidacion = validarEspecificaciones();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await api.devolverExpediente(formularioId, {
        especificaciones: especificaciones.trim(),
      });
      setEspecificaciones('');
      onDevuelto();
    } catch (err) {
      setError(err.message || 'Error al procesar la devolución. Intente nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (!visible) return null;

  const longitudActual   = especificaciones.trim().length;
  const formularioValido = longitudActual >= LONGITUD_MINIMA_ESPECIFICACIONES;
  const textoBoton       = enviando ? 'Enviando devolución…' : 'Confirmar devolución';

  return (
    <div style={s.fondo} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-devolucion">
      <div style={s.modal}>

        {/* Encabezado */}
        <div style={s.encabezado}>
          <h2 style={s.titulo} id="titulo-modal-devolucion">
            Devolver formulario para corrección
          </h2>
          <p style={s.descripcion}>
            El destinatario recibirá un correo con las especificaciones indicadas
            y podrá acceder al formulario para corregir o completar la información solicitada.
          </p>
        </div>

        {/* Cuerpo */}
        <div style={s.cuerpo}>

          {/* Campo de especificaciones */}
          <label style={s.etiqueta} htmlFor="campo-especificaciones-correccion">
            Especificaciones de corrección
          </label>
          <textarea
            id="campo-especificaciones-correccion"
            style={{ ...s.textarea, ...(enfocado ? s.textareaActivo : {}) }}
            value={especificaciones}
            onChange={e => setEspecificaciones(e.target.value)}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            placeholder="Describa exactamente qué información debe corregirse o completarse en el formulario…"
            rows={6}
            maxLength={LONGITUD_MAXIMA_ESPECIFICACIONES}
            disabled={enviando}
          />
          <div style={s.contadorCaracteres}>
            <span>{longitudActual} / {LONGITUD_MAXIMA_ESPECIFICACIONES}</span>
            {!formularioValido && longitudActual > 0 && (
              <span style={s.avisoMinimo}>
                Mínimo {LONGITUD_MINIMA_ESPECIFICACIONES} caracteres
              </span>
            )}
          </div>

          {/* Vista previa del correo */}
          <div style={s.vistaPreviaContenedor}>
            <p style={s.vistaPreviaTitulo}>Vista previa del correo al destinatario</p>
            <div style={s.vistaPrevia}>
              <p style={s.vistaPreviaIntroduccion}>
                Usted ha sido requerido para completar/modificar la siguiente información
                del formulario:
              </p>
              <p style={s.vistaPreviaEspecificaciones}>
                {especificaciones.trim() || (
                  <span style={{ color: '#b45309', fontStyle: 'italic' }}>
                    Las especificaciones aparecerán aquí…
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Banner de error */}
          {error && <div style={s.bannerError}>{error}</div>}

        </div>

        {/* Pie con acciones */}
        <div style={s.pie}>
          <button
            style={s.btnCancelar}
            onClick={limpiarYCerrar}
            disabled={enviando}
            type="button"
          >
            Cancelar
          </button>
          <button
            style={{
              ...s.btnConfirmar,
              ...(!formularioValido || enviando ? s.btnDeshabilitado : {}),
            }}
            onClick={handleConfirmar}
            disabled={!formularioValido || enviando}
            type="button"
          >
            {textoBoton}
          </button>
        </div>

      </div>
    </div>
  );
}
