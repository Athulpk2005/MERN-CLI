# create-mern-app (MERN Scaffolder CLI)

Quick scaffolder to generate a production-ready MERN (MongoDB, Express, React, Node) monorepo.

## Quickstart

- Using npx (recommended):

```
npx create-mern-app my-app
```

- Non-interactive with sensible defaults:

```
npx create-mern-app my-app -y
```

- Choose TypeScript template:

```
npx create-mern-app my-app --template typescript
```

## What it creates

- `client/` — Vite + React frontend (JS or TS)
- `server/` — Express backend
- `package.json` at root with `client`, `server`, and `dev` scripts

## Local development (for contributors)

Run the CLI locally for testing:

```powershell
npm run start -- my-app
# or non-interactive:
npm run start -- my-app -y
```

## Flags

- `-y, --yes`: skip interactive prompts and use sensible defaults.
- `-t, --template <javascript|typescript>`: choose template type.

## Contributing

Feel free to open issues or pull requests to improve templates, defaults, and docs.

## License

MIT
