# User Service Registration and Distributed Supervision

Status: illustrative proposal, not an approved contract.

![User service registration and distributed supervision](https://github.com/amendez13/ms-tc-pg/blob/main/docs/architecture/diagrams/drawio/user-service-supervision-registration.png?raw=true)

Source: [user-service-supervision-registration.drawio](user-service-supervision-registration.drawio)

1. Many users, of several kinds, select a service in the Human–Machine Interface (HMI).
2. The HMI sends the request to the Service System. Its control, matchmaking, resource-allocation, and resource-pooling logic is acknowledged but out of scope.
3. The Service System publishes each allocated user service to a durable queue on the AMQP 1.0 message broker.
4. Supervisor instances consume these messages to register the user services.
5. User services 1…N are distributed across Supervisor instances 1…M, and each user service is owned by one instance at a time. Each instance monitors its user services through REST API calls (HTTPS/JSON) to the resource provider (1…K) that each service is allocated to. A single instance can therefore talk to several providers, and a single provider can be called by several instances.

The [registration storyboard](user-service-registration-storyboard.md) shows what the registration message must carry (parameter list, endpoint, provider) for the Supervisor to poll the resource provider.

Open questions: the AsyncAPI contract for the registration message, the mechanism that assigns user services to instances and rebalances them, and the REST contract for each resource provider.
