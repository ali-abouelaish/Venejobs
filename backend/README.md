# VeneJobs Backend — README

A backend built with Node.js, Express, PostgreSQL, and Sequelize ORM.
Includes authentication, migrations, seeders, and automatic DB setup for development, test, and production environments.

============================================================
INSTALLATION GUIDE (WINDOWS + MAC BOTH)
============================================================

------------------------------------------------------------
1. Clone the Repository
------------------------------------------------------------
git clone <your-repo-url>
cd venejobs-backend

------------------------------------------------------------
2. Install Dependencies
------------------------------------------------------------
npm installD

============================================================
DATABASE SETUP
============================================================

------------------------------------------------------------
4. Initialize Development Database
------------------------------------------------------------
Windows:
    npm run init-db:dev

Mac/Linux:
    npm run init-db:dev

(Works on both because of cross-env)

This will:
- Create database (if missing)
- Run Sequelize migrations
- Run seeders (if any)
- Prepare admin account

------------------------------------------------------------
Optional Commands:
------------------------------------------------------------

Run migrations only:
    npx sequelize-cli db:migrate

Undo last migration:
    npx sequelize-cli db:migrate:undo

Run all seeders:
    npx sequelize-cli db:seed:all

============================================================
START SERVER
============================================================

------------------------------------------------------------
Development Mode:
------------------------------------------------------------
Windows + Mac:
    npm run dev

------------------------------------------------------------
Production Mode:
------------------------------------------------------------
Windows + Mac:
    npm start

Server URL:
http://localhost:3000

============================================================
CREATING A NEW TABLE
============================================================

1. Generate a migration:
    npx sequelize-cli migration:generate --name create-products-table

2. Edit migration file to add createTable()

3. Run migration:
    npx sequelize-cli db:migrate

4. Create model:
    models/product.js

============================================================
DONE
============================================================

Your project is now ready to run for any developer on Windows or Mac.
