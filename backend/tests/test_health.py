import pytest
from fastapi.testclient import TestClient

from app.api.health import check_database, check_redis, check_saleor


def override(client: TestClient, *, database: bool, redis: bool, saleor: bool) -> None:
    overrides = client.app.dependency_overrides  # type: ignore[attr-defined]
    overrides[check_database] = lambda: database
    overrides[check_redis] = lambda: redis
    overrides[check_saleor] = lambda: saleor


def test_liveness(client: TestClient):
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"]


def test_request_id_is_echoed(client: TestClient):
    response = client.get("/health/live", headers={"X-Request-ID": "abc-123"})
    assert response.headers["X-Request-ID"] == "abc-123"


def test_ready_when_everything_is_up(client: TestClient):
    override(client, database=True, redis=True, saleor=True)
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.parametrize(("database", "redis"), [(False, True), (True, False)])
def test_not_ready_without_a_hard_dependency(client: TestClient, database: bool, redis: bool):
    override(client, database=database, redis=redis, saleor=True)
    response = client.get("/health/ready")
    assert response.status_code == 503
    assert response.json()["status"] == "down"


def test_saleor_outage_degrades_without_failing_readiness(client: TestClient):
    override(client, database=True, redis=True, saleor=False)
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {
        "status": "degraded",
        "database": "ok",
        "redis": "ok",
        "saleor": "down",
    }


def test_unknown_route_uses_error_envelope(client: TestClient):
    response = client.get("/nope")
    assert response.status_code == 404
    body = response.json()["error"]
    assert body["code"] == "not_found"
    assert body["request_id"]
