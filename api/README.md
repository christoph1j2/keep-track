# 💸 Keep Track - API

Modern and robust RESTful API backend for the Keep Track personal finance management application. It provides data persistence, user management, and business logic for the frontend.

This directory contains the server-side code built with NestJS, preparing to replace the frontend's localStorage with a persistent database.

## ✨ Key Features

- 🏗️ **Robust Architecture:** Built with NestJS for scalable and maintainable server-side logic.
- 🗄️ **Database Integration:** Uses Prisma ORM with PostgreSQL for type-safe database access.
- 🔐 **Authentication & Authorization:** Secure user authentication using Passport and JWT.
- 🚀 **Real-time WebSockets:** Support for real-time updates using Socket.IO.
- 🤖 **AI Integration:** Prepared for AI integrations via OpenRouter SDK.

## 🛠️ Tech Stack

- **Framework:** [NestJS 11](https://nestjs.com/)
- **Language:** TypeScript
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (via `pg` and Prisma)
- **Authentication:** `passport`, `bcrypt`, `jwt`

## 🚀 How to run locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v20 or newer recommended).
- PostgreSQL database running locally or accessible via URL.

### Installation

1. Open the API directory:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root of the `api` directory based on your database configuration. Example:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/keeptrack"
   ```

4. Apply database migrations and generate Prisma client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

6. The API will be running (usually at `http://localhost:3000`).

### 📦 Production Build

The API can be built for production using the following commands:

```bash
npm run build
npm run start:prod
```

## 📂 Project Structure

* `src/` - Main application source code.
* `prisma/` - Database schema and migration files.
* `test/` - End-to-end testing setup.
