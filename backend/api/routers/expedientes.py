"""
Router de expedientes — portal interno SAGRILAFT.

Expone endpoints de solo lectura para consultar formularios enviados por
clientes y proveedores, incluyendo la descarga de documentos adjuntos.

SRP: parsea solicitudes HTTP y delega toda la lógica al ExpedienteService.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from api.schemas import ExpedienteDetalle, ExpedienteResumen
from infrastructure.persistencia.database import get_db
from services.expedientes.expediente_service import ExpedienteService

enrutador = APIRouter(prefix="/api/expedientes", tags=["expedientes"])


def _obtener_servicio(
    sesion: Session = Depends(get_db),
) -> ExpedienteService:
    return ExpedienteService(sesion)


# ─── Listado ──────────────────────────────────────────────────────────────────

@enrutador.get(
    "/",
    response_model=List[ExpedienteResumen],
    summary="Listar formularios enviados",
    description=(
        "Devuelve todos los formularios en estado no-borrador (enviados, validados, rechazados), "
        "ordenados por fecha de actualización descendente. "
        "Acepta filtros opcionales por tipo de contraparte y búsqueda en razón social."
    ),
)
def listar_expedientes(
    tipo_contraparte: Optional[str] = Query(None, description="'CLIENTE' o 'PROVEEDOR'"),
    busqueda: Optional[str] = Query(None, description="Texto libre en razón social"),
    servicio: ExpedienteService = Depends(_obtener_servicio),
) -> List[ExpedienteResumen]:
    return servicio.listar_expedientes(
        tipo_contraparte=tipo_contraparte,
        busqueda=busqueda,
    )


# ─── Detalle ──────────────────────────────────────────────────────────────────

@enrutador.get(
    "/{formulario_id}",
    response_model=ExpedienteDetalle,
    summary="Obtener detalle de expediente",
    description="Retorna los metadatos del expediente y sus documentos adjuntos. Los datos del formulario están disponibles exclusivamente en el PDF descargable.",
    responses={404: {"description": "Formulario no encontrado o en borrador"}},
)
def obtener_expediente(
    formulario_id: str,
    servicio: ExpedienteService = Depends(_obtener_servicio),
) -> ExpedienteDetalle:
    return servicio.obtener_expediente(formulario_id)


# ─── Descarga de documentos ───────────────────────────────────────────────────

@enrutador.get(
    "/{formulario_id}/documentos/{doc_id}/descargar",
    summary="Descargar documento adjunto",
    description="Descarga un documento adjunto perteneciente a un expediente enviado.",
    responses={404: {"description": "Documento no encontrado o eliminado"}},
)
def descargar_documento(
    formulario_id: str,
    doc_id: str,
    servicio: ExpedienteService = Depends(_obtener_servicio),
) -> FileResponse:
    ruta, nombre_archivo, content_type = servicio.resolver_documento_para_descarga(
        formulario_id, doc_id
    )
    return FileResponse(
        path=ruta,
        filename=nombre_archivo,
        media_type=content_type,
    )
