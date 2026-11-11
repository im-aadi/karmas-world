# Contributing to Karma's World

Thank you for your interest in contributing to **Karma's World** — a free cybersecurity learning platform dedicated to making cybersecurity education accessible, engaging, and practical for learners worldwide.

## Core Philosophy

> **Learn. Practice. Explore. Master Cybersecurity.**

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, considerate, and collaborative.

## Security & Educational Safety Rules

Because Karma's World is a cybersecurity education platform, security and safety are foundational:

1. **No Real-World Exploits Against Unauthorized Targets**: Educational exercises and interactive demos must run strictly in simulated browser environments or safely isolated, short-lived sandboxes.
2. **Never Commit Secrets**: Never commit `.env` files, API keys, passwords, database credentials, or private cryptographic keys to the repository.
3. **Defense-in-Depth**: All user inputs must be validated with schemas (e.g., Zod), parameterized queries (Prisma), proper output encoding, CSRF protection, and strict rate limiting.
4. **No Arbitrary Command Execution**: Learner-submitted text must never be executed directly on the host server.

## Getting Started

### Prerequisites

- **Node.js**: v20 or newer (v26+ supported)
- **pnpm**: Fast, disk space-efficient package manager
- **Docker Desktop**: For running local PostgreSQL and Mailpit services
- **Git**: For version control

### Setup Instructions

1. Clone the repository:
   ```sh
   git clone https://github.com/adityakashyap/karmas-world.git
   cd karmas-world
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in the root and in `server/.env`.
   - Ensure a secure random string is set for `SESSION_SECRET` in `server/.env`.

4. Start backing services (PostgreSQL & Mailpit):
   ```sh
   docker compose up -d database mailpit
   ```

5. Run database migrations:
   ```sh
   pnpm --filter @karmas-world/api db:deploy
   ```

6. Start development servers:
   ```sh
   # Frontend (Vite)
   pnpm dev

   # Backend API (Express)
   pnpm api:dev
   ```

## Development Quality Checks

Before submitting any code, verify that all checks and tests pass:

```sh
# Run frontend tests
pnpm test

# Build frontend
pnpm build

# Run backend tests
pnpm api:test

# Build backend
pnpm api:build
```

## Commit Guidelines

We follow standard Conventional Commits:

- `feat:` A new user-facing feature or enhancement
- `fix:` A bug fix
- `security:` Security hardening or vulnerability fixes
- `test:` Adding or updating tests
- `docs:` Documentation updates
- `chore:` Maintenance, dependency updates, or configuration changes

## Submitting Pull Requests

1. Fork the repo and create your branch from `main`:
   ```sh
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with meaningful commit messages.
3. Push to your branch and open a Pull Request.
4. Describe the changes, tests performed, and any relevant context in the PR description.
