"""
ExpedienteService — gestión de formularios enviados para el portal interno.

Responsabilidades:
  - Listar formularios en estado no-borrador (enviados, validados, rechazados).
  - Recuperar el detalle completo de un expediente con documentos y validaciones.
  - Resolver la ruta de un documento en disco para descarga directa.
  - Aprobar o rechazar un formulario enviado (cambio de estado manual).
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from domain.excepciones import DocumentoNoEncontradoError, FormularioNoEditableError, FormularioNoEncontradoError
from infrastructure.persistencia.models import (
    DocumentoAdjunto,
    EstadoFormulario,
    Formulario,
)


_ESTADOS_EXPEDIENTE = [
    EstadoFormulario.ENVIADO,
    EstadoFormulario.VALIDADO,
    EstadoFormulario.RECHAZADO,
    EstadoFormulario.PENDIENTE_FIRMA,
    EstadoFormulario.FIRMADO,
]


class ExpedienteService:
    """
    Servicio de gestión de expedientes para el portal interno.

    Responsabilidades:
      - Listar y detallar formularios en estado no-borrador.
      - Resolver documentos adjuntos para descarga directa.
      - Aprobar o rechazar un formulario enviado (transición de estado manual).
    """

    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    # ─── Queries internas ─────────────────────────────────────────────────────

    def _consulta_expedientes(self):
        return self._sesion.query(Formulario).filter(
            Formulario.estado.in_(_ESTADOS_EXPEDIENTE)
        )

    def _buscar_formulario_expediente(self, formulario_id: str) -> Formulario:
        """
        Recupera un formulario únicamente si aplica como expediente.

        Regla: el formulario ya debió haber sido enviado (o estar en estados posteriores
        como validado/rechazado). En borrador, se comporta como "no existe" para el portal.
        """
        formulario = (
            self._sesion.query(Formulario)
            .filter(
                Formulario.id == formulario_id,
                Formulario.estado.in_(_ESTADOS_EXPEDIENTE),
            )
            .first()
        )
        if not formulario:
            raise FormularioNoEncontradoError(formulario_id)
        return formulario

    def _buscar_documento_descargable(
        self, formulario_id: str, doc_id: str
    ) -> DocumentoAdjunto | None:
        """
        Retorna el documento si y solo si pertenece a un expediente (no borrador).

        Regla de negocio: para descargar desde el portal interno, el formulario
        ya debió haber sido enviado (o estar en estados posteriores como validado/rechazado).
        """
        return (
            self._sesion.query(DocumentoAdjunto)
            .join(Formulario, Formulario.id == DocumentoAdjunto.formulario_id)
            .filter(
                DocumentoAdjunto.id == doc_id,
                DocumentoAdjunto.formulario_id == formulario_id,
                DocumentoAdjunto.deleted_at.is_(None),
                Formulario.estado.in_(_ESTADOS_EXPEDIENTE),
            )
            .first()
        )

    def _conteos_documentos_por_formulario(self, ids_formularios: list[str]) -> dict[str, int]:
        """Cuenta documentos activos en una sola query GROUP BY — evita N+1."""
        filas = (
            self._sesion.query(
                DocumentoAdjunto.formulario_id,
                func.count(DocumentoAdjunto.id).label("total"),
            )
            .filter(
                DocumentoAdjunto.formulario_id.in_(ids_formularios),
                DocumentoAdjunto.deleted_at.is_(None),
            )
            .group_by(DocumentoAdjunto.formulario_id)
            .all()
        )
        return {fila.formulario_id: fila.total for fila in filas}

    # ─── Serialización ────────────────────────────────────────────────────────

    def _serializar_resumen(self, formulario: Formulario, cantidad_documentos: int) -> Dict[str, Any]:
        return {
            "formulario_id":         formulario.id,
            "codigo_peticion":       formulario.codigo_peticion,
            "razon_social":          formulario.razon_social,
            "numero_identificacion": formulario.numero_identificacion,
            "tipo_contraparte":      formulario.tipo_contraparte,
            "tipo_persona":          formulario.tipo_persona,
            "estado":                formulario.estado,
            "cantidad_documentos":   cantidad_documentos,
            "created_at":            formulario.created_at,
            "updated_at":            formulario.updated_at,
        }

    # ─── Listado ──────────────────────────────────────────────────────────────

    def listar_expedientes(
        self,
        tipo_contraparte: Optional[str] = None,
        busqueda: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retorna todos los formularios no-borrador ordenados por fecha de actualización.

        Acepta filtros opcionales: tipo_contraparte ('cliente'/'proveedor') y búsqueda
        de texto libre en razón social y código de petición (case-insensitive).
        """
        consulta = self._consulta_expedientes()

        if tipo_contraparte:
            consulta = consulta.filter(
                Formulario.tipo_contraparte == tipo_contraparte.lower()
            )
        if busqueda:
            termino = f"%{busqueda.strip()}%"
            consulta = consulta.filter(
                or_(
                    Formulario.razon_social.ilike(termino),
                    Formulario.codigo_peticion.ilike(termino),
                )
            )

        formularios = consulta.order_by(Formulario.updated_at.desc()).all()
        conteos     = self._conteos_documentos_por_formulario([f.id for f in formularios])
        return [self._serializar_resumen(f, conteos.get(f.id, 0)) for f in formularios]

    # ─── Detalle ──────────────────────────────────────────────────────────────

    def obtener_expediente(self, formulario_id: str) -> Dict[str, Any]:
        """
        Recupera los metadatos del expediente y sus documentos adjuntos.

        Devuelve únicamente los campos que el portal necesita para la vista de detalle.
        Los datos del formulario (financieros, tributarios, etc.) no se exponen aquí —
        están disponibles exclusivamente en el PDF descargable.

        Lanza FormularioNoEncontradoError si el formulario no existe o está en borrador.
        """
        formulario = self._buscar_formulario_expediente(formulario_id)

        documentos = (
            self._sesion.query(DocumentoAdjunto)
            .filter(
                DocumentoAdjunto.formulario_id == formulario_id,
                DocumentoAdjunto.deleted_at.is_(None),
            )
            .order_by(DocumentoAdjunto.created_at)
            .all()
        )

        return {
            "formulario_id":    formulario.id,
            "codigo_peticion":  formulario.codigo_peticion,
            "razon_social":     formulario.razon_social,
            "tipo_contraparte": formulario.tipo_contraparte,
            "estado":           formulario.estado,
            "updated_at":       formulario.updated_at,
            "documentos": [
                {
                    "id":             doc.id,
                    "tipo_documento": doc.tipo_documento,
                    "nombre_archivo": doc.nombre_archivo,
                    "tamano":         doc.tamano,
                }
                for doc in documentos
            ],
        }

    # ─── Aprobación / Rechazo ─────────────────────────────────────────────────

    def aprobar_expediente(self, formulario_id: str) -> Dict[str, Any]:
        """Cambia el estado de ENVIADO a VALIDADO (aprobación manual del portal interno)."""
        formulario = self._buscar_formulario_expediente(formulario_id)
        if formulario.estado != EstadoFormulario.ENVIADO:
            raise FormularioNoEditableError(
                f"Solo se puede aprobar un formulario en estado 'enviado' (actual: '{formulario.estado}')."
            )
        formulario.estado = EstadoFormulario.VALIDADO
        self._sesion.commit()
        return {"estado": formulario.estado}

    def rechazar_expediente(self, formulario_id: str) -> Dict[str, Any]:
        """Cambia el estado de ENVIADO o VALIDADO a RECHAZADO."""
        formulario = self._buscar_formulario_expediente(formulario_id)
        if formulario.estado not in (EstadoFormulario.ENVIADO, EstadoFormulario.VALIDADO):
            raise FormularioNoEditableError(
                f"Solo se puede rechazar un formulario en estado 'enviado' o 'validado' (actual: '{formulario.estado}')."
            )
        formulario.estado = EstadoFormulario.RECHAZADO
        self._sesion.commit()
        return {"estado": formulario.estado}

    # ─── Descarga ─────────────────────────────────────────────────────────────

    def resolver_documento_para_descarga(
        self, formulario_id: str, doc_id: str
    ) -> tuple[Path, str, str]:
        """
        Verifica que el documento pertenece al expediente y devuelve su ruta en disco.

        Returns:
            (ruta_archivo, nombre_archivo, content_type)

        Lanza DocumentoNoEncontradoError si el documento no existe, fue eliminado
        o el archivo ya no está en disco.
        """
        documento = self._buscar_documento_descargable(formulario_id, doc_id)
        if not documento:
            raise DocumentoNoEncontradoError(formulario_id, doc_id)

        ruta = Path(documento.ruta_archivo)
        if not ruta.exists():
            raise DocumentoNoEncontradoError(formulario_id, doc_id)

        content_type = documento.content_type or "application/octet-stream"
        return ruta, documento.nombre_archivo, content_type
