-- CREATE DATABASE _____

CREATE TABLE users (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(30),
  email VARCHAR(30)
);

CREATE ROLE testname WITH LOGIN PASSWORD 'testpassword';
-- CREATE ROLE ____ WITH LOGIN PASSWORD '______';

-- current tables
GRANT SELECT, INSERT, UPDATE, DELETE 
ON ALL TABLES IN SCHEMA public TO testname;
-- GRANT SELECT, INSERT, UPDATE, DELETE 
-- ON ALL TABLES IN SCHEMA schema_name TO username;

-- future tables
ALTER DEFAULT PRIVILEGES
FOR USER testname
IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO testname;
-- ALTER DEFAULT PRIVILEGES
-- FOR USER username
-- IN SCHEMA schema_name
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO username;

SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'testname';

-- CREATE TABLE IF NOT EXISTS "users" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"email" varchar NOT NULL UNIQUE,
-- 	"password_hash" TEXT NOT NULL,
-- 	"first_name" varchar NOT NULL,
-- 	"last_name" varchar NOT NULL,
-- 	"phone" varchar NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS "products" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"name" varchar NOT NULL UNIQUE,
-- 	"model_number" varchar NOT NULL UNIQUE,
-- 	"description" varchar NOT NULL,
-- 	"price" DECIMAL NOT NULL	
-- );

-- CREATE TABLE IF NOT EXISTS "orders" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"created" DATE NOT NULL,
-- 	"modified" DATE NOT NULL,
-- 	"status" varchar NOT NULL,
-- 	"total_price" DECIMAL NOT NULL,
-- 	"user_id" integer NOT NULL REFERENCES users(id)
-- );

-- CREATE TABLE IF NOT EXISTS "order_items" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"order_id" integer NOT NULL REFERENCES orders(id),
-- 	"product_id" integer NOT NULL REFERENCES products(id),
-- 	"quantity" integer NOT NULL,
-- 	"price_unit" DECIMAL NOT NULL    
-- );

-- CREATE TABLE IF NOT EXISTS "cart" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"created" DATE NOT NULL,
-- 	"modified" DATE NOT NULL,
-- 	"user_id" integer NOT NULL REFERENCES users(id)
-- );

-- CREATE TABLE IF NOT EXISTS "cart_items" (
-- 	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
-- 	"cart_id" integer NOT NULL REFERENCES cart(id),
-- 	"product_id" integer NOT NULL REFERENCES products(id),
-- 	"quantity" integer NOT NULL
-- );
