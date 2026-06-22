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

## Documentation Guidance

- Capture major decisions in `docs/decisions/`.
- Keep benchmark methodology in `experiments/`.
- Update the README when repository structure, stack choices, or setup commands change.

