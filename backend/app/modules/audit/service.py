from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog


async def record_audit_event(
    session: AsyncSession,
    *,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    request_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """Add an audit row to the caller's transaction, so it commits or rolls back with it."""
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        request_id=request_id,
        details=details or {},
    )
    session.add(entry)
    await session.flush()
    return entry


async def prune_audit_logs(session: AsyncSession, *, retention_days: int) -> int:
    cutoff = datetime.now(UTC) - timedelta(days=retention_days)
    result = await session.execute(delete(AuditLog).where(AuditLog.created_at < cutoff))
    assert isinstance(result, CursorResult)  # noqa: S101 - narrows the type for rowcount
    return result.rowcount or 0
