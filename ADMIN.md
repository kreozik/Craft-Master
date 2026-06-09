# 🛠 Админ-панель Craft-Master

## Установка и запуск

### 1. Применить новые миграции

Изменения в `backend/src/db/schema.sql` применяются автоматически при старте бэкенда
(в `ensureSchemaAndSeed`). Просто перезапусти бэкенд:

```bash
cd backend
npm start
```

### 2. Создать админа

```bash
cd backend
node src/scripts/createAdmin.js
```

По умолчанию создаётся:
- **Email:** `admin@craftmaster.local`
- **Пароль:** `Admin123!`

Кастомные данные:

```bash
node src/scripts/createAdmin.js my@email.com MyPass123 "My Name"
```

### 3. Запуск фронтенда

```bash
cd frontend
npm run dev
```

Админка доступна по адресу: **http://localhost:5173/admin.html**

## Функционал

### Дашборд
- Статистика по пользователям, товарам, заказам
- Общая выручка

### Пользователи
- Список с поиском и фильтрацией по ролям
- Блокировка / разблокировка
- Смена роли (BUYER, SELLER, ADMIN)
- Сброс пароля
- Удаление

### Товары
- Список с фильтрацией по статусу
- Модерация: PENDING → ACTIVE / REJECTED / DISABLED
- Удаление товаров

### Заказы
- Список с фильтрацией по статусу
- Смена статуса заказа

### Журнал действий
- История всех действий администратора
- Кто, что, когда сделал

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/me` | Текущий админ |
| GET | `/api/admin/stats` | Статистика |
| GET/DELETE | `/api/admin/users` | Пользователи |
| PATCH | `/api/admin/users/:id/block` | Блокировка |
| PATCH | `/api/admin/users/:id/role` | Смена роли |
| PATCH | `/api/admin/users/:id/password` | Сброс пароля |
| GET | `/api/admin/products` | Товары |
| PATCH | `/api/admin/products/:id/status` | Статус товара |
| DELETE | `/api/admin/products/:id` | Удаление товара |
| GET | `/api/admin/orders` | Заказы |
| GET | `/api/admin/orders/:id` | Детали заказа |
| PATCH | `/api/admin/orders/:id/status` | Статус заказа |
| GET | `/api/admin/logs` | Журнал действий |
