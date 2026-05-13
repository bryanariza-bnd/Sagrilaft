"""
Dependencias FastAPI compartidas entre routers.

Centraliza los factories de servicios que necesitan Request + Session para
evitar duplicar la misma función en múltiples routers.
"""

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from core.configuracion import AppConfig
from infrastructure.persistencia.database import get_db
from infrastructure.dependencies import obtener_config
from services.acceso_manual.acceso_manual_service import AccesoManualService
from services.firma.firma_service import FirmaService
from services.notificaciones.email_service import EmailService


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


def obtener_servicio_acceso(
    sesion: Session = Depends(get_db),
    config: AppConfig = Depends(obtener_config),
) -> AccesoManualService:
    return AccesoManualService(sesion, config.frontend_urls[0])


def obtener_servicio_email(
    config: AppConfig = Depends(obtener_config),
) -> EmailService:
    return EmailService(config.smtp)
