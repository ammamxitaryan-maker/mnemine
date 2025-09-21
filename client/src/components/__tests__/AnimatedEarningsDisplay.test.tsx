import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedEarningsDisplay } from '../AnimatedEarningsDisplay';

describe('AnimatedEarningsDisplay', () => {
  it('displays earnings with correct formatting', () => {
    const earnings = 123.456789;
    render(<AnimatedEarningsDisplay earnings={earnings} />);

    expect(screen.getByText('123.45678900')).toBeInTheDocument();
  });

  it('shows coins icon', () => {
    render(<AnimatedEarningsDisplay earnings={100} />);

    const coinsIcon = screen.getByRole('img', { hidden: true });
    expect(coinsIcon).toBeInTheDocument();
  });

  it('applies animation classes when earnings increase', async () => {
    const { rerender } = render(<AnimatedEarningsDisplay earnings={100} />);

    // Increase earnings
    rerender(<AnimatedEarningsDisplay earnings={150} />);

    await waitFor(() => {
      const displayElement = screen.getByText('150.00000000');
      expect(displayElement).toHaveClass('text-green-600', 'scale-105');
    });
  });

  it('shows increase indicator when animating', async () => {
    const { rerender } = render(<AnimatedEarningsDisplay earnings={100} isAnimating={true} />);

    // Increase earnings
    rerender(<AnimatedEarningsDisplay earnings={150} isAnimating={true} />);

    await waitFor(() => {
      expect(screen.getByText('↗')).toBeInTheDocument();
    });
  });

  it('does not show increase indicator when not animating', () => {
    render(<AnimatedEarningsDisplay earnings={100} isAnimating={false} />);

    expect(screen.queryByText('↗')).not.toBeInTheDocument();
  });

  it('handles zero earnings', () => {
    render(<AnimatedEarningsDisplay earnings={0} />);

    expect(screen.getByText('0.00000000')).toBeInTheDocument();
  });

  it('handles negative earnings', () => {
    render(<AnimatedEarningsDisplay earnings={-50.123} />);

    expect(screen.getByText('-50.12300000')).toBeInTheDocument();
  });

  it('handles very small earnings', () => {
    render(<AnimatedEarningsDisplay earnings={0.00000001} />);

    expect(screen.getByText('0.00000001')).toBeInTheDocument();
  });

  it('handles very large earnings', () => {
    render(<AnimatedEarningsDisplay earnings={999999.99999999} />);

    expect(screen.getByText('999999.99999999')).toBeInTheDocument();
  });

  it('updates display value when earnings change', async () => {
    const { rerender } = render(<AnimatedEarningsDisplay earnings={100} />);

    expect(screen.getByText('100.00000000')).toBeInTheDocument();

    rerender(<AnimatedEarningsDisplay earnings={200} />);

    await waitFor(() => {
      expect(screen.getByText('200.00000000')).toBeInTheDocument();
    });
  });

  it('does not animate when earnings decrease', async () => {
    const { rerender } = render(<AnimatedEarningsDisplay earnings={200} />);

    // Decrease earnings
    rerender(<AnimatedEarningsDisplay earnings={100} />);

    await waitFor(() => {
      const displayElement = screen.getByText('100.00000000');
      expect(displayElement).not.toHaveClass('text-green-600', 'scale-105');
    });
  });
});
