# StoreBridge

Commerce, connected intelligently. An AI-powered commerce platform: Saleor for the commerce
engine, FastAPI for AI and automation, Next.js for the storefront and dashboard.

**Status: Phase 1 of 5 (foundation).** Sign-in, the dashboard shell and a live overview work.
Commerce screens, the storefront, AI Studio, payments and analytics are not built yet; see
the roadmap in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it

You need Docker with Compose v2, `make`, `openssl`, and about 4 GB of free memory.

```sh
make up              # generates .env with fresh secrets, builds and starts everything
make saleor-admin    # create your staff account (first run only)
```

Then open:

| URL | What |
| --- | --- |
| http://localhost:3000 | StoreBridge dashboard. Sign in with the account you just created |
| http://localhost:8001/docs | StoreBridge API reference |
| http://localhost:8000/graphql/ | Saleor GraphQL playground |
| http://localhost:8025 | Mailpit: every email the stack sends in development |

Optional: `make saleor-sample-data` loads Saleor's demo catalogue (development only), and
`docker compose --profile tools up -d saleor-dashboard` starts Saleor's own admin on
http://localhost:9000 for managing products until Phase 2.

## Work on it without Docker

```sh
# Backend (Python 3.12+)
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
pytest                                   # 18 tests, no services needed
uvicorn app.main:app --port 8001 --reload

# Frontend (Node 22)
cd frontend
npm install
npm run dev                              # http://localhost:3000
```

The frontend reads `SALEOR_API_URL` (default `http://localhost:8000/graphql/`) and
`STOREBRIDGE_API_URL` (default `http://localhost:8001`). Both are server-side only.

## What has and has not been tested

Verified in the environment this was built in:

- Backend: lint, 18 tests (token verification, role checks, health, error format), and the
  migration rendered to SQL.
- Frontend: lint, type-check and production build.
- End to end in a real browser, against a stand-in that signs RS256 tokens the way Saleor
  does: validation errors, wrong password, sign-in, redirect to the requested page, cookie
  flags, FastAPI accepting the token through JWKS, automatic refresh after expiry, sidebar
  collapse, mobile navigation, sign-out.
- `docker compose config` accepts the compose file.

**Not yet verified, because Docker could not run there:** the containers themselves (both
Dockerfiles, the Postgres init script, Saleor start-up), and the GraphQL queries against a
real Saleor 3.23. Expect to fix small things on the first `make up`. The Saleor calls are in
`frontend/lib/auth/` and `frontend/features/overview/data.ts`.

## Layout

```
backend/         FastAPI service, ARQ worker, Alembic migrations, tests
frontend/        Next.js 16 app
infrastructure/  Postgres init script
scripts/         bootstrap.sh generates local secrets
docs/            architecture and decisions
```
