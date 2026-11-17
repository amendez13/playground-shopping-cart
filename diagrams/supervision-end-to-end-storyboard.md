# Supervision End to End: From Service Registration to the User's Chart

Status: simplified, illustrative storyboard for [ADR 0005](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0005-user-facing-supervision-data-access.md) and [ADR 0006](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/decisions/0006-supervision-history-in-prometheus-and-thanos.md). Names, ids, and values are fake.

![Supervision end-to-end storyboard](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/supervision-end-to-end-storyboard.png?raw=true)

Source: [supervision-end-to-end-storyboard.drawio](supervision-end-to-end-storyboard.drawio)

## Row A: registration and collection (continuous, no user involved)

1. **RP registers the user service.** The resource provider (RP) registers the user service in the Service System user interface (UI) with its endpoint and supervision parameters; the Service System assigns the id US-1001 and holds this data.
2. **Service System notifies the Supervisor.** One AMQP message carries what collection needs: provider, endpoint, and parameter list. It carries no credentials.
3. **Supervisor updates its database.** It stores the user service, its provider, and its 30 parameters, then schedules collection at 10 s, 60 s, and 300 s.
4. **Supervisor polls the RP and publishes metrics.** Each due run calls RP-A over HTTPS; the latest values appear on the private `/metrics/business` endpoint.
5. **Prometheus + Thanos store the history.** Prometheus scrapes the endpoint; Thanos keeps days of history on network disk and in S3.

## Row B: a user views supervision data (one session)

6. **g-user1 signs in.** The Keycloak login page is reached through Traefik, which keeps the tokens; the browser holds only a session cookie.
7. **Supervisor fetches and shows the user's services.** The Service System decides which user services g-user1 may see; the Supervisor adds status from its database.
8. **g-user1 selects US-1001 and sees the chart.** The Supervisor queries Thanos for the selected range and returns the series; the chart refreshes every 15–30 s.

The dashed links show how row A feeds row B: registered services and parameters feed the list, and Thanos history feeds the chart.

## Detail

- [User service registration storyboard](user-service-registration-storyboard.md) (steps 1–4)
- [Supervision use case storyboard](supervision-use-case-storyboard.md) (steps 6–8)
- [List user services sequence](list-my-user-services-sequence.md) and [parameter graph sequence](supervision-parameter-graph-sequence.md)
