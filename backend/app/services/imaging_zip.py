from __future__ import annotations

import io
import logging
import zipfile
from pathlib import PurePosixPath

logger = logging.getLogger(__name__)

SKIP_PARTS = {"__macosx", ".ds_store", "thumbs.db"}


def _has_dicom_magic(data: bytes) -> bool:
    return len(data) >= 132 and data[128:132] == b"DICM"


def _is_dicom_filename(name: str) -> bool:
    lower = name.lower()
    return lower.endswith(".dcm") or lower.endswith(".dicom")


def _should_skip_path(path: str) -> bool:
    parts = PurePosixPath(path).parts
    return any(part.lower() in SKIP_PARTS for part in parts)


def _unique_entry_name(path: str) -> str:
    normalized = path.replace("\\", "/").strip("/")
    if "/" not in normalized:
        return PurePosixPath(normalized).name
    return normalized.replace("/", "__")


def extract_dicom_files_from_zip(zip_bytes: bytes) -> list[tuple[str, bytes]]:
    dicom_files: list[tuple[str, bytes]] = []

    try:
        archive = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile as exc:
        raise ValueError("ZIP 文件损坏或不完整，请重新打包后上传") from exc

    with archive:
        for info in archive.infolist():
            if info.is_dir() or _should_skip_path(info.filename):
                continue

            basename = PurePosixPath(info.filename).name
            if not basename:
                continue

            lower = basename.lower()
            if lower.endswith((".txt", ".xml", ".json", ".html", ".md")):
                continue

            data = archive.read(info)
            if _is_dicom_filename(basename) or _has_dicom_magic(data):
                dicom_files.append((_unique_entry_name(info.filename), data))

    return dicom_files
