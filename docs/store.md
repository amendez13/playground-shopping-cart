# Store Definition

## Store Concept

Playground Shopping Cart is a specialty online bookstore for software engineering books. The initial catalog focuses on real books about programming, architecture, distributed systems, testing, maintainability, operations, and engineering practice.

The catalog is intentionally small and stable so the shopping cart service, purchase simulator, frontend, metrics, and performance experiments can all use the same domain model.

## Product Model

The first version of the store can model each book with:

- `sku`: stable product identifier.
- `title`: book title.
- `authors`: book author or authors.
- `category`: broad software engineering category.
- `inventory`: current available stock count.

Inventory starts as a seeded playground value from `0` to `10`. These values are not meant to represent real availability. They exist so the cart service and simulator can exercise in-stock, low-stock, and out-of-stock behavior.

## Initial Catalog

| SKU | Title | Authors | Category | Inventory |
| --- | --- | --- | --- | --- |
| `book-001` | Code Complete | Steve McConnell | Programming Practice | 7 |
| `book-002` | Clean Code | Robert C. Martin | Programming Practice | 4 |
| `book-003` | The Pragmatic Programmer | Andrew Hunt, David Thomas | Programming Practice | 9 |
| `book-004` | Refactoring | Martin Fowler | Code Quality | 2 |
| `book-005` | Design Patterns | Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides | Software Design | 5 |
| `book-006` | Patterns of Enterprise Application Architecture | Martin Fowler | Architecture | 3 |
| `book-007` | Domain-Driven Design | Eric Evans | Architecture | 6 |
| `book-008` | Working Effectively with Legacy Code | Michael Feathers | Code Quality | 1 |
| `book-009` | Test-Driven Development: By Example | Kent Beck | Testing | 8 |
| `book-010` | Continuous Delivery | Jez Humble, David Farley | Delivery | 4 |
| `book-011` | Accelerate | Nicole Forsgren, Jez Humble, Gene Kim | Delivery | 10 |
| `book-012` | Release It! | Michael T. Nygard | Reliability | 2 |
| `book-013` | Designing Data-Intensive Applications | Martin Kleppmann | Distributed Systems | 7 |
| `book-014` | Software Engineering at Google | Titus Winters, Tom Manshreck, Hyrum Wright | Engineering Practice | 6 |
| `book-015` | A Philosophy of Software Design | John Ousterhout | Software Design | 3 |
| `book-016` | The Mythical Man-Month | Frederick P. Brooks Jr. | Engineering Practice | 5 |
| `book-017` | Peopleware | Tom DeMarco, Tim Lister | Engineering Management | 0 |
| `book-018` | Site Reliability Engineering | Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Richard Murphy | Reliability | 9 |
| `book-019` | Building Microservices | Sam Newman | Architecture | 4 |
| `book-020` | Monolith to Microservices | Sam Newman | Architecture | 1 |
| `book-021` | Microservices Patterns | Chris Richardson | Architecture | 6 |
| `book-022` | Head First Design Patterns | Eric Freeman, Elisabeth Robson, Bert Bates, Kathy Sierra | Software Design | 8 |
| `book-023` | Effective Java | Joshua Bloch | Java | 3 |
| `book-024` | Java Concurrency in Practice | Brian Goetz, Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea | Java | 0 |
| `book-025` | Fluent Python | Luciano Ramalho | Python | 5 |
| `book-026` | Effective Python | Brett Slatkin | Python | 2 |
| `book-027` | The Go Programming Language | Alan A. A. Donovan, Brian W. Kernighan | Go | 7 |
| `book-028` | Concurrency in Go | Katherine Cox-Buday | Go | 4 |
| `book-029` | You Don't Know JS Yet: Scope & Closures | Kyle Simpson | JavaScript | 6 |
| `book-030` | Eloquent JavaScript | Marijn Haverbeke | JavaScript | 10 |

## Inventory Behavior

Initial service behavior should support:

- Products with `inventory > 0` can be added to carts.
- Products with `inventory = 0` should be visible but unavailable for purchase.
- Purchase completion should decrement inventory.
- Cart reservations are optional at first; the simpler initial rule is to validate inventory at purchase time.
- Synthetic users should sample across the whole catalog, including out-of-stock books, so failure paths are exercised.

## Experiment Notes

This catalog should be enough to test:

- Product browsing and detail lookups.
- Cart add, update, remove, and checkout flows.
- Out-of-stock behavior.
- Concurrent purchases against the same low-inventory items.
- Read-heavy traffic against the catalog.
- Write-heavy traffic against carts and inventory updates.
