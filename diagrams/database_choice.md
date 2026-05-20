Предложение по БД и схемам

Чтобы закрыть требования диплома (БД + отказоустойчивость/безопасность), рационально взять:
- PostgreSQL (основная БД)

Почему:
- надежная СУБД, поддерживает транзакции, индексы, роли, FK
- удобно для docker-compose

Набор таблиц:
- users
- seller_profiles
- categories
- products
- product_images
- orders
- order_items
- payments (опционально)

Диаграммы:
- ERD/логическая схема — c:/Users/n/Documents/vs/Diplom/diagrams/erd.txt
- Sequence (покупка) — c:/Users/n/Documents/vs/Diplom/diagrams/sequence_purchase.txt

