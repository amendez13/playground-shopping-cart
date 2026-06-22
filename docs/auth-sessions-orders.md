# Authentication, Sessions, Carts, and Orders

## Direction

The shopping cart workflow needs authenticated customers so carts can be persisted, orders can be processed, and order history can be tracked across sessions.

The first implementation should support:

- Anonymous browsing and anonymous cart creation.
- Customer sign-up and sign-in.
- Cart migration when an anonymous customer signs in.
- Persisted customer carts.
- Order creation during checkout.
- Order history and order detail views for customers.
- Store-owner operational views for order processing and inventory state.

## Frontend Roles

The frontend has two top-level views:

| View | Purpose |
| --- | --- |
| Customer | Browse catalog, manage cart, sign in/sign up, view order history, inspect order detail. |
| Store owner | Monitor order queue, inventory alerts, and simulator demand signals. |

The current frontend implementation is still static and client-side only. Sign-in and sign-up are UI state placeholders until the cart service exposes authentication APIs.

## Anonymous Cart Fallback

Anonymous local-only cart behavior is allowed as a temporary fallback.

Rules:

- Anonymous users can add books to a local cart.
- Anonymous cart state is not durable across browsers/devices.
- Checkout requires an authenticated user.
- When the backend exists, signing in should merge or attach the anonymous cart to the customer account.
- The frontend should keep the anonymous cart pathway small so it can be replaced with API-backed behavior without changing the main UI.

## Backend State

PostgreSQL should persist:

- Customers.
- Authentication identities.
- Refresh/session tokens if token revocation is needed.
- Carts.
- Cart items.
- Orders.
- Order line item snapshots.
- Order events.

Order line items should snapshot the purchased title, SKU, quantity, price, and currency so order history remains stable if catalog data changes later.

## Auth Approach

Start with application-owned authentication in the cart service:

- Email and password sign-up/sign-in.
- Password hashes stored with a strong adaptive hashing algorithm.
- Short-lived access tokens for API calls.
- Refresh tokens or server-side sessions for longer-lived sign-in.

AWS Cognito can be added later as an experiment, but it should not block the first cart-service implementation.

## Checkout Flow

Initial checkout behavior:

1. Customer submits the authenticated cart.
2. Cart service opens a database transaction.
3. Cart service validates inventory for each item.
4. Cart service creates an order and order line item snapshots.
5. Cart service decrements inventory.
6. Cart service records order events.
7. Cart service marks the cart as checked out or creates a new active cart.

The simulator should generate both anonymous browsing sessions and authenticated checkout sessions so failure paths and successful order paths can be compared.

## Initial API Surface

Expected cart-service endpoints:

```text
POST /auth/sign-up
POST /auth/sign-in
POST /auth/sign-out
GET  /me

GET    /catalog/books
GET    /cart
POST   /cart/items
PATCH  /cart/items/{sku}
DELETE /cart/items/{sku}
POST   /cart/checkout

GET /orders
GET /orders/{order_id}

GET /owner/orders
GET /owner/inventory
```

The frontend should use an environment-specific API base URL once these endpoints exist.
