import {
  Activity,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  LogIn,
  LogOut,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
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
type ViewMode = 'user' | 'owner';
type AuthMode = 'signIn' | 'signUp';
type UserTab = 'shop' | 'orders';
type OrderStatus = 'processing' | 'packed' | 'shipped' | 'delivered';

type CustomerSession = {
  name: string;
  email: string;
};

type OrderLine = {
  sku: string;
  title: string;
  quantity: number;
  price_cents: number;
};

type OrderEvent = {
  label: string;
  at: string;
};

type Order = {
  id: string;
  customer: string;
  placedAt: string;
  status: OrderStatus;
  currency: string;
  lines: OrderLine[];
  events: OrderEvent[];
};

const statusLabels: Record<OrderStatus, string> = {
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const catalogBySku = new Map(books.map((book) => [book.sku, book]));

function makeOrder(
  id: string,
  customer: string,
  placedAt: string,
  status: OrderStatus,
  lineSpecs: Array<{ sku: string; quantity: number }>,
  events: OrderEvent[],
): Order {
  return {
    id,
    customer,
    placedAt,
    status,
    currency: 'USD',
    lines: lineSpecs.map(({ sku, quantity }) => {
      const book = catalogBySku.get(sku);

      if (!book) {
        throw new Error(`Unknown seed catalog SKU: ${sku}`);
      }

      return {
        sku,
        title: book.title,
        quantity,
        price_cents: book.price_cents,
      };
    }),
    events,
  };
}

const sampleOrders = [
  makeOrder(
    'PSC-1007',
    'Alex Reader',
    '2026-06-20',
    'shipped',
    [
      { sku: 'book-013', quantity: 1 },
      { sku: 'book-011', quantity: 1 },
    ],
    [
      { label: 'Order accepted', at: '2026-06-20 09:14 UTC' },
      { label: 'Inventory reserved', at: '2026-06-20 09:14 UTC' },
      { label: 'Packed', at: '2026-06-20 15:42 UTC' },
      { label: 'Shipped', at: '2026-06-21 08:05 UTC' },
    ],
  ),
  makeOrder(
    'PSC-1006',
    'Alex Reader',
    '2026-06-18',
    'delivered',
    [
      { sku: 'book-003', quantity: 1 },
      { sku: 'book-009', quantity: 1 },
      { sku: 'book-015', quantity: 1 },
    ],
    [
      { label: 'Order accepted', at: '2026-06-18 11:30 UTC' },
      { label: 'Packed', at: '2026-06-18 16:10 UTC' },
      { label: 'Shipped', at: '2026-06-19 07:40 UTC' },
      { label: 'Delivered', at: '2026-06-20 13:25 UTC' },
    ],
  ),
  makeOrder(
    'PSC-1005',
    'Synthetic User 42',
    '2026-06-17',
    'processing',
    [
      { sku: 'book-019', quantity: 1 },
      { sku: 'book-021', quantity: 1 },
    ],
    [
      { label: 'Order accepted', at: '2026-06-17 19:02 UTC' },
      { label: 'Inventory reserved', at: '2026-06-17 19:02 UTC' },
    ],
  ),
];

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

function getOrderTotal(order: Order): number {
  return order.lines.reduce(
    (total, line) => total + line.price_cents * line.quantity,
    0,
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

function getOwnerOrderStats(orders: Order[]) {
  return {
    openOrders: orders.filter((order) => order.status !== 'delivered').length,
    processingOrders: orders.filter((order) => order.status === 'processing').length,
    orderRevenue: orders.reduce((total, order) => total + getOrderTotal(order), 0),
  };
}

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('user');
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [userTab, setUserTab] = useState<UserTab>('shop');
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartQuantities, setCartQuantities] = useState<CartQuantities>({});
  const [selectedOrderId, setSelectedOrderId] = useState(sampleOrders[0]?.id ?? '');

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
  const ownerOrderStats = useMemo(() => getOwnerOrderStats(sampleOrders), []);
  const topWeightedBooks = useMemo(() => getTopWeightedBooks(books, 5), []);
  const lowInventoryBooks = useMemo(
    () =>
      books.filter(
        (book) =>
          book.inventory_count === 0 ||
          book.inventory_count <= book.restock_threshold,
      ),
    [],
  );
  const selectedOrder =
    sampleOrders.find((order) => order.id === selectedOrderId) ?? sampleOrders[0];
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

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || 'reader@example.com');
    const providedName = String(data.get('name') || '').trim();

    setSession({
      email,
      name: providedName || email.split('@')[0] || 'Reader',
    });
    setUserTab('shop');
  }

  function renderUserMetrics() {
    return (
      <section className="metricGrid" aria-label="Customer metrics">
        <article className="metricCard">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <span>{stats.activeProducts}</span>
            <p>Active books</p>
          </div>
        </article>
        <article className="metricCard">
          <ShoppingCart size={22} aria-hidden="true" />
          <div>
            <span>{cartItemCount}</span>
            <p>{session ? 'Saved cart items' : 'Guest cart items'}</p>
          </div>
        </article>
        <article className="metricCard">
          <ClipboardList size={22} aria-hidden="true" />
          <div>
            <span>{sampleOrders.length}</span>
            <p>Tracked orders</p>
          </div>
        </article>
        <article className="metricCard">
          <Activity size={22} aria-hidden="true" />
          <div>
            <span>{formatCurrency(cartTotal, 'USD')}</span>
            <p>Cart total</p>
          </div>
        </article>
      </section>
    );
  }

  function renderOwnerMetrics() {
    return (
      <section className="metricGrid" aria-label="Store owner metrics">
        <article className="metricCard">
          <PackageCheck size={22} aria-hidden="true" />
          <div>
            <span>{stats.totalInventory}</span>
            <p>Units in stock</p>
          </div>
        </article>
        <article className="metricCard">
          <ClipboardList size={22} aria-hidden="true" />
          <div>
            <span>{ownerOrderStats.openOrders}</span>
            <p>Open orders</p>
          </div>
        </article>
        <article className="metricCard">
          <AlertTriangle size={22} aria-hidden="true" />
          <div>
            <span>{lowInventoryBooks.length}</span>
            <p>Inventory alerts</p>
          </div>
        </article>
        <article className="metricCard">
          <Activity size={22} aria-hidden="true" />
          <div>
            <span>{formatCurrency(ownerOrderStats.orderRevenue, 'USD')}</span>
            <p>Seed order value</p>
          </div>
        </article>
      </section>
    );
  }

  function renderCatalog() {
    return (
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
    );
  }

  function renderAuthPanel() {
    if (session) {
      return (
        <section className="authPanel" aria-label="Signed in customer">
          <div className="panelHeading">
            <h2>{session.name}</h2>
            <span>Signed in</span>
          </div>
          <p className="accountEmail">{session.email}</p>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => setSession(null)}
          >
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </button>
        </section>
      );
    }

    return (
      <section className="authPanel" aria-label="Customer authentication">
        <div className="panelHeading">
          <h2>{authMode === 'signIn' ? 'Sign in' : 'Create account'}</h2>
          <span>Guest cart</span>
        </div>
        <div className="segmentedControl compact" aria-label="Authentication mode">
          <button
            className={authMode === 'signIn' ? 'activeSegment' : ''}
            type="button"
            onClick={() => setAuthMode('signIn')}
          >
            <LogIn size={16} aria-hidden="true" />
            Sign in
          </button>
          <button
            className={authMode === 'signUp' ? 'activeSegment' : ''}
            type="button"
            onClick={() => setAuthMode('signUp')}
          >
            <UserPlus size={16} aria-hidden="true" />
            Sign up
          </button>
        </div>

        <form className="formGrid" onSubmit={handleAuthSubmit}>
          {authMode === 'signUp' ? (
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Alex Reader" type="text" />
            </label>
          ) : null}
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              placeholder="reader@example.com"
              required
              type="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" required type="password" />
          </label>
          <button className="primaryButton" type="submit">
            {authMode === 'signIn' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    );
  }

  function renderCartPanel() {
    return (
      <section className="cartPanel">
        <div className="panelHeading">
          <h2>{session ? 'Saved cart' : 'Guest cart'}</h2>
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
        <button
          className="primaryButton fullWidth"
          disabled={!session || cartLines.length === 0}
          type="button"
        >
          {session ? 'Review order' : 'Sign in to checkout'}
        </button>
      </section>
    );
  }

  function renderOrderHistory() {
    if (!selectedOrder) {
      return null;
    }

    return (
      <section className="orderWorkspace" aria-label="Order history">
        <div className="orderList">
          <div className="sectionHeading">
            <h2>Order history</h2>
            <span>{sampleOrders.length} orders</span>
          </div>
          {sampleOrders.map((order) => (
            <button
              className={
                selectedOrderId === order.id ? 'orderButton activeOrder' : 'orderButton'
              }
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
            >
              <span>{order.id}</span>
              <small>{formatDate(order.placedAt)}</small>
              <strong>{formatCurrency(getOrderTotal(order), order.currency)}</strong>
            </button>
          ))}
        </div>

        <article className="orderDetail">
          <div className="sectionHeading">
            <div>
              <h2>Order detail</h2>
              <p>{selectedOrder.id}</p>
            </div>
            <span className="statusPill">{statusLabels[selectedOrder.status]}</span>
          </div>

          <div className="detailGrid">
            <div>
              <span className="detailLabel">Placed</span>
              <strong>{formatDate(selectedOrder.placedAt)}</strong>
            </div>
            <div>
              <span className="detailLabel">Total</span>
              <strong>{formatCurrency(getOrderTotal(selectedOrder), 'USD')}</strong>
            </div>
            <div>
              <span className="detailLabel">Customer</span>
              <strong>{session?.name ?? selectedOrder.customer}</strong>
            </div>
          </div>

          <div className="lineTable" role="table" aria-label="Order line items">
            {selectedOrder.lines.map((line) => (
              <div className="lineRow" role="row" key={line.sku}>
                <span>{line.title}</span>
                <span>{line.quantity}</span>
                <strong>{formatCurrency(line.price_cents * line.quantity, 'USD')}</strong>
              </div>
            ))}
          </div>

          <div className="statusTimeline" aria-label="Order events">
            {selectedOrder.events.map((event) => (
              <div className="timelineEvent" key={`${selectedOrder.id}-${event.label}`}>
                <span aria-hidden="true" />
                <div>
                  <strong>{event.label}</strong>
                  <small>{event.at}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    );
  }

  function renderUserView() {
    return (
      <>
        {renderUserMetrics()}
        <div className="viewTabs" aria-label="Customer view">
          <button
            className={userTab === 'shop' ? 'activeTab' : ''}
            type="button"
            onClick={() => setUserTab('shop')}
          >
            Shop
          </button>
          <button
            className={userTab === 'orders' ? 'activeTab' : ''}
            type="button"
            onClick={() => setUserTab('orders')}
          >
            Orders
          </button>
        </div>
        <section className="workspace">
          {userTab === 'shop' ? renderCatalog() : renderOrderHistory()}
          <aside className="sidePanel" aria-label="Customer account and cart">
            {renderAuthPanel()}
            {renderCartPanel()}
          </aside>
        </section>
      </>
    );
  }

  function renderOwnerView() {
    return (
      <>
        {renderOwnerMetrics()}
        <section className="ownerWorkspace" aria-label="Store owner dashboard">
          <article className="ownerPanel">
            <div className="sectionHeading">
              <h2>Order queue</h2>
              <span>{ownerOrderStats.openOrders} open</span>
            </div>
            <div className="ownerOrderRows">
              {sampleOrders.map((order) => (
                <div className="ownerOrderRow" key={order.id}>
                  <div>
                    <strong>{order.id}</strong>
                    <span>{order.customer}</span>
                  </div>
                  <span>{statusLabels[order.status]}</span>
                  <strong>{formatCurrency(getOrderTotal(order), order.currency)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="ownerPanel">
            <div className="sectionHeading">
              <h2>Inventory watch</h2>
              <span>{lowInventoryBooks.length} books</span>
            </div>
            <div className="inventoryRows">
              {lowInventoryBooks.map((book) => (
                <div className="inventoryRow" key={book.sku}>
                  <div>
                    <strong>{book.title}</strong>
                    <span>{book.sku}</span>
                  </div>
                  <span className={getStockClass(book)}>{getStockLabel(book)}</span>
                  <strong>{book.inventory_count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="ownerPanel">
            <div className="sectionHeading">
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
          </article>
        </section>
      </>
    );
  }

  return (
    <main className="appShell">
      <section className="topBar" aria-label="Store overview">
        <div>
          <p className="eyebrow">Software Engineering Bookstore</p>
          <h1>
            {viewMode === 'user'
              ? 'Catalog, cart, and order tracking'
              : 'Store owner operations'}
          </h1>
        </div>
        <div className="topActions">
          <div className="segmentedControl" aria-label="Application view">
            <button
              className={viewMode === 'user' ? 'activeSegment' : ''}
              type="button"
              onClick={() => setViewMode('user')}
            >
              <User size={17} aria-hidden="true" />
              Customer
            </button>
            <button
              className={viewMode === 'owner' ? 'activeSegment' : ''}
              type="button"
              onClick={() => setViewMode('owner')}
            >
              <Store size={17} aria-hidden="true" />
              Store owner
            </button>
          </div>
          <div className="cartBadge" aria-label={`${cartItemCount} cart items`}>
            <ShoppingCart size={20} aria-hidden="true" />
            <span>{cartItemCount}</span>
          </div>
        </div>
      </section>

      {viewMode === 'user' ? renderUserView() : renderOwnerView()}
    </main>
  );
}
