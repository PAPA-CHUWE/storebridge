.PHONY: setup up down logs saleor-admin saleor-sample-data test lint

setup: ## Generate .env with local secrets
	sh scripts/bootstrap.sh

up: setup ## Build and start the whole stack
	docker compose up -d --build

down: ## Stop the stack (data is kept)
	docker compose down

logs:
	docker compose logs -f --tail=100

saleor-admin: ## Create the first staff account (you choose the email and password)
	docker compose run --rm saleor-api python3 manage.py createsuperuser

saleor-sample-data: ## Load Saleor's demo catalogue. Development only.
	docker compose run --rm saleor-api python3 manage.py populatedb

test: ## Run backend tests and frontend checks on the host
	cd backend && python -m pytest -q
	cd frontend && npm run lint && npm run typecheck && npm run build

lint:
	cd backend && ruff check . && ruff format --check .
	cd frontend && npm run lint
