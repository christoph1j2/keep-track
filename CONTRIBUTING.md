# Contributing to Keep Track

First off, thank you for considering contributing to Keep Track! It's people like you that make open-source tools great. 

Whether you want to fix a bug, add a new feature, or improve the documentation, all contributions are welcome.

## 🐛 Reporting Bugs & Requesting Features

Before creating a new issue, please check the existing open issues to see if it has already been reported. 

When opening an issue:
* **Bugs:** Provide a clear description, steps to reproduce, and what you expected to happen versus what actually happened.
* **Features:** Explain the use case and how it would benefit the project.

## 🛠️ Local Development Setup

Keep Track consists of a separate frontend (`ui/`) and backend (`api/`)[cite: 1]. 

### 1. Fork & Clone
Fork the repository `christoph1j2/keep-track`[cite: 1] to your own GitHub account, then clone it locally:

```bash
git clone [https://github.com/YOUR_USERNAME/keep-track.git](https://github.com/YOUR_USERNAME/keep-track.git)
cd keep-track

```

### 2. Environment Variables

Navigate to the `api/` folder and create a `.env` file. You can use the configuration examples provided in the `README.md`.

### 3. Start the Application (Recommended)

The easiest way to get the entire stack running (Frontend, NestJS Backend, and PostgreSQL database) is via Docker:

```bash
docker compose up -d --build

```

### 4. Manual Setup (Alternative)

If you prefer running the servers locally without Docker:

* **Frontend:** Navigate to `ui/`, run `npm install`, and start the Vite dev server with `npm run dev`.


* **Backend:** Navigate to `api/`, run `npm install`, generate the Prisma client with `npx prisma generate`, and start the server with `npm run start:dev`.



## 🚀 Pull Request Process

1. **Create a branch:** Create a new branch from `main` for your feature or bugfix (e.g., `feature/awesome-new-thing` or `fix/login-bug`).
2. **Make your changes:** Write clean, documented code. Ensure your changes follow the existing formatting. Both the `api/` and `ui/` directories have ESLint configured.


3. **Commit your changes:** Use clear and descriptive commit messages.
4. **Push and PR:** Push your branch to your fork and open a Pull Request against the `main` branch of this repository. Provide a clear description of what you've changed and why.

## 📝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://www.google.com/search?q=CODE_OF_CONDUCT.md). Please ensure your interactions remain respectful and constructive.
