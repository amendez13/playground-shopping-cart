# Supervision Data Access Architecture

Status: decided in [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md) and [ADR 0006](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0006-supervision-history-in-prometheus-and-thanos.md). The visibility rule is provisional and needs detailed review.

![Supervision data access architecture](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/supervision-data-access-architecture.png?raw=true)

Source: [supervision-data-access-architecture.drawio](supervision-data-access-architecture.drawio) · Detailed flows: [list user services](list-my-user-services-sequence.md), [parameter graph](supervision-parameter-graph-sequence.md)

## User read path (1–7)

1. Login (orange, 1a–1c), run by Traefik, which is both the API gateway and the Ingress Controller:
   - 1a. When the browser has no session, Traefik redirects it to the Keycloak login page. Traefik is the confidential client `hmi-gateway` and uses the authorization-code flow with Proof Key for Code Exchange (PKCE).
   - 1b. The user signs in on the Keycloak login page. Neither the HMI nor Traefik sees the password.
   - 1c. Keycloak redirects back to Traefik with a one-time code. Traefik exchanges it for tokens and keeps them in its server-side session store. The access token carries `sub`, groups, business roles (for example `c-admin`, `go-user`), the `supervision-api` audience, and the technical `supervision-api:read` role. The browser gets only an HttpOnly session cookie.
2. The Supervisor-owned micro frontend (Angular/TypeScript, in the HMI's Angular shell) calls `/supervision/v1/…`; the browser sends only the cookie. The micro frontend holds no tokens.
3. Behind the reverse proxy/WAF, Traefik looks up the session, refreshes the token if needed, checks signature (Keycloak JWKS), audience, and `supervision-api:read`, and adds `Authorization: Bearer <access token>`.
4. Traefik's Ingress routes `/supervision/v1/*` to the Supervisor's ClusterIP Service.
5. The Supervision Data API validates the token again. It does not interpret business roles: it exchanges the token for a Service System token and asks the Service System for the user's scope (`all`, `listed` ids, or 403). The answer is cached per user.
6. The API reads the resource provider, status, and parameter catalogue from its PostgreSQL. PostgreSQL holds no user ids and no long-term history.
7. For graphs, the API reads history from Thanos Query with PromQL it builds itself.

## Registration, supervision, and history path (a–f)

The Service System publishes each allocated user service to the AMQP broker, without owner data. The Supervisor consumes the message and supervises the user service through its resource provider's REST API. Prometheus scrapes the latest values from `GET /metrics/business`, one job per interval class, and Thanos keeps the history on network storage with blocks uploaded to S3.

## API resources

| Operation | Purpose |
|---|---|
| `GET /supervision/v1/user-services` | List the user services visible to the caller (paginated) |
| `GET /supervision/v1/user-services/{id}/parameters` | Parameter catalogue: ids, units, collection intervals |
| `GET /supervision/v1/user-services/{id}/series?parameters=&from=&to=` | Parameter history for the graph |

## Open decisions

- The business-role → scope mapping (Service System).
- Scope cache TTL, and per-pod or shared cache.
- Micro frontend asset hosting.
- Thanos retention, Sidecar or Receive, and Supervisor authentication to Thanos Query.
- Pagination and rate limits.
- The Traefik OIDC component, session store, session lifetime with polling, CSRF policy, and back-channel logout.
