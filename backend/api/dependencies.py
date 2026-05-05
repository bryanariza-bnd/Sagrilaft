"""
Dependencias FastAPI compartidas entre routers.

Centraliza los factories de servicios que necesitan Request + Session para
evitar duplicar la misma función en múltiples routers.
"""

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from infrastructure.persistencia.database import get_db
from services.firma.firma_service import FirmaService


def obtener_servicio_firma(
    request: Request,
    sesion: Session = Depends(get_db),
) -> FirmaService:
    config = request.app.state.config
    return FirmaService(
        sesion=sesion,
        zoho=request.app.state.zoho_sign,
        upload_dir=config.upload_dir,
        webhook_secret=config.zoho_sign.webhook_secret,
    )
