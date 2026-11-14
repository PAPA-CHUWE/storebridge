"""Environment-based configuration. Every setting can be overridden with an env var."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: str = "INFO"

    # StoreBridge's own database. Saleor owns its database; we never write to it directly.
    database_url: str = "postgresql+asyncpg://storebridge:storebridge@localhost:5432/storebridge"
    redis_url: str = "redis://localhost:6379/2"

    # Saleor is the commerce engine and the identity provider for staff and customers.
    saleor_api_url: str = "http://localhost:8000/graphql/"
    # Leave empty to skip issuer validation (Saleor derives `iss` from PUBLIC_URL or the
    # request host, which differs between browser and container networks in development).
    saleor_jwt_issuer: str = ""
    saleor_jwks_cache_seconds: int = 300

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    audit_log_retention_days: int = 365

    @computed_field  # type: ignore[prop-decorator]
    @property
    def saleor_jwks_url(self) -> str:
        base = self.saleor_api_url.rstrip("/").removesuffix("/graphql")
        return f"{base}/.well-known/jwks.json"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
