# Deployment Runbook — (Docker option removed)

This repository no longer includes Docker deployment artifacts. The project templates are intended to be run directly (Node + Vite) or deployed via your preferred cloud platform's build/deploy pipeline.

If you need Docker support later, restore the appropriate `Dockerfile` and `docker-compose` examples from version control history or re-add them using the project scaffolder.

Quick notes for non-containerized deployment
- Start the server locally:

```bash
cd templates/server
npm install
NODE_ENV=production MONGO_URI="<your-mongo-uri>" PORT=5000 node server.js
```

- Build and serve the client locally (Vite):

```bash
cd templates/client
npm install
npm run build
npx serve -s dist  # or configure your static file host
```

Health and readiness endpoints remain available on the server:
- `GET /health` — liveness
- `GET /ready` — readiness (checks DB connection)

Secrets and environment variables should be provided by your environment or cloud platform (do not commit `.env` to the repo).

For CI changes, remove or update workflows that referenced Docker images (previously under `.github/workflows/`).

If you'd like, I can:
- update CI to remove Docker build/publish steps
- remove any remaining Docker references in docs and code
- add platform-specific deployment examples (Heroku, Vercel, Railway, or cloud providers)


