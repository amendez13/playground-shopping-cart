# Supervision HTTP Request Catalogue

Status: illustrative, collected from the supervision diagrams and the [Supervision Data API draft](https://github.com/amendez13/ms-tc-pg/blob/main/contracts/supervision-data/openapi.yaml). Only the Supervision Data API (H08–H10) has a committed contract; the other rows follow external standards or are proposals. Hosts, ids, and values are placeholders.

Every request uses HTTPS. "Bearer" means an `Authorization: Bearer <token>` header; "Basic" means confidential-client authentication with the client's credentials, which never appear in documents.

## Sign-in (Traefik holds the tokens)

| ID | Method and path | Description | Sender | Receiver | Parameters |
|---|---|---|---|---|---|
| H01 | `GET /supervision/` (any HMI page) | First page load without a session; Traefik answers 302 to the Keycloak login. | Browser | Traefik | None; no session cookie yet |
| H02 | `GET /realms/platform/protocol/openid-connect/auth` | Authorization request (code flow with PKCE); returns the Keycloak login page. | Browser (redirected by Traefik) | Keycloak | `response_type=code`, `client_id=hmi-gateway`, `redirect_uri`, `scope=openid`, `state`, `code_challenge`, `code_challenge_method=S256` |
| H03 | `POST` Keycloak login form | The user submits credentials (and MFA if enabled); Keycloak redirects to the Traefik callback. Keycloak-owned form, not a project contract. | Browser | Keycloak | Username, password |
| H04 | `GET /oauth2/callback` | Redirect back with a one-time code; Traefik completes login and sets the session cookie. | Browser (redirected by Keycloak) | Traefik | `code`, `state` |
| H05 | `POST /realms/platform/protocol/openid-connect/token` | Exchanges the code for access, refresh, and ID tokens, kept in Traefik's session store. | Traefik | Keycloak | Basic (`hmi-gateway`); `grant_type=authorization_code`, `code`, `redirect_uri`, `code_verifier` |
| H06 | `POST /realms/platform/protocol/openid-connect/token` | Refreshes the access token when it is near expiry. | Traefik | Keycloak | Basic (`hmi-gateway`); `grant_type=refresh_token`, `refresh_token` |
| H07 | `GET /realms/platform/protocol/openid-connect/certs` | Fetches the signing keys (JWKS) to validate access tokens; cached. | Traefik, Supervisor | Keycloak | None |

## Supervision Data API (user-facing)

Each call has two hops: the browser sends the session cookie to Traefik, and Traefik forwards it to the Supervisor with Bearer (the user's access token). Contract: [openapi.yaml](https://github.com/amendez13/ms-tc-pg/blob/main/contracts/supervision-data/openapi.yaml).

| ID | Method and path | Description | Sender | Receiver | Parameters |
|---|---|---|---|---|---|
| H08 | `GET /supervision/v1/user-services` | Lists the user services the caller may see, with provider, status, and freshness. | Browser, via Traefik | Supervisor (Supervision Data API) | `pageSize`, `pageToken` |
| H09 | `GET /supervision/v1/user-services/{userServiceId}/parameters` | Returns the parameter catalogue of one user service (id, name, unit, collection interval). | Browser, via Traefik | Supervisor (Supervision Data API) | Path `userServiceId` |
| H10 | `GET /supervision/v1/user-services/{userServiceId}/series` | Returns the time series for the chart, with a `partial` flag. The 15–30 s refresh repeats it with `from` set to the last point. | Browser, via Traefik | Supervisor (Supervision Data API) | Path `userServiceId`; `parameters` (comma-separated ids), `from`, `to` |

## Visibility (Supervisor asks the Service System)

| ID | Method and path | Description | Sender | Receiver | Parameters |
|---|---|---|---|---|---|
| H11 | `POST /realms/platform/protocol/openid-connect/token` | Token exchange (RFC 8693): turns the user's token into one for the Service System, same user. | Supervisor | Keycloak | Basic (`supervision-api`); `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token`, `subject_token_type`, `requested_token_type`, `audience=service-system` |
| H12 | `GET /service-system/v1/user-services` | Returns the caller's scope: `all`, a page of `listed` ids, or 403. The Supervisor caches the answer per user. | Supervisor | Service System | Bearer (exchanged token); `pageSize`, `pageToken`, `fields=userServiceId` |
| H13 | `GET /service-system/v1/user-services/{userServiceId}` | Fallback when an id is not in the cached scope: 200 visible, 404 not visible, 403 no access. | Supervisor | Service System | Bearer (exchanged token); path `userServiceId`; `fields=userServiceId` |

## Collection and history

| ID | Method and path | Description | Sender | Receiver | Parameters |
|---|---|---|---|---|---|
| H14 | `GET {endpoint}/user-services/{userServiceId}/measurements` | Polls the resource provider for one interval class's parameters. Endpoint and parameter ids come from the registration message; the shape is illustrative and must be qualified per provider. | Supervisor | Resource provider (e.g. RP-A) | Credentials from the provider's connection profile (e.g. Bearer); path `userServiceId`; `parameters` |
| H15 | `GET /metrics/business` | Scrape of the latest business values in Prometheus exposition format; private, never publicly routed. | Prometheus | Supervisor | `interval` (`10s`, `60s`, or `300s`; one scrape job each) |
| H16 | `GET /api/v1/query_range` | Range query for the chart, with PromQL built by the Supervisor from allowlisted ids. | Supervisor | Thanos Query | `query`, `start`, `end`, `step`, `max_source_resolution`, `partial_response` |

## Service registration and request

| ID | Method and path | Description | Sender | Receiver | Parameters |
|---|---|---|---|---|---|
| H17 | Service System UI (not defined here) | The resource provider registers a service with its endpoint and supervision parameters. Owned by the Service System. | Browser (RP operator) | Service System | Provider, endpoint, parameter list (id, unit, collection interval) |
| H18 | Service request UI (not defined here) | A user requests a registered service for a start and an end datetime. Owned by the Service System. | Browser (HMI user) | Service System | Service id, start datetime, end datetime; returns the assigned `userServiceId` |
| H19 | Service request UI (not defined here) | The user cancels a requested user service, before or during its period. Owned by the Service System. | Browser (HMI user) | Service System | `userServiceId` |

At the start datetime the Service System instantiates the user service and notifies the Supervisor with `UserServiceRegistered`; at the end datetime or on cancellation it removes it and sends `UserServiceDeregistered`. These are AMQP messages, not HTTP, and are not listed here.

Whether H08–H10 still return an ended or cancelled user service while its history is retained is open.

## Not listed

Operational endpoints (`GET /health/ready`, `GET /health/live`, and the technical `GET /metrics`) are covered in [Supervisor Container Runtime, Configuration, and Observability](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/supervisor-runtime-and-observability.md).

## Sources

- [Supervision end-to-end storyboard](supervision-end-to-end-storyboard.md)
- [List user services sequence](list-my-user-services-sequence.md): H01–H08, H11, H12
- [Parameter graph sequence](supervision-parameter-graph-sequence.md): H09, H10, H13, H15, H16
- [User service registration storyboard](user-service-registration-storyboard.md): H14, H17
- [Supervision data access architecture](supervision-data-access-architecture.md): H17, H18
