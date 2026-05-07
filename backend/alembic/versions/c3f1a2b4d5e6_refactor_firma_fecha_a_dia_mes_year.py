"""refactor firma: fecha_firma -> dia/mes/year; eliminar nombre_firma

Revision ID: c3f1a2b4d5e6
Revises: ed8fe2b9a6b2
Create Date: 2026-05-07

Motivo:
- fecha_firma (String) se descompone en dia_firma, mes_firma, year_firma (Integer)
  para el texto narrativo "a los DD dias del mes de MMMM de AAAA".
- nombre_firma se elimina: el nombre del firmante se toma de nombre_representante
  (Paso 3); el campo quedo huerfano sin consumidor en frontend ni en firma_service.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f1a2b4d5e6"
down_revision: Union[str, Sequence[str], None] = "ed8fe2b9a6b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("formularios", sa.Column("dia_firma",  sa.Integer(), nullable=True))
    op.add_column("formularios", sa.Column("mes_firma",  sa.Integer(), nullable=True))
    op.add_column("formularios", sa.Column("year_firma", sa.Integer(), nullable=True))
    op.drop_column("formularios", "fecha_firma")
    op.drop_column("formularios", "nombre_firma")


def downgrade() -> None:
    op.add_column("formularios", sa.Column("nombre_firma", sa.String(), nullable=True))
    op.add_column("formularios", sa.Column("fecha_firma",  sa.String(), nullable=True))
    op.drop_column("formularios", "year_firma")
    op.drop_column("formularios", "mes_firma")
    op.drop_column("formularios", "dia_firma")
