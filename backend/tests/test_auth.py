from datetime import UTC, datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from jwt.exceptions import PyJWKClientConnectionError

from app.core.security import SaleorTokenVerifier, StaffPrincipal


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_valid_token_returns_principal(client: TestClient, make_token):
    response = client.get("/api/v1/me", headers=auth(make_token()))
    assert response.status_code == 200
    assert response.json() == {
        "user_id": "VXNlcjox",
        "email": "owner@example.com",
        "is_staff": True,
    }


def test_missing_token_is_rejected(client: TestClient):
    response = client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_expired_token_is_rejected(client: TestClient, make_token):
    expired = make_token(exp=datetime.now(UTC) - timedelta(seconds=1))
    response = client.get("/api/v1/me", headers=auth(expired))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "token_expired"


def test_token_signed_by_another_key_is_rejected(client: TestClient, make_token, other_key):
    response = client.get("/api/v1/me", headers=auth(make_token(key=other_key)))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_symmetric_algorithm_is_rejected(client: TestClient, make_token):
    """Guards against algorithm confusion: only RS256 is ever accepted."""
    forged = make_token(key="a-shared-secret-that-is-long-enough-for-hs256", algorithm="HS256")
    response = client.get("/api/v1/me", headers=auth(forged))
    assert response.status_code == 401


def test_refresh_token_cannot_authorize_requests(client: TestClient, make_token):
    response = client.get("/api/v1/me", headers=auth(make_token(type="refresh")))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_wrong_issuer_is_rejected(client: TestClient, make_token):
    response = client.get("/api/v1/me", headers=auth(make_token(iss="http://evil.test/")))
    assert response.status_code == 401


def test_token_without_user_id_is_rejected(client: TestClient, make_token):
    response = client.get("/api/v1/me", headers=auth(make_token(user_id=None)))
    assert response.status_code == 401


def test_garbage_token_is_rejected(client: TestClient):
    response = client.get("/api/v1/me", headers=auth("not-a-jwt"))
    assert response.status_code == 401


def test_staff_dependency_blocks_customers(client: TestClient, make_token):
    app: FastAPI = client.app  # type: ignore[assignment]

    @app.get("/_test/staff-only")
    async def staff_only(principal: StaffPrincipal) -> dict[str, str]:
        return {"email": principal.email}

    customer = client.get("/_test/staff-only", headers=auth(make_token(is_staff=False)))
    assert customer.status_code == 403
    assert customer.json()["error"]["code"] == "forbidden"

    staff = client.get("/_test/staff-only", headers=auth(make_token()))
    assert staff.status_code == 200


def test_unreachable_identity_provider_returns_503(client: TestClient, make_token):
    def unreachable(_token: str):
        raise PyJWKClientConnectionError("connection refused")

    client.app.state.token_verifier = SaleorTokenVerifier(  # type: ignore[attr-defined]
        issuer="", key_resolver=unreachable
    )
    response = client.get("/api/v1/me", headers=auth(make_token()))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "identity_provider_unavailable"
