# List My User Services: Authentication and Visibility

Status: illustrative proposal under [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md). The visibility model is provisional and needs detailed review.

![List my user services sequence](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/list-my-user-services-sequence.png?raw=true)

Source: [list-my-user-services-sequence.drawio](list-my-user-services-sequence.drawio) · Step reference: [list-my-user-services-steps.md](list-my-user-services-steps.md)

## Decisions shown

- Traefik is both the API gateway and the Ingress Controller. It is the confidential Keycloak client (`hmi-gateway`): it runs the login, keeps the tokens in a server-side session store, and gives the browser only an HttpOnly session cookie (backend-for-frontend pattern). It forwards the real access token to the Supervisor as `Authorization: Bearer`, which the Supervisor re-validates and uses for token exchange.
- The Supervisor owns the Supervision micro frontend (Angular/TypeScript) and its user-facing Supervision Data API.
- Only the Service System knows which user or group owns a user service. The Supervisor maps user service → resource provider and stores no user ids.
- Users hold business roles (`c-admin`, `c-operator`, `e-admin`, `e-operator`, `g-manager`, `g-operator`, `go-user`). Only the Service System knows what each may see. It maps roles plus ownership to a scope: `all`, `listed` ids, or no access (403). The Supervisor never interprets business roles; it and the gateway check only the technical `supervision-api:read` role, granted to every HMI user.
- The first operation is a paginated `GET /supervision/v1/user-services`. It is one collection for every role, and the results depend on the caller's visibility: users with scope `all` see all supervised services, others see the ids the Service System lists. There is no `/me` path, so each service has one URL (`/user-services/{id}`) for every caller. Responses are caller-specific (`Cache-Control: private, no-store`, `Vary: Authorization`).
- For every user whose scope is not cached, the Supervisor exchanges the user's token for a Service System token through Keycloak (RFC 8693) and asks the Service System which ids the user may see. Because the Service System decides from a Keycloak-issued token for that user, the Supervisor cannot ask on behalf of anyone else.
- If the Service System is unavailable, the API returns 503 and never falls back to showing everything. Per-service calls repeat the visibility check and return 404 when the id is not visible.

## REST APIs involved

| Ref | API | Owner |
|---|---|---|
| A1 | `GET /realms/{realm}/protocol/openid-connect/auth` (authorization code + PKCE, redirect started by Traefik) | Keycloak |
| A2 | `POST /realms/{realm}/protocol/openid-connect/token` (code exchange by Traefik) and the session cookie Traefik sets | Keycloak, Traefik |
| A3 | `GET /realms/{realm}/protocol/openid-connect/certs` (JWKS) | Keycloak |
| A4 | `GET /supervision/v1/user-services` | Supervisor |
| A5 | `POST /realms/{realm}/protocol/openid-connect/token` (token exchange) | Keycloak |
| A6 | `GET /service-system/v1/user-services` (caller-filtered; `fields=userServiceId` optional) | Service System |

Example requests and responses, plus the 401/403/404/503 problem+json errors, are in the diagram. The realm, hosts, ids and tokens are fake placeholders. The Supervisor-to-PostgreSQL step is SQL, not REST.

## Open

- The Traefik OIDC component (for example ForwardAuth with oauth2-proxy, or an OIDC middleware), its session store, session lifetime with 15–30 s polling, CSRF policy, and Keycloak back-channel logout.
- The exact business-role → scope mapping (owned by the Service System).
- The cache TTL for each user's scope.
- Whether the Keycloak version selected supports standard token exchange (26.2+).
- Pagination tokens across the Supervisor and Service System pages.
- Formal OpenAPI documents for A4 and A6, and whether A6 is also the Service System's own user-facing list. A6 is not publicly routed: a NetworkPolicy allows only the Supervisor, and calls must carry the `service-system` audience.
