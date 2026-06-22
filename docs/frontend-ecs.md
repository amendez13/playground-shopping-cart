# Frontend ECS Container

The frontend container is designed to run as an ECS web service behind an Application Load Balancer.

## Image

Build from the repository root:

```bash
docker build -f frontend/Dockerfile -t playground-shopping-cart-frontend:<tag> .
```

The Dockerfile uses:

- A Node build stage to compile the Vite application.
- An unprivileged Nginx runtime stage to serve static assets.
- The shared `docs/catalog.seed.json` file as build-time seed data for the initial static catalog view.

## ECS Task Settings

Use these initial task settings:

| Setting | Value |
| --- | --- |
| Container port | `8080` |
| Protocol | `HTTP` |
| Health endpoint | `/health` |
| CPU architecture | `x86_64` or `arm64` |
| Required environment variables | None |

The container-level health check can use:

```bash
wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
```

The load balancer target group should also use `/health` as the HTTP health check path.

## Follow-Up Infrastructure

Terraform should later add:

- An ECR repository for the frontend image.
- An ECS task definition using container port `8080`.
- An ECS service attached to the project load balancer.
- CloudWatch log configuration for Nginx access and error logs.
- A deployment variable for the frontend image tag.
