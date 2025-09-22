import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Mock console.error to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    const TestComponent = () => <div>Test Content</div>;
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should display custom error message', () => {
    const ThrowError = () => {
      throw new Error('Custom error message');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('should handle different types of errors', () => {
    const ThrowStringError = () => {
      throw 'String error';
    };

    render(
      <ErrorBoundary>
        <ThrowStringError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('should handle null/undefined errors', () => {
    const ThrowNullError = () => {
      throw null;
    };

    render(
      <ErrorBoundary>
        <ThrowNullError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });
});
