# Store Definition

## Store Concept

Playground Shopping Cart is a specialty online bookstore for software engineering books. The initial catalog focuses on real books about programming, architecture, distributed systems, testing, maintainability, operations, and engineering practice.

The catalog is intentionally small and stable so the shopping cart service, purchase simulator, frontend, metrics, and performance experiments can all use the same domain model.

## Product Model

The first version of the store can model each book with:

- `sku`: stable product identifier.
- `title`: book title.
- `authors`: array of book author names.
- `category`: broad software engineering category.
- `tags`: search and filtering tags.
- `price_cents`: product price in minor currency units.
- `currency`: ISO 4217 currency code. Use `USD` for the initial catalog.
- `inventory_count`: current available stock count.
- `isbn`: ISBN-13 when available.
- `publisher`: publisher name.
- `publication_year`: publication year for the selected edition.
- `page_count`: page count for the selected edition.
- `format`: initial sellable format, such as `paperback` or `hardcover`.
- `description`: short product description for catalog and detail views.
- `popularity_weight`: simulator weighting from `1` to `10`, where higher values are sampled more often.
- `restock_threshold`: inventory level where a restock simulation could be triggered later.
- `active`: whether the product is currently listed and sellable.
- `created_at`: seed creation timestamp.
- `updated_at`: seed update timestamp.

Inventory starts as a seeded playground value from `0` to `10`. These values are not meant to represent real availability. They exist so the cart service and simulator can exercise in-stock, low-stock, and out-of-stock behavior.

The machine-readable seed catalog is maintained in `docs/catalog.seed.json`. The Markdown table below is a compact overview for humans.

Book metadata is edition-specific seed data for the playground. Before using this catalog outside the project, verify ISBN, publisher, page count, and edition details against publisher or bookseller records.

## Initial Catalog

| SKU | Title | Category | Price | Inventory | Popularity |
| --- | --- | --- | --- | --- | --- |
| `book-001` | Code Complete | Programming Practice | `$59.99` | 7 | 8 |
| `book-002` | Clean Code | Programming Practice | `$49.99` | 4 | 9 |
| `book-003` | The Pragmatic Programmer | Programming Practice | `$44.99` | 9 | 9 |
| `book-004` | Refactoring | Code Quality | `$54.99` | 2 | 8 |
| `book-005` | Design Patterns | Software Design | `$64.99` | 5 | 7 |
| `book-006` | Patterns of Enterprise Application Architecture | Architecture | `$59.99` | 3 | 5 |
| `book-007` | Domain-Driven Design | Architecture | `$64.99` | 6 | 7 |
| `book-008` | Working Effectively with Legacy Code | Code Quality | `$49.99` | 1 | 8 |
| `book-009` | Test-Driven Development: By Example | Testing | `$39.99` | 8 | 7 |
| `book-010` | Continuous Delivery | Delivery | `$54.99` | 4 | 6 |
| `book-011` | Accelerate | Delivery | `$29.99` | 10 | 8 |
| `book-012` | Release It! | Reliability | `$49.99` | 2 | 6 |
| `book-013` | Designing Data-Intensive Applications | Distributed Systems | `$54.99` | 7 | 10 |
| `book-014` | Software Engineering at Google | Engineering Practice | `$49.99` | 6 | 7 |
| `book-015` | A Philosophy of Software Design | Software Design | `$29.99` | 3 | 8 |
| `book-016` | The Mythical Man-Month | Engineering Practice | `$34.99` | 5 | 5 |
| `book-017` | Peopleware | Engineering Management | `$34.99` | 0 | 5 |
| `book-018` | Site Reliability Engineering | Reliability | `$54.99` | 9 | 8 |
| `book-019` | Building Microservices | Architecture | `$54.99` | 4 | 7 |
| `book-020` | Monolith to Microservices | Architecture | `$39.99` | 1 | 6 |
| `book-021` | Microservices Patterns | Architecture | `$59.99` | 6 | 7 |
| `book-022` | Head First Design Patterns | Software Design | `$49.99` | 8 | 6 |
| `book-023` | Effective Java | Java | `$54.99` | 3 | 8 |
| `book-024` | Java Concurrency in Practice | Java | `$49.99` | 0 | 6 |
| `book-025` | Fluent Python | Python | `$64.99` | 5 | 7 |
| `book-026` | Effective Python | Python | `$39.99` | 2 | 6 |
| `book-027` | The Go Programming Language | Go | `$44.99` | 7 | 7 |
| `book-028` | Concurrency in Go | Go | `$39.99` | 4 | 5 |
| `book-029` | You Don't Know JS Yet: Scope & Closures | JavaScript | `$29.99` | 6 | 6 |
| `book-030` | Eloquent JavaScript | JavaScript | `$39.99` | 10 | 7 |

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
