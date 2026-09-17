"""Resumable Chunked Media Upload Integration Tests

Validates chunked underground photo uploads, staging directory lifecycle,
multi-chunk binary stitching on disk, and InspectionEvidence database creation.
"""

import os
from pathlib import Path
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sync_log import InspectionEvidence


@pytest.mark.asyncio
async def test_chunked_upload_full_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """Verifies complete upload lifecycle: init -> chunk 0 -> chunk 1 -> chunk 2 -> final assembly."""
    chunk_0_data = b"RIFF" + b"\x00" * 496      # 500 bytes
    chunk_1_data = b"WEBPVP8 " + b"\x01" * 492  # 500 bytes
    chunk_2_data = b"\x02" * 500                # 500 bytes
    total_bytes = len(chunk_0_data) + len(chunk_1_data) + len(chunk_2_data)  # 1500 bytes

    # 1. Initialize upload session
    init_payload = {
        "file_name": "roof_fracture_panel_4.webp",
        "total_chunks": 3,
        "file_size_bytes": total_bytes,
    }
    init_res = await client.post("/api/v1/sync/upload-evidence/init", json=init_payload)
    assert init_res.status_code == 201
    init_data = init_res.json()
    upload_token = init_data["upload_token"]
    assert init_data["total_chunks"] == 3

    # 2. Upload Chunk 0
    c0_res = await client.put(
        f"/api/v1/sync/upload-evidence/{upload_token}/chunk",
        params={"chunk_index": 0},
        content=chunk_0_data,
        headers={"Content-Type": "application/octet-stream"},
    )
    assert c0_res.status_code == 200
    c0_data = c0_res.json()
    assert c0_data["upload_completed"] is False
    assert c0_data["chunks_received"] == 1

    # 3. Upload Chunk 1
    c1_res = await client.put(
        f"/api/v1/sync/upload-evidence/{upload_token}/chunk",
        params={"chunk_index": 1},
        content=chunk_1_data,
        headers={"Content-Type": "application/octet-stream"},
    )
    assert c1_res.status_code == 200
    c1_data = c1_res.json()
    assert c1_data["upload_completed"] is False
    assert c1_data["chunks_received"] == 2

    # 4. Upload Chunk 2 (Final chunk -> triggers assembly)
    c2_res = await client.put(
        f"/api/v1/sync/upload-evidence/{upload_token}/chunk",
        params={"chunk_index": 2},
        content=chunk_2_data,
        headers={"Content-Type": "application/octet-stream"},
    )
    assert c2_res.status_code == 200
    c2_data = c2_res.json()
    assert c2_data["upload_completed"] is True
    assert c2_data["chunks_received"] == 3
    assert c2_data["evidence_id"] is not None
    assert c2_data["file_path"] is not None

    # Verify assembled file exists and size matches
    assembled_file = Path(c2_data["file_path"])
    assert assembled_file.exists()
    assert assembled_file.stat().st_size == total_bytes

    # Verify InspectionEvidence record in database
    evidence_id = uuid.UUID(c2_data["evidence_id"])
    e_stmt = select(InspectionEvidence).where(InspectionEvidence.id == evidence_id)
    e_res = await db_session.execute(e_stmt)
    evidence = e_res.scalar_one_or_none()

    assert evidence is not None
    assert evidence.upload_completed is True
    assert evidence.file_size_bytes == total_bytes
    assert evidence.mime_type == "image/webp"

    # Cleanup test media artifact
    try:
        assembled_file.unlink()
    except Exception:
        pass


@pytest.mark.asyncio
async def test_chunked_upload_invalid_chunk_index(client: AsyncClient):
    """Verifies that out-of-bounds chunk index returns HTTP 400."""
    init_res = await client.post(
        "/api/v1/sync/upload-evidence/init",
        json={"file_name": "test.webp", "total_chunks": 2, "file_size_bytes": 100},
    )
    upload_token = init_res.json()["upload_token"]

    # Send index 5 when total_chunks = 2 (valid indices: 0, 1)
    res = await client.put(
        f"/api/v1/sync/upload-evidence/{upload_token}/chunk",
        params={"chunk_index": 5},
        content=b"invalid_chunk",
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_chunked_upload_invalid_upload_token(client: AsyncClient):
    """Verifies that invalid or expired upload tokens return HTTP 404."""
    res = await client.put(
        "/api/v1/sync/upload-evidence/non_existent_token_999/chunk",
        params={"chunk_index": 0},
        content=b"test_chunk",
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_chunked_upload_empty_body_fails(client: AsyncClient):
    """Verifies that empty chunk byte payloads return HTTP 400."""
    init_res = await client.post(
        "/api/v1/sync/upload-evidence/init",
        json={"file_name": "test_empty.webp", "total_chunks": 1, "file_size_bytes": 50},
    )
    upload_token = init_res.json()["upload_token"]

    res = await client.put(
        f"/api/v1/sync/upload-evidence/{upload_token}/chunk",
        params={"chunk_index": 0},
        content=b"",
    )
    assert res.status_code == 400
