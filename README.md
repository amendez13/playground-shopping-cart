# Playground Shopping Cart

Playground Shopping Cart is an experimental microservices project for comparing web stacks, service runtimes, container deployment patterns, and observability approaches.

## Goals

- Build a shopping cart service in one backend language.
- Build a synthetic purchasing simulator in another backend language.
- Share a common JavaScript frontend across the services.
- Package services as containers and deploy them to AWS ECS.
- Provision AWS infrastructure with Terraform.
- Add observability with Prometheus, Grafana, logs, traces, and dashboards.
- Run repeatable performance experiments and visualize the results.

## Planned Architecture

- `frontend/`: JavaScript framework application for interacting with the system and viewing experiment results.
- `services/cart/`: Shopping cart microservice.
- `services/purchase-simulator/`: Synthetic user or multi-user purchase simulator.
- `infra/terraform/`: AWS infrastructure definitions for ECS, networking, IAM, load balancing, and supporting resources.
- `observability/`: Prometheus, Grafana, dashboard, alerting, and telemetry configuration.
- `experiments/`: Workloads, scenarios, raw results, and analysis notebooks or scripts.
- `docs/`: Design notes, architecture decisions, and operating guides.

## Candidate Stack

The exact stack is intentionally open so experiments can compare technologies. Initial candidates:

- Cart service: Java, Python, or Go.
- Purchase simulator: a different language from the cart service.
- Frontend: React, Vue, Svelte, or another JavaScript framework.
- Runtime: Docker containers on AWS ECS and AWS Fargate.
- Observability: Prometheus, Grafana, OpenTelemetry, and AWS CloudWatch.
- Infrastructure: Terraform.

## First Milestones

1. Select languages and frameworks for the first cart and simulator implementations.
2. Define service APIs and synthetic purchase event models.
3. Add local development with Docker Compose.
4. Add baseline instrumentation and service-level metrics.
5. Create Terraform modules for the first ECS deployment.
6. Define benchmark scenarios and result schemas.

