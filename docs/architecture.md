# Architecture Notes

## System Components

The project will start with two backend services and one shared frontend:

- Shopping cart service: owns carts, line items, totals, and checkout-like operations.
- Purchase simulator: generates synthetic users, sessions, product selections, cart updates, and purchases.
- Frontend: provides a common UI for manual interaction, operational views, and experiment visualization. The initial frontend is a React, Vite, and TypeScript application packaged as an ECS-ready static container served by unprivileged Nginx on port `8080`.

The customer workflow will include authentication, persisted carts, checkout, order history, and order detail tracking. The frontend separates customer views from store-owner operational views. The current frontend models those screens with client-side state until the cart service exposes the API described in `docs/auth-sessions-orders.md`.

## Deployment Direction

Services will be packaged as containers and deployed on AWS ECS. The cart service can begin on regular ECS capacity, while the simulator can run as Fargate tasks for bursty experiment workloads.

Terraform will provision infrastructure, including networking, ECS clusters/services/tasks, IAM, load balancers, log groups, and observability integrations.

## Observability Direction

The project should expose:

- Request rates, latency, and errors per service.
- Business-level metrics such as cart creation, item additions, purchases, and abandoned carts.
- Runtime metrics such as CPU, memory, garbage collection, and container restarts.
- Experiment-level metrics that connect workload settings to observed service behavior.
