.PHONY: help install test seed dev dev-api dev-web docker-up docker-down

help:
	@echo "Intelligent Land Record Digitization and Validation System (SIH 2026)"
	@echo "------------------------------------------------------------------"
	@echo "make install     - Install all backend and frontend dependencies"
	@echo "make test        - Run backend test suite (pytest)"
	@echo "make seed        - Generate sample land record assets and seed database"
	@echo "make dev-api     - Run FastAPI backend server on port 8000"
	@echo "make dev-web     - Run Next.js frontend dev server on port 3000"
	@echo "make docker-up   - Start full stack with Docker Compose"
	@echo "make docker-down - Stop Docker Compose containers"

install:
	python -m venv apps/api/venv
	apps/api/venv/Scripts/pip install -r apps/api/requirements.txt
	cd apps/web && npm install

test:
	apps/api/venv/Scripts/python -m pytest -v

seed:
	apps/api/venv/Scripts/python apps/api/scripts/generate_sample_assets.py

dev-api:
	apps/api/venv/Scripts/uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000 --reload

dev-web:
	cd apps/web && npm run dev

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down
