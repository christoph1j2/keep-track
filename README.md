# keep-track

> As the name suggests, the app is used to **Keep Track** of your finances. The app is fitted with a modern responsive UI, *tries* to be good in terms of UX, and also has a fully fledged API. The app is currently in beta and development is still underway.

## Overview

The application is for anyone, who wants something more effective, visually pleasing and functional to track their finances than Excel. Are you a person who has expenses and income? Are you someone who would like to keep track, where that money flows and what you are spending the most on? Then **Keep Track** might be for you. 

Nobody likes to manually enter transactions you make often again and again - that's what KeepTrack's QuickAdd templates are for! You assign a name, amount and a category, creating a new template you can then put in your hotbar displayed on your dashboard.

Do you want to start using KeepTrack and import your transactions? You can do that easily with KeepTrack's smart .csv import, which utilises a small model through OpenRouter, assigning your imported transactions to your created categories.

## Features

- Dedicated frontend and backend
- Smart .csv import
- QuickAdd Templates
- ...

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Docker (optional, but highly recommended if you wanna follow the tutorial)

### Installation

```bash
git clone https://github.com/christoph1j2/keep-track.git
cd keep-track
```

### Usage

```bash
docker compose up -d --build
```

## Configuration

If you plan on running it on a homelab, here is all the stuff you need to know (incl. a tailscale funnel tutorial)

```env
EXAMPLE_VARIABLE=value
```

## Project Structure

```text
.
├── src/
├── tests/
└── README.md
```

## Roadmap

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

- Name: Your Name
- Email: you@example.com
- Repository: https://github.com/christoph1j2/keep-track
