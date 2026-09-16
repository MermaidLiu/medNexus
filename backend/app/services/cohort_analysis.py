"""91 例卵巢癌队列 — Excel + 影像报告 多源相关性分析."""

from __future__ import annotations

import io
import re
import zipfile
from typing import Any

import pandas as pd

# 列名别名 → 标准字段
COLUMN_ALIASES: dict[str, list[str]] = {
    "patient_id": ["编号", "病例号", "住院号", "id", "patient_id", "patient id", "序号"],
    "name": ["姓名", "患者姓名", "name", "病人姓名"],
    "age": ["年龄", "age"],
    "figo": ["figo", "分期", "figo分期", "临床分期", "stage"],
    "ca125_baseline": ["ca125", "ca125基线", "ca125初", "ca-125", "ca125(基线)", "基线ca125"],
    "ca125_mid": ["ca125中期", "ca125化疗后", "ca125下降", "中期ca125", "ca125(中)"],
    "pci": ["pci", "pci评分", "pci总分", "pci score"],
    "hrd": ["hrd", "hrd评分", "hrd score", "hrd状态"],
    "brca": ["brca", "brca1/2", "brca状态", "brca突变"],
    "nact_cycles": ["nact周期", "化疗周期", "nact cycles", "周期数"],
    "nact_response": ["nact反应", "化疗反应", "化疗敏感性", "nact response", "敏感性", "疗效"],
    "r0": ["r0", "理想减瘤", "减瘤结果", "手术结果", "残留", "cytoreduction", "减瘤术"],
    "pfs": ["pfs", "无进展生存", "progression free"],
    "os": ["os", "总生存", "overall survival"],
}

OUTCOME_FIELDS = ["nact_response", "r0", "pfs", "os"]


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", str(s).strip().lower())


def map_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
    """将原始列名映射为标准字段名，保留未映射列."""
    col_map: dict[str, str] = {}
    used_std: set[str] = set()
    rename: dict[str, str] = {}

    for col in df.columns:
        ncol = _norm(col)
        matched = None
        for std, aliases in COLUMN_ALIASES.items():
            if std in used_std:
                continue
            for alias in aliases:
                if _norm(alias) == ncol or _norm(alias) in ncol or ncol in _norm(alias):
                    matched = std
                    break
            if matched:
                break
        if matched:
            rename[col] = matched
            col_map[matched] = str(col)
            used_std.add(matched)

    out = df.rename(columns=rename)
    return out, col_map


def _to_numeric_series(s: pd.Series) -> pd.Series:
    return pd.to_numeric(
        s.astype(str).str.replace(r"[^\d.\-]", "", regex=True).replace("", pd.NA),
        errors="coerce",
    )


def _encode_categorical(df: pd.DataFrame) -> pd.DataFrame:
    """将分类型结局/变量简单数值化以便相关性."""
    out = df.copy()
    for col in out.columns:
        if out[col].dtype == object or str(out[col].dtype) == "string":
            lowered = out[col].astype(str).str.lower()
            # 常见临床编码
            if col in ("nact_response", "r0"):
                mapping = {
                    "敏感": 1,
                    "有效": 1,
                    "yes": 1,
                    "是": 1,
                    "r0": 1,
                    "理想": 1,
                    "不确定": 0.5,
                    "部分": 0.5,
                    "耐药": 0,
                    "无效": 0,
                    "no": 0,
                    "否": 0,
                    "非r0": 0,
                    "差": 0,
                }
                encoded = lowered.map(lambda x: next((v for k, v in mapping.items() if k in x), pd.NA))
                if encoded.notna().sum() >= 3:
                    out[col] = encoded
                    continue
            if col == "hrd":
                hrd_map = {"阳性": 1, "positive": 1, "阴性": 0, "negative": 0}
                encoded = lowered.map(lambda x: next((v for k, v in hrd_map.items() if k in x), pd.NA))
                if encoded.notna().sum() >= 3:
                    out[col] = encoded
                    continue
            if col == "brca":
                brca_map = {"突变": 1, "mutated": 1, "野生": 0, "wild": 0}
                encoded = lowered.map(lambda x: next((v for k, v in brca_map.items() if k in x), pd.NA))
                if encoded.notna().sum() >= 3:
                    out[col] = encoded
                    continue
            # 尝试直接转数值
            num = _to_numeric_series(out[col])
            if num.notna().sum() >= max(3, len(out) * 0.3):
                out[col] = num
    return out


def extract_imaging_index(zip_bytes: bytes) -> list[dict[str, str]]:
    """从影像报告 ZIP 提取文件名索引."""
    items: list[dict[str, str]] = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename.split("/")[-1]
            if name.startswith(".") or name.startswith("__MACOSX"):
                continue
            base = re.sub(r"\.[^.]+$", "", name)
            items.append({"filename": name, "basename": base, "path": info.filename})
    return items


