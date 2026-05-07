import FormField from './FormField';
import { OPCIONES_MES, componerPartesFirma } from '../utils/firmaFormato';

const estilos = {
  contenedor: {
    marginTop: '8px',
  },
  titulo: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--gray-800)',
    marginBottom: '16px',
  },
  narrativa: {
    border: '1px solid var(--gray-200)',
    borderRadius: '6px',
    padding: '20px 24px',
    marginTop: '20px',
    lineHeight: '2',
    fontSize: '0.9rem',
    color: 'var(--gray-800)',
  },
  campo: {
    display: 'inline-block',
    borderBottom: '1.5px solid var(--gray-600)',
    minWidth: '3ch',
    textAlign: 'center',
    color: 'var(--primary, #1a237e)',
    fontWeight: '500',
  },
  campoVacio: {
    color: 'var(--gray-400)',
    fontWeight: '400',
  },
  firmaLinea: {
    marginTop: '32px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },
  firmaEtiqueta: {
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
    color: 'var(--gray-800)',
    paddingBottom: '3px',
  },
};

function CampoNarrativa({ valor, anchoVacio }) {
  const lleno = Boolean(valor);
  return (
    <span
      style={{
        ...estilos.campo,
        ...(lleno ? {} : estilos.campoVacio),
        minWidth: lleno ? 'auto' : anchoVacio,
        padding: '0 4px',
      }}
    >
      {lleno ? valor : ' '.repeat(Math.max(1, Math.round(parseInt(anchoVacio) / 8)))}
    </span>
  );
}

/**
 * Sección "Firma del Representante Legal" del Paso 8.
 *
 * Captura día, mes, año y ciudad. La firma en sí la captura ZohoSign
 * cuando el formulario se envía a firma electrónica.
 */
export default function FirmaRepresentanteLegal({ formData, onChange, onOpenHelp, errors = {} }) {
  const diaFirma    = formData.dia_firma    ?? '';
  const mesFirma    = formData.mes_firma    ?? '';
  const yearFirma   = formData.year_firma   ?? '';
  const ciudadFirma = formData.ciudad_firma ?? '';

  const { dia, mes, year, ciudad } = componerPartesFirma({ diaFirma, mesFirma, yearFirma, ciudadFirma });

  return (
    <div style={estilos.contenedor}>
      <h3 style={estilos.titulo}>Firma del Representante Legal</h3>

      {/* Captura de fecha y ciudad */}
      <div className="form-row">
        <FormField
          label="Día" name="dia_firma" type="number" required
          value={diaFirma} onChange={onChange} onOpenHelp={onOpenHelp}
          error={errors.dia_firma} placeholder="DD"
          min={1} max={31}
        />
        <FormField
          label="Mes" name="mes_firma" type="select" required
          value={mesFirma} onChange={onChange} onOpenHelp={onOpenHelp}
          error={errors.mes_firma} options={OPCIONES_MES}
        />
        <FormField
          label="Año" name="year_firma" type="number" required
          value={yearFirma} onChange={onChange} onOpenHelp={onOpenHelp}
          error={errors.year_firma} placeholder="AAAA"
          min={2000} max={2100}
        />
        <FormField
          label="Ciudad" name="ciudad_firma" required
          value={ciudadFirma} onChange={onChange} onOpenHelp={onOpenHelp}
          error={errors.ciudad_firma}
        />
      </div>

      {/* Vista del documento — texto narrativo + línea de firma */}
      <div style={estilos.narrativa}>
        <p>
          En constancia de haber leído y acatado lo anterior firmo el presente documento a los{' '}
          <CampoNarrativa valor={dia} anchoVacio="40px" />{' '}
          días del mes de{' '}
          <CampoNarrativa valor={mes} anchoVacio="110px" />{' '}
          de{' '}
          <CampoNarrativa valor={year} anchoVacio="56px" />{' '}
          en la ciudad de{' '}
          <CampoNarrativa valor={ciudad} anchoVacio="150px" />.
        </p>

        {/* Línea de firma — marcador visual donde ZohoSign capturará la firma */}
        <div style={estilos.firmaLinea}>
          <span style={estilos.firmaEtiqueta}>Firma Representante Legal</span>
        </div>
      </div>
    </div>
  );
}
