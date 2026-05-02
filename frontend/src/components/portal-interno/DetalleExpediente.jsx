/**
 * DetalleExpediente — Vista completa de un formulario enviado.
 *
 * Se superpone a la lista como overlay de pantalla completa. Muestra:
 *   1. Banner de descarga del PDF oficial (FORMULARIO_PDF generado al enviar).
 *   2. Documentos adjuntos por el cliente/proveedor con descarga directa.
 *
 * Los datos del formulario NO se muestran en pantalla — toda la información
 * sensible está contenida exclusivamente en el PDF oficial descargable.
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { estilosEstadoCargaBase } from './ui/listaStyles';
import BadgeEstadoFormulario from './BadgeEstadoFormulario';
import {
  ETIQUETA_TIPO_CONTRAPARTE,
  formatearFechaCorta,
  formatearBytes,
  TIPO_DOCUMENTO_PDF,
} from './constantes';

// ── Estilos ─────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position:   'fixed',
    inset:      0,
    background: 'var(--gray-50, #f8fafc)',
    overflowY:  'auto',
    zIndex:     100,
  },
  contenedor: {
    maxWidth: '800px',
    margin:   '0 auto',
    padding:  '32px 24px 64px',
  },
  // Encabezado
  encabezado: {
    marginBottom: '28px',
  },
  btnVolver: {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '6px',
    padding:      '6px 0',
    background:   'transparent',
    color:        'var(--primary-600, #2563eb)',
    border:       'none',
    fontSize:     '0.85rem',
    fontWeight:   '600',
    cursor:       'pointer',
    marginBottom: '16px',
  },
  tituloEncabezado: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '12px',
    flexWrap:   'wrap',
  },
  razonSocial: {
    fontSize:   '1.5rem',
    fontWeight: '800',
    color:      'var(--gray-900, #0f172a)',
    margin:     '0 0 6px',
    lineHeight: 1.2,
  },
  metaEncabezado: {
    display:    'flex',
    gap:        '8px',
    flexWrap:   'wrap',
    alignItems: 'center',
  },
  chip: {
    fontSize:      '0.75rem',
    color:         'var(--gray-500, #64748b)',
    background:    'var(--gray-100, #f1f5f9)',
    border:        '1px solid var(--gray-200, #e2e8f0)',
    borderRadius:  '999px',
    padding:       '3px 10px',
    fontFamily:    'inherit',
    whiteSpace:    'nowrap',
  },
  chipCodigo: {
    fontSize:      '0.75rem',
    color:         'var(--gray-500, #64748b)',
    fontFamily:    'monospace',
    letterSpacing: '0.06em',
  },
  // Sección de documentos adjuntos
  seccion: {
    background:   '#fff',
    borderRadius: 'var(--radius-md, 8px)',
    border:       '1px solid var(--gray-200, #e2e8f0)',
    marginBottom: '16px',
    overflow:     'hidden',
  },
  seccionTitulo: {
    fontSize:      '0.8rem',
    fontWeight:    '700',
    color:         'var(--gray-500, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding:       '12px 20px',
    background:    'var(--gray-50, #f8fafc)',
    borderBottom:  '1px solid var(--gray-100, #f1f5f9)',
    margin:        0,
  },
  // Banner PDF oficial
  bannerPdf: {
    display:       'flex',
    alignItems:    'center',
    justifyContent: 'space-between',
    gap:           '16px',
    background:    'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
    borderRadius:  'var(--radius-md, 8px)',
    padding:       '20px 24px',
    marginBottom:  '20px',
    flexWrap:      'wrap',
  },
  bannerPdfTextos: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '3px',
  },
  bannerPdfTitulo: {
    fontSize:   '0.92rem',
    fontWeight: '700',
    color:      '#fff',
    margin:     0,
  },
  bannerPdfSubtitulo: {
    fontSize: '0.78rem',
    color:    'rgba(255,255,255,0.7)',
    margin:   0,
  },
  btnDescargarPdf: {
    padding:        '9px 20px',
    background:     '#fff',
    color:          '#1d4ed8',
    border:         'none',
    borderRadius:   'var(--radius-sm, 6px)',
    fontSize:       '0.85rem',
    fontWeight:     '700',
    cursor:         'pointer',
    textDecoration: 'none',
    whiteSpace:     'nowrap',
    flexShrink:     0,
  },
  // Documentos
  listaDocumentos: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0',
  },
  filaDocumento: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '12px 20px',
    borderBottom:   '1px solid var(--gray-50, #f8fafc)',
    gap:            '12px',
  },
  infoDocumento: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
    flex:          1,
    minWidth:      0,
  },
  nombreArchivo: {
    fontSize:     '0.88rem',
    fontWeight:   '500',
    color:        'var(--gray-800, #1e293b)',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  tipoTamano: {
    fontSize: '0.75rem',
    color:    'var(--gray-400, #94a3b8)',
  },
  btnDescargar: {
    padding:      '5px 14px',
    background:   'var(--primary-50, #eff6ff)',
    color:        'var(--primary-700, #1d4ed8)',
    border:       '1px solid var(--primary-200, #bfdbfe)',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize:     '0.78rem',
    fontWeight:   '600',
    cursor:       'pointer',
    textDecoration: 'none',
    whiteSpace:   'nowrap',
    flexShrink:   0,
  },
  sinDocumentos: {
    padding:   '20px',
    textAlign: 'center',
    color:     'var(--gray-400, #94a3b8)',
    fontSize:  '0.85rem',
  },
  // Estados
  spinner: {
    ...estilosEstadoCargaBase.spinner,
    padding:   '80px 0',
    fontSize:  '0.9rem',
  },
  errorCarga: {
    ...estilosEstadoCargaBase.errorCarga,
    padding:      '16px 20px',
    fontSize:     '0.88rem',
    margin:       '24px 0',
  },
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

function BannerPdfFormulario({ documento, formularioId }) {
  const urlDescarga = api.urlDescargaDocumento(formularioId, documento.id);
  const tamano      = documento.tamano ? ` · ${formatearBytes(documento.tamano)}` : '';

  return (
    <div style={s.bannerPdf}>
      <div style={s.bannerPdfTextos}>
        <p style={s.bannerPdfTitulo}>Formulario SAGRILAFT — PDF oficial</p>
        <p style={s.bannerPdfSubtitulo}>
          {documento.nombre_archivo}{tamano}
        </p>
      </div>
      <a
        href={urlDescarga}
        download={documento.nombre_archivo}
        style={s.btnDescargarPdf}
        target="_blank"
        rel="noreferrer"
      >
        Descargar PDF
      </a>
    </div>
  );
}

function FilaDocumento({ documento, formularioId }) {
  const urlDescarga = api.urlDescargaDocumento(formularioId, documento.id);

  return (
    <div style={s.filaDocumento}>
      <div style={s.infoDocumento}>
        <span style={s.nombreArchivo} title={documento.nombre_archivo}>
          {documento.nombre_archivo}
        </span>
        <span style={s.tipoTamano}>
          {documento.tipo_documento}
          {documento.tamano ? ` · ${formatearBytes(documento.tamano)}` : ''}
        </span>
      </div>
      <a
        href={urlDescarga}
        download={documento.nombre_archivo}
        style={s.btnDescargar}
        target="_blank"
        rel="noreferrer"
      >
        Descargar
      </a>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DetalleExpediente({ formularioId, razonSocial, onVolver }) {
  const [expediente, setExpediente] = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    api.obtenerExpediente(formularioId)
      .then(datos => { if (activo) setExpediente(datos); })
      .catch(() => { if (activo) setError('No se pudo cargar el formulario. Intente nuevamente.'); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [formularioId]);

  const tipoLabel         = expediente ? (ETIQUETA_TIPO_CONTRAPARTE[expediente.tipo_contraparte] ?? expediente.tipo_contraparte) : '';
  const todosDocumentos   = expediente?.documentos ?? [];
  const pdfFormulario     = todosDocumentos.find(d => d.tipo_documento === TIPO_DOCUMENTO_PDF) ?? null;
  const documentosAdjuntos = todosDocumentos.filter(d => d.tipo_documento !== TIPO_DOCUMENTO_PDF);

  return (
    <div style={s.overlay}>
      <div style={s.contenedor}>
        {/* Botón volver */}
        <button style={s.btnVolver} onClick={onVolver} type="button">
          ← Volver a formularios
        </button>

        {cargando && <div style={s.spinner}>Cargando expediente…</div>}
        {error    && <div style={s.errorCarga}>{error}</div>}

        {!cargando && expediente && (
          <>
            {/* Encabezado */}
            <div style={s.encabezado}>
              <h1 style={s.razonSocial}>{expediente.razon_social ?? razonSocial ?? '(Sin razón social)'}</h1>
              <div style={s.metaEncabezado}>
                <BadgeEstadoFormulario
                  estado={expediente.estado}
                  overrides={{ fontSize: '0.75rem', padding: '3px 12px' }}
                />
                {tipoLabel && <span style={s.chip}>{tipoLabel}</span>}
                <span style={s.chipCodigo}>{expediente.codigo_peticion}</span>
                {expediente.updated_at && (
                  <span style={s.chip}>Enviado {formatearFechaCorta(expediente.updated_at)}</span>
                )}
              </div>
            </div>

            {/* PDF oficial del formulario */}
            {pdfFormulario && (
              <BannerPdfFormulario documento={pdfFormulario} formularioId={formularioId} />
            )}

            {/* Documentos adjuntos por el cliente/proveedor */}
            <div style={s.seccion}>
              <p style={s.seccionTitulo}>
                Documentos adjuntos ({documentosAdjuntos.length})
              </p>
              <div style={s.listaDocumentos}>
                {documentosAdjuntos.length === 0 ? (
                  <div style={s.sinDocumentos}>No hay documentos adjuntos en este formulario.</div>
                ) : (
                  documentosAdjuntos.map(doc => (
                    <FilaDocumento
                      key={doc.id}
                      documento={doc}
                      formularioId={formularioId}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
