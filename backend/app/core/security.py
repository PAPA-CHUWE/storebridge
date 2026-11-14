"""Authentication against Saleor-issued JWTs.

Saleor is the single identity provider. It signs access tokens with RS256 and publishes
the public keys as a JWKS document, so this service verifies tokens locally and never
sees passwords. Authorization decisions are always made here, on the server.
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated, Any

import jwt
from fastapi import Depends, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError, PyJWKClientError

from app.core.config import Settings
from app.core.errors import AppError
from app.core.logging import get_logger

log = get_logger(__name__)

# Pinned: never accept the algorithm named in an untrusted token header.
ALGORITHMS = ["RS256"]

KeyResolver = Callable[[str], Any]


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated caller, as asserted by a verified Saleor access token."""

    user_id: str
    email: str
    is_staff: bool


class SaleorTokenVerifier:
    def __init__(self, issuer: str, key_resolver: KeyResolver) -> None:
        self._issuer = issuer
        self._resolve_key = key_resolver

    @classmethod
    def from_settings(cls, settings: Settings) -> "SaleorTokenVerifier":
        client = PyJWKClient(
            settings.saleor_jwks_url,
            cache_keys=True,
            lifespan=settings.saleor_jwks_cache_seconds,
            timeout=5,
        )
        return cls(
            issuer=settings.saleor_jwt_issuer,
            key_resolver=lambda token: client.get_signing_key_from_jwt(token).key,
        )

    def verify(self, token: str) -> Principal:
        try:
            key = self._resolve_key(token)
        except PyJWKClientConnectionError as exc:
            log.error("saleor_jwks_unreachable", error=str(exc))
            raise AppError(
                503, "identity_provider_unavailable", "Sign-in service is unavailable."
            ) from exc
        except (PyJWKClientError, jwt.InvalidTokenError) as exc:
            raise AppError(401, "invalid_token", "The access token is not valid.") from exc

        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=ALGORITHMS,
                issuer=self._issuer or None,
                options={
                    "require": ["exp", "iat", "type", "user_id"],
                    "verify_iss": bool(self._issuer),
                    "verify_aud": False,
                },
            )
        except jwt.ExpiredSignatureError as exc:
            raise AppError(401, "token_expired", "The access token has expired.") from exc
        except jwt.InvalidTokenError as exc:
            raise AppError(401, "invalid_token", "The access token is not valid.") from exc

        # Refresh tokens share the signing key but must never authorize API calls.
        if claims.get("type") != "access":
            raise AppError(401, "invalid_token", "The access token is not valid.")

        return Principal(
            user_id=str(claims["user_id"]),
            email=str(claims.get("email", "")),
            is_staff=claims.get("is_staff") is True,
        )


_bearer = HTTPBearer(auto_error=False)


async def get_principal(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Principal:
    if credentials is None:
        raise AppError(401, "unauthenticated", "Sign in to continue.")
    verifier: SaleorTokenVerifier = request.app.state.token_verifier
    # Key lookup may hit the network on a cold cache, so keep it off the event loop.
    return await run_in_threadpool(verifier.verify, credentials.credentials)


async def require_staff(principal: Annotated[Principal, Depends(get_principal)]) -> Principal:
    if not principal.is_staff:
        raise AppError(403, "forbidden", "Your account can't access store management.")
    return principal


CurrentPrincipal = Annotated[Principal, Depends(get_principal)]
StaffPrincipal = Annotated[Principal, Depends(require_staff)]
