"""
docker_controller.py
-------------------
Docker-compatible version of the cyberdesk operator that runs without Kubernetes dependencies.
This version maintains the core functionality while using Docker-specific implementations.
"""

from __future__ import annotations

import logging
import os
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Dict, Optional

from dotenv import load_dotenv
from supabase import Client, create_client
from fastapi import FastAPI
import uvicorn

# ---------------------------------------------------------------------------
# Logging & basic config -----------------------------------------------------
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Ensure ENV is loaded *early* so everything that relies on os.getenv works.
load_dotenv()

# ---------------------------------------------------------------------------
# Constants -----------------------------------------------------------------
# ---------------------------------------------------------------------------
MANAGED_BY = "cyberdesk-operator-docker"

# ---------------------------------------------------------------------------
# Enums ----------------------------------------------------------------------
# ---------------------------------------------------------------------------
class InstanceStatus(str, Enum):
    """Canonical states for Docker instances."""

    PENDING = "pending"
    RUNNING = "running"
    TERMINATED = "terminated"
    ERROR = "error"

# ---------------------------------------------------------------------------
# Bootstrap helpers ----------------------------------------------------------
# ---------------------------------------------------------------------------

def _init_supabase() -> Client:
    """Create and return a Supabase client or raise error."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        msg = "SUPABASE_URL / SUPABASE_KEY env vars must be set"
        logger.critical(msg)
        raise RuntimeError(msg)

    try:
        client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")
        return client
    except Exception as exc:
        logger.critical("Failed to initialize Supabase: %s", exc)
        raise RuntimeError("Supabase init failed") from exc

# ---------------------------------------------------------------------------
# Supabase helpers -----------------------------------------------------------
# ---------------------------------------------------------------------------

def get_instance_status(instance_id: str) -> Optional[str]:
    """Return the current status for *instance_id* or ``None`` if missing/error."""
    try:
        logger.debug("Supabase query: status for %s", instance_id)
        resp = SUPABASE.table("cyberdesk_instances").select("status").eq("id", instance_id).limit(1).execute()
        return (resp.data[0]["status"] if resp.data else None)
    except Exception as exc:
        logger.error("Supabase error: %s", exc)
        return None

def update_instance_status(instance_id: str, status: str) -> None:
    """Update the status for *instance_id* in Supabase."""
    try:
        logger.debug("Supabase update: status for %s to %s", instance_id, status)
        SUPABASE.table("cyberdesk_instances").update({"status": status}).eq("id", instance_id).execute()
    except Exception as exc:
        logger.error("Supabase error: %s", exc)

# Initialize Supabase client
SUPABASE: Client = _init_supabase()

# Initialize FastAPI app
app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

def main():
    """Main entry point for the Docker controller."""
    logger.info("Starting cyberdesk-operator in Docker mode")
    try:
        # Start the FastAPI server
        uvicorn.run(app, host="0.0.0.0", port=80)
    except KeyboardInterrupt:
        logger.info("Shutting down cyberdesk-operator")
    except Exception as exc:
        logger.error("Unexpected error: %s", exc)
        raise

if __name__ == "__main__":
    main() 