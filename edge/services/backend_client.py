"""HTTP Client for Coal Guard Surface Gateway REST Endpoints

Handles worker statutory credential arbitration and access event ingestion:
- GET  /api/v1/auth/workers/{rfid_tag}/eligibility
- POST /api/v1/vision-edge/events/access-attempt
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
import uuid
import httpx

logger = logging.getLogger("edge.services.backend_client")


class BackendClient:
    """REST Client for communicating with the Coal Guard surface backend."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000/api/v1",
        timeout: float = 5.0,
        simulation_mode: bool = False,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.simulation_mode = simulation_mode
        self._sync_client: Optional[httpx.Client] = None
        self._async_client: Optional[httpx.AsyncClient] = None

    def _get_sync_client(self) -> httpx.Client:
        if self._sync_client is None or self._sync_client.is_closed:
            self._sync_client = httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
        return self._sync_client

    async def _get_async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
        return self._async_client

    # ---------------------------------------------------------
    # Worker Eligibility Checks
    # ---------------------------------------------------------
    def check_worker_eligibility(self, rfid_tag: str) -> Dict[str, Any]:
        """Synchronously query worker statutory eligibility from surface backend.

        Args:
            rfid_tag: Scanned worker RFID tag identifier.

        Returns:
            Dict containing 'eligible', 'worker_name', 'reason', 'vtc_valid', 'pme_valid'.
        """
        client = self._get_sync_client()
        url = f"/auth/workers/{rfid_tag}/eligibility"
        try:
            logger.info("[BackendClient] Querying eligibility for badge: %s", rfid_tag)
            response = client.get(url)
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    "[BackendClient] Eligibility resolved for %s (%s): eligible=%s, reason=%s",
                    rfid_tag,
                    data.get("worker_name", "Unknown"),
                    data.get("eligible", False),
                    data.get("reason", "N/A"),
                )
                return data
            elif response.status_code == 404:
                logger.warning("[BackendClient] Worker badge not registered: %s (404)", rfid_tag)
                if self.simulation_mode:
                    return self._simulate_worker_eligibility(rfid_tag)
                return {
                    "eligible": False,
                    "reason": "Unregistered RFID Badge: Worker not found in mine registry",
                    "worker_name": "Unregistered Worker",
                    "vtc_valid": False,
                    "pme_valid": False,
                    "rfid_tag": rfid_tag,
                }
            else:
                logger.error("[BackendClient] Eligibility query returned HTTP %d: %s", response.status_code, response.text)
                if self.simulation_mode:
                    logger.info("[BackendClient] Utilizing simulated eligibility fallback for badge: %s", rfid_tag)
                    return self._simulate_worker_eligibility(rfid_tag)
                return {
                    "eligible": False,
                    "reason": f"Statutory server returned HTTP {response.status_code}",
                    "worker_name": "Unknown",
                    "vtc_valid": False,
                    "pme_valid": False,
                    "rfid_tag": rfid_tag,
                }
        except httpx.RequestError as exc:
            logger.error("[BackendClient] Network failure checking eligibility for %s: %s", rfid_tag, exc)
            if self.simulation_mode:
                logger.info("[BackendClient] Utilizing simulated eligibility fallback for badge: %s", rfid_tag)
                return self._simulate_worker_eligibility(rfid_tag)
            return {
                "eligible": False,
                "reason": "Surface network offline: Fail-secure interlock engaged",
                "worker_name": "Network Unavailable",
                "vtc_valid": False,
                "pme_valid": False,
                "rfid_tag": rfid_tag,
            }

    async def check_worker_eligibility_async(self, rfid_tag: str) -> Dict[str, Any]:
        """Asynchronously query worker statutory eligibility from surface backend."""
        client = await self._get_async_client()
        url = f"/auth/workers/{rfid_tag}/eligibility"
        try:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                if self.simulation_mode:
                    return self._simulate_worker_eligibility(rfid_tag)
                return {
                    "eligible": False,
                    "reason": "Unregistered RFID Badge: Worker not found in mine registry",
                    "worker_name": "Unregistered Worker",
                    "vtc_valid": False,
                    "pme_valid": False,
                    "rfid_tag": rfid_tag,
                }
            else:
                if self.simulation_mode:
                    return self._simulate_worker_eligibility(rfid_tag)
                return {
                    "eligible": False,
                    "reason": f"Statutory server returned HTTP {response.status_code}",
                    "worker_name": "Unknown",
                    "vtc_valid": False,
                    "pme_valid": False,
                    "rfid_tag": rfid_tag,
                }
        except httpx.RequestError as exc:
            if self.simulation_mode:
                return self._simulate_worker_eligibility(rfid_tag)
            return {
                "eligible": False,
                "reason": f"Surface network offline: {exc}",
                "worker_name": "Network Unavailable",
                "vtc_valid": False,
                "pme_valid": False,
                "rfid_tag": rfid_tag,
            }

    # ---------------------------------------------------------
    # Access Attempt Event Ingestion
    # ---------------------------------------------------------
    def send_access_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronously transmit post-turnstile actuation metadata to backend.

        Args:
            payload: Dict conforming to EdgeAccessEventPayload schema.

        Returns:
            Dict containing backend response (e.g. access_log_id, violation_ticket_created).
        """
        client = self._get_sync_client()
        url = "/vision-edge/events/access-attempt"
        try:
            logger.info(
                "[BackendClient] Dispatched access event: rfid=%s, optical=%s, gate=%s",
                payload.get("rfid_tag"),
                payload.get("optical_compliance"),
                payload.get("gate_actuated"),
            )
            response = client.post(url, json=payload)
            if response.status_code in (200, 201):
                data = response.json()
                logger.info(
                    "[BackendClient] Access event logged: id=%s, ticket_created=%s",
                    data.get("access_log_id"),
                    data.get("violation_ticket_created"),
                )
                return data
            else:
                logger.error("[BackendClient] Event ingestion failed (HTTP %d): %s", response.status_code, response.text)
                if self.simulation_mode:
                    logger.info("[BackendClient] Utilizing simulated access event response fallback.")
                    return self._simulate_access_event_response(payload)
                return {
                    "status": "error",
                    "error": response.text,
                    "status_code": response.status_code,
                }
        except httpx.RequestError as exc:
            logger.error("[BackendClient] Network error posting access event: %s", exc)
            if self.simulation_mode:
                logger.info("[BackendClient] Utilizing simulated access event response fallback.")
                return self._simulate_access_event_response(payload)
            return {
                "status": "network_error",
                "error": str(exc),
            }

    async def send_access_event_async(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Asynchronously transmit post-turnstile actuation metadata to backend."""
        client = await self._get_async_client()
        url = "/vision-edge/events/access-attempt"
        try:
            response = await client.post(url, json=payload)
            if response.status_code in (200, 201):
                return response.json()
            if self.simulation_mode:
                return self._simulate_access_event_response(payload)
            return {
                "status": "error",
                "error": response.text,
                "status_code": response.status_code,
            }
        except httpx.RequestError as exc:
            if self.simulation_mode:
                return self._simulate_access_event_response(payload)
            return {
                "status": "network_error",
                "error": str(exc),
            }

    def _simulate_worker_eligibility(self, rfid_tag: str) -> Dict[str, Any]:
        """Provide realistic simulated worker credential arbitration."""
        tag_up = rfid_tag.upper()
        if "EXPIRED" in tag_up or "DENIED" in tag_up or "INVALID" in tag_up:
            return {
                "eligible": False,
                "reason": "Vocational Training Certificate (VTC) expired under CMR 2017",
                "worker_name": "Deepak Verma (Simulated)",
                "vtc_valid": False,
                "pme_valid": True,
                "rfid_tag": rfid_tag,
            }
        elif "UNREGISTERED" in tag_up or "UNKNOWN" in tag_up:
            return {
                "eligible": False,
                "reason": "Unregistered RFID Badge: Worker not found in mine registry",
                "worker_name": "Unregistered Worker",
                "vtc_valid": False,
                "pme_valid": False,
                "rfid_tag": rfid_tag,
            }
        else:
            return {
                "eligible": True,
                "reason": "All statutory credentials valid (Simulated Clearance)",
                "worker_name": "Ramesh Kumar (Simulated)",
                "vtc_valid": True,
                "pme_valid": True,
                "rfid_tag": rfid_tag,
            }

    def _simulate_access_event_response(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Provide realistic simulated access attempt logging response."""
        violation = not (payload.get("optical_compliance", False) and payload.get("credential_eligibility", False))
        return {
            "status": "logged_simulated",
            "access_log_id": str(uuid.uuid4()),
            "violation_ticket_created": violation,
            "violation_id": str(uuid.uuid4()) if violation else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def close(self) -> None:
        """Close active HTTP client sessions."""
        if self._sync_client is not None and not self._sync_client.is_closed:
            self._sync_client.close()

    async def close_async(self) -> None:
        """Close active async HTTP client sessions."""
        if self._async_client is not None and not self._async_client.is_closed:
            await self._async_client.aclose()
