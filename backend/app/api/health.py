"""Liveness and readiness probes.

`/health/live` answers "is the process up". `/health/ready` checks the dependencies this
service cannot work without (database, Redis) and reports Saleor separately: if Saleor is
down the service stays ready, because already-verified keys are cached.
"""

from typing import Annotated, Literal

import httpx
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter(prefix="/health", tags=["health"])

ComponentStatus = Literal["ok", "down"]


class Liveness(BaseModel):
    status: Literal["ok"] = "ok"


class Readiness(BaseModel):
    status: Literal["ok", "degraded", "down"]
    database: ComponentStatus
    redis: ComponentStatus
    saleor: ComponentStatus


async def check_database(request: Request) -> bool:
    try:
        async with request.app.state.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def check_redis(request: Request) -> bool:
    try:
        return bool(await request.app.state.redis.ping())
    except Exception:
        return False


async def check_saleor(request: Request) -> bool:
    try:
        client: httpx.AsyncClient = request.app.state.http
        response = await client.get(request.app.state.settings.saleor_jwks_url, timeout=3)
        return response.status_code == 200
    except Exception:
        return False


@router.get("/live", response_model=Liveness)
async def live() -> Liveness:
    return Liveness()


@router.get("/ready", response_model=Readiness)
async def ready(
    response: Response,
    database: Annotated[bool, Depends(check_database)],
    redis: Annotated[bool, Depends(check_redis)],
    saleor: Annotated[bool, Depends(check_saleor)],
) -> Readiness:
    if not (database and redis):
        status: Literal["ok", "degraded", "down"] = "down"
        response.status_code = 503
    elif not saleor:
        status = "degraded"
    else:
        status = "ok"

    def label(up: bool) -> ComponentStatus:
        return "ok" if up else "down"

    return Readiness(
        status=status, database=label(database), redis=label(redis), saleor=label(saleor)
    )
