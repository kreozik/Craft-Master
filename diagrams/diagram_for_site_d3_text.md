graph TB
  U[User]

  FE[Frontend]
  API[Backend API (Node.js)]
  PY[Python service]
  DB[(PostgreSQL)]
  DEV[DevOps]

  FEUI[UI: catalog, product card, cart]
  FEAPI[HTTP client]
  APISvc[REST API]
  Auth[Auth]
  Orders[Orders]
  PYLogic[Business logic]
  DC[docker-compose]
  GH[GitHub Actions]
  IMG[Docker images]

  U --> FEUI
  FEUI --> FEAPI
  FEAPI --> APISvc

  APISvc -->|HTTP| PYLogic
  APISvc -->|SQL| DB

  DEV --> DC
  DEV --> GH
  DEV --> IMG
```

```mermaid
erDiagram
  USERS {
    bigint id PK
    string role
    string email
  }
  SELLER_PROFILES {
    bigint id PK
    bigint user_id FK
  }
  CATEGORIES {
    bigint id PK
    string name
  }
  PRODUCTS {
    bigint id PK
    bigint seller_id FK
    bigint category_id FK
    string title
    numeric price
    string status
  }
  ORDERS {
    bigint id PK
    bigint buyer_id FK
    string status
    numeric total_amount
  }
  ORDER_ITEMS {
    bigint id PK
    bigint order_id FK
    bigint product_id FK
    int qty
    numeric unit_price
  }

  USERS ||--o{ PRODUCTS : sells
  USERS ||--o{ ORDERS : buys
  CATEGORIES ||--o{ PRODUCTS : categorizes
  PRODUCTS ||--o{ ORDER_ITEMS : contains
  ORDERS ||--o{ ORDER_ITEMS : has
  USERS ||--|| SELLER_PROFILES : profile
