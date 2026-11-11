# Development

## Requirements

- Node.js 20 or newer
- pnpm

## Start

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The learning content and games work without signing in. Registration, verification, account recovery, shared community features, and saved account progress need the API, PostgreSQL, and an SMTP service. See the [API setup guide](../server/docs/api.md) for the local Mailpit inbox and provider settings.

## Quality checks

```sh
pnpm test
pnpm build
pnpm api:test
pnpm api:build
```

For the API, PostgreSQL and environment configuration are also required. Follow [the API setup guide](../server/docs/api.md) before starting it.
