# Frontend

The frontend is a React, Vite, and TypeScript application for browsing the seeded software engineering book catalog, exercising local cart interactions, and previewing simulator demand weights.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The Vite development server listens on port `5173`.

## Checks

```bash
cd frontend
npm run lint
npm run test
npm run build
```

## Container

Build the image from the repository root so the Docker build can include the shared catalog seed file:

```bash
docker build -f frontend/Dockerfile -t playground-shopping-cart-frontend:local .
docker run --rm -p 5173:8080 playground-shopping-cart-frontend:local
```

Docker Compose uses the same production image:

```bash
docker compose up --build frontend
```

The container serves the built static site with unprivileged Nginx on port `8080`.

## ECS Runtime Notes

Use the production image built by `frontend/Dockerfile` for ECS. The expected container settings are:

- Container port: `8080`
- Protocol: `HTTP`
- Health check path: `/health`
- Health check command: `wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1`

The first version is a static UI backed by the seed catalog at build time. When the cart service API exists, add an environment-specific API base URL and route catalog/cart actions through that service.
