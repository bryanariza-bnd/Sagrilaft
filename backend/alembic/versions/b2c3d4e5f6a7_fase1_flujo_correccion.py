"""fase1_flujo_correccion

Stub de recuperación: esta migración fue aplicada a la BD pero el archivo
se perdió del repositorio. Los cambios (campos_a_corregir, motivo_devolucion,
numero_correccion) ya están presentes en la base de datos.

Revision ID: b2c3d4e5f6a7
Revises: c3f1a2b4d5e6
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'c3f1a2b4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
