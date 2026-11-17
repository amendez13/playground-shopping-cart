# User Service Registration Storyboard: From the Service System to the First Poll

Status: illustrative proposal, not an approved contract. It refines step 3 of [user service registration](user-service-supervision-registration.md). Names, ids, and values are fake.

![User service registration storyboard](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/user-service-registration-storyboard.png?raw=true)

Source: [user-service-registration-storyboard.drawio](user-service-registration-storyboard.drawio)

## The gap it closes

The Supervisor cannot poll a resource provider (RP) without knowing what to collect and where. The RP registers each user service in the Service System user interface (UI), with the supervision parameter list, the endpoint, and other details. The Service System therefore holds this data, and the Supervisor must receive it in the registration message.

## Steps

1. **Register in the Service System.** An RP-A operator registers US-1001 with its supervision endpoint and its 30 parameters, each with a unit and collection interval. The Service System validates and stores them; it is the authority for this data.
2. **Publish the registration.** After its commit, the Service System publishes `UserServiceRegistered` through a transactional outbox to a durable AMQP 1.0 queue. The message carries the provider, endpoint, connection profile name, and parameter list, versioned by `revision`. It never carries credentials or tokens.
3. **Supervisor registers and schedules.** The Supervisor upserts the user service and its parameters in PostgreSQL by user service id and revision, so a duplicate or older revision changes nothing. It accepts the message only after the commit. One instance owns US-1001 and schedules runs per interval class (10 s, 60 s, 300 s). The same parameter catalogue later feeds the [parameter graph](supervision-parameter-graph-sequence.md).
4. **Poll the resource provider.** Each due run calls RP-A over HTTPS for that interval class's parameters. The endpoint and parameter ids come from the registration; credentials come from the connection profile's Kubernetes Secret. Values are exposed on the private `/metrics/business` endpoint and scraped into Prometheus and Thanos.

Later changes to the parameter list or endpoint arrive as a new revision (`UserServiceUpdated`); `UserServiceDeregistered` stops collection.

## Open questions

- The AsyncAPI 3.0.0 contract for the registration events (field names above are examples).
- Who provisions the connection profile and Secret when a new provider is onboarded.
- Validation of parameter ids against the provider's qualified API profile, and where it happens.
- How user services are assigned to Supervisor instances and rebalanced.
