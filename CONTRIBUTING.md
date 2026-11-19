# Contributing to StoreBridge

Thanks for your interest in StoreBridge. Contributions are welcome through issues and pull requests.

## Before you start

- Read the [README](README.md) and [architecture notes](docs/ARCHITECTURE.md) to understand what exists and what is planned.
- Search existing issues and pull requests before opening a new one. For larger changes, open an issue first to discuss the scope.
- Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Do not include credentials, customer data, supplier secrets, or real production URLs in issues, commits, fixtures, or screenshots. Use `.env.example` as the configuration reference and keep real `.env` files local.

## Set up locally

StoreBridge requires Docker Compose v2, Node 22, Python 3.12+, `make`, and `openssl`. From a clean clone:

```sh
make dev
```

For the native frontend/backend workflow, install the project dependencies once:

```sh
cd backend && python3 -m venv .venv && .venv/bin/pip install -e "[dev]"
cd ../frontend && npm ci
```

See the README for the complete local development instructions and available URLs.

## Make a change

1. Fork the repository and create a focused branch from `main`.
2. Keep changes scoped and explain the user or engineering problem they solve.
3. Add or update tests for behavior changes. Do not commit generated secrets, `.env` files, build output, or unrelated formatting changes.
4. Run the checks relevant to your changes:

   ```sh
   # Backend
   cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/pytest -q

   # Frontend
   cd frontend && npm run lint && npm run typecheck && npm run check:graphql && npm test
   ```

5. Open a pull request against `main`. Describe the change, how you checked it, any configuration needed, and any remaining limitations. Include screenshots for visible UI changes where useful.

## Project conventions

- Saleor is the source of truth for commerce data. Use its GraphQL API; do not write directly to Saleor's database.
- Keep credentials and authenticated calls server-side. Never put secrets in browser code, logs, test fixtures, or documentation.
- Treat supplier URLs and page contents as untrusted input. Keep the SSRF protections and request size/time limits intact.
- Label planned capabilities as planned. Do not describe RAG, AI evaluation, integrations, or deployments as implemented unless the code supports the claim.
- Keep pull requests focused. A maintainer may ask for changes or split a broad pull request to make review easier.

## Reporting vulnerabilities

Please do not report security vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) to contact the maintainers privately.
