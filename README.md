# Маркетплейс hand-made (frontend/backend/devops)

Это быстрый, рабочий каркас проекта для диплома/курсовой: фронтенд на HTML/CSS/TS, бэкенд на Node.js (REST API) + Python (доп. логика), инфраструктура на Docker + GitHub Actions.

## Быстрый старт (БЕЗ Docker)

### Одна команда (без Docker)
1) Установи Node.js и Python 3.12+

```bash
npm run dev
```

Открой:
- Frontend: http://localhost:5173
- API: http://localhost:8000
- Python: http://localhost:9001/health

### (необязательно) Makefile
Если у тебя есть `make`, то можно запускать через `make dev`.


Открой:
- Frontend: http://localhost:5173
- API: http://localhost:8000
- Python: http://localhost:9001/health

### Вариант 2: вручную 3 терминала
**Terminal #1 (frontend):**
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

**Terminal #2 (backend):**
```bash
cd backend
npm install
npm start
```

**Terminal #3 (python):**
```bash
cd python
pip install -r requirements.txt
python -m app
```

## Структура
- `frontend/` — UI (HTML/CSS/TS на Vite)
- `backend/` — API (Node.js Express)
- `python/` — дополнительный сервис (FastAPI)
- `docker-compose.yml`, `*/Dockerfile` — заготовки под Docker (временно не используем)


