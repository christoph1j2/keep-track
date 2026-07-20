# KeepTrack

![Version: Beta](https://img.shields.io/badge/Version-Beta-green.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
<br>
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

> As the name suggests, the app is used to **Keep Track** of your finances. The app is fitted with a modern responsive UI, *tries* to be good in terms of UX, and also has a fully fledged API. The app is currently in beta and development is still underway.

<screenshot

## Overview

The application is for anyone, who wants something more effective, visually pleasing and functional to track their finances than Excel. Are you a person who has expenses and income? Are you someone who would like to keep track, where that money flows and what you are spending the most on? Then **Keep Track** might be for you. 

Nobody likes to manually enter transactions you make often again and again - that's what KeepTrack's QuickAdd templates are for! You assign a name, amount and a category, creating a new template you can then put in your hotbar displayed on your dashboard.

Do you want to start using KeepTrack and import your transactions? You can do that easily with KeepTrack's smart .csv import, which utilises a small model through OpenRouter, assigning your imported transactions to your created categories.

## Features

- **Full-Stack Architecture:** Built with React, TypeScript, Tailwind CSS, and Zustand on the frontend, powered by a NestJS and PostgreSQL backend.

- **Smart .csv Import**: AI-driven categorization using OpenRouter.

- **QuickAdd Templates**: One-click transaction logging directly from your dashboard.

- ...

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Docker (optional, but highly recommended if you plan to use the provided Docker Compose setup)

### Installation

```bash
git clone https://github.com/christoph1j2/keep-track.git
cd keep-track
```

### Usage

Running the following command will automatically spin up the frontend, the backend API, and the PostgreSQL database:

```bash
docker compose up -d --build
```

## Configuration

If you plan on running it on a homelab, here is all the stuff you need to know (incl. a tailscale funnel tutorial)

Put a `.env` file inside the `api` folder with these variables inside (replace the placeholder values inside `<>` with your own credentials)

```env

DATABASE_URL="postgresql://<db_username>:<db_password>@127.0.0.1:5432/keep-track?schema=public"

JWT_ACCESS_SECRET="<your_access_secret>"
JWT_REFRESH_SECRET="<your_refresh_secret>"

BREVO_SMTP_USER="<your_smtp_brevo_username>@smtp-brevo.com"
BREVO_SMTP_PASSWORD="<your_smtp_password>"

OPENROUTER_API_KEY="<your_openrouter_api_key>"
```

#### What's Brevo?

Brevo is a SMTP relay middleman used for "forgot password" emails. You can find further guides how to set it up online.

#### Why do I need an OPENROUTER_API_KEY?

You technically don't need it, although it is a cool feature of the app. Up to you!

### How to set it up using tailscale?

If you have tailscale running on your homelab, simply running the command below does the job:
`sudo tailscale funnel --bg --set-path=/keeptrack http://127.0.0.1:8080`


## Project Structure

```text
.
├── src/
├── tests/
└── README.md
```

## Roadmap

- [ ] Landing page
- [ ] Feedback system
- [ ] PWA support
- [ ] Better analytics
- [ ] LLM Insights
- [ ] ...

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

- Name: Ernst Christoph Leschka
- Email: ernst.leschka@gmail.com
- Repository: https://github.com/christoph1j2/keep-track
