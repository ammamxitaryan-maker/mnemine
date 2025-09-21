import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlippableCard } from '../FlippableCard';

// Mock the usePersistentState hook
jest.mock('../../hooks/usePersistentState', () => ({
  usePersistentState: (key: string, defaultValue: boolean) => {
    const [state, setState] = React.useState(defaultValue);
    return [state, setState];
  },
}));

describe('FlippableCard', () => {
  const mockFrontContent = <div data-testid="front-content">Front Content</div>;
  const mockBackContent = <div data-testid="back-content">Back Content</div>;

  it('renders front content by default', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    expect(screen.getByTestId('front-content')).toBeInTheDocument();
    expect(screen.queryByTestId('back-content')).not.toBeInTheDocument();
  });

  it('flips to back content when clicked', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(screen.getByTestId('back-content')).toBeInTheDocument();
    expect(screen.queryByTestId('front-content')).not.toBeInTheDocument();
  });

  it('flips back to front content when clicked again', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    
    // First click - flip to back
    fireEvent.click(card);
    expect(screen.getByTestId('back-content')).toBeInTheDocument();
    
    // Second click - flip back to front
    fireEvent.click(card);
    expect(screen.getByTestId('front-content')).toBeInTheDocument();
  });

  it('responds to keyboard events', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByTestId('back-content')).toBeInTheDocument();
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByTestId('front-content')).toBeInTheDocument();
  });

  it('ignores other keyboard events', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    
    // Test other keys
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(screen.getByTestId('front-content')).toBeInTheDocument();
    
    fireEvent.keyDown(card, { key: 'Tab' });
    expect(screen.getByTestId('front-content')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Flip card to back');
  });

  it('updates aria-label when flipped', () => {
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(card).toHaveAttribute('aria-label', 'Flip card to front');
  });

  it('applies custom className', () => {
    const customClass = 'custom-card-class';
    render(
      <FlippableCard
        id="test-card"
        frontContent={mockFrontContent}
        backContent={mockBackContent}
        className={customClass}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass(customClass);
  });
});
