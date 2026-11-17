# List User Services: Step Reference

This file gives a one-line explanation of each numbered step in the [list user services sequence diagram](list-my-user-services-sequence.md). Bracketed references such as [A1] point to the example API panels in the diagram.

## Login (Traefik holds the tokens)

1. **Open Supervision view** — The user opens the HMI Supervision view; the browser has no session cookie yet.
2. **Redirect to login** — Traefik, the confidential Keycloak client `hmi-gateway`, redirects the browser to the Keycloak authorization endpoint with a PKCE challenge [A1].
3. **Sign in** — The user enters their credentials (and MFA, if enabled) on the Keycloak login page; neither the HMI nor Traefik sees the password.
4. **Return auth code** — Keycloak redirects the browser to Traefik's callback with a one-time authorization code.
5. **Exchange code for tokens** — Traefik sends the code, its PKCE verifier, and its client credentials to the Keycloak token endpoint [A2].
6. **Store tokens** — Keycloak returns access, refresh, and ID tokens. Traefik keeps them in its server-side session store; they never reach the browser.
7. **Set session cookie** — Traefik redirects back to the page and sets an HttpOnly, Secure, SameSite session cookie [A2].

## List request

8. **Request the list** — The micro frontend calls `GET /supervision/v1/user-services`; the browser sends only the session cookie [A4].
9. **Session to token** — Traefik looks up the session, refreshes the access token if it is near expiry, and checks its signature (JWKS, cached [A3]), audience, and `supervision-api:read`.
10. **Forward with Bearer** — Traefik forwards the request with `Authorization: Bearer <access token>` [A4].
11. **Re-validate and check cache** — The Supervision Data API repeats the token checks and looks for this user's cached scope. It does not interpret business roles.

## Visibility lookup (scope not cached)

12. **Request token exchange** — The Supervisor asks Keycloak to exchange the user's token for one addressed to the Service System [A5].
13. **Receive exchanged token** — Keycloak returns a short-lived token for the same user with `aud=service-system`.
14. **Ask for visible services** — The Supervisor calls `GET /service-system/v1/user-services` with the exchanged token [A6].
15. **Apply visibility rule** — The Service System maps the user's business roles (for example `c-admin`, `go-user`) and ownership to a scope: all, listed ids, or no access.
16. **Return scope** — The Service System returns `all`, or a page of `listed` ids, or 403. The Supervisor caches the scope; it returns 403 for no access and 503 if the Service System is unavailable [E].

If the scope is already cached, steps 12–16 are skipped.

## Response

17. **Load supervision data** — The Supervisor queries its PostgreSQL for the listed ids, or all user services for scope `all` (paged), with resource provider, status, and freshness (SQL, not REST).
18. **Return rows** — PostgreSQL returns the matching rows.
19. **Return the page** — The Supervisor returns one page of user services with a `nextPageToken`, or an error [A4] [E].
20. **Show the list** — The micro frontend displays the user's visible services.
