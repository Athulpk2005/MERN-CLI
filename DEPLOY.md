# Deployment Runbook — Docker / Compose

Purpose: provide repeatable production deployment steps, health checks, shutdown, and troubleshooting for the generated MERN project templates.

Prerequisites
- Docker (20+)
- docker-compose (v1.27+ or Docker Compose v2)
- Access to a production MongoDB (URI)
- Secrets manager or secure place for credentials (do NOT commit `.env`)

Files in this repo used for deployment
- `templates/server/Dockerfile` — server production image
- `templates/client/Dockerfile` — client multistage build + nginx
- `docker-compose.prod.yml` — example production compose
- `templates/server/.env.template` — required env keys

Required environment variables
- `MONGO_URI` — production MongoDB connection string (required)
- `NODE_ENV` — should be `production`
- `PORT` — server port (default 5000)

Build & run with docker-compose (recommended for small deployments)

Build images:
```bash
docker-compose -f docker-compose.prod.yml build
```

Start services (detached):
```bash
docker-compose -f docker-compose.prod.yml up -d
```

To update and restart with rebuilt images:
```bash
docker-compose -f docker-compose.prod.yml pull || true
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

Direct image build (if you want to push to a registry):
```bash
docker build -t my-registry/mern-app-server:latest -f templates/server/Dockerfile templates/server
docker build -t my-registry/mern-app-client:latest -f templates/client/Dockerfile templates/client
docker push my-registry/mern-app-server:latest
docker push my-registry/mern-app-client:latest
```

Health checks and readiness
- The server exposes two endpoints:
  - `GET /health` — basic liveness (200 when app responding)
  - `GET /ready` — readiness (200 when DB connected, 503 otherwise)

Example checks:
```bash
curl -fsS http://localhost:5000/health
curl -fsS http://localhost:5000/ready || (echo "not ready" && exit 1)
```

Graceful shutdown
- The server listens for `SIGTERM` and `SIGINT` and will:
  1. Stop accepting new connections
  2. Close HTTP server
  3. Disconnect from MongoDB
  4. Exit process
- A 10s force-exit timeout exists to avoid hung processes. When using orchestration, send `SIGTERM` and allow at least 10s for shutdown.

Secrets & env management
- Do not store production secrets in the repo. Use one of:
  - Docker secrets (Swarm)
  - Cloud secret manager (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
  - Environment variables injected by the orchestrator
- The included `docker-compose.prod.yml` references `templates/server/.env.template` as an example. Replace with a secure source in production.

Logging & monitoring
- Container logs: `docker-compose -f docker-compose.prod.yml logs -f` or `docker logs -f <container>`
- Add structured logging (pino/winston) and forward to a log aggregator (ELK, Datadog, Logflare).
- Add metrics and alerting (Prometheus + Alertmanager or cloud provider monitoring).

Zero-downtime / rolling updates
- Docker Compose is simple but not ideal for zero-downtime. For rolling updates consider:
  - Kubernetes (Deployments + Readiness probes)
  - Docker Swarm with rolling update strategy
  - Cloud platform managed services (ECS, GKE, AKS) with load balancer

Backups & persistence
- Ensure MongoDB backups are configured (provider-managed or scheduled mongodump snapshots).

Troubleshooting checklist
- Check container status:
```bash
docker ps --filter "name=mern-app"
```
- See logs:
```bash
docker-compose -f docker-compose.prod.yml logs --tail=200 --follow
```
- Query readiness endpoint:
```bash
curl -v http://localhost:5000/ready
```
- If DB connection fails, confirm `MONGO_URI` and network access, then inspect server logs for stack trace.

CI/CD notes
- The repo includes a basic GitHub Actions CI that builds and audits template packages.
- Extend CI to build Docker images, run integration tests, and push images to a registry on merge to `main`.

Minimal rollback
- If a new release fails, use your registry to `docker pull` the known-good tag and `docker-compose -f docker-compose.prod.yml up -d` with that tag.

Appendix — example quick deploy (one-off)
```bash
# copy env template and edit for production
cp templates/server/.env.template .env
# edit .env and set MONGO_URI and NODE_ENV=production

docker-compose -f docker-compose.prod.yml up -d --build

# check readiness
curl -fsS http://localhost:5000/ready || (docker-compose -f docker-compose.prod.yml logs --tail=200 && exit 1)
```

Security reminders
- Ensure `helmet` is configured appropriately (CSP, hide powered-by).
- Use TLS/HTTPS at the edge (Load balancer or reverse proxy). Do not rely on HTTP in production.

Contact/runbook owner
- Add maintainers and escalation steps here once your team is defined.
