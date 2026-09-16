"""Excel → 结构化病例记录."""

from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from app.services.cohort_analysis import COLUMN_ALIASES, map_columns

STANDARD_FIELDS = list(COLUMN_ALIASES.keys())


def _cell_str(v: Any) -> str | None:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none", "nat") else None


def parse_excel_to_patients(excel_bytes: bytes) -> dict[str, Any]:
    """解析 Excel，返回病例列表与列元信息."""
    df_raw = pd.read_excel(io.BytesIO(excel_bytes), engine="openpyxl")
    df_raw = df_raw.dropna(how="all").dropna(axis=1, how="all")
    df_mapped, col_map = map_columns(df_raw)

    # 未映射列保留在 extra
    mapped_raw_cols = set(col_map.values())
    extra_cols = [c for c in df_raw.columns if str(c) not in mapped_raw_cols]

    patients: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()

    for idx, row in df_mapped.iterrows():
        raw_row = df_raw.iloc[idx]
        record: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "sourceRow": int(idx) + 2,  # Excel 行号（含表头）
            "importedAt": now,
            "updatedAt": now,
        }
        extra: dict[str, str] = {}

        for std in STANDARD_FIELDS:
            if std in df_mapped.columns:
                record[std] = _cell_str(row.get(std))

        for col in extra_cols:
            val = _cell_str(raw_row.get(col))
            if val is not None:
                extra[str(col)] = val

        record["extra"] = extra
        patients.append(record)

    return {
        "patients": patients,
        "columns_raw": [str(c) for c in df_raw.columns],
        "columns_mapped": col_map,
        "imported_count": len(patients),
    }


def patients_to_dataframe(patients: list[dict[str, Any]]) -> pd.DataFrame:
    """病例列表 → DataFrame（含 extra 字段展开）."""
    rows: list[dict[str, Any]] = []
    for p in patients:
        row: dict[str, Any] = {}
        for std in STANDARD_FIELDS:
            if p.get(std) is not None:
                row[std] = p[std]
        for k, v in (p.get("extra") or {}).items():
            row[k] = v
        rows.append(row)
    return pd.DataFrame(rows)
