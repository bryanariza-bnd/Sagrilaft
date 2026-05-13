"""add_pais_departamento_funciones

Revision ID: f1a2b3c4d5e6
Revises: b2c3d4e5f6a7
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Columnas ya presentes en la BD; migración registrada para sincronizar el historial.
    op.execute("ALTER TABLE formularios ADD COLUMN IF NOT EXISTS pais_funciones VARCHAR")
    op.execute("ALTER TABLE formularios ADD COLUMN IF NOT EXISTS departamento_funciones VARCHAR")


def downgrade() -> None:
    op.drop_column('formularios', 'departamento_funciones')
    op.drop_column('formularios', 'pais_funciones')
