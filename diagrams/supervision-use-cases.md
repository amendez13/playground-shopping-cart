# Supervision Use Cases

Status: proposed list.

## Context

Resource providers (RPs) deliver user services. An RP registers each user service in the Service System, including the supervision parameters to collect and the endpoint to collect them from. The Supervisor learns this only from the registration message the Service System publishes over an AMQP 1.0 message broker; it then polls the RP and makes the values available for history and display. Users see supervision data in the Supervision micro frontend of the Human-Machine Interface (HMI).

| Actor or system | Role |
|---|---|
| RP operator | Registers and maintains user services in the Service System user interface. |
| Service System | Holds user services, their parameters and endpoints, and decides which user services each user may see. |
| Supervisor | Stores registrations, polls RPs, publishes current values, and serves supervision data to the micro frontend. |
| Prometheus and Thanos | Prometheus scrapes current values from the Supervisor; Thanos keeps days of history on network disk and in S3 object storage. |
| Traefik and Keycloak | Traefik is the API gateway and Ingress Controller; it signs users in with Keycloak and keeps their tokens, so the browser holds only a session cookie. |
| HMI user | Views the user services they may access, for example `g-user1`. |
| Platform operator | Sets up the connection to each RP. |

Signing in is a shared step of UC-07 and UC-08, not a separate use case.

## Registration lifecycle

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-01 | Register a user service for supervision | RP operator | The RP registers a user service in the Service System with its endpoint and supervision parameters (id, unit, collection interval). The Service System assigns the user service id and publishes a registration message; the Supervisor stores the registration and schedules collection. The message carries no credentials. |
| UC-02 | Update a user service registration | RP operator | A change to the parameter list or endpoint is published as a new revision. The Supervisor applies it and ignores duplicate or older revisions. |
| UC-03 | Deregister a user service | Service System | The Service System removes a user service; the Supervisor stops collecting it. Existing history stays in Thanos until its retention expires. |
| UC-04 | Onboard a resource provider connection | Platform operator | Once per RP, before its first poll: set up how the Supervisor authenticates to the RP (for example OAuth client credentials or mutual TLS), which server certificates to trust, and the RP's rate limits and timeouts, under a named connection profile. Credentials are kept in a Kubernetes Secret, never in the Supervisor database or the registration message. Every user service of that RP reuses the profile; a registration naming an unknown profile cannot be collected. Who owns this step is open. |

## Collection and history

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-05 | Collect supervision data | Supervisor scheduler | When an interval class (10 s, 60 s, or 300 s) is due, the Supervisor polls the RP for that class's parameters at the registered endpoint, using the RP's connection profile. Retries, rate limits, and failure isolation apply per RP. |
| UC-06 | Publish supervision history | Prometheus | Prometheus scrapes the latest values from the Supervisor's private `/metrics/business` endpoint; Thanos keeps days of history. |
| UC-09 | Process provider measurements | Supervisor | Validate, normalize, and record collected values with observation time, quality, and provenance, so unreliable data is never shown as authoritative. |
| UC-10 | Compute business metrics and KPIs | Supervisor | Derive business metrics and key performance indicators (KPIs) from validated data, tracking freshness, quality, and calculation version. |

## User-facing (Supervision micro frontend)

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-07 | List visible user services | HMI user | The user opens Supervision and sees the user services they may access, with provider, status, and freshness. The Service System decides visibility; the Supervisor never interprets business roles. If the Service System is unavailable, the list fails rather than showing all services. |
| UC-08 | View a user service's parameter chart | HMI user | The user selects a user service and parameters; the Supervisor returns the parameter catalogue and the history from Thanos, and the chart refreshes every 15–30 s. A user service the user may not see is reported as not found. |
| UC-11 | View business KPIs | HMI user | Show calculated KPIs and their trends for the user services the user may access. Depends on UC-10. |

## Thresholds and alerting

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-12 | Define metric thresholds | Authorized user | Configure warning and critical thresholds for selected metrics or KPIs, with scope, evaluation window, and recovery condition. |
| UC-13 | Evaluate thresholds and manage alerts | Alert-evaluation capability | Evaluate thresholds and track alert activation, suppression, acknowledgement, and recovery. Missing or stale data is a data-availability condition, never a healthy result. |
| UC-14 | Send notifications | Notification capability | Notify the responsible owners of sustained conditions, with deduplication and recovery messages, and without credentials or raw provider payloads. |

## Open questions

- UC-04: who provisions connection profiles and credentials for a new RP.
- UC-10, UC-11: which metrics and KPIs are defined.
- UC-12 to UC-14: which capability evaluates thresholds and sends notifications.
