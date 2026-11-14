"""ARQ worker. Run with: arq app.workers.settings.WorkerSettings

Background jobs keep slow work (emails, AI generation, reports) out of API requests.
Phase 1 ships the worker with one maintenance job; feature jobs register here as they land.
"""

from typing import Any, ClassVar

from arq import cron
from arq.connections import RedisSettings

from app.core.config import get_settings
from app.core.database import create_engine, create_session_factory
from app.core.logging import configure_logging, get_logger
from app.modules.audit.service import prune_audit_logs

log = get_logger(__name__)


async def startup(ctx: dict[str, Any]) -> None:
    settings = get_settings()
    configure_logging(settings.log_level, json_output=settings.environment != "development")
    ctx["settings"] = settings
    ctx["engine"] = create_engine(settings.database_url)
    ctx["session_factory"] = create_session_factory(ctx["engine"])
    log.info("worker_started")


async def shutdown(ctx: dict[str, Any]) -> None:
    await ctx["engine"].dispose()
    log.info("worker_stopped")


async def prune_audit_logs_job(ctx: dict[str, Any]) -> int:
    async with ctx["session_factory"]() as session:
        removed = await prune_audit_logs(
            session, retention_days=ctx["settings"].audit_log_retention_days
        )
        await session.commit()
    log.info("audit_logs_pruned", removed=removed)
    return removed


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)
    on_startup = startup
    on_shutdown = shutdown
    functions: ClassVar[list[Any]] = [prune_audit_logs_job]
    cron_jobs: ClassVar[list[Any]] = [cron(prune_audit_logs_job, hour=2, minute=30)]
    health_check_interval = 30
