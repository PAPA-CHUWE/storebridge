from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.security import SaleorTokenVerifier
from app.main import create_app

ISSUER = "http://saleor.test/graphql/"


@pytest.fixture(scope="session")
def signing_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def other_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def make_token(signing_key: rsa.RSAPrivateKey):
    """Builds tokens shaped like Saleor's, signed with the key the verifier trusts."""

    def _make(key: Any = None, algorithm: str = "RS256", **overrides: Any) -> str:
        now = datetime.now(UTC)
        claims: dict[str, Any] = {
            "iat": now,
            "exp": now + timedelta(minutes=5),
            "iss": ISSUER,
            "owner": "saleor",
            "type": "access",
            "user_id": "VXNlcjox",
            "email": "owner@example.com",
            "is_staff": True,
            **overrides,
        }
        claims = {k: v for k, v in claims.items() if v is not None}
        return jwt.encode(claims, key or signing_key, algorithm=algorithm)

    return _make


@pytest.fixture
def client(signing_key: rsa.RSAPrivateKey) -> Iterator[TestClient]:
    app = create_app(Settings(environment="test", saleor_jwt_issuer=ISSUER))
    app.state.token_verifier = SaleorTokenVerifier(
        issuer=ISSUER, key_resolver=lambda _token: signing_key.public_key()
    )
    with TestClient(app) as test_client:
        yield test_client
