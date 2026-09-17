"""Resumable Chunked Media Upload Service

Handles Tus.io-style chunked byte uploads for compressed WebP photos and strata evidence
captured underground during offline inspections. Assembles chunks on disk and creates
InspectionEvidence records linked to Form IV inspections.
"""

from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
from typing import Dict, Optional, Set
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.sync_log import FormIVInspection, InspectionEvidence
from app.schemas.sync import (
    ChunkUploadInit,
    ChunkUploadInitResponse,
    ChunkUploadProgressResponse,
)

logger = logging.getLogger("coalguard.upload")


class UploadService:
    """Manages chunked resumable file upload sessions and final assembly."""

    @classmethod
    def _get_staging_dir(cls, upload_token: str) -> Path:
        base_dir = Path(settings.UPLOAD_DIR) / "chunks" / upload_token
        base_dir.mkdir(parents=True, exist_ok=True)
        return base_dir

    @classmethod
    def _get_media_dir(cls) -> Path:
        media_dir = Path(settings.UPLOAD_DIR) / "media"
        media_dir.mkdir(parents=True, exist_ok=True)
        return media_dir

    @classmethod
    async def init_upload(
        cls,
        db: AsyncSession,
        payload: ChunkUploadInit,
    ) -> ChunkUploadInitResponse:
        """Initializes a resumable chunk upload session and stages temporary directory."""
        if payload.inspection_id is not None:
            stmt = select(FormIVInspection).where(FormIVInspection.id == payload.inspection_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Form IV Inspection #{payload.inspection_id} does not exist.",
                )

        upload_token = uuid.uuid4().hex
        staging_dir = cls._get_staging_dir(upload_token)

        meta = {
            "upload_token": upload_token,
            "file_name": payload.file_name,
            "total_chunks": payload.total_chunks,
            "file_size_bytes": payload.file_size_bytes,
            "inspection_id": str(payload.inspection_id) if payload.inspection_id else None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        meta_file = staging_dir / "session.json"
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(meta, f)

        logger.info(
            f"[UPLOAD INIT] Session initialized (Token: {upload_token}, "
            f"File: {payload.file_name}, Chunks: {payload.total_chunks})"
        )

        return ChunkUploadInitResponse(
            upload_token=upload_token,
            chunk_size_recommended=524288,  # 512 KB
            total_chunks=payload.total_chunks,
            status="INITIALIZED",
        )

    @classmethod
    async def save_chunk(
        cls,
        db: AsyncSession,
        upload_token: str,
        chunk_index: int,
        chunk_data: bytes,
    ) -> ChunkUploadProgressResponse:
        """Saves a binary chunk; if all chunks are received, stitches final image."""
        staging_dir = Path(settings.UPLOAD_DIR) / "chunks" / upload_token
        meta_file = staging_dir / "session.json"

        if not staging_dir.exists() or not meta_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Upload session with token '{upload_token}' not found or expired.",
            )

        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)

        total_chunks = meta["total_chunks"]
        if chunk_index < 0 or chunk_index >= total_chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid chunk_index {chunk_index}. Must be between 0 and {total_chunks - 1}.",
            )

        # Write chunk part
        chunk_file = staging_dir / f"chunk_{chunk_index:05d}.part"
        with open(chunk_file, "wb") as f:
            f.write(chunk_data)

        # Determine how many chunks have been saved so far
        existing_chunks = list(staging_dir.glob("chunk_*.part"))
        chunks_received = len(existing_chunks)

        # If not all chunks received yet, report progress
        if chunks_received < total_chunks:
            return ChunkUploadProgressResponse(
                upload_token=upload_token,
                chunks_received=chunks_received,
                total_chunks=total_chunks,
                upload_completed=False,
                evidence_id=None,
                file_path=None,
            )

        # All chunks received -> Assemble final file
        sanitized_name = Path(meta["file_name"]).name
        final_filename = f"{upload_token}_{sanitized_name}"
        final_path = cls._get_media_dir() / final_filename

        with open(final_path, "wb") as outfile:
            for idx in range(total_chunks):
                part_path = staging_dir / f"chunk_{idx:05d}.part"
                if not part_path.exists():
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Missing chunk #{idx} during assembly.",
                    )
                with open(part_path, "rb") as infile:
                    outfile.write(infile.read())

        # Cleanup temporary chunk parts and session file
        try:
            for part_path in staging_dir.glob("*"):
                part_path.unlink()
            staging_dir.rmdir()
        except Exception as exc:
            logger.warning(f"Error cleaning staging directory {staging_dir}: {exc}")

        # Persist InspectionEvidence in database
        actual_size = os.path.getsize(final_path)
        inspection_id = uuid.UUID(meta["inspection_id"]) if meta.get("inspection_id") else None

        evidence = InspectionEvidence(
            id=uuid.uuid4(),
            inspection_id=inspection_id,
            file_path=str(final_path.as_posix()),
            file_size_bytes=actual_size,
            mime_type="image/webp",
            upload_completed=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(evidence)
        await db.commit()
        await db.refresh(evidence)

        logger.info(
            f"[UPLOAD ASSEMBLED] Final media assembled at '{final_path}' "
            f"({actual_size} bytes). Evidence record #{evidence.id} created."
        )

        return ChunkUploadProgressResponse(
            upload_token=upload_token,
            chunks_received=total_chunks,
            total_chunks=total_chunks,
            upload_completed=True,
            evidence_id=evidence.id,
            file_path=str(final_path.as_posix()),
        )
