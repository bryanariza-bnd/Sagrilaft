import { CARGOS_JUNTA_DIRECTIVA } from '../../data/formularioConfig';
import {
  onlyTextKeyDown, onlyTextPaste,
  onlyAlphanumericKeyDown, onlyAlphanumericPaste,
  onPorcentajeKeyDown, onPorcentajePaste,
} from '../../utils/inputValidation';
import {
  UMBRAL_MINIMO_PARTICIPACION_ACCIONISTA,
  UMBRAL_MINIMO_CONTROL_BENEFICIARIO_FINAL,
  PORCENTAJE_MAXIMO_PERMITIDO,
} from '../../utils/constantes';
import { HR, SectionTitle, ESTILO_CELDA_ERROR, ESTILO_BTN_ELIMINAR, CeldaPEP, CeldaIdentificacion } from '../TablaFormComponents';

const TIPOS_ID_JUNTA = [
  { value: 'CC',  label: 'CC'  },
  { value: 'CE',  label: 'CE'  },
  { value: 'PAS', label: 'PAS' },
];

const TIPOS_ID_ACCIONISTA = [
  { value: 'CC',  label: 'CC'  },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE',  label: 'CE'  },
  { value: 'PAS', label: 'PAS' },
];

/**
 * Paso 4 — Junta Directiva y Composición Accionaria.
 * Solo aplica a Persona Jurídica; muestra mensaje alternativo para Natural.
 */
