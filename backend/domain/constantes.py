"""
Constantes de dominio compartidas entre servicios.

Centraliza valores que deben permanecer sincronizados entre múltiples capas
(servicios, migraciones, frontend) para evitar magic strings duplicados.
"""

# Tipo de documento del PDF oficial generado al enviar el formulario SAGRILAFT.
# Sincronizar con: frontend/src/components/portal-interno/constantes.js → TIPO_DOCUMENTO_PDF
TIPO_DOCUMENTO_FORMULARIO_PDF = "FORMULARIO_PDF"
