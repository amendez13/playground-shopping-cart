# Supervision Use Cases

Status: proposed list.

## Context

Resource providers (RPs) register services in the Service System, including the supervision parameters to collect and the endpoint to collect them from. Users request a registered service for a start and an end datetime, and the Service System assigns a user service id to the request. At the start datetime the Service System instantiates the user service and notifies the Supervisor over an AMQP 1.0 message broker. The Supervisor learns the parameters and endpoint only from that message; it then polls the RP and makes the values available for history and display. Users see supervision data in the Supervision micro frontend of the Human-Machine Interface (HMI).

| Actor or system | Role |
|---|---|
| RP operator | Registers and maintains services in the Service System user interface. |
| HMI user | Requests services for a start and an end datetime, can cancel them, and views the user services they may access, for example `g-user1`. |
| Service System | Holds registered services with their parameters and endpoints, assigns a user service id to each request, instantiates the user service at its start datetime and removes them at their end datetime or on cancellation, and decides which user services each user may see. |
| Supervisor | Stores user services, polls RPs, publishes current values, and serves supervision data to the micro frontend. |
| Prometheus and Thanos | Prometheus scrapes current values from the Supervisor; Thanos keeps days of history on network disk and in S3 object storage. |
| Traefik and Keycloak | Traefik is the API gateway and Ingress Controller; it signs users in with Keycloak and keeps their tokens, so the browser holds only a session cookie. |
| Platform operator | Sets up the connection to each RP. |

Signing in is a shared step of UC-02, UC-05 (when the user cancels), UC-11, UC-12, and UC-13, not a separate use case.

## Services and user services

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-01 | Register a service | RP operator | The RP registers a service in the Service System with its supervision endpoint and parameters (id, unit, collection interval). The Service System assigns the service id and keeps the data; users do not see it. |
| UC-02 | Request a service | HMI user | The user requests a registered service for a start and an end datetime. The Service System assigns the user service id (for example US-1001) when the request is made; nothing is collected outside that period. |
| UC-03 | Start a user service | Service System | At the start datetime, the Service System instantiates the user service and publishes a registration message with the provider, endpoint, connection profile name, and parameter list copied from the service. The message carries no credentials. The Supervisor stores the user service and schedules collection. |
| UC-04 | Update a user service | RP operator | A change to a service's parameter list or endpoint is published as a new revision of each of its user services. The Supervisor applies it and ignores duplicate or older revisions. |
| UC-05 | End or cancel a user service | Service System, or HMI user (cancel) | At the end datetime, or when the user cancels the request, the Service System removes the user service and publishes a deregistration message; the Supervisor stops collecting it. A request cancelled before its start never reaches the Supervisor. Existing history stays in Thanos until its retention expires. |
| UC-06 | Onboard a resource provider connection | Platform operator | Once per RP, before its first poll: set up how the Supervisor authenticates to the RP (for example OAuth client credentials or mutual TLS), which server certificates to trust, and the RP's rate limits and timeouts, under a named connection profile. Credentials are kept in a Kubernetes Secret, never in the Supervisor database or the registration message. Every user service of that RP reuses the profile; a message naming an unknown profile cannot be collected. |

## Collection and history

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-07 | Collect supervision data | Supervisor scheduler | When an interval class (10 s, 60 s, or 300 s) is due, the Supervisor polls the RP for that class's parameters at the endpoint from the registration message, using the RP's connection profile. Retries, rate limits, and failure isolation apply per RP. |
| UC-08 | Process provider measurements | Supervisor | Validate, normalize, and record collected values with observation time, quality, and provenance, so unreliable data is never shown as authoritative. |
| UC-09 | Publish supervision history | Prometheus | Prometheus scrapes the latest values from the Supervisor's private `/metrics/business` endpoint; Thanos keeps days of history. |
| UC-10 | Compute business metrics and KPIs | Supervisor | Derive business metrics and key performance indicators (KPIs) from validated data, tracking freshness, quality, and calculation version. |

## User-facing (Supervision micro frontend)

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-11 | List visible user services | HMI user | The user opens Supervision and sees the user services they may access, with provider, status, and freshness. The Service System decides visibility; the Supervisor never interprets business roles. If the Service System is unavailable, the list fails rather than showing all services. |
| UC-12 | View a user service's parameter chart | HMI user | The user selects a user service and parameters; the Supervisor returns the parameter catalogue and the history from Thanos, and the chart refreshes every 15–30 s. A user service the user may not see is reported as not found. |
| UC-13 | View business KPIs | HMI user | Show calculated KPIs and their trends for the user services the user may access. Depends on UC-10. |

## Thresholds and alerting

| ID | Use case | Primary actor | Description |
|---|---|---|---|
| UC-14 | Define metric thresholds | Authorized user | Configure warning and critical thresholds for selected metrics or KPIs, with scope, evaluation window, and recovery condition. |
| UC-15 | Evaluate thresholds and manage alerts | Alert-evaluation capability | Evaluate thresholds and track alert activation, suppression, acknowledgement, and recovery. Missing or stale data is a data-availability condition, never a healthy result. |
| UC-16 | Send notifications | Notification capability | Notify the responsible owners of sustained conditions, with deduplication and recovery messages, and without credentials or raw provider payloads. |

## Open questions

- UC-05, UC-11, UC-12: whether an ended or cancelled user service stays listed and chartable while its history is retained.
- UC-06: who provisions connection profiles and credentials for a new RP.
- UC-10, UC-13: which metrics and KPIs are defined.
- UC-14 to UC-16: which capability evaluates thresholds and sends notifications.
