import seedCatalog from '../../docs/catalog.seed.json';

export type Book = {
  sku: string;
  title: string;
  authors: string[];
  category: string;
  tags: string[];
  price_cents: number;
  currency: string;
  inventory_count: number;
  isbn: string;
  publisher: string;
  publication_year: number;
  page_count: number;
  format: string;
  description: string;
  popularity_weight: number;
  restock_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CartLine = {
  book: Book;
  quantity: number;
};

export const books = seedCatalog as Book[];

export function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function getCategories(catalog: Book[]): string[] {
  return Array.from(new Set(catalog.map((book) => book.category))).sort();
}

export function filterBooks(
  catalog: Book[],
  searchTerm: string,
  selectedCategory: string,
): Book[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return catalog.filter((book) => {
    const matchesCategory =
      selectedCategory === 'all' || book.category === selectedCategory;
    const searchableText = [
      book.title,
      book.authors.join(' '),
      book.category,
      book.tags.join(' '),
      book.publisher,
    ]
      .join(' ')
      .toLowerCase();

    return matchesCategory && searchableText.includes(normalizedSearch);
  });
}

export function getCartLines(
  catalog: Book[],
  quantitiesBySku: Record<string, number>,
): CartLine[] {
  return catalog
    .map((book) => ({
      book,
      quantity: quantitiesBySku[book.sku] ?? 0,
    }))
    .filter((line) => line.quantity > 0);
}

export function getCartTotal(lines: CartLine[]): number {
  return lines.reduce(
    (total, line) => total + line.book.price_cents * line.quantity,
    0,
  );
}

export function getCatalogStats(catalog: Book[]) {
  const totalInventory = catalog.reduce(
    (total, book) => total + book.inventory_count,
    0,
  );
  const outOfStock = catalog.filter((book) => book.inventory_count === 0).length;
  const lowStock = catalog.filter(
    (book) =>
      book.inventory_count > 0 &&
      book.inventory_count <= book.restock_threshold,
  ).length;
  const totalValue = catalog.reduce(
    (total, book) => total + book.inventory_count * book.price_cents,
    0,
  );

  return {
    activeProducts: catalog.filter((book) => book.active).length,
    totalInventory,
    outOfStock,
    lowStock,
    totalValue,
  };
}

export function getTopWeightedBooks(catalog: Book[], count: number): Book[] {
  return [...catalog]
    .sort((left, right) => right.popularity_weight - left.popularity_weight)
    .slice(0, count);
}
