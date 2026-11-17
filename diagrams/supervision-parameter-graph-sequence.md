# Supervision Parameter Graph: Populate and Refresh from Prometheus and Thanos

Status: illustrative proposal under [ADR 0006](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0006-supervision-history-in-prometheus-and-thanos.md) and [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md). The visibility model is provisional (see [list user services](list-my-user-services-sequence.md)).

![Supervision parameter graph sequence](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/supervision-parameter-graph-sequence.png?raw=true)

Source: [supervision-parameter-graph-sequence.drawio](supervision-parameter-graph-sequence.drawio) · Step reference: [supervision-parameter-graph-steps.md](supervision-parameter-graph-steps.md)

## Decisions shown

- History lives in Prometheus and Thanos. Prometheus scrapes the Supervisor's private `GET /metrics/business`, and Thanos keeps the history on network storage and uploads blocks to S3. The Supervisor PostgreSQL holds no long-term history, and resource providers are not queried for history.
- Collection runs continuously for every supervised user service. The scrape is the only path into history, so a service that is not collected has no history.
- There is one scrape job per interval class (10 s, 60 s, 300 s). Each value is stored once, at its own collection interval.
- Prometheus, Thanos, and Grafana have no per-user authorization, so the browser never queries them. Only the Supervision Data API calls Thanos Query, with PromQL it builds from allowlisted parameter ids and the requested user-service id.
- The list call caches the user's scope from the Service System (`all`, or listed ids). The graph checks US1 against that scope; the Supervisor never interprets business roles. The Service System is called only on a miss (steps 7–10). An id the user may not see returns 404.
- If Thanos Query is down, the API returns 503 (degraded visibility under ADR 0004; collection continues). If a store such as S3 is unreachable, the API returns 200 with `"partial": true` and the data that is available.
- The chart polls every 15–30 s and asks only for points after the last one it already has.

## Requirements used

| Item | Value | Consequence |
|---|---|---|
| History | days | Thanos retention ≥ the longest graph range; downsampled data (5 min, 1 h) for long ranges |
| Freshness | 15–30 s behind real time is acceptable | collection + 10 s scrape stays within it; recent data comes from the Thanos Sidecar or Receive |
| Parameters | 30 per user service: 10 × 10 s, 10 × 60 s, 10 × 300 s | 30 series per user service; about 6,000 samples/s at 5,000 services |
| Live update | the chart refreshes itself every 15–30 s | the scope cache keeps polling from calling the Service System |

The server picks the query step from the range (about 1,000 points per series), never below the parameter's collection interval. For example, 6 hours uses 30 s steps.

## REST APIs involved

| Ref | API | Owner |
|---|---|---|
| A1 | `GET /metrics/business?interval=…` (Prometheus exposition, scraped, private) | Supervisor |
| A2 | `GET /supervision/v1/user-services/{id}/parameters` | Supervisor |
| A3 | `GET /service-system/v1/user-services/{id}` (caller-filtered; fallback only) | Service System |
| A4 | `GET /supervision/v1/user-services/{id}/series?parameters&from&to` | Supervisor |
| A5 | `GET /api/v1/query_range` (Thanos Query, Prometheus-compatible HTTP API) | Platform observability |

Token exchange uses the same call as [A5] in the list diagram. Example requests and responses, plus the 400/401/403/404/503 problem+json errors, are in the diagram. Hosts, ids, values and tokens are fake placeholders. The Supervisor-to-PostgreSQL step is SQL, not REST.

## Open

- Approval of the `user_service_id` label under ADR 0004 (cardinality and privacy). For example, 5,000 services × 30 parameters is 150,000 series.
- Thanos Sidecar or Receive, retention per resolution, and the S3 lifecycle.
- How the Supervisor authenticates to Thanos Query, in addition to the NetworkPolicy.
- The metric names and whether the `interval` scrape parameter is the selection mechanism.
- The scope cache TTL (it bounds how long revoked access remains visible) and whether the cache is per pod or shared.
- OpenAPI documents for A2–A4.