export default function PasoJuntaAccionistas({
  formData,
  errors = {},
  juntaDirectiva, onJuntaChange, onJuntaTipoIdChange, onAddJuntaMember, onEliminarJuntaMember,
  accionistas, onAccionistaChange, onAccionistaTipoIdChange, onAddAccionista, onEliminarAccionista,
  beneficiarios, onBeneficiarioChange, onBeneficiarioTipoIdChange, onAddBeneficiario, onEliminarBeneficiario,
}) {
  const erroresFilasJunta = errors.junta_directiva_filas ?? [];
  const erroresFilasAcc   = errors.accionistas_filas     ?? [];
  const erroresFilasBen   = errors.beneficiarios_filas   ?? [];

  if (formData.tipo_persona === 'natural') {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--gray-500)' }}>
          Esta sección aplica solo para Persona Jurídica. Haga clic en "Siguiente" para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h2 className="section-title">INFORMACIÓN JUNTA DIRECTIVA, REPRESENTANTES LEGALES Y REVISORES FISCALES</h2>
      <p className="section-subtitle">Registrar los datos de las personas que conforman la Junta Directiva Principal, Junta Directiva suplente y Revisores Fiscales, que se encuentran registradas en Cámara de Comercio.</p>
      <p className="section-subtitle">Para responder las preguntas respecto a PEP´s, tenga en cuenta que corresponden a personas expuestas políticamente o públicamente que: Manejan recursos públicos, tienen algún grado de poder público o gozan dereconocimiento público.</p>

      {/* ── Junta Directiva ─────────────────────────────────────────────────── */}
      <SectionTitle bold>Junta Directiva y Representantes</SectionTitle>
      <div className="info-box">
        <p> PEP: Persona Expuesta Políticamente — persona que maneja recursos públicos, tiene poder público o reconocimiento público.</p>
        <p> ¿Vínculos con PEP? Si es asi, describa, de lo contrario colocar No.</p>
      </div>
      {errors.junta_directiva_tabla && (
        <div className="field-error" style={{ marginBottom: '8px' }}>{errors.junta_directiva_tabla}</div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cargo</th><th>Nombre</th><th>Tipo ID</th>
              <th>Número ID</th><th>¿PEP?</th><th>Vínculos PEP</th>
              {juntaDirectiva.length > 1 && <th></th>}
            </tr>
          </thead>
          <tbody>
            {juntaDirectiva.map((miembro, idx) => {
              const err = erroresFilasJunta[idx] ?? {};
              return (
                <tr key={idx}>
                  <td>
                    <select
                      value={miembro.cargo || ''}
                      onChange={(e) => onJuntaChange(idx, 'cargo', e.target.value)}
                      style={err.cargo ? ESTILO_CELDA_ERROR : undefined}
                    >
                      <option value="">Seleccione...</option>
                      {CARGOS_JUNTA_DIRECTIVA.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      value={miembro.nombre || ''} placeholder="Nombre completo"
                      onChange={(e) => onJuntaChange(idx, 'nombre', e.target.value)}
                      onKeyDown={onlyTextKeyDown} onPaste={onlyTextPaste}
                      style={err.nombre ? ESTILO_CELDA_ERROR : undefined}
                    />
                  </td>
                  <CeldaIdentificacion
                    item={miembro} err={err} tiposId={TIPOS_ID_JUNTA}
                    onTipoChange={(tipo) => onJuntaTipoIdChange(idx, tipo)}
                    onNumeroChange={(val) => onJuntaChange(idx, 'numero_id', val)}
                  />
                  <CeldaPEP item={miembro} err={err} onChange={(campo, val) => onJuntaChange(idx, campo, val)} />
                  {juntaDirectiva.length > 1 && (
                    <td>
                      <button type="button" onClick={() => onEliminarJuntaMember(idx)} style={ESTILO_BTN_ELIMINAR} title="Eliminar miembro">×</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-sm btn-outline" onClick={onAddJuntaMember}>
        + Agregar miembro
      </button>

      <HR />

      {/* ── Composición Accionaria ───────────────────────────────────────────── */}
      <SectionTitle bold>Composición Accionaria</SectionTitle>
      <div className="info-box">
        <p>Registrar todos los accionistas o asociados que tengan directa o indirectamente mas del {UMBRAL_MINIMO_PARTICIPACION_ACCIONISTA}% de su capital social, aporte o participación.</p>
        <p>  ¿Vínculos con PEP? Si es asi, describa, de lo contrario colocar No.</p>
      </div>
      {errors.accionistas_tabla && (
        <div className="field-error" style={{ marginBottom: '8px' }}>{errors.accionistas_tabla}</div>
      )}
      {errors.accionistas_suma && (
        <div className="field-error" style={{ marginBottom: '8px' }}>{errors.accionistas_suma}</div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre o Razón Social</th><th>% Participación</th><th>Tipo ID</th>
              <th>Número ID</th><th>¿PEP?</th><th>Vínculos PEP</th>
              {accionistas.length > 1 && <th></th>}
            </tr>
          </thead>
          <tbody>
            {accionistas.map((acc, idx) => {
              const err = erroresFilasAcc[idx] ?? {};
              return (
                <tr key={idx}>
                  <td>
                    <input
                      value={acc.nombre || ''} placeholder="Nombre"
                      onChange={(e) => onAccionistaChange(idx, 'nombre', e.target.value)}
                      onKeyDown={onlyAlphanumericKeyDown} onPaste={onlyAlphanumericPaste}
                      style={err.nombre ? ESTILO_CELDA_ERROR : undefined}
                    />
                  </td>
                  <td>
                    <input
                      type="number" step="0.01"
                      min={UMBRAL_MINIMO_PARTICIPACION_ACCIONISTA + 0.01}
                      max={PORCENTAJE_MAXIMO_PERMITIDO - 0.01}
                      value={acc.porcentaje || ''} placeholder="%"
                      onChange={(e) => onAccionistaChange(idx, 'porcentaje', e.target.value)}
                      onKeyDown={onPorcentajeKeyDown} onPaste={onPorcentajePaste}
                      style={err.porcentaje ? ESTILO_CELDA_ERROR : undefined}
                    />
                    {err.porcentaje && (
                      <span style={{ color: 'var(--error, #e53e3e)', fontSize: '0.75rem', display: 'block' }}>{err.porcentaje}</span>
                    )}
                  </td>
                  <CeldaIdentificacion
                    item={acc} err={err} tiposId={TIPOS_ID_ACCIONISTA}
                    onTipoChange={(tipo) => onAccionistaTipoIdChange(idx, tipo)}
                    onNumeroChange={(val) => onAccionistaChange(idx, 'numero_id', val)}
                  />
                  <CeldaPEP item={acc} err={err} onChange={(campo, val) => onAccionistaChange(idx, campo, val)} />
                  {accionistas.length > 1 && (
                    <td>
                      <button type="button" onClick={() => onEliminarAccionista(idx)} style={ESTILO_BTN_ELIMINAR} title="Eliminar accionista">×</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-sm btn-outline" onClick={onAddAccionista}>
        + Agregar accionista
      </button>

      <HR />

      {/* ── Beneficiario Final ───────────────────────────────────────────────── */}
      <SectionTitle bold>Beneficiario Final</SectionTitle>
      <div className="info-box">
        <p>En caso de que los socios sean personas jurídicas, describa la(s) persona(s) natural(es) que ejercen el control efectivo directo o indirecto sobre los socios persona(s) jurídica(s), o que sea titular del <strong>{UMBRAL_MINIMO_CONTROL_BENEFICIARIO_FINAL}% o más del capital</strong> de los socios.</p>
      </div>
      {errors.beneficiarios_tabla && (
        <div className="field-error" style={{ marginBottom: '8px' }}>{errors.beneficiarios_tabla}</div>
      )}
      {errors.beneficiarios_suma && (
        <div className="field-error" style={{ marginBottom: '8px' }}>{errors.beneficiarios_suma}</div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre / Razón Social</th><th>% Control</th><th>Tipo ID</th>
              <th>Número ID</th><th>¿PEP?</th><th>Vínculos PEP</th>
              {beneficiarios.length > 1 && <th></th>}
            </tr>
          </thead>
          <tbody>
            {beneficiarios.map((ben, idx) => {
              const err = erroresFilasBen[idx] ?? {};
              return (
                <tr key={idx}>
                  <td>
                    <input
                      value={ben.nombre || ''} placeholder="Nombre"
                      onChange={(e) => onBeneficiarioChange(idx, 'nombre', e.target.value)}
                      onKeyDown={onlyAlphanumericKeyDown} onPaste={onlyAlphanumericPaste}
                      style={err.nombre ? ESTILO_CELDA_ERROR : undefined}
                    />
                  </td>
                  <td>
                    <input
                      type="number" step="0.01"
                      min={UMBRAL_MINIMO_CONTROL_BENEFICIARIO_FINAL + 0.01}
                      max={PORCENTAJE_MAXIMO_PERMITIDO - 0.01}
                      value={ben.porcentaje || ''} placeholder="%"
                      onChange={(e) => onBeneficiarioChange(idx, 'porcentaje', e.target.value)}
                      onKeyDown={onPorcentajeKeyDown} onPaste={onPorcentajePaste}
                      style={err.porcentaje ? ESTILO_CELDA_ERROR : undefined}
                    />
                    {err.porcentaje && (
                      <span style={{ color: 'var(--error, #e53e3e)', fontSize: '0.75rem', display: 'block' }}>{err.porcentaje}</span>
                    )}
                  </td>
                  <CeldaIdentificacion
                    item={ben} err={err} tiposId={TIPOS_ID_JUNTA}
                    onTipoChange={(tipo) => onBeneficiarioTipoIdChange(idx, tipo)}
                    onNumeroChange={(val) => onBeneficiarioChange(idx, 'numero_id', val)}
                  />
                  <CeldaPEP item={ben} err={err} onChange={(campo, val) => onBeneficiarioChange(idx, campo, val)} />
                  {beneficiarios.length > 1 && (
                    <td>
                      <button type="button" onClick={() => onEliminarBeneficiario(idx)} style={ESTILO_BTN_ELIMINAR} title="Eliminar beneficiario">×</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-sm btn-outline" onClick={onAddBeneficiario}>
        + Agregar beneficiario
      </button>
    </div>
  );
}