def match_imaging_to_patients(
    df: pd.DataFrame, imaging_index: list[dict[str, str]]
) -> list[dict[str, Any]]:
    """按姓名/编号模糊匹配影像报告."""
    matches: list[dict[str, Any]] = []
    id_col = "patient_id" if "patient_id" in df.columns else None
    name_col = "name" if "name" in df.columns else None

    for idx, row in df.iterrows():
        keys: list[str] = []
        if id_col and pd.notna(row.get(id_col)):
            keys.append(str(row[id_col]).strip())
        if name_col and pd.notna(row.get(name_col)):
            keys.append(str(row[name_col]).strip())
        if not keys:
            matches.append({"row": int(idx), "matched_files": [], "match_count": 0})
            continue

        found: list[str] = []
        for img in imaging_index:
            blob = f"{img['basename']} {img['filename']}"
            if any(k and k in blob for k in keys):
                found.append(img["filename"])
        matches.append({"row": int(idx), "keys": keys, "matched_files": found, "match_count": len(found)})

    return matches


def compute_correlations(df: pd.DataFrame, min_pairs: int = 8) -> dict[str, Any]:
    """Spearman 相关矩阵 + 与结局变量的 Top 相关."""
    numeric = df.select_dtypes(include="number")
    for col in df.columns:
        if col not in numeric.columns:
            num = _to_numeric_series(df[col])
            if num.notna().sum() >= min_pairs:
                numeric[col] = num

    if numeric.shape[1] < 2:
        return {"matrix": [], "variables": [], "outcome_correlations": [], "note": "数值变量不足"}

    corr = numeric.corr(method="spearman", min_periods=min_pairs)
    variables = list(corr.columns)

    matrix = []
    for i, r in enumerate(variables):
        row = []
        for j, c in enumerate(variables):
            val = corr.iloc[i, j]
            row.append(None if pd.isna(val) else round(float(val), 3))
        matrix.append(row)

    outcome_correlations: list[dict[str, Any]] = []
    for outcome in OUTCOME_FIELDS:
        if outcome not in corr.columns:
            continue
        pairs = []
        for var in variables:
            if var == outcome:
                continue
            val = corr.loc[outcome, var]
            if pd.isna(val):
                continue
            n = numeric[[outcome, var]].dropna().shape[0]
            if n < min_pairs:
                continue
            pairs.append({"variable": var, "rho": round(float(val), 3), "n": n})
        pairs.sort(key=lambda x: abs(x["rho"]), reverse=True)
        outcome_correlations.append({"outcome": outcome, "top": pairs[:8]})

    return {
        "matrix": matrix,
        "variables": variables,
        "outcome_correlations": outcome_correlations,
        "method": "spearman",
    }


def analyze_cohort(excel_bytes: bytes, zip_bytes: bytes | None = None) -> dict[str, Any]:
    """主入口：解析 Excel，可选匹配影像 ZIP，输出相关性."""
    df_raw = pd.read_excel(io.BytesIO(excel_bytes), engine="openpyxl")
    df_raw = df_raw.dropna(how="all").dropna(axis=1, how="all")
    df_mapped, col_map = map_columns(df_raw)
    df_encoded = _encode_categorical(df_mapped)

    imaging_index: list[dict[str, str]] = []
    imaging_matches: list[dict[str, Any]] = []
    if zip_bytes:
        imaging_index = extract_imaging_index(zip_bytes)
        imaging_matches = match_imaging_to_patients(df_mapped, imaging_index)

    matched_patients = sum(1 for m in imaging_matches if m.get("match_count", 0) > 0)

    preview_cols = list(df_raw.columns)[:20]
    preview = df_raw.head(5).fillna("").astype(str).to_dict(orient="records")

    correlations = compute_correlations(df_encoded)

    return {
        "n_patients": len(df_raw),
        "n_columns": len(df_raw.columns),
        "columns_raw": [str(c) for c in df_raw.columns],
        "columns_mapped": col_map,
        "preview_columns": preview_cols,
        "preview_rows": preview,
        "imaging": {
            "zip_file_count": len(imaging_index),
            "matched_patients": matched_patients,
            "match_rate": round(matched_patients / len(df_raw), 3) if len(df_raw) else 0,
            "sample_files": [x["filename"] for x in imaging_index[:10]],
            "matches": imaging_matches[:20],
        },
        "correlations": correlations,
        "model_hints": _build_model_hints(correlations, col_map),
    }


def _build_model_hints(corr: dict[str, Any], col_map: dict[str, str]) -> list[str]:
    hints: list[str] = []
    mapped = set(col_map.keys())
    if "pci" in mapped and "nact_response" in mapped:
        hints.append("PCI 与 NACT 反应均在数据中，适合作为多模态预测核心特征对。")
    if "ca125_baseline" in mapped and "ca125_mid" in mapped:
        hints.append("具备 CA125 基线/中期，可构造下降率特征纳入模型。")
    if "hrd" in mapped or "brca" in mapped:
        hints.append("含分子标志物，建议与影像 PCI 做分层相关与交互项分析。")
    if not hints:
        hints.append("建议确认 Excel 列名后重新映射；当前可先做探索性 Spearman 相关。")

    for block in corr.get("outcome_correlations", []):
        top = block.get("top") or []
        if top:
            t = top[0]
            hints.append(
                f"「{block['outcome']}」与「{t['variable']}」Spearman ρ={t['rho']}（n={t['n']}），可作为候选预测因子。"
            )
    return hints[:6]
