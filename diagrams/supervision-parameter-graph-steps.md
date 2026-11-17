# Supervision Parameter Graph: Step Reference

This file gives a one-line explanation of each numbered step in the [supervision parameter graph sequence diagram](supervision-parameter-graph-sequence.md). Bracketed references such as [A1] point to the example API panels in the diagram.

## Background scrape (one job per interval class: 10 s, 60 s, 300 s)

1. **Scrape** — Prometheus calls the Supervisor's private `GET /metrics/business` endpoint for one interval class [A1].
2. **Return latest values** — The Supervisor returns the latest values of that class. Thanos keeps them as history on network storage and uploads blocks to S3.

## Open the graph

3. **Open graph** — The signed-in user opens the graph page for user service US1. The browser holds only the session cookie; Traefik holds the tokens (list diagram steps 1–7).
4. **Request parameter list** — The micro frontend calls `GET /supervision/v1/user-services/US1/parameters`; the browser sends the session cookie [A2].
5. **Session to token** — Traefik looks up the session, checks the access token's signature, expiry, issuer, audience, and `supervision-api:read`, and forwards the request with `Authorization: Bearer`.
6. **Re-validate and check visibility** — The Supervisor repeats the token checks and checks US1 against the scope the list call cached (`all`, or listed ids). It does not interpret business roles.

## Visibility fallback (US1 not within the cached scope)

This happens only on a cache miss: a deep link, a later list page, an expired entry, another replica, or a new grant.

7. **Request token exchange** — The Supervisor asks Keycloak for a token for the same user, addressed to the Service System.
8. **Receive exchanged token** — Keycloak returns a short-lived token with `aud=service-system`.
9. **Ask about US1** — The Supervisor calls `GET /service-system/v1/user-services/US1` [A3].
10. **Visibility answer** — 200 means visible and is added to the cached scope. 404 means not visible, and the Supervisor returns 404. 403 means no supervision access. 503 means unavailable, and the Supervisor returns 503 [E].

## Parameter catalogue

11. **Load catalogue** — The Supervisor reads US1's parameters from PostgreSQL (SQL, not REST).
12. **Return rows** — PostgreSQL returns the parameter ids, units, and collection intervals.
13. **Return parameters** — The Supervisor returns the parameter catalogue to the micro frontend, through Traefik [A2].

## Load the series

14. **Request series** — The micro frontend calls `GET /supervision/v1/user-services/US1/series` with the selected parameters and time range [A4].
15. **Validate and forward** — Traefik repeats its session and token checks and forwards the request with the Bearer token.
16. **Check and plan** — The Supervisor checks visibility from the cache (404 if not visible), rejects unknown parameters or ranges (400), and picks a step size.
17. **Query Thanos** — The Supervisor calls Thanos Query `GET /api/v1/query_range` with PromQL it built itself, at a coarser resolution for long ranges [A5].
18. **Return samples** — Thanos returns a matrix of samples. If a store such as S3 is unreachable, it returns what it has plus a warning. If Thanos Query is down, the Supervisor returns 503.
19. **Return series** — The Supervisor returns the points with unit, step, last collection time, and a `partial` flag, through Traefik [A4], or an error [E].
20. **Draw chart** — The micro frontend draws the chart.

## Refresh (every 15–30 s while the graph is open)

21. **Request new points** — The micro frontend asks for points after the last one it has; the browser sends only the session cookie [A4].
22. **Validate and forward** — Traefik and the Supervisor repeat the checks of steps 15–16, and Traefik forwards the request with the Bearer token.
23. **Query recent window** — The Supervisor runs a short `query_range`; Thanos serves it from recent data (Sidecar or Receive).
24. **Return new samples** — Thanos returns samples for the short window.
25. **Return new points** — The Supervisor returns only the new points, through Traefik [A4].
26. **Append to chart** — The micro frontend adds the new points to the chart.
