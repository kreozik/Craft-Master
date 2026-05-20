-- Seed demo data

-- Create demo seller users
INSERT INTO users (role, name, email, password_hash)
VALUES 
  ('SELLER', 'Ирина Рукодельница', 'seller@example.com', 'demo_hash'),
  ('SELLER', 'Мария Керамист', 'maria@example.com', 'demo_hash'),
  ('SELLER', 'Анна Вязальщица', 'anna@example.com', 'demo_hash'),
  ('SELLER', 'Елена Ювелир', 'elena@example.com', 'demo_hash')
ON CONFLICT (email) DO NOTHING;

-- Seller profiles
INSERT INTO seller_profiles (user_id, shop_name, description, avatar_url)
SELECT u.id, 'Мастерская Ирины', 'Хендмейд изделия из воска и ароматов', NULL
FROM users u WHERE u.email = 'seller@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO seller_profiles (user_id, shop_name, description, avatar_url)
SELECT u.id, 'Гончарная мастерская', 'Керамика ручной работы', NULL
FROM users u WHERE u.email = 'maria@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO seller_profiles (user_id, shop_name, description, avatar_url)
SELECT u.id, 'Вязаный мир', 'Вязаные изделия из натуральной шерсти', NULL
FROM users u WHERE u.email = 'anna@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO seller_profiles (user_id, shop_name, description, avatar_url)
SELECT u.id, 'Серебряная нить', 'Украшения ручной работы', NULL
FROM users u WHERE u.email = 'elena@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Categories
INSERT INTO categories (name)
VALUES 
  ('Свечи'), 
  ('Керамика'), 
  ('Вязание'),
  ('Украшения'),
  ('Кожаные изделия'),
  ('Дерево')
ON CONFLICT (name) DO NOTHING;

-- Products
WITH sellers AS (
  SELECT id AS seller_id, email FROM users WHERE role = 'SELLER'
),
items AS (
  -- Свечи
  SELECT 'seller@example.com' AS email, 'Свечи' AS cat, 'Свеча ароматическая "Лаванда"' AS title, 'Натуральный воск, эфирные масла' AS description, 850.00::numeric AS price UNION ALL
  SELECT 'seller@example.com', 'Свечи', 'Свеча "Ваниль и корица"', 'Теплый пряный аромат', 950.00 UNION ALL
  SELECT 'seller@example.com', 'Свечи', 'Набор свечей "Лесные ягоды"', '3 штуки в подарочной упаковке', 2200.00 UNION ALL
  SELECT 'seller@example.com', 'Свечи', 'Свеча в банке "Морской бриз"', 'Длительное горение 40 часов', 1200.00 UNION ALL
  
  -- Керамика
  SELECT 'maria@example.com', 'Керамика', 'Кружка керамическая "Рустика"', 'Объем 350 мл, ручная роспись', 1100.00 UNION ALL
  SELECT 'maria@example.com', 'Керамика', 'Тарелка декоративная', 'Диаметр 25 см', 1800.00 UNION ALL
  SELECT 'maria@example.com', 'Керамика', 'Набор чашек "4 сезона"', '4 чашки, разные оттенки', 3200.00 UNION ALL
  SELECT 'maria@example.com', 'Керамика', 'Ваза керамическая "Волна"', 'Высота 30 см', 2500.00 UNION ALL
  
  -- Вязание
  SELECT 'anna@example.com', 'Вязание', 'Шапка вязаная "Скандинавия"', 'Мериносовая шерсть', 1800.00 UNION ALL
  SELECT 'anna@example.com', 'Вязание', 'Шарф "Снежный узор"', 'Длина 180 см', 2200.00 UNION ALL
  SELECT 'anna@example.com', 'Вязание', 'Варежки "Тепло рук"', 'Натуральная шерсть', 950.00 UNION ALL
  SELECT 'anna@example.com', 'Вязание', 'Свитер "Косы"', 'Размеры S-XL', 4500.00 UNION ALL
  
  -- Украшения
  SELECT 'elena@example.com', 'Украшения', 'Серьги "Листья"', 'Серебро 925, ручная работа', 2800.00 UNION ALL
  SELECT 'elena@example.com', 'Украшения', 'Кольцо "Виноградная лоза"', 'Серебро с позолотой', 3500.00 UNION ALL
  SELECT 'elena@example.com', 'Украшения', 'Браслет "Плетение"', 'Серебро 925', 4200.00 UNION ALL
  SELECT 'elena@example.com', 'Украшения', 'Кулон "Лунный камень"', 'Натуральный камень, серебро', 3800.00 UNION ALL
  
  -- Кожаные изделия
  SELECT 'seller@example.com', 'Кожаные изделия', 'Кошелек "Классика"', 'Натуральная кожа, коричневый', 2900.00 UNION ALL
  SELECT 'seller@example.com', 'Кожаные изделия', 'Ремень кожаный "Премиум"', 'Ширина 35 мм', 3500.00 UNION ALL
  
  -- Дерево
  SELECT 'maria@example.com', 'Дерево', 'Разделочная доска "Дуб"', 'Массив дуба, пропитка маслом', 1500.00 UNION ALL
  SELECT 'maria@example.com', 'Дерево', 'Набор деревянных ложек', '6 штук, береза', 1200.00
)
INSERT INTO products (seller_id, category_id, title, description, price, currency, status)
SELECT
  s.seller_id,
  c.id,
  i.title,
  i.description,
  i.price,
  'RUB',
  'ACTIVE'
FROM items i
JOIN sellers s ON s.email = i.email
JOIN categories c ON c.name = i.cat
ON CONFLICT DO NOTHING;


