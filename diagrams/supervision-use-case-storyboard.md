# Supervision Use Case: Sign In, Pick a User Service, View Parameters

Status: illustrative storyboard for [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md) and [ADR 0006](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0006-supervision-history-in-prometheus-and-thanos.md). The screens are mock-ups, not a user interface (UI) design; names, ids, and values are fake.

![Supervision use case storyboard](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/supervision-use-case-storyboard.png?raw=true)

Source: [supervision-use-case-storyboard.drawio](supervision-use-case-storyboard.drawio)

## What it shows

g-user1 sits at a workstation and uses the Human-Machine Interface (HMI) in a web browser. The top row shows the three screens they see; the bottom row shows what happens behind each one.

1. **Sign in.** Traefik sends the browser to the Keycloak login page. After sign-in, Traefik keeps the tokens in its session store and the browser holds only a session cookie. Detail: [list diagram](list-my-user-services-sequence.md), steps 1–7.
2. **Pick a user service.** The Supervisor asks the Service System which user services g-user1 may see, adds status and freshness from its PostgreSQL, and returns the list. Detail: [list diagram](list-my-user-services-sequence.md), steps 8–20.
3. **View parameters and chart.** After g-user1 clicks US-1001, the Supervisor reads the parameter catalogue from PostgreSQL and the history from Thanos Query, and the chart refreshes every 15–30 s. Detail: [parameter graph diagram](supervision-parameter-graph-sequence.md).

Every browser call goes to Traefik with the session cookie; Traefik forwards it to the Supervisor with the user's access token. The browser never calls the Keycloak API, the Service System, or Thanos directly.
