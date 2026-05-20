# Windows users: run with `mingw32-make` or `make` if available.
# Also included npm scripts below in case Makefile isn't usable.

.PHONY: dev up down frontend backend python

dev: frontend backend python
	@echo "Starting all services (frontend + backend + python)..."
	@echo "Open: http://localhost:5173"

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0 --port 5173

backend:
	cd backend && npm start

python:
	cd python && python -m app.__main__

пароль БД: market_password

