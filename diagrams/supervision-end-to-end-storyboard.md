# Supervision End to End: From Service Registration to the User's Chart

Status: simplified, illustrative storyboard for [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md) and [ADR 0006](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0006-supervision-history-in-prometheus-and-thanos.md). Names, ids, and values are fake.

![Supervision end-to-end storyboard](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/supervision-end-to-end-storyboard.png?raw=true)

Source: [supervision-end-to-end-storyboard.drawio](supervision-end-to-end-storyboard.drawio)

## Service registration (once per service)

1. **RP registers the service.** The resource provider (RP) registers service S-100 in the Service System user interface (UI) with its supervision endpoint and parameters (id, unit, collection interval). The Service System assigns the service id and keeps a catalogue of registered services. Credentials are not part of it: the Supervisor's connection profile for each RP holds them, set up once per RP by a platform operator.

## Row A: service request and collection

2. **User requests the service.** In the Service request UI, g-user1 picks S-100 with a start and an end datetime. The Service System assigns the user service id US-1001 at once; the user can cancel it at any time.
3. **At the start time, the Service System instantiates the user service.** At the start datetime it instantiates US-1001 from S-100 and sends one AMQP message (`UserServiceRegistered`) with the provider, endpoint, and parameter list copied from the service. It carries no credentials.
4. **Supervisor updates its database.** It stores the user service, its provider, and its 30 parameters, then schedules collection at 10 s, 60 s, and 300 s.
5. **Supervisor polls the RP and publishes metrics.** Each due run calls RP-A over HTTPS; the latest values appear on the private `/metrics/business` endpoint.
6. **Prometheus + Thanos store the history.** Prometheus scrapes the endpoint; Thanos keeps days of history on network disk and in S3.

Collection runs without any user from the start datetime until the end datetime or until the user cancels. Then the Service System sends `UserServiceDeregistered` and the Supervisor stops collecting; a request cancelled before its start never reaches the Supervisor.

## Row B: a user views supervision data (one session)

7. **g-user1 signs in.** The Keycloak login page is reached through Traefik, which keeps the tokens; the browser holds only a session cookie.
8. **Supervisor fetches and shows the user's services.** The Service System decides which user services g-user1 may see; the Supervisor adds status from its database.
9. **g-user1 selects US-1001 and sees the chart.** The Supervisor queries Thanos for the selected range and returns the series; the chart refreshes every 15–30 s.

The dashed links show how the rows connect: the service's endpoint and parameters feed the start-time message, registered user services and parameters feed the list, and Thanos history feeds the chart.

## Detail

- [User service registration storyboard](user-service-registration-storyboard.md) (steps 3–5)
- [Supervision use case storyboard](supervision-use-case-storyboard.md) (steps 7–9)
- [List user services sequence](list-my-user-services-sequence.md) and [parameter graph sequence](supervision-parameter-graph-sequence.md)
