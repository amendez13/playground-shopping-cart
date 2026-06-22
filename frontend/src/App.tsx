import {
  Activity,
  AlertTriangle,
  BookOpen,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  books,
  filterBooks,
  formatCurrency,
  getCartLines,
  getCartTotal,
  getCatalogStats,
  getCategories,
  getTopWeightedBooks,
  type Book,
} from './catalog';

type CartQuantities = Record<string, number>;

function getStockLabel(book: Book): string {
  if (book.inventory_count === 0) {
    return 'Out';
  }

  if (book.inventory_count <= book.restock_threshold) {
    return 'Low';
  }

  return 'Ready';
}

function getStockClass(book: Book): string {
  if (book.inventory_count === 0) {
    return 'stock stockOut';
  }

  if (book.inventory_count <= book.restock_threshold) {
    return 'stock stockLow';
  }

  return 'stock stockReady';
}

export function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartQuantities, setCartQuantities] = useState<CartQuantities>({});

  const categories = useMemo(() => getCategories(books), []);
  const filteredBooks = useMemo(
    () => filterBooks(books, searchTerm, selectedCategory),
    [searchTerm, selectedCategory],
  );
  const cartLines = useMemo(
    () => getCartLines(books, cartQuantities),
    [cartQuantities],
  );
  const stats = useMemo(() => getCatalogStats(books), []);
  const topWeightedBooks = useMemo(() => getTopWeightedBooks(books, 5), []);
  const cartItemCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const cartTotal = getCartTotal(cartLines);

  function updateCartQuantity(book: Book, nextQuantity: number) {
    const boundedQuantity = Math.max(
      0,
      Math.min(nextQuantity, book.inventory_count),
    );

    setCartQuantities((current) => {
      const next = { ...current };

      if (boundedQuantity === 0) {
        delete next[book.sku];
      } else {
        next[book.sku] = boundedQuantity;
      }

      return next;
    });
  }

  return (
    <main className="appShell">
      <section className="topBar" aria-label="Store overview">
        <div>
          <p className="eyebrow">Software Engineering Bookstore</p>
          <h1>Catalog, cart, and experiment console</h1>
        </div>
        <div className="cartBadge" aria-label={`${cartItemCount} cart items`}>
          <ShoppingCart size={20} aria-hidden="true" />
          <span>{cartItemCount}</span>
        </div>
      </section>

      <section className="metricGrid" aria-label="Catalog metrics">
        <article className="metricCard">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <span>{stats.activeProducts}</span>
            <p>Active books</p>
          </div>
        </article>
        <article className="metricCard">
          <PackageCheck size={22} aria-hidden="true" />
          <div>
            <span>{stats.totalInventory}</span>
            <p>Units in stock</p>
          </div>
        </article>
        <article className="metricCard">
          <AlertTriangle size={22} aria-hidden="true" />
          <div>
            <span>{stats.lowStock + stats.outOfStock}</span>
            <p>Inventory alerts</p>
          </div>
        </article>
        <article className="metricCard">
          <Activity size={22} aria-hidden="true" />
          <div>
            <span>{formatCurrency(stats.totalValue, 'USD')}</span>
            <p>Seed inventory value</p>
          </div>
        </article>
      </section>

      <section className="workspace">
        <section className="catalogPanel" aria-label="Book catalog">
          <div className="toolbar">
            <label className="searchBox">
              <Search size={18} aria-hidden="true" />
              <span className="srOnly">Search catalog</span>
              <input
                type="search"
                placeholder="Search title, author, tag"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="categoryTabs" aria-label="Category filter">
              <button
                className={selectedCategory === 'all' ? 'activeTab' : ''}
                type="button"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  className={selectedCategory === category ? 'activeTab' : ''}
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="resultSummary">
            <span>{filteredBooks.length} books</span>
            <span>{selectedCategory === 'all' ? 'All categories' : selectedCategory}</span>
          </div>

          <div className="bookGrid">
            {filteredBooks.map((book) => {
              const quantityInCart = cartQuantities[book.sku] ?? 0;
              const addDisabled =
                book.inventory_count === 0 || quantityInCart >= book.inventory_count;

              return (
                <article className="bookCard" key={book.sku}>
                  <div className="bookCardHeader">
                    <span className={getStockClass(book)}>{getStockLabel(book)}</span>
                    <span className="sku">{book.sku}</span>
                  </div>
                  <h2>{book.title}</h2>
                  <p className="authors">{book.authors.join(', ')}</p>
                  <p className="description">{book.description}</p>
                  <div className="bookMeta">
                    <span>{book.category}</span>
                    <span>{book.publication_year}</span>
                    <span>{book.format}</span>
                  </div>
                  <div className="bookFooter">
                    <div>
                      <strong>{formatCurrency(book.price_cents, book.currency)}</strong>
                      <span>{book.inventory_count} available</span>
                    </div>
                    <button
                      aria-label={`Add ${book.title} to cart`}
                      className="iconButton"
                      disabled={addDisabled}
                      type="button"
                      onClick={() => updateCartQuantity(book, quantityInCart + 1)}
                    >
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="sidePanel" aria-label="Cart and simulator preview">
          <section className="cartPanel">
            <div className="panelHeading">
              <h2>Cart</h2>
              <span>{cartItemCount} items</span>
            </div>

            {cartLines.length === 0 ? (
              <p className="emptyState">No books selected.</p>
            ) : (
              <div className="cartLines">
                {cartLines.map(({ book, quantity }) => (
                  <article className="cartLine" key={book.sku}>
                    <div>
                      <h3>{book.title}</h3>
                      <p>{formatCurrency(book.price_cents, book.currency)}</p>
                    </div>
                    <div className="quantityControls">
                      <button
                        aria-label={`Remove one ${book.title}`}
                        className="iconButton subtle"
                        type="button"
                        onClick={() => updateCartQuantity(book, quantity - 1)}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label={`Add one ${book.title}`}
                        className="iconButton subtle"
                        disabled={quantity >= book.inventory_count}
                        type="button"
                        onClick={() => updateCartQuantity(book, quantity + 1)}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                      <button
                        aria-label={`Remove ${book.title} from cart`}
                        className="iconButton danger"
                        type="button"
                        onClick={() => updateCartQuantity(book, 0)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="cartTotal">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal, 'USD')}</strong>
            </div>
          </section>

          <section className="simulatorPanel">
            <div className="panelHeading">
              <h2>Simulator weights</h2>
              <span>Top 5</span>
            </div>
            <div className="weightList">
              {topWeightedBooks.map((book) => (
                <div className="weightRow" key={book.sku}>
                  <div>
                    <span>{book.title}</span>
                    <small>{book.popularity_weight}/10</small>
                  </div>
                  <meter
                    max="10"
                    min="0"
                    value={book.popularity_weight}
                    aria-label={`${book.title} popularity weight`}
                  />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
