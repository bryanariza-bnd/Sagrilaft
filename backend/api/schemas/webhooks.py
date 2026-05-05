from pydantic import BaseModel


class _ZohoNotificacion(BaseModel):
    secret_token: str = ""
    operation_type: str = ""


class _ZohoRequests(BaseModel):
    request_id: str = ""
    request_status: str = ""


class ZohoWebhookPayload(BaseModel):
    """Payload recibido en el webhook de ZohoSign."""
    notifications: _ZohoNotificacion = _ZohoNotificacion()
    requests: _ZohoRequests = _ZohoRequests()
