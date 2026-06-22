import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the catalog and cart workspace', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /catalog, cart, and experiment console/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cart' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Designing Data-Intensive Applications',
      }),
    ).toBeInTheDocument();
  });
});
