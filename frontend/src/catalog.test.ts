import { describe, expect, it } from 'vitest';
import {
  books,
  filterBooks,
  formatCurrency,
  getCartLines,
  getCartTotal,
  getCatalogStats,
  getCategories,
  getTopWeightedBooks,
} from './catalog';

describe('catalog helpers', () => {
  it('loads the seeded catalog', () => {
    expect(books).toHaveLength(30);
    expect(getCategories(books)).toContain('Architecture');
  });

  it('filters books by title, author, category, and tags', () => {
    expect(filterBooks(books, 'kleppmann', 'all')).toHaveLength(1);
    expect(filterBooks(books, 'microservices', 'Architecture')).toHaveLength(3);
    expect(filterBooks(books, 'microservices', 'Testing')).toHaveLength(0);
  });

  it('calculates cart lines and totals', () => {
    const lines = getCartLines(books, {
      'book-001': 2,
      'book-011': 1,
    });

    expect(lines).toHaveLength(2);
    expect(getCartTotal(lines)).toBe(14997);
    expect(formatCurrency(getCartTotal(lines), 'USD')).toBe('$149.97');
  });

  it('summarizes inventory and demand signals', () => {
    const stats = getCatalogStats(books);
    const topWeighted = getTopWeightedBooks(books, 1);

    expect(stats.activeProducts).toBe(30);
    expect(stats.outOfStock).toBe(2);
    expect(stats.totalInventory).toBeGreaterThan(0);
    expect(topWeighted[0]?.title).toBe('Designing Data-Intensive Applications');
  });
});
