# Windows users: run with `mingw32-make` or `make` if available.
# Also included npm scripts below in case Makefile isn't usable.
.PHONY: dev up down restart logs-db clean

# 1. Запуск всего проекта одной командой в фоне
dev:
	@echo "Запуск инфраструктуры маркетплейса в Docker..."
	docker-compose up -d --build
	@echo "Фронтенд доступен на: http://localhost:5173"
	@echo "pgAdmin доступен на: http://localhost:5050"

# 2. Полная остановка всех контейнеров
down:
	@echo "Остановка всех сервисов..."
	docker-compose down

# 3. Быстрый перезапуск (если обновил код)
restart: down dev

# 4. Посмотреть, что происходит внутри базы данных (логи)
logs-db:
	docker-compose logs -f database

# 5. Очистить неиспользуемый кэш Docker (если кончилось место)
clean:
	docker system prune -f
