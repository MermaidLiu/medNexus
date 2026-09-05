from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.services.imaging_zip import extract_dicom_files_from_zip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/imaging", tags=["imaging"])


def _upstream_error_detail(resp: httpx.Response) -> str:
    text = (resp.text or "").strip()
    if not text:
        return f"CT 分析服务错误 ({resp.status_code})"
    try:
        payload = resp.json()
        detail = payload.get("detail")
        if isinstance(detail, str) and detail.strip():
            return detail.strip()
        if isinstance(detail, list):
            parts = [str(item.get("msg", item)) for item in detail if item]
            if parts:
                return "；".join(parts)
        message = payload.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
    except Exception:
        pass
    return text[:400]


@router.get("/health")
async def imaging_health() -> dict:
    url = f"{settings.imaging_api_url.rstrip('/')}/health"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            payload = resp.json()
            upstream_ok = payload.get("status") == "ok"
            return {
                "status": "ok",
                "upstreamOnline": upstream_ok,
                "upstream": payload,
            }
    except Exception as exc:
        logger.warning("CT upstream health check failed: %s", exc)
        return {
            "status": "ok",
            "upstreamOnline": False,
            "upstreamError": str(exc),
        }


@router.post("/upload-zip")
async def upload_imaging_zip(file: UploadFile = File(...)) -> dict:
    filename = (file.filename or "").lower()
    if not filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="请上传 .zip 压缩包")

    try:
        zip_bytes = await file.read()
        if not zip_bytes:
            raise HTTPException(status_code=400, detail="ZIP 文件为空")

        try:
            dicom_files = extract_dicom_files_from_zip(zip_bytes)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if not dicom_files:
            raise HTTPException(
                status_code=400,
                detail="ZIP 中未找到有效 DICOM 文件，请确认压缩包内为 .dcm 或标准 DICOM 序列",
            )

        logger.info("imaging upload: zip=%s bytes=%d dicom_count=%d", filename, len(zip_bytes), len(dicom_files))

        upload_url = f"{settings.imaging_api_url.rstrip('/')}/ct-module/dicom/upload"
        multipart_files = [
            ("files", (name, content, "application/dicom")) for name, content in dicom_files
        ]
        form_data = {"runPci": "true"}

        async with httpx.AsyncClient(timeout=settings.imaging_api_timeout) as client:
            resp = await client.post(upload_url, files=multipart_files, data=form_data)

        if resp.status_code >= 400:
            detail = _upstream_error_detail(resp)
            logger.warning("imaging upstream error %s: %s", resp.status_code, detail)
            raise HTTPException(status_code=resp.status_code, detail=detail)

        return resp.json()
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="CT 分析超时，请稍后重试") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CT 分析服务请求失败: {exc}") from exc
    except Exception as exc:
        logger.exception("imaging upload failed")
        raise HTTPException(status_code=500, detail=f"影像分析失败: {exc}") from exc
