from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_serializer

from infrastructure.persistencia.models import EstadoFormulario, TipoContraparte, TipoPersona

from .comunes import a_iso_utc


class ExpedienteResumen(BaseModel):
    """Vista compacta de un formulario enviado, para listados en el portal interno."""

    formulario_id: str
    codigo_peticion: str
    razon_social: Optional[str] = None
    numero_identificacion: Optional[str] = None
    tipo_contraparte: Optional[TipoContraparte] = None
    tipo_persona: Optional[TipoPersona] = None
    estado: EstadoFormulario
    cantidad_documentos: int
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at", when_used="json")
    def _serializar_fechas(self, valor: datetime) -> str:
        return a_iso_utc(valor) or ""


class DocumentoResumen(BaseModel):
    """Metadatos mínimos de un documento adjunto para descarga desde el portal."""

    id: str
    tipo_documento: str
    nombre_archivo: str
    tamano: Optional[int] = None


class ExpedienteDetalle(BaseModel):
    """
    Vista de detalle de un expediente para el portal interno.

    Expone únicamente los campos que la pantalla necesita.
    Los datos del formulario (financieros, tributarios, representante legal, etc.)
    no se incluyen — están disponibles exclusivamente en el PDF descargable.
    """

    formulario_id: str
    codigo_peticion: str
    razon_social: Optional[str] = None
    tipo_contraparte: Optional[TipoContraparte] = None
    estado: EstadoFormulario
    updated_at: datetime
    documentos: List[DocumentoResumen] = []

    @field_serializer("updated_at", when_used="json")
    def _serializar_fecha(self, valor: datetime) -> str:
        return a_iso_utc(valor) or ""
