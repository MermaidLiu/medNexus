from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.cohort_analysis import _build_model_hints, _encode_categorical, compute_correlations
from app.services.cohort_import import parse_excel_to_patients, patients_to_dataframe
from app.services import cohort_store

router = APIRouter(prefix="/api/v1/cohort", tags=["cohort"])


class PatientPatch(BaseModel):
    patient_id: str | None = None
    name: str | None = None
    age: str | None = None
    figo: str | None = None
    ca125_baseline: str | None = None
    ca125_mid: str | None = None
    pci: str | None = None
    hrd: str | None = None
    brca: str | None = None
    nact_cycles: str | None = None
    nact_response: str | None = None
    r0: str | None = None
    pfs: str | None = None
    os: str | None = None
    extra: dict[str, str] | None = None


@router.get("/meta")
async def cohort_meta() -> dict:
    return cohort_store.get_meta()


@router.get("/patients")
async def list_patients() -> dict:
    patients = cohort_store.list_patients()
    meta = cohort_store.get_meta()
    return {**meta, "patients": patients}


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str) -> dict:
    p = cohort_store.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="病例不存在")
    return p


@router.patch("/patients/{patient_id}")
async def patch_patient(patient_id: str, body: PatientPatch) -> dict:
    patch = body.model_dump(exclude_unset=True)
    updated = cohort_store.update_patient(patient_id, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="病例不存在")
    return updated


@router.post("/import")
async def import_excel(
    excel: UploadFile = File(...),
    mode: str = Form("replace"),
) -> dict:
    if not excel.filename or not excel.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="请上传 .xlsx / .xls 文件")

    excel_bytes = await excel.read()
    if not excel_bytes:
        raise HTTPException(status_code=400, detail="Excel 文件为空")

    if mode not in ("replace", "append"):
        raise HTTPException(status_code=400, detail="mode 须为 replace 或 append")

    try:
        parsed = parse_excel_to_patients(excel_bytes)
        result = cohort_store.import_patients(
            parsed["patients"],
            columns_raw=parsed["columns_raw"],
            columns_mapped=parsed["columns_mapped"],
            source_file=excel.filename,
            mode=mode,
        )
        return {
            **result,
            "columns_raw": parsed["columns_raw"],
            "columns_mapped": parsed["columns_mapped"],
            "patients": cohort_store.list_patients(),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"导入失败: {exc}") from exc


@router.get("/correlations")
async def cohort_correlations() -> dict:
    patients = cohort_store.list_patients()
    if len(patients) < 3:
        raise HTTPException(status_code=400, detail="队列病例不足，请先导入 Excel")

    df = patients_to_dataframe(patients)
    df_encoded = _encode_categorical(df)
    correlations = compute_correlations(df_encoded)
    meta = cohort_store.get_meta()
    hints = _build_model_hints(correlations, meta.get("columns_mapped", {}))

    return {
        "n_patients": len(patients),
        "columns_mapped": meta.get("columns_mapped", {}),
        "correlations": correlations,
        "model_hints": hints,
    }


@router.delete("/patients")
async def clear_cohort() -> dict:
    cohort_store.delete_all()
    return {"ok": True}
