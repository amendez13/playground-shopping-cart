import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('renders the customer catalog and authentication workspace', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /catalog, cart, and order tracking/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Guest cart' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Designing Data-Intensive Applications',
      }),
    ).toBeInTheDocument();
  });

  it('shows order history and detail in the customer view', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Orders' }));

    expect(screen.getByRole('heading', { name: 'Order history' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order detail' })).toBeInTheDocument();
    expect(screen.getAllByText('PSC-1007')).toHaveLength(2);
    expect(screen.getByText('Inventory reserved')).toBeInTheDocument();
  });

  it('switches to the store owner dashboard', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Store owner' }));

    expect(
      screen.getByRole('heading', { name: 'Store owner operations' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order queue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inventory watch' })).toBeInTheDocument();
  });
});
