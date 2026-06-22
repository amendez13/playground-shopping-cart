# AGENTS.md

## Project Intent

This repository is a playground for learning and comparing microservice implementation styles, container deployment patterns, AWS ECS operations, and observability. Keep changes oriented toward repeatable experiments and clear comparisons between technologies.

## Working Principles

- Prefer small, independently runnable services over shared monolith code.
- Keep each service language-specific and idiomatic.
- Use explicit API contracts between services.
- Make local development reproducible before adding cloud deployment complexity.
- Instrument services from the beginning with metrics, structured logs, and traces where practical.
- Keep benchmark scenarios and results versioned so experiments can be repeated.

## Repository Layout

- `frontend/`: Common JavaScript frontend.
- `services/cart/`: Shopping cart service.
- `services/purchase-simulator/`: Synthetic purchase simulator.
- `infra/terraform/`: AWS infrastructure-as-code.
- `observability/`: Prometheus, Grafana, dashboards, alerts, and telemetry configuration.
- `experiments/`: Load scenarios, synthetic data, result files, and analysis.
- `docs/`: Architecture notes and decisions.

## Coding Guidance

- Do not mix implementation languages inside one service unless there is a clear build/runtime reason.
- Keep service boundaries explicit: API schema, container image, config, health checks, and metrics endpoint.
- Prefer Dockerfiles that can run in CI and locally without hidden host dependencies.
- Add tests with each service implementation. Use language-native test tooling.
- For performance experiments, record enough context to explain the result: service version, container config, ECS/Fargate configuration, workload shape, dataset, and metric window.
- Terraform should be modular enough to support multiple experiment environments without duplicating entire stacks.

## Frontend Stack Decision

Use React with Vite and TypeScript for the common frontend unless a later decision record explicitly changes this.

Recommended supporting libraries:

- TanStack Query for API state and request lifecycle handling.
- React Router or TanStack Router for application navigation.
- Mantine for practical dashboard and form UI components.
- Apache ECharts or Plotly for experiment and performance visualizations.

Rationale:

- The frontend is expected to include operational dashboards, experiment result views, forms, control panels, and API clients for multiple services.
- React has the broadest ecosystem for charts, tables, dashboards, component libraries, and API integration.
- Vite keeps local development and build configuration lightweight.
- TypeScript is important because the UI will consume service APIs and experiment result schemas.
- Next.js is not the default choice unless the project later needs server-side rendering, auth-heavy app routing, or backend-for-frontend behavior.

## Database Decision

Use PostgreSQL as the primary database for persisted store state.

In this playground, PostgreSQL should run as a container by default:

- Local development: run PostgreSQL as a Docker Compose service.
- AWS playground deployment: run PostgreSQL as its own ECS service or task.
- Persistent storage is optional and should be added only when an experiment needs state across restarts.
- RDS or Aurora PostgreSQL may be added later as a comparison point, but they are not the default.

Rationale:

- The project is a playground, not a production system, so managed database concerns such as backups, failover, patching, and recovery are not the main driver.
- Running PostgreSQL as a container keeps the database inside the same container and ECS learning surface as the application services.
- A containerized database makes it easier to explore service discovery, networking, volumes, health checks, metrics, and operational behavior.
- PostgreSQL still gives realistic database behavior for transactions, indexes, concurrent synthetic users, and performance experiments.
- SQLite may be used for lightweight tests, fixtures, or throwaway prototypes, but it is not the project database.

## Documentation Guidance

- Capture major decisions in `docs/decisions/`.
- Keep benchmark methodology in `experiments/`.
- Update the README when repository structure, stack choices, or setup commands change.
