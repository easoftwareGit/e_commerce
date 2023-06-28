CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"email" varchar NOT NULL UNIQUE,
	"password_hash" TEXT NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- confirm table and index were created
SELECT *
FROM pg_indexes
WHERE tablename = 'users';

CREATE TABLE IF NOT EXISTS "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"name" varchar NOT NULL UNIQUE,
	"model_number" varchar NOT NULL UNIQUE,
	"description" varchar NOT NULL,
	"price" DECIMAL NOT NULL	
);
CREATE UNIQUE INDEX IF NOT EXISTS products_name_idx ON products (name);
CREATE UNIQUE INDEX IF NOT EXISTS products_model_number_idx ON products (model_number);

-- confirm table and indexes were created
SELECT *
FROM pg_indexes
WHERE tablename = 'products';

-- create role for a person
CREATE ROLE testname WITH LOGIN PASSWORD 'testpassword';
-- CREATE ROLE ____ WITH LOGIN PASSWORD '______';

-- confirm role was created
SELECT rolname 
FROM pg_roles
WHERE rolname = 'testname';
-- SELECT rolname 
-- FROM pg_roles
-- WHERE rolname = '______';

-- current tables
GRANT SELECT, INSERT, UPDATE, DELETE 
ON ALL TABLES IN SCHEMA public TO testname;
-- GRANT SELECT, INSERT, UPDATE, DELETE 
-- ON ALL TABLES IN SCHEMA ______ TO ______;

-- future tables
ALTER DEFAULT PRIVILEGES
FOR USER testname
IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO testname;
-- ALTER DEFAULT PRIVILEGES
-- FOR USER username
-- IN SCHEMA schema_name
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO username;

-- confirm roles
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'testname';
